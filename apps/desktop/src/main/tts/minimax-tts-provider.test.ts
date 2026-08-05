import { describe, expect, it, vi } from 'vitest';
import { MiniMaxTextToSpeechProvider } from './minimax-tts-provider';

const config = {
  apiKey: 'secret',
  baseUrl: 'https://api.minimax.io/v1',
  language: 'Chinese',
  model: 'speech-2.8-turbo',
  timeoutMs: 5000,
};
const request = {
  requestId: 'tts-1',
  signal: new AbortController().signal,
  text: '你好',
  voiceId: 'voice-1',
};

describe('MiniMaxTextToSpeechProvider', () => {
  it('uses the documented endpoint and decodes hex in main', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      void input;
      void init;
      return new Response(
        JSON.stringify({
          base_resp: { status_code: 0 },
          data: { audio: '494433' },
          extra_info: { audio_length: 321, usage_characters: 2 },
          trace_id: 'trace-safe',
        }),
        { status: 200 },
      );
    });
    const result = await new MiniMaxTextToSpeechProvider(
      fetcher as unknown as typeof fetch,
    ).synthesize(config, request);
    expect([...result.audio]).toEqual([0x49, 0x44, 0x33]);
    expect(result.audioLengthMs).toBe(321);
    expect(result.traceId).toBe('trace-safe');
    expect(result.usageCharacters).toBe(2);
    const [target, init] = fetcher.mock.calls[0] ?? [];
    expect(target).toBe('https://api.minimax.io/v1/t2a_v2');
    expect(init?.headers).toEqual({
      Authorization: 'Bearer secret',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: 'speech-2.8-turbo',
      output_format: 'hex',
      stream: false,
      voice_setting: { voice_id: 'voice-1' },
    });
  });
  it('rejects malformed audio instead of forwarding provider text', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      void input;
      void init;
      return new Response(
        JSON.stringify({ base_resp: { status_code: 0 }, data: { audio: 'not-hex' } }),
        { status: 200 },
      );
    });
    await expect(
      new MiniMaxTextToSpeechProvider(fetcher as unknown as typeof fetch).synthesize(
        config,
        request,
      ),
    ).rejects.toMatchObject({ code: 'malformed_response' });
  });

  it.each([
    [401, 'authentication'],
    [402, 'quota_exceeded'],
    [404, 'invalid_model'],
    [429, 'rate_limit'],
    [503, 'provider_unavailable'],
  ] as const)('maps HTTP %s to %s', async (status, code) => {
    const fetcher = vi.fn(async () => new Response('', { status }));
    await expect(
      new MiniMaxTextToSpeechProvider(fetcher as unknown as typeof fetch).synthesize(
        config,
        request,
      ),
    ).rejects.toMatchObject({ code });
  });

  it('rejects empty audio, provider business errors, invalid voices and oversized responses', async () => {
    const payloads = [
      { base_resp: { status_code: 0 }, data: { audio: '' } },
      { base_resp: { status_code: 1001, status_msg: 'service busy' } },
      { base_resp: { status_code: 1002, status_msg: 'invalid voice id' } },
    ];
    const expected = ['malformed_response', 'provider_unavailable', 'invalid_configuration'];
    for (const [index, payload] of payloads.entries()) {
      const fetcher = vi.fn(async () => new Response(JSON.stringify(payload)));
      await expect(
        new MiniMaxTextToSpeechProvider(fetcher as unknown as typeof fetch).synthesize(
          config,
          request,
        ),
      ).rejects.toMatchObject({ code: expected[index] });
    }
    const oversized = vi.fn(
      async () => new Response('{}', { headers: { 'content-length': String(25 * 1024 * 1024) } }),
    );
    await expect(
      new MiniMaxTextToSpeechProvider(oversized as unknown as typeof fetch).synthesize(
        config,
        request,
      ),
    ).rejects.toMatchObject({ code: 'malformed_response' });
  });

  it.each([
    ['timeout', false],
    ['cancelled', true],
  ] as const)('distinguishes %s aborts', async (code, cancelRequest) => {
    const controller = new AbortController();
    const fetcher = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit): Promise<Response> =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    if (cancelRequest) setTimeout(() => controller.abort(), 1);
    await expect(
      new MiniMaxTextToSpeechProvider(fetcher as unknown as typeof fetch).synthesize(
        { ...config, timeoutMs: cancelRequest ? 100 : 1 },
        { ...request, signal: controller.signal },
      ),
    ).rejects.toMatchObject({ code });
  });
});
