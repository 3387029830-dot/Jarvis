import { describe, expect, it, vi } from 'vitest';

import {
  CONVERSATION_CANCEL_CHANNEL,
  CONVERSATION_START_CHANNEL,
  type ProviderPublicConfig,
} from '../../shared/provider';
import { registerProviderHandlers } from './provider-ipc';
import type { ProviderService } from './provider-service';

const config: ProviderPublicConfig = {
  baseUrl: 'https://provider.example/v1',
  hasCredential: true,
  keySuffix: '1234',
  lastTestedAt: '2026-07-30T08:00:00.000Z',
  mode: 'real',
  model: 'model',
};

function validRequest(requestId: string) {
  return {
    context: { domains: ['心理学'], exploration: '探索', recentMessages: [] },
    requestId,
    userMessage: '继续',
  };
}

describe('registerProviderHandlers', () => {
  it('isolates identical request IDs by renderer sender and cancellation', async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const signals: AbortSignal[] = [];
    const service = {
      deleteCredential: vi.fn(),
      getConfig: vi.fn().mockResolvedValue(config),
      saveConfig: vi.fn(),
      streamConversation: vi.fn(
        (_request: unknown, _send: unknown, signal: AbortSignal) =>
          new Promise<void>((resolve) => {
            signals.push(signal);
            signal.addEventListener('abort', () => resolve(), { once: true });
          }),
      ),
      testConfig: vi.fn(),
    } as unknown as ProviderService;
    registerProviderHandlers(
      {
        handle: (channel, handler) => {
          handlers.set(channel, handler as (...args: unknown[]) => unknown);
        },
        removeHandler: vi.fn(),
      },
      service,
    );
    const senderOne = { id: 1, isDestroyed: () => false, send: vi.fn() };
    const senderTwo = { id: 2, isDestroyed: () => false, send: vi.fn() };
    const start = handlers.get(CONVERSATION_START_CHANNEL);
    await start?.({ sender: senderOne }, validRequest('same-id'));
    await start?.({ sender: senderTwo }, validRequest('same-id'));
    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(false);
    expect(signals[1]?.aborted).toBe(false);

    const cancel = handlers.get(CONVERSATION_CANCEL_CHANNEL);
    await cancel?.({ sender: senderOne }, 'same-id');
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });
});
