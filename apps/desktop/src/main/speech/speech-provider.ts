import type { SpeechUsage } from '../../shared/speech';

export interface SpeechToTextProviderConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly language?: string;
  readonly model: string;
  readonly timeoutMs: number;
}

export interface SpeechToTextProviderRequest {
  readonly allowEmptyTranscript?: boolean;
  readonly audio: Uint8Array;
  readonly filename: string;
  readonly mimeType: string;
  readonly prompt?: string;
  readonly requestId: string;
  readonly signal: AbortSignal;
}

export interface SpeechToTextProviderResult {
  readonly transcript: string;
  readonly uploadCompletedMs: number;
  readonly usage?: SpeechUsage;
}

export interface SpeechToTextProvider {
  readonly id: 'openai-compatible';
  transcribe(
    config: SpeechToTextProviderConfig,
    request: SpeechToTextProviderRequest,
  ): Promise<SpeechToTextProviderResult>;
}
