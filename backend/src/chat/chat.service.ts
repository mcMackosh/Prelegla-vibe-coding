import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChatMessageDto } from './dto/chat-message.dto';
import { NDA_FIELDS, NdaChatFields } from './nda-fields';

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

export type NdaChatResult = {
  reply: string;
  fields: NdaChatFields;
};

/**
 * response_format/structured_outputs support varies by free-tier model and provider
 * routing on OpenRouter (confirmed unsupported for openai/gpt-oss-120b:free on any
 * provider via /api/v1/models supported_parameters). To keep OPENROUTER_MODEL swappable
 * across free models without re-verifying each one, we enforce JSON shape via prompt
 * instructions only and parse leniently rather than relying on response_format.
 */
function buildSystemPrompt(): string {
  const fieldList = NDA_FIELDS.map((f) => `- ${f.key}: ${f.description}`).join('\n');
  return [
    'You are a sharp, capable legal-intake assistant helping a user fill out a Mutual Non-Disclosure Agreement (NDA). Act like a real assistant a person would actually want to work with, not a rigid form wizard.',
    'Fields you can fill:',
    fieldList,
    'How to handle input:',
    '- If the user dumps unstructured information (a paragraph, a list, a copy-pasted email, several facts at once), parse all of it in one pass and fill every field you can confidently infer from it — do not make them repeat it back to you one field at a time.',
    '- Do not interrogate the user field-by-field in a fixed order. Only ask about what is still missing and actually relevant, and batch related missing items into a single natural question instead of a rigid checklist.',
    '- If the user explicitly defers a decision to you ("you decide", "whatever is standard", "up to you", "на свій розсуд", etc.), fill that field yourself with a reasonable, standard choice (e.g. a common governing law/jurisdiction pairing, a typical 1-3 year term, a generic purpose description) instead of leaving it blank or asking again. Say what you chose in "reply" so the user can correct it if they want something else.',
    '- Only leave a field blank when you have neither information from the user nor a reasonable default to offer, and the user has not delegated the decision to you. Never invent specific facts about the actual parties (names, addresses, signer identities) — those must come from the user.',
    "- Keep \"reply\" natural and conversational, like a helpful colleague, not a scripted intake bot. Vary your phrasing; do not always ask \"what's next\" in the same way.",
    '- Once all fields are known, tell the user their Mutual NDA is ready to review in the form.',
    'Response format (strict):',
    '- Reply with ONLY a single JSON object — no markdown code fences, no text before or after it.',
    `- The JSON object must have exactly two top-level keys: "reply" (string) and "fields" (an object with exactly these string keys: ${NDA_FIELDS.map((f) => f.key).join(', ')}).`,
    '- Every field key must be present in "fields", using an empty string for anything still unknown.',
  ].join('\n\n');
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

@Injectable()
export class ChatService {
  async handleNdaTurn(messages: ChatMessageDto[]): Promise<NdaChatResult> {
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
            messages: [{ role: 'system', content: buildSystemPrompt() }, ...messages],
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

      let parsed: NdaChatResult;
      try {
        const body = await response.json();
        parsed = extractJsonObject(body?.choices?.[0]?.message?.content) as NdaChatResult;
      } catch {
        lastError = new BadGatewayException('The AI assistant returned an unreadable response');
        continue;
      }

      if (typeof parsed?.reply !== 'string' || typeof parsed?.fields !== 'object' || parsed.fields === null) {
        lastError = new BadGatewayException('The AI assistant returned an unexpected response shape');
        continue;
      }

      return parsed;
    }

    throw lastError;
  }
}
