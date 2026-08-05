import { describe, expect, it, vi } from 'vitest';
import { TTS_CANCEL_CHANNEL, TTS_SYNTHESIZE_CHANNEL } from '../../shared/tts';
import { registerTtsHandlers } from './tts-ipc';
import type { TtsService } from './tts-service';

describe('registerTtsHandlers', () => {
  it('isolates cancellation by renderer sender', async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const signals: AbortSignal[] = [];
    const service = {
      synthesize: vi.fn(
        (_request: unknown, signal: AbortSignal) =>
          new Promise((resolve) => {
            signals.push(signal);
            signal.addEventListener(
              'abort',
              () =>
                resolve({
                  error: {
                    code: 'cancelled',
                    message: 'cancelled',
                    providerId: 'minimax',
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
    } as unknown as TtsService;
    registerTtsHandlers(
      {
        handle: (channel, handler) =>
          handlers.set(channel, handler as (...args: unknown[]) => unknown),
        removeHandler: vi.fn(),
      },
      service,
    );
    const request = { requestId: 'same-id', text: '你好', voiceProfileId: 'profile' };
    const first = handlers.get(TTS_SYNTHESIZE_CHANNEL)?.({ sender: { id: 1 } }, request);
    const second = handlers.get(TTS_SYNTHESIZE_CHANNEL)?.({ sender: { id: 2 } }, request);
    await vi.waitFor(() => expect(signals).toHaveLength(2));
    await handlers.get(TTS_CANCEL_CHANNEL)?.({ sender: { id: 1 } }, 'same-id');
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    await handlers.get(TTS_CANCEL_CHANNEL)?.({ sender: { id: 2 } }, 'same-id');
    await Promise.all([first, second]);
  });

  it('rejects arbitrary request shapes before the service boundary', async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const service = { synthesize: vi.fn() } as unknown as TtsService;
    registerTtsHandlers(
      {
        handle: (channel, handler) =>
          handlers.set(channel, handler as (...args: unknown[]) => unknown),
        removeHandler: vi.fn(),
      },
      service,
    );
    const result = await handlers.get(TTS_SYNTHESIZE_CHANNEL)?.(
      { sender: { id: 1 } },
      { requestId: 'request', text: '', url: 'https://forbidden.example', voiceId: 'arbitrary' },
    );
    expect(result).toMatchObject({ error: { code: 'invalid_configuration' }, ok: false });
    expect(service.synthesize).not.toHaveBeenCalled();
  });
});
