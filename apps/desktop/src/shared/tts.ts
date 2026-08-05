import type { ProviderError } from './provider';

export const TTS_GET_CONFIG_CHANNEL = 'jarvis:tts:get-config';
export const TTS_TEST_CONFIG_CHANNEL = 'jarvis:tts:test-config';
export const TTS_SAVE_CONFIG_CHANNEL = 'jarvis:tts:save-config';
export const TTS_DELETE_CREDENTIAL_CHANNEL = 'jarvis:tts:delete-credential';
export const TTS_SYNTHESIZE_CHANNEL = 'jarvis:tts:synthesize';
export const TTS_CANCEL_CHANNEL = 'jarvis:tts:cancel';
export const TTS_INSTALL_PROFILE_CHANNEL = 'jarvis:tts:install-profile';
export const TTS_SELECT_PROFILE_CHANNEL = 'jarvis:tts:select-profile';
export const TTS_DELETE_PROFILE_CHANNEL = 'jarvis:tts:delete-profile';

export type TtsMode = 'mock' | 'real';
export type TtsPlaybackMode = 'off' | 'manual' | 'automatic';
export type VoiceProfileCategory = 'original' | 'licensed-character' | 'consented-clone';
export type VoiceAuthorizationBasis = 'original-work' | 'license' | 'explicit-consent';

export interface VoiceAuthorization {
  readonly basis: VoiceAuthorizationBasis;
  readonly expiresAt: string | null;
  readonly permittedUse: string;
  readonly reference: string;
  readonly rightsHolder: string;
}

export interface VoiceProfile {
  readonly authorization: VoiceAuthorization;
  readonly category: VoiceProfileCategory;
  readonly description: string;
  readonly displayName: string;
  readonly id: string;
  readonly locale: string;
  readonly model: string;
  readonly previewText: string;
  readonly providerId: 'minimax';
  readonly providerVoiceId: string;
  readonly templateId?: string;
}

export interface TtsPublicVoiceProfile {
  readonly authorization: VoiceAuthorization;
  readonly category: VoiceProfileCategory;
  readonly description: string;
  readonly displayName: string;
  readonly id: string;
  readonly locale: string;
  readonly model: string;
  readonly previewText: string;
  readonly providerId: 'minimax';
  readonly templateId?: string;
}

export interface VoiceProfileTemplate {
  readonly description: string;
  readonly displayName: string;
  readonly id: string;
  readonly locale: string;
}

export interface TtsDraftConfig {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly language: string;
  readonly model: string;
  readonly timeoutMs: number;
}

export interface TtsSaveInput extends TtsDraftConfig {
  readonly mode: TtsMode;
  readonly playbackMode: TtsPlaybackMode;
}

export interface TtsPublicConfig {
  readonly baseUrl: string;
  readonly hasCredential: boolean;
  readonly keySuffix: string | null;
  readonly language: string;
  readonly lastTestedAt: string | null;
  readonly mode: TtsMode;
  readonly model: string;
  readonly playbackMode: TtsPlaybackMode;
  readonly profiles: readonly TtsPublicVoiceProfile[];
  readonly providerId: 'minimax';
  readonly selectedProfileId: string | null;
  readonly templates: readonly VoiceProfileTemplate[];
  readonly timeoutMs: number;
}

export interface TtsSynthesisRequest {
  readonly requestId: string;
  readonly text: string;
  readonly voiceProfileId: string;
}

export interface TtsSynthesisMetrics {
  readonly audioLengthMs?: number;
  readonly providerId: 'minimax';
  readonly totalMs: number;
  readonly usageCharacters?: number;
  readonly traceId?: string;
}

export type TtsOperationResult =
  | { readonly config: TtsPublicConfig; readonly ok: true }
  | { readonly error: ProviderError; readonly ok: false };

export type TtsTestResult =
  | { readonly latencyMs: number; readonly ok: true }
  | { readonly error: ProviderError; readonly ok: false };

export type TtsSynthesisResult =
  | {
      readonly audio: Uint8Array;
      readonly mimeType: 'audio/mpeg';
      readonly metrics: TtsSynthesisMetrics;
      readonly ok: true;
      readonly requestId: string;
    }
  | { readonly error: ProviderError; readonly ok: false };

export interface JarvisTtsApi {
  readonly cancel: (requestId: string) => Promise<void>;
  readonly deleteCredential: () => Promise<TtsOperationResult>;
  readonly deleteProfile: (profileId: string) => Promise<TtsOperationResult>;
  readonly getConfig: () => Promise<TtsPublicConfig>;
  readonly installProfile: (profile: VoiceProfile) => Promise<TtsOperationResult>;
  readonly saveConfig: (input: TtsSaveInput) => Promise<TtsOperationResult>;
  readonly selectProfile: (profileId: string) => Promise<TtsOperationResult>;
  readonly synthesize: (request: TtsSynthesisRequest) => Promise<TtsSynthesisResult>;
  readonly testConfig: (input: TtsDraftConfig) => Promise<TtsTestResult>;
}
