import type {
  ConversationMessage,
  ConversationStreamEvent,
  ProviderDraftConfig,
} from '../../shared/provider';
import { ProviderFailure } from './provider-error';

interface ProviderRequest {
  readonly apiKey: string;
  readonly config: ProviderDraftConfig;
  readonly messages: readonly ConversationMessage[];
  readonly onEvent: (event: ConversationStreamEvent) => void;
  readonly requestId: string;
  readonly signal: AbortSignal;
}

export interface OpenAICompatibleProviderOptions {
  readonly fetch?: typeof fetch;
  readonly maxResponseBytes?: number;
  readonly timeoutMs?: number;
}

const textDecoder = new TextDecoder();

function errorForStatus(status: number): ProviderFailure {
  if (status === 401 || status === 403) {
    return new ProviderFailure(status === 401 ? 'authentication' : 'permission', { status });
  }
  if (status === 402) {
    return new ProviderFailure('quota_exceeded', { status });
  }
  if (status === 404) {
    return new ProviderFailure('invalid_model', { status });
  }
  if (status === 429) {
    return new ProviderFailure('rate_limit', { status });
  }
  if (status >= 500) {
    return new ProviderFailure('provider_unavailable', { status });
  }
  return new ProviderFailure(status === 422 ? 'content_rejected' : 'invalid_configuration', {
    status,
  });
}

function parseDataEvent(
  raw: string,
  requestId: string,
  onEvent: (event: ConversationStreamEvent) => void,
): { readonly contentAdded: boolean; readonly done: boolean } {
  const data = raw
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');
  if (!data) {
    return { contentAdded: false, done: false };
  }
  if (data.trim() === '[DONE]') {
    return { contentAdded: false, done: true };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch (error) {
    throw new ProviderFailure('malformed_response', { cause: error });
  }
  if (!payload || typeof payload !== 'object') {
    throw new ProviderFailure('malformed_response');
  }
  const record = payload as Record<string, unknown>;
  if (record.error) {
    throw new ProviderFailure('provider_unavailable', {
      safeTechnicalSummary: 'provider_error_event',
    });
  }
  const choices = record.choices;
  let contentAdded = false;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      const delta =
        choice && typeof choice === 'object'
          ? (choice as Record<string, unknown>).delta
          : undefined;
      const content =
        delta && typeof delta === 'object' ? (delta as Record<string, unknown>).content : undefined;
      if (typeof content === 'string' && content) {
        onEvent({ content, requestId, type: 'delta' });
        contentAdded = true;
      }
    }
  }
  const usage = record.usage;
  if (usage && typeof usage === 'object') {
    const source = usage as Record<string, unknown>;
    const promptTokens =
      typeof source.prompt_tokens === 'number' ? source.prompt_tokens : undefined;
    const completionTokens =
      typeof source.completion_tokens === 'number' ? source.completion_tokens : undefined;
    const totalTokens = typeof source.total_tokens === 'number' ? source.total_tokens : undefined;
    onEvent({
      requestId,
      type: 'usage',
      usage: {
        ...(promptTokens === undefined ? {} : { promptTokens }),
        ...(completionTokens === undefined ? {} : { completionTokens }),
        ...(totalTokens === undefined ? {} : { totalTokens }),
      },
    });
  }
  return { contentAdded, done: false };
}

export class OpenAICompatibleConversationProvider {
  private readonly fetchImplementation: typeof fetch;
  private readonly maxResponseBytes: number;
  private readonly timeoutMs: number;

  constructor(options: OpenAICompatibleProviderOptions = {}) {
    this.fetchImplementation = options.fetch ?? fetch;
    this.maxResponseBytes = options.maxResponseBytes ?? 1_048_576;
    this.timeoutMs = options.timeoutMs ?? 45_000;
  }

  async stream(request: ProviderRequest): Promise<void> {
    const controller = new AbortController();
    let timedOut = false;
    const abort = (): void => controller.abort();
    request.signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    try {
      request.onEvent({ requestId: request.requestId, type: 'started' });
      const response = await this.fetchImplementation(
        `${request.config.baseUrl}/chat/completions`,
        {
          body: JSON.stringify({
            messages: request.messages,
            model: request.config.model,
            stream: true,
            stream_options: { include_usage: true },
          }),
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${request.apiKey}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          redirect: 'manual',
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        throw errorForStatus(response.status);
      }
      if (!response.body) {
        throw new ProviderFailure('malformed_response');
      }
      const reader = response.body.getReader();
      let buffer = '';
      let bytes = 0;
      let contentAdded = false;
      let done = false;
      while (!done) {
        const result = await reader.read();
        if (result.done) {
          break;
        }
        bytes += result.value.byteLength;
        if (bytes > this.maxResponseBytes) {
          await reader.cancel();
          throw new ProviderFailure('malformed_response', {
            safeTechnicalSummary: 'response_size_limit_exceeded',
          });
        }
        buffer += textDecoder.decode(result.value, { stream: true });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const parsed = parseDataEvent(part, request.requestId, request.onEvent);
          contentAdded ||= parsed.contentAdded;
          done ||= parsed.done;
        }
      }
      if (!done && buffer.trim()) {
        const parsed = parseDataEvent(buffer, request.requestId, request.onEvent);
        contentAdded ||= parsed.contentAdded;
        done ||= parsed.done;
      }
      if (!contentAdded) {
        throw new ProviderFailure('malformed_response', {
          safeTechnicalSummary: 'empty_text_response',
        });
      }
      request.onEvent({ requestId: request.requestId, type: 'complete' });
    } catch (error) {
      if (error instanceof ProviderFailure) {
        throw error;
      }
      if (controller.signal.aborted) {
        throw new ProviderFailure(timedOut ? 'timeout' : 'cancelled', { cause: error });
      }
      throw new ProviderFailure('network', { cause: error });
    } finally {
      clearTimeout(timeout);
      request.signal.removeEventListener('abort', abort);
    }
  }
}
