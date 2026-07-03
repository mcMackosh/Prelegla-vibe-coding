import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChatMessageDto } from './dto/chat-message.dto';
import { NDA_FIELDS, NdaChatFields } from './nda-fields';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type NdaChatResult = {
  reply: string;
  fields: NdaChatFields;
};

/**
 * openai/gpt-oss-120b:free (the model CLAUDE.md mandates) does not support
 * response_format/structured_outputs on any OpenRouter provider — confirmed via
 * OpenRouter's /api/v1/models supported_parameters and provider.require_parameters
 * routing (returns "No endpoints found that can handle the requested parameters").
 * We therefore enforce JSON shape via prompt instructions only and parse leniently.
 */
function buildSystemPrompt(): string {
  const fieldList = NDA_FIELDS.map((f) => `- ${f.key}: ${f.description}`).join('\n');
  return [
    'You are a legal-intake assistant helping a user fill out a Mutual Non-Disclosure Agreement (NDA).',
    'Have a natural conversation, asking one or two questions at a time about whatever information is still missing.',
    'You must extract values for these fields whenever the user states them:',
    fieldList,
    'Rules:',
    '- Only fill a field when the user has clearly stated it. Use an empty string for any field you are not confident about — never guess or invent a value.',
    '- Keep "reply" conversational and short: acknowledge what you learned, then ask for the next missing piece of information.',
    '- Once all fields are known, tell the user their Mutual NDA is ready to review in the form.',
    'Response format (strict):',
    '- Reply with ONLY a single JSON object — no markdown code fences, no text before or after it.',
    `- The JSON object must have exactly two top-level keys: "reply" (string) and "fields" (an object with exactly these string keys: ${NDA_FIELDS.map((f) => f.key).join(', ')}).`,
    '- Every field key must be present in "fields", using an empty string for anything unknown.',
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
      throw new BadGatewayException('Failed to reach the AI assistant');
    }

    if (!response.ok) {
      throw new BadGatewayException('The AI assistant returned an error');
    }

    let parsed: NdaChatResult;
    try {
      const body = await response.json();
      parsed = extractJsonObject(body?.choices?.[0]?.message?.content) as NdaChatResult;
    } catch {
      throw new BadGatewayException('The AI assistant returned an unreadable response');
    }

    if (typeof parsed?.reply !== 'string' || typeof parsed?.fields !== 'object' || parsed.fields === null) {
      throw new BadGatewayException('The AI assistant returned an unexpected response shape');
    }

    return parsed;
  }
}
