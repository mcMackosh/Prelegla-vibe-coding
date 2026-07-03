import { BadGatewayException, InternalServerErrorException } from '@nestjs/common';
import { ChatService } from './chat.service';

function mockOpenRouterResponse(content: unknown) {
  return mockOpenRouterResponseRaw(JSON.stringify(content));
}

function mockOpenRouterResponseRaw(rawContent: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content: rawContent } }] }),
  } as Response;
}

describe('ChatService', () => {
  let service: ChatService;
  const originalEnv = process.env;

  beforeEach(() => {
    service = new ChatService();
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-key',
      OPENROUTER_MODEL: 'openai/gpt-oss-120b:free',
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns the parsed reply and fields on a successful OpenRouter call', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({ reply: 'Got it, what is Party A\'s address?', fields: { partyAName: 'Acme Corp.' } })
    );

    const result = await service.handleNdaTurn([{ role: 'user', content: 'Party A is Acme Corp.' }]);

    expect(result).toEqual({
      reply: "Got it, what is Party A's address?",
      fields: { partyAName: 'Acme Corp.' },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      })
    );
  });

  it('does not send response_format, since openai/gpt-oss-120b:free supports no response_format mode on any provider', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockOpenRouterResponse({ reply: 'hi', fields: {} }));

    await service.handleNdaTurn([{ role: 'user', content: 'hello' }]);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody.response_format).toBeUndefined();
  });

  it('extracts the JSON object even when the model wraps it in prose or a markdown code fence', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponseRaw(
        'Sure thing! ```json\n' +
          JSON.stringify({ reply: 'Got it.', fields: { partyAName: 'Acme Corp.' } }) +
          '\n```'
      )
    );

    const result = await service.handleNdaTurn([{ role: 'user', content: 'Party A is Acme Corp.' }]);

    expect(result).toEqual({ reply: 'Got it.', fields: { partyAName: 'Acme Corp.' } });
  });

  it('includes every NDA field name in the system prompt sent to OpenRouter', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockOpenRouterResponse({ reply: 'hi', fields: {} }));

    await service.handleNdaTurn([{ role: 'user', content: 'hello' }]);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const systemPrompt = requestBody.messages[0].content as string;
    for (const key of ['partyAName', 'purpose', 'governingLaw', 'jurisdiction']) {
      expect(systemPrompt).toContain(key);
    }
  });

  it('throws BadGatewayException when OpenRouter responds with a non-2xx status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false } as Response);

    await expect(service.handleNdaTurn([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      BadGatewayException
    );
  });

  it('throws BadGatewayException when the network request itself fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(service.handleNdaTurn([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      BadGatewayException
    );
  });

  it('throws BadGatewayException when the model returns unparsable JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
    } as Response);

    await expect(service.handleNdaTurn([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      BadGatewayException
    );
  });

  it('throws BadGatewayException when the parsed response is missing required keys', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockOpenRouterResponse({ reply: 'hi' }));

    await expect(service.handleNdaTurn([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      BadGatewayException
    );
  });

  it('throws InternalServerErrorException when OPENROUTER_API_KEY is not configured', async () => {
    delete process.env.OPENROUTER_API_KEY;

    await expect(service.handleNdaTurn([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
