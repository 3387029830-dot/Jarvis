import { describe, expect, it, vi } from 'vitest';

import type { ConversationStreamEvent } from '../../shared/provider';
import { ProviderFailure } from './provider-error';
import { OpenAICompatibleConversationProvider } from './openai-compatible-provider';

const config = { baseUrl: 'https://provider.example/v1', model: 'test-model' };
const encoder = new TextEncoder();

function sseResponse(chunks: readonly string[], status = 200): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
    { headers: { 'content-type': 'text/event-stream' }, status },
  );
}

function createRequest(onEvent: (event: ConversationStreamEvent) => void, signal?: AbortSignal) {
  return {
    apiKey: 'not-a-real-key',
    config,
    messages: [{ content: '你好', role: 'user' as const }],
    onEvent,
    requestId: 'request-1',
    signal: signal ?? new AbortController().signal,
  };
}

describe('OpenAICompatibleConversationProvider', () => {
  it('parses split SSE chunks, usage and DONE without exposing reasoning fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse([
          'data: {"choices":[{"delta":{"content":"你","reasoning":"hidden"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"好"}}],"usage":{"prompt_tokens":3,"completion_tokens":2,"total_tokens":5}}\n',
          '\ndata: [DONE]\n\n',
        ]),
      );
    const events: ConversationStreamEvent[] = [];
    const provider = new OpenAICompatibleConversationProvider({ fetch: fetchMock });
    await provider.stream(createRequest((event) => events.push(event)));

    expect(events).toContainEqual({ content: '你', requestId: 'request-1', type: 'delta' });
    expect(events).toContainEqual({ content: '好', requestId: 'request-1', type: 'delta' });
    expect(events).toContainEqual({
      requestId: 'request-1',
      type: 'usage',
      usage: { completionTokens: 2, promptTokens: 3, totalTokens: 5 },
    });
    expect(events.at(-1)).toEqual({ requestId: 'request-1', type: 'complete' });
    expect(JSON.stringify(events)).not.toContain('hidden');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: { Authorization: 'Bearer not-a-real-key' },
      redirect: 'manual',
    });
  });

  it.each([
    [401, 'authentication'],
    [429, 'rate_limit'],
    [503, 'provider_unavailable'],
    [400, 'invalid_configuration'],
  ])('maps HTTP %s to %s', async (status, code) => {
    const provider = new OpenAICompatibleConversationProvider({
      fetch: vi.fn().mockResolvedValue(new Response('error', { status })),
    });
    await expect(provider.stream(createRequest(() => undefined))).rejects.toMatchObject({ code });
  });

  it('rejects malformed SSE and oversized responses', async () => {
    const malformed = new OpenAICompatibleConversationProvider({
      fetch: vi.fn().mockResolvedValue(sseResponse(['data: {bad-json}\n\n'])),
    });
    await expect(malformed.stream(createRequest(() => undefined))).rejects.toMatchObject({
      code: 'malformed_response',
    });

    const oversized = new OpenAICompatibleConversationProvider({
      fetch: vi.fn().mockResolvedValue(sseResponse([`data: ${'x'.repeat(60)}\n\n`])),
      maxResponseBytes: 20,
    });
    await expect(oversized.stream(createRequest(() => undefined))).rejects.toMatchObject({
      code: 'malformed_response',
    });
  });

  it('maps an in-stream Provider error without exposing its body', async () => {
    const provider = new OpenAICompatibleConversationProvider({
      fetch: vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            'data: {"error":{"message":"private provider detail","api_key":"secret"}}\n\n',
          ]),
        ),
    });
    const promise = provider.stream(createRequest(() => undefined));
    await expect(promise).rejects.toMatchObject({
      code: 'provider_unavailable',
      safeTechnicalSummary: 'provider_error_event',
    });
    await expect(promise).rejects.not.toThrow('private provider detail');
  });

  it('distinguishes timeout and user cancellation', async () => {
    const blockingFetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      });
    });
    const timeoutProvider = new OpenAICompatibleConversationProvider({
      fetch: blockingFetch as typeof fetch,
      timeoutMs: 5,
    });
    await expect(timeoutProvider.stream(createRequest(() => undefined))).rejects.toMatchObject({
      code: 'timeout',
    });

    const controller = new AbortController();
    const cancelProvider = new OpenAICompatibleConversationProvider({
      fetch: blockingFetch as typeof fetch,
      timeoutMs: 1_000,
    });
    const promise = cancelProvider.stream(createRequest(() => undefined, controller.signal));
    controller.abort();
    await expect(promise).rejects.toEqual(expect.any(ProviderFailure));
    await expect(promise).rejects.toMatchObject({ code: 'cancelled' });
  });
});
