import type {
  ConversationRequest,
  ProviderDraftConfig,
  ProviderSaveInput,
} from '../../shared/provider';
import { ProviderFailure } from './provider-error';

const MAX_MESSAGE_LENGTH = 24_000;
const MAX_RECENT_MESSAGES = 12;

function requiredText(value: unknown, maximum: number): string {
  if (typeof value !== 'string') {
    throw new ProviderFailure('invalid_configuration');
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maximum) {
    throw new ProviderFailure('invalid_configuration');
  }
  return trimmed;
}

export function validateProviderBaseUrl(value: unknown): string {
  const raw = requiredText(value, 2_048).replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ProviderFailure('invalid_configuration');
  }
  const isLocalhost = ['127.0.0.1', '::1', 'localhost'].includes(parsed.hostname);
  if (
    (parsed.protocol !== 'https:' && !(isLocalhost && parsed.protocol === 'http:')) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new ProviderFailure('invalid_configuration');
  }
  return parsed.toString().replace(/\/$/, '');
}

export function validateProviderDraft(value: unknown): ProviderDraftConfig {
  if (!value || typeof value !== 'object') {
    throw new ProviderFailure('invalid_configuration');
  }
  const draft = value as Record<string, unknown>;
  const apiKey =
    draft.apiKey === undefined || draft.apiKey === ''
      ? undefined
      : requiredText(draft.apiKey, 4_096);
  return {
    ...(apiKey === undefined ? {} : { apiKey }),
    baseUrl: validateProviderBaseUrl(draft.baseUrl),
    model: requiredText(draft.model, 256),
  };
}

export function validateProviderSave(value: unknown): ProviderSaveInput {
  const draft = validateProviderDraft(value);
  const mode = (value as Record<string, unknown>).mode;
  if (mode !== 'mock' && mode !== 'real') {
    throw new ProviderFailure('invalid_configuration');
  }
  return { ...draft, mode };
}

export function validateConversationRequest(value: unknown): ConversationRequest {
  if (!value || typeof value !== 'object') {
    throw new ProviderFailure('invalid_configuration');
  }
  const request = value as Record<string, unknown>;
  const context = request.context;
  if (!context || typeof context !== 'object') {
    throw new ProviderFailure('invalid_configuration');
  }
  const contextRecord = context as Record<string, unknown>;
  if (
    !Array.isArray(contextRecord.domains) ||
    contextRecord.domains.length > 12 ||
    !Array.isArray(contextRecord.recentMessages) ||
    contextRecord.recentMessages.length > MAX_RECENT_MESSAGES
  ) {
    throw new ProviderFailure('invalid_configuration');
  }
  const domains = contextRecord.domains.map((domain) => requiredText(domain, 80));
  const recentMessages = contextRecord.recentMessages.map((message) => {
    if (!message || typeof message !== 'object') {
      throw new ProviderFailure('invalid_configuration');
    }
    const candidate = message as Record<string, unknown>;
    if (!['assistant', 'system', 'user'].includes(String(candidate.role))) {
      throw new ProviderFailure('invalid_configuration');
    }
    return {
      content: requiredText(candidate.content, MAX_MESSAGE_LENGTH),
      role: candidate.role as 'assistant' | 'system' | 'user',
    };
  });
  return {
    context: {
      domains,
      exploration: requiredText(contextRecord.exploration, 1_000),
      recentMessages,
    },
    requestId: requiredText(request.requestId, 128),
    userMessage: requiredText(request.userMessage, MAX_MESSAGE_LENGTH),
  };
}
