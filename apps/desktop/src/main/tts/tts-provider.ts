export interface TextToSpeechProviderConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly language: string;
  readonly model: string;
  readonly timeoutMs: number;
}

export interface TextToSpeechProviderRequest {
  readonly requestId: string;
  readonly signal: AbortSignal;
  readonly text: string;
  readonly voiceId: string;
}

export interface TextToSpeechProviderResult {
  readonly audio: Uint8Array;
  readonly audioLengthMs?: number;
  readonly usageCharacters?: number;
  readonly traceId?: string;
}

export interface TextToSpeechProvider {
  readonly id: 'minimax';
  synthesize(
    config: TextToSpeechProviderConfig,
    request: TextToSpeechProviderRequest,
  ): Promise<TextToSpeechProviderResult>;
}
