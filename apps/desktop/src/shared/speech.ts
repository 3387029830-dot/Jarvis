import type { ProviderError } from './provider';

export const SPEECH_GET_CONFIG_CHANNEL = 'jarvis:speech:get-config';
export const SPEECH_TEST_CONFIG_CHANNEL = 'jarvis:speech:test-config';
export const SPEECH_SAVE_CONFIG_CHANNEL = 'jarvis:speech:save-config';
export const SPEECH_DELETE_CREDENTIAL_CHANNEL = 'jarvis:speech:delete-credential';
export const SPEECH_TRANSCRIBE_CHANNEL = 'jarvis:speech:transcribe';
export const SPEECH_CANCEL_CHANNEL = 'jarvis:speech:cancel';

export const SPEECH_AUDIO_LIMITS = {
  maximumBytes: 16 * 1024 * 1024,
  maximumDurationMs: 60_500,
  minimumDurationMs: 300,
} as const;

export const SPEECH_SUPPORTED_MIME_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/wav',
  'audio/mpeg',
] as const;

export type SpeechMode = 'mock' | 'real';
export type SpeechCredentialSource = 'conversation' | 'independent';

export interface SpeechDraftConfig {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly credentialSource: SpeechCredentialSource;
  readonly language: string;
  readonly model: string;
  readonly timeoutMs: number;
}

export interface SpeechSaveInput extends SpeechDraftConfig {
  readonly mode: SpeechMode;
}

export interface SpeechPublicConfig {
  readonly baseUrl: string;
  readonly credentialSource: SpeechCredentialSource;
  readonly hasCredential: boolean;
  readonly keySuffix: string | null;
  readonly language: string;
  readonly lastTestedAt: string | null;
  readonly mode: SpeechMode;
  readonly model: string;
  readonly providerId: 'openai-compatible';
  readonly timeoutMs: number;
}

export interface SpeechTranscriptionRequest {
  readonly audio: Uint8Array;
  readonly durationMs: number;
  readonly mimeType: string;
  readonly requestId: string;
}

export interface SpeechUsage {
  readonly inputSeconds?: number;
}

export interface SpeechTranscriptionMetrics {
  readonly audioBytes: number;
  readonly audioDurationMs: number;
  readonly providerId: 'openai-compatible';
  readonly totalMs: number;
  readonly uploadCompletedMs: number;
}

export type SpeechOperationResult =
  | { readonly config: SpeechPublicConfig; readonly ok: true }
  | { readonly error: ProviderError; readonly ok: false };

export type SpeechTestResult =
  | { readonly latencyMs: number; readonly ok: true }
  | { readonly error: ProviderError; readonly ok: false };

export type SpeechTranscriptionResult =
  | {
      readonly metrics: SpeechTranscriptionMetrics;
      readonly ok: true;
      readonly requestId: string;
      readonly transcript: string;
      readonly usage?: SpeechUsage;
    }
  | { readonly error: ProviderError; readonly ok: false };

export interface JarvisSpeechApi {
  readonly cancel: (requestId: string) => Promise<void>;
  readonly deleteCredential: () => Promise<SpeechOperationResult>;
  readonly getConfig: () => Promise<SpeechPublicConfig>;
  readonly saveConfig: (input: SpeechSaveInput) => Promise<SpeechOperationResult>;
  readonly testConfig: (input: SpeechDraftConfig) => Promise<SpeechTestResult>;
  readonly transcribe: (request: SpeechTranscriptionRequest) => Promise<SpeechTranscriptionResult>;
}
