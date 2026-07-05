import {
  BadGatewayException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { TemplatesService } from '../templates/templates.service';

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
    service = new ChatService({} as TemplatesService);
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-key',
      OPENROUTER_MODEL: 'openai/gpt-oss-20b:free',
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns the parsed reply and fields on a successful OpenRouter call', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({
        reply: "Got it, what is Party A's address?",
        fields: { partyAName: 'Acme Corp.' },
      }),
    );

    const result = await service.handleNdaTurn([
      { role: 'user', content: 'Party A is Acme Corp.' },
    ]);

    expect(result).toEqual({
      reply: "Got it, what is Party A's address?",
      fields: { partyAName: 'Acme Corp.' },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
  });

  it('does not send response_format, since openai/gpt-oss-120b:free supports no response_format mode on any provider', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({ reply: 'hi', fields: {} }),
    );

    await service.handleNdaTurn([{ role: 'user', content: 'hello' }]);

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(requestBody.response_format).toBeUndefined();
  });

  it('extracts the JSON object even when the model wraps it in prose or a markdown code fence', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponseRaw(
        'Sure thing! ```json\n' +
          JSON.stringify({
            reply: 'Got it.',
            fields: { partyAName: 'Acme Corp.' },
          }) +
          '\n```',
      ),
    );

    const result = await service.handleNdaTurn([
      { role: 'user', content: 'Party A is Acme Corp.' },
    ]);

    expect(result.fields).toEqual({ partyAName: 'Acme Corp.' });
    expect(result.reply.startsWith('Got it.')).toBe(true);
  });

  it('includes every NDA field name in the system prompt sent to OpenRouter', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({ reply: 'hi', fields: {} }),
    );

    await service.handleNdaTurn([{ role: 'user', content: 'hello' }]);

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    const systemPrompt = requestBody.messages[0].content as string;
    for (const key of [
      'partyAName',
      'purpose',
      'governingLaw',
      'jurisdiction',
    ]) {
      expect(systemPrompt).toContain(key);
    }
  });

  it('throws BadGatewayException when OpenRouter responds with a non-2xx status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      service.handleNdaTurn([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(BadGatewayException);
  });

  it('retries after a 429 and succeeds once the rate limit clears', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce(
        mockOpenRouterResponse({ reply: 'hi', fields: {} }),
      );

    const result = await service.handleNdaTurn([
      { role: 'user', content: 'hi' },
    ]);

    expect(result.fields).toEqual({});
    expect(result.reply).toMatch(/^hi.*\?$/);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('throws BadGatewayException when every retry attempt is rate-limited', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
    });

    await expect(
      service.handleNdaTurn([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(BadGatewayException);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  }, 10000);

  it('throws BadGatewayException when the network request itself fails on every attempt', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(
      service.handleNdaTurn([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(BadGatewayException);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  }, 10000);

  it('throws BadGatewayException when the model returns unparsable JSON on every attempt', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
    });

    await expect(
      service.handleNdaTurn([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(BadGatewayException);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  }, 10000);

  it('throws BadGatewayException when the parsed response is missing required keys on every attempt', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({ reply: 'hi' }),
    );

    await expect(
      service.handleNdaTurn([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(BadGatewayException);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  }, 10000);

  it('retries after unparsable JSON and succeeds on a later attempt', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
      })
      .mockResolvedValueOnce(
        mockOpenRouterResponse({ reply: 'hi', fields: {} }),
      );

    const result = await service.handleNdaTurn([
      { role: 'user', content: 'hi' },
    ]);

    expect(result.fields).toEqual({});
    expect(result.reply).toMatch(/^hi.*\?$/);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('retries after a malformed shape (missing fields) and succeeds on a later attempt', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockOpenRouterResponse({ reply: 'hi' }))
      .mockResolvedValueOnce(
        mockOpenRouterResponse({ reply: 'hi', fields: {} }),
      );

    const result = await service.handleNdaTurn([
      { role: 'user', content: 'hi' },
    ]);

    expect(result.fields).toEqual({});
    expect(result.reply).toMatch(/^hi.*\?$/);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('appends a follow-up question when fields are still missing and the model did not ask one', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({
        reply: 'Got it, Acme Corp. is Party A.',
        fields: { partyAName: 'Acme Corp.' },
      }),
    );

    const result = await service.handleNdaTurn([
      { role: 'user', content: 'Party A is Acme Corp.' },
    ]);

    expect(result.reply.startsWith('Got it, Acme Corp. is Party A.')).toBe(
      true,
    );
    expect(result.reply.trim().endsWith('?')).toBe(true);
  });

  it('does not append a follow-up question when the model already asked one', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({
        reply: "Got it. What's Party A's address?",
        fields: { partyAName: 'Acme Corp.' },
      }),
    );

    const result = await service.handleNdaTurn([
      { role: 'user', content: 'Party A is Acme Corp.' },
    ]);

    expect(result.reply).toBe("Got it. What's Party A's address?");
  });

  it('does not append a follow-up question once every field is filled', async () => {
    const allFieldsFilled = Object.fromEntries(
      [
        'partyAName',
        'partyAAddress',
        'partyASignerName',
        'partyASignerTitle',
        'partyBName',
        'partyBAddress',
        'partyBSignerName',
        'partyBSignerTitle',
        'effectiveDate',
        'purpose',
        'mndaTerm',
        'termOfConfidentiality',
        'governingLaw',
        'jurisdiction',
      ].map((key) => [key, 'value']),
    );
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({
        reply: 'Your Mutual NDA is ready to review.',
        fields: allFieldsFilled,
      }),
    );

    const result = await service.handleNdaTurn([
      { role: 'user', content: 'that is everything' },
    ]);

    expect(result.reply).toBe('Your Mutual NDA is ready to review.');
  });

  it('throws InternalServerErrorException when OPENROUTER_API_KEY is not configured', async () => {
    delete process.env.OPENROUTER_API_KEY;

    await expect(
      service.handleNdaTurn([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('ChatService.handleDocumentTurn (KAN-6, any catalog document type)', () => {
  let service: ChatService;
  let templatesService: TemplatesService;
  const originalEnv = process.env;

  beforeEach(() => {
    templatesService = new TemplatesService();
    templatesService.onModuleInit();
    service = new ChatService(templatesService);
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-key',
      OPENROUTER_MODEL: 'openai/gpt-oss-20b:free',
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('builds the prompt from the real parsed fields of a non-NDA document type', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({
        reply: 'Got it, what is next?',
        fields: { customer: 'Acme Corp.' },
      }),
    );

    const result = await service.handleDocumentTurn('cloud-service-agreement', [
      { role: 'user', content: 'Customer is Acme Corp.' },
    ]);

    expect(result.fields).toEqual({ customer: 'Acme Corp.' });
    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    const systemPrompt = requestBody.messages[0].content as string;
    expect(systemPrompt).toContain('Cloud Service Agreement');
    expect(systemPrompt).toContain('customer');
  });

  it('throws NotFoundException for an unknown document type before ever calling OpenRouter', async () => {
    await expect(
      service.handleDocumentTurn('not-a-real-type', [
        { role: 'user', content: 'hi' },
      ]),
    ).rejects.toThrow(NotFoundException);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('ChatService.routeToDocumentType (KAN-6 document-type router)', () => {
  let service: ChatService;
  let templatesService: TemplatesService;
  const originalEnv = process.env;

  beforeEach(() => {
    templatesService = new TemplatesService();
    templatesService.onModuleInit();
    service = new ChatService(templatesService);
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-key',
      OPENROUTER_MODEL: 'openai/gpt-oss-20b:free',
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns the matched document type id and reply', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({
        documentTypeId: 'mutual-nda',
        reply: "Sounds like you need a Mutual NDA — let's get started.",
      }),
    );

    const result = await service.routeToDocumentType(
      'I need an NDA with a vendor',
    );

    expect(result.documentTypeId).toBe('mutual-nda');
    expect(result.reply).toContain('Mutual NDA');
  });

  it('retries when the model returns a documentTypeId outside the catalog', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockOpenRouterResponse({
          documentTypeId: 'not-a-real-type',
          reply: 'x',
        }),
      )
      .mockResolvedValueOnce(
        mockOpenRouterResponse({
          documentTypeId: 'mutual-nda',
          reply: 'Mutual NDA it is.',
        }),
      );

    const result = await service.routeToDocumentType('something vague');

    expect(result.documentTypeId).toBe('mutual-nda');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('includes every catalog document type in the router system prompt', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockOpenRouterResponse({ documentTypeId: 'mutual-nda', reply: 'ok' }),
    );

    await service.routeToDocumentType('I need something');

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    const systemPrompt = requestBody.messages[0].content as string;
    for (const id of [
      'mutual-nda',
      'cloud-service-agreement',
      'business-associate-agreement',
    ]) {
      expect(systemPrompt).toContain(id);
    }
  });
});
