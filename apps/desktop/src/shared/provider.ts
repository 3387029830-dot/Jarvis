export const PROVIDER_GET_CONFIG_CHANNEL = 'jarvis:provider:get-config';
export const PROVIDER_TEST_CONFIG_CHANNEL = 'jarvis:provider:test-config';
export const PROVIDER_SAVE_CONFIG_CHANNEL = 'jarvis:provider:save-config';
export const PROVIDER_DELETE_CREDENTIAL_CHANNEL = 'jarvis:provider:delete-credential';
export const CONVERSATION_START_CHANNEL = 'jarvis:conversation:start';
export const CONVERSATION_CANCEL_CHANNEL = 'jarvis:conversation:cancel';
export const CONVERSATION_EVENT_CHANNEL = 'jarvis:conversation:event';

export const PROVIDER_ERROR_CODES = [
  'authentication',
  'permission',
  'invalid_configuration',
  'invalid_model',
  'rate_limit',
  'quota_exceeded',
  'timeout',
  'network',
  'provider_unavailable',
  'content_rejected',
  'cancelled',
  'malformed_response',
  'audio_too_short',
  'audio_too_large',
  'unsupported_audio_format',
  'empty_transcript',
  'transcription_failed',
  'unknown',
] as const;

export type ProviderErrorCode = (typeof PROVIDER_ERROR_CODES)[number];
export type ConversationMode = 'mock' | 'real';

export interface ProviderError {
  readonly code: ProviderErrorCode;
  readonly message: string;
  readonly providerId: 'openai-compatible';
  readonly requestId: string;
  readonly retryable: boolean;
  readonly safeTechnicalSummary: string;
  readonly status?: number;
}

export interface ProviderDraftConfig {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly model: string;
}

export interface ProviderPublicConfig {
  readonly baseUrl: string;
  readonly hasCredential: boolean;
  readonly keySuffix: string | null;
  readonly lastTestedAt: string | null;
  readonly mode: ConversationMode;
  readonly model: string;
}

export interface ProviderSaveInput extends ProviderDraftConfig {
  readonly mode: ConversationMode;
}

export type ProviderOperationResult =
  | { readonly ok: true; readonly config: ProviderPublicConfig }
  | { readonly ok: false; readonly error: ProviderError };

export type ProviderTestResult =
  | { readonly ok: true; readonly latencyMs: number }
  | { readonly ok: false; readonly error: ProviderError };

export interface ConversationMessage {
  readonly content: string;
  readonly role: 'assistant' | 'system' | 'user';
}

export interface ConversationContext {
  readonly domains: readonly string[];
  readonly exploration: string;
  readonly recentMessages: readonly ConversationMessage[];
}

export interface ConversationRequest {
  readonly context: ConversationContext;
  readonly requestId: string;
  readonly userMessage: string;
}

export type ConversationStreamEvent =
  | { readonly requestId: string; readonly type: 'started' }
  | { readonly content: string; readonly requestId: string; readonly type: 'delta' }
  | {
      readonly requestId: string;
      readonly type: 'usage';
      readonly usage: {
        readonly completionTokens?: number;
        readonly promptTokens?: number;
        readonly totalTokens?: number;
      };
    }
  | { readonly requestId: string; readonly type: 'complete' }
  | { readonly error: ProviderError; readonly requestId: string; readonly type: 'error' };

export interface JarvisProviderApi {
  readonly getConfig: () => Promise<ProviderPublicConfig>;
  readonly testConfig: (input: ProviderDraftConfig) => Promise<ProviderTestResult>;
  readonly saveConfig: (input: ProviderSaveInput) => Promise<ProviderOperationResult>;
  readonly deleteCredential: () => Promise<ProviderOperationResult>;
}

export interface JarvisConversationApi {
  readonly start: (request: ConversationRequest) => Promise<ProviderOperationResult>;
  readonly cancel: (requestId: string) => Promise<void>;
  readonly onEvent: (listener: (event: ConversationStreamEvent) => void) => () => void;
}
