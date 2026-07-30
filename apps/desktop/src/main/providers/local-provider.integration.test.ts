import { createServer, type Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import type { ConversationStreamEvent } from '../../shared/provider';
import { OpenAICompatibleConversationProvider } from './openai-compatible-provider';

let server: Server | null = null;

afterEach(
  () =>
    new Promise<void>((resolve) => {
      if (!server) {
        resolve();
        return;
      }
      server.close(() => resolve());
      server = null;
    }),
);

describe('local OpenAI-compatible server acceptance', () => {
  it('sends a real HTTP request and consumes fragmented Chinese SSE', async () => {
    let receivedModel = '';
    server = createServer((request, response) => {
      let body = '';
      request.setEncoding('utf8');
      request.on('data', (chunk) => {
        body += chunk;
      });
      request.on('end', () => {
        receivedModel = String((JSON.parse(body) as { model?: unknown }).model);
        response.writeHead(200, { 'content-type': 'text/event-stream' });
        response.write('data: {"choices":[{"delta":{"cont');
        response.write('ent":"真实网络"}}]}\n\n');
        response.write('data: {"choices":[{"delta":{"content":"流式中文"}}]}\n\n');
        response.end('data: [DONE]\n\n');
      });
    });
    await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Local test server did not expose a port.');
    }
    const events: ConversationStreamEvent[] = [];
    const provider = new OpenAICompatibleConversationProvider();
    await provider.stream({
      apiKey: 'local-fake-key',
      config: {
        baseUrl: `http://localhost:${address.port}/v1`,
        model: 'local-model-v2',
      },
      messages: [{ content: '测试', role: 'user' }],
      onEvent: (event) => events.push(event),
      requestId: 'local-http-request',
      signal: new AbortController().signal,
    });
    expect(receivedModel).toBe('local-model-v2');
    expect(
      events
        .filter((event) => event.type === 'delta')
        .map((event) => (event.type === 'delta' ? event.content : ''))
        .join(''),
    ).toBe('真实网络流式中文');
    expect(events.at(-1)?.type).toBe('complete');
  });
});
