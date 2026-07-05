import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ChatMessageDto } from './dto/chat-message.dto';
import { NDA_FIELDS } from './nda-fields';
import { TemplatesService } from '../templates/templates.service';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Free-tier models/providers on OpenRouter are prone to two transient failure modes:
 * 429 rate-limiting, and occasionally malformed completions (invalid JSON, or JSON
 * missing the expected reply/fields shape). Both usually clear on a retry.
 */
const TRANSIENT_FAILURE_RETRIES = 3;
const TRANSIENT_FAILURE_BACKOFF_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type FieldDescriptor = { key: string; description: string };

export type ChatFields = Record<string, string>;

export type ChatTurnResult = {
  reply: string;
  fields: ChatFields;
};

/**
 * response_format/structured_outputs support varies by free-tier model and provider
 * routing on OpenRouter (confirmed unsupported for openai/gpt-oss-120b:free on any
 * provider via /api/v1/models supported_parameters). To keep OPENROUTER_MODEL swappable
 * across free models without re-verifying each one, we enforce JSON shape via prompt
 * instructions only and parse leniently rather than relying on response_format.
 */
function buildSystemPrompt(
  documentName: string,
  fields: FieldDescriptor[],
): string {
  const fieldList = fields
    .map((f) => `- ${f.key}: ${f.description}`)
    .join('\n');
  return [
    `You are a sharp, capable legal-intake assistant helping a user fill out a ${documentName}. Act like a real assistant a person would actually want to work with, not a rigid form wizard.`,
    'Fields you can fill:',
    fieldList,
    'How to handle input:',
    '- If the user dumps unstructured information (a paragraph, a list, a copy-pasted email, several facts at once), parse all of it in one pass and fill every field you can confidently infer from it — do not make them repeat it back to you one field at a time.',
    '- Do not interrogate the user field-by-field in a fixed order. Only ask about what is still missing and actually relevant, and batch related missing items into a single natural question instead of a rigid checklist.',
    '- If the user explicitly defers a decision to you ("you decide", "whatever is standard", "up to you", "на свій розсуд", etc.), fill that field yourself with a reasonable, standard choice (e.g. a common governing law/jurisdiction pairing, a typical 1-3 year term, a generic purpose description) instead of leaving it blank or asking again. Say what you chose in "reply" so the user can correct it if they want something else.',
    '- Only leave a field blank when you have neither information from the user nor a reasonable default to offer, and the user has not delegated the decision to you. Never invent specific facts about the actual parties (names, addresses, signer identities) — those must come from the user.',
    '- Keep "reply" natural and conversational, like a helpful colleague, not a scripted intake bot. Vary your phrasing; do not always ask "what\'s next" in the same way.',
    '- If, after this turn, any field is still blank (and the user has not deferred it to you), "reply" MUST end with a direct question asking for at least one of the missing pieces of information. Never end a turn by just restating or summarizing what you have — if something is still needed, ask for it.',
    '- Once all fields are known, tell the user their document is ready to review in the form (and do not ask a further question).',
    'Response format (strict):',
    '- Reply with ONLY a single JSON object — no markdown code fences, no text before or after it.',
    `- The JSON object must have exactly two top-level keys: "reply" (string) and "fields" (an object with exactly these string keys: ${fields.map((f) => f.key).join(', ')}).`,
    '- Every field key must be present in "fields", using an empty string for anything still unknown.',
  ].join('\n\n');
}

/**
 * Backstop for the "always ask a follow-up when info is still missing" rule in the
 * system prompt: prompt instructions are best-effort, not guaranteed, so if the model's
 * reply doesn't actually end in a question while fields remain blank, append one
 * deterministically rather than silently leaving the user without a next step.
 */
function ensureFollowUpQuestion(
  result: ChatTurnResult,
  fields: FieldDescriptor[],
): ChatTurnResult {
  const missingField = fields.find((f) => !result.fields[f.key]?.trim());
  if (!missingField) {
    return result;
  }

  const reply = result.reply.trim();
  if (reply.endsWith('?')) {
    return result;
  }

  const separator = reply.length > 0 ? ' ' : '';
  return {
    ...result,
    reply: `${reply}${separator}Could you tell me the ${missingField.description.charAt(0).toLowerCase()}${missingField.description.slice(1)}?`,
  };
}

function extractJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON object found in response');
    return JSON.parse(match[0]);
  }
}

