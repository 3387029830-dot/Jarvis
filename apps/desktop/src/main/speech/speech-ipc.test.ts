import { describe, expect, it, vi } from 'vitest';

import {
  SPEECH_CANCEL_CHANNEL,
  SPEECH_TRANSCRIBE_CHANNEL,
  type SpeechPublicConfig,
} from '../../shared/speech';
import { registerSpeechHandlers } from './speech-ipc';
import type { SpeechService } from './speech-service';

const config: SpeechPublicConfig = {
  baseUrl: 'https://speech.example/v1',
  credentialSource: 'independent',
  hasCredential: true,
  keySuffix: '1357',
  language: 'zh',
  lastTestedAt: null,
  mode: 'real',
  model: 'speech-model',
  providerId: 'openai-compatible',
  timeoutMs: 45_000,
};

function validRequest(requestId: string) {
  return {
    audio: new Uint8Array([1, 2, 3]),
    durationMs: 800,
    mimeType: 'audio/webm',
    requestId,
  };
}

describe('registerSpeechHandlers', () => {
  it('isolates cancellation by renderer sender and keeps audio binary', async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const signals: AbortSignal[] = [];
    const requests: unknown[] = [];
    const service = {
      deleteCredential: vi.fn(),
      getConfig: vi.fn().mockResolvedValue(config),
      saveConfig: vi.fn(),
      testConfig: vi.fn(),
      transcribe: vi.fn(
        (request: unknown, signal: AbortSignal) =>
          new Promise((resolve) => {
            requests.push(request);
            signals.push(signal);
            signal.addEventListener(
              'abort',
              () =>
                resolve({
                  error: {
                    code: 'cancelled',
                    message: 'cancelled',
                    providerId: 'openai-compatible',
                    requestId: 'same-id',
                    retryable: false,
                    safeTechnicalSummary: 'cancelled',
                  },
                  ok: false,
                }),
              { once: true },
            );
          }),
      ),
    } as unknown as SpeechService;
    registerSpeechHandlers(
      {
        handle: (channel, handler) => {
          handlers.set(channel, handler as (...args: unknown[]) => unknown);
        },
        removeHandler: vi.fn(),
      },
      service,
    );
    const senderOne = { id: 1 };
    const senderTwo = { id: 2 };
    const start = handlers.get(SPEECH_TRANSCRIBE_CHANNEL);
    const first = start?.({ sender: senderOne }, validRequest('same-id'));
    const second = start?.({ sender: senderTwo }, validRequest('same-id'));
    await vi.waitFor(() => expect(signals).toHaveLength(2));
    expect((requests[0] as { audio: unknown }).audio).toBeInstanceOf(Uint8Array);

    const cancel = handlers.get(SPEECH_CANCEL_CHANNEL);
    await cancel?.({ sender: senderOne }, 'same-id');
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    await cancel?.({ sender: senderTwo }, 'same-id');
    await Promise.all([first, second]);
  });

  it('rejects JSON number arrays before the service boundary', async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const service = {
      transcribe: vi.fn(),
    } as unknown as SpeechService;
    registerSpeechHandlers(
      {
        handle: (channel, handler) => {
          handlers.set(channel, handler as (...args: unknown[]) => unknown);
        },
        removeHandler: vi.fn(),
      },
      service,
    );
    const result = await handlers.get(SPEECH_TRANSCRIBE_CHANNEL)?.(
      { sender: { id: 1 } },
      { ...validRequest('request-1'), audio: [1, 2, 3] },
    );
    expect(result).toMatchObject({
      error: { code: 'unsupported_audio_format' },
      ok: false,
    });
    expect(service.transcribe).not.toHaveBeenCalled();
  });
});
