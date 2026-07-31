import { describe, expect, it, vi } from 'vitest';

import { ProviderFailure } from '../providers/provider-error';
import { OpenAICompatibleSpeechToTextProvider } from './openai-compatible-speech-provider';

const config = {
  apiKey: 'not-a-real-key',
  baseUrl: 'https://speech.example/v1',
  language: 'zh',
  model: 'speech-model',
  timeoutMs: 1_000,
};

function request(signal = new AbortController().signal) {
  return {
    audio: new Uint8Array([1, 2, 3, 4]),
    filename: 'jarvis-request-1.webm',
    mimeType: 'audio/webm',
    prompt: '忠实转录中文',
    requestId: 'request-1',
    signal,
  };
}

describe('OpenAICompatibleSpeechToTextProvider', () => {
  it('posts typed audio as multipart and parses transcript plus usage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: '  这是转录结果。 ', usage: { seconds: 1.25 } }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );
    const provider = new OpenAICompatibleSpeechToTextProvider({ fetch: fetchMock });

    await expect(provider.transcribe(config, request())).resolves.toMatchObject({
      transcript: '这是转录结果。',
      usage: { inputSeconds: 1.25 },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://speech.example/v1/audio/transcriptions');
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init).toMatchObject({
      headers: { Authorization: 'Bearer not-a-real-key' },
      method: 'POST',
      redirect: 'manual',
    });
    const form = init.body as FormData;
    expect(form.get('model')).toBe('speech-model');
    expect(form.get('language')).toBe('zh');
    expect(form.get('prompt')).toBe('忠实转录中文');
    const file = form.get('file') as File;
    expect(file.name).toBe('jarvis-request-1.webm');
    expect(file.type).toBe('audio/webm');
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it.each([
    [401, 'authentication'],
    [403, 'permission'],
    [404, 'invalid_model'],
    [402, 'quota_exceeded'],
    [413, 'audio_too_large'],
    [415, 'unsupported_audio_format'],
    [429, 'rate_limit'],
    [503, 'provider_unavailable'],
    [400, 'transcription_failed'],
  ])('maps HTTP %s to %s', async (status, code) => {
    const provider = new OpenAICompatibleSpeechToTextProvider({
      fetch: vi.fn().mockResolvedValue(new Response('private body', { status })),
    });
    await expect(provider.transcribe(config, request())).rejects.toMatchObject({ code });
  });

  it('rejects empty, malformed, oversized and redirect responses', async () => {
    const empty = new OpenAICompatibleSpeechToTextProvider({
      fetch: vi.fn().mockResolvedValue(new Response('{"text":"  "}')),
    });
    await expect(empty.transcribe(config, request())).rejects.toMatchObject({
      code: 'empty_transcript',
    });

    const malformed = new OpenAICompatibleSpeechToTextProvider({
      fetch: vi.fn().mockResolvedValue(new Response('{bad-json')),
    });
    await expect(malformed.transcribe(config, request())).rejects.toMatchObject({
      code: 'malformed_response',
    });

    const oversized = new OpenAICompatibleSpeechToTextProvider({
      fetch: vi.fn().mockResolvedValue(new Response('{"text":"too large"}')),
      maxResponseBytes: 5,
    });
    await expect(oversized.transcribe(config, request())).rejects.toMatchObject({
      code: 'malformed_response',
    });

    const redirect = new OpenAICompatibleSpeechToTextProvider({
      fetch: vi.fn().mockResolvedValue(new Response(null, { status: 307 })),
    });
    await expect(redirect.transcribe(config, request())).rejects.toMatchObject({
      code: 'invalid_configuration',
      safeTechnicalSummary: 'speech_redirect_rejected',
    });
  });

  it('distinguishes cancellation, timeout and network failure', async () => {
    const blockingFetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    const controller = new AbortController();
    const cancelled = new OpenAICompatibleSpeechToTextProvider({
      fetch: blockingFetch as typeof fetch,
    });
    const cancelledPromise = cancelled.transcribe(config, request(controller.signal));
    controller.abort();
    await expect(cancelledPromise).rejects.toEqual(expect.any(ProviderFailure));
    await expect(cancelledPromise).rejects.toMatchObject({ code: 'cancelled' });

    const timedOut = new OpenAICompatibleSpeechToTextProvider({
      fetch: blockingFetch as typeof fetch,
    });
    await expect(timedOut.transcribe({ ...config, timeoutMs: 5 }, request())).rejects.toMatchObject(
      { code: 'timeout' },
    );

    const network = new OpenAICompatibleSpeechToTextProvider({
      fetch: vi.fn().mockRejectedValue(new Error('private network detail')),
    });
    await expect(network.transcribe(config, request())).rejects.toMatchObject({
      code: 'network',
      safeTechnicalSummary: 'speech_network_failed',
    });
  });
});