async function callOpenRouterForFields(
  messages: ChatMessageDto[],
  documentName: string,
  fields: FieldDescriptor[],
): Promise<ChatTurnResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) {
    throw new InternalServerErrorException('OpenRouter is not configured');
  }

  let lastError = new BadGatewayException('The AI assistant returned an error');
  for (let attempt = 0; attempt <= TRANSIENT_FAILURE_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(TRANSIENT_FAILURE_BACKOFF_MS);
    }

    let response: Response;
    try {
      response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: buildSystemPrompt(documentName, fields),
            },
            ...messages,
          ],
        }),
      });
    } catch {
      lastError = new BadGatewayException('Failed to reach the AI assistant');
      continue;
    }

    if (response.status === 429) {
      lastError = new BadGatewayException('The AI assistant returned an error');
      continue;
    }

    if (!response.ok) {
      throw new BadGatewayException('The AI assistant returned an error');
    }

    let parsed: ChatTurnResult;
    try {
      const body = await response.json();
      parsed = extractJsonObject(
        body?.choices?.[0]?.message?.content,
      ) as ChatTurnResult;
    } catch {
      lastError = new BadGatewayException(
        'The AI assistant returned an unreadable response',
      );
      continue;
    }

    if (
      typeof parsed?.reply !== 'string' ||
      typeof parsed?.fields !== 'object' ||
      parsed.fields === null
    ) {
      lastError = new BadGatewayException(
        'The AI assistant returned an unexpected response shape',
      );
      continue;
    }

    return ensureFollowUpQuestion(parsed, fields);
  }

  throw lastError;
}

export type RouteResult = {
  documentTypeId: string;
  reply: string;
};

function buildRouterSystemPrompt(
  catalog: { id: string; name: string; description: string }[],
): string {
  const catalogList = catalog
    .map((c) => `- ${c.id}: ${c.name} — ${c.description}`)
    .join('\n');
  return [
    'You help a user figure out which legal document template they need, from a fixed catalog. You do not fill in the document itself here — only pick the right template.',
    'Catalog of available document types:',
    catalogList,
    'Rules:',
    "- If the user's request clearly matches one catalog entry, pick it.",
    "- If the user asks for something not in the catalog (e.g. a document type we simply don't have a template for), you must still pick the single closest available catalog entry — never refuse without a suggestion. Say in \"reply\" that you don't have their exact document, and explain what you're suggesting instead and why it's the closest fit.",
    '- If the request is ambiguous between two or more catalog entries, pick your best single guess and briefly explain it in "reply" — the user can redirect if you guessed wrong.',
    '- Keep "reply" short and conversational.',
    'Response format (strict):',
    '- Reply with ONLY a single JSON object — no markdown code fences, no text before or after it.',
    `- The JSON object must have exactly two top-level keys: "documentTypeId" (must be exactly one of these ids: ${catalog.map((c) => c.id).join(', ')}) and "reply" (string).`,
  ].join('\n\n');
}

async function callOpenRouterForRoute(
  message: string,
  catalog: { id: string; name: string; description: string }[],
): Promise<RouteResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) {
    throw new InternalServerErrorException('OpenRouter is not configured');
  }

  const validIds = new Set(catalog.map((c) => c.id));
  let lastError = new BadGatewayException('The AI assistant returned an error');

  for (let attempt = 0; attempt <= TRANSIENT_FAILURE_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(TRANSIENT_FAILURE_BACKOFF_MS);
    }

    let response: Response;
    try {
      response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: buildRouterSystemPrompt(catalog) },
            { role: 'user', content: message },
          ],
        }),
      });
    } catch {
      lastError = new BadGatewayException('Failed to reach the AI assistant');
      continue;
    }

    if (response.status === 429) {
      lastError = new BadGatewayException('The AI assistant returned an error');
      continue;
    }

    if (!response.ok) {
      throw new BadGatewayException('The AI assistant returned an error');
    }

    let parsed: RouteResult;
    try {
      const body = await response.json();
      parsed = extractJsonObject(
        body?.choices?.[0]?.message?.content,
      ) as RouteResult;
    } catch {
      lastError = new BadGatewayException(
        'The AI assistant returned an unreadable response',
      );
      continue;
    }

    if (
      typeof parsed?.reply !== 'string' ||
      typeof parsed?.documentTypeId !== 'string' ||
      !validIds.has(parsed.documentTypeId)
    ) {
      lastError = new BadGatewayException(
        'The AI assistant returned an unexpected response shape',
      );
      continue;
    }

    return parsed;
  }

  throw lastError;
}

@Injectable()
export class ChatService {
  constructor(private readonly templatesService: TemplatesService) {}

  handleNdaTurn(messages: ChatMessageDto[]): Promise<ChatTurnResult> {
    return callOpenRouterForFields(
      messages,
      'Mutual Non-Disclosure Agreement (NDA)',
      NDA_FIELDS,
    );
  }

  async handleDocumentTurn(
    documentTypeId: string,
    messages: ChatMessageDto[],
  ): Promise<ChatTurnResult> {
    const documentType = this.templatesService.getDocumentType(documentTypeId);
    const fields: FieldDescriptor[] = documentType.fields.map((f) => ({
      key: f.key,
      description: f.label,
    }));
    return callOpenRouterForFields(messages, documentType.name, fields);
  }

  routeToDocumentType(message: string): Promise<RouteResult> {
    const catalog = this.templatesService.listDocumentTypes();
    return callOpenRouterForRoute(message, catalog);
  }
}
