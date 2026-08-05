import type {
  TtsDraftConfig,
  TtsOperationResult,
  TtsPublicConfig,
  TtsSaveInput,
  TtsSynthesisRequest,
  TtsSynthesisResult,
  TtsTestResult,
  VoiceProfile,
} from '../../shared/tts';
import { ProviderFailure, toProviderError } from '../providers/provider-error';
import { TtsConfigStore, isProfileAvailable } from './tts-config-store';
import type { TextToSpeechProvider } from './tts-provider';
import { normalizeTextForSpeech } from '../../shared/tts-text';

export class TtsService {
  constructor(
    private readonly store: TtsConfigStore,
    private readonly provider: TextToSpeechProvider,
  ) {}
  getConfig(): Promise<TtsPublicConfig> {
    return this.store.getPublicConfig();
  }
  private async credential(input?: TtsDraftConfig): Promise<string> {
    const value = input?.apiKey?.trim() || (await this.store.getCredential());
    if (!value)
      throw new ProviderFailure('invalid_configuration', {
        safeTechnicalSummary: 'tts_credential_missing',
      });
    return value;
  }
  async testConfig(input: TtsDraftConfig): Promise<TtsTestResult> {
    const profile = await this.store.getSelectedProfile();
    if (!profile || !isProfileAvailable(profile))
      return {
        error: toProviderError(
          new ProviderFailure('invalid_configuration', {
            safeTechnicalSummary: 'tts_selected_profile_required',
          }),
          'tts-connection-test',
          'minimax',
        ),
        ok: false,
      };
    const started = performance.now();
    try {
      await this.provider.synthesize(
        { ...input, apiKey: await this.credential(input) },
        {
          requestId: 'tts-connection-test',
          signal: new AbortController().signal,
          text: '你好',
          voiceId: profile.providerVoiceId,
        },
      );
      return { latencyMs: Math.max(1, Math.round(performance.now() - started)), ok: true };
    } catch (error) {
      return { error: toProviderError(error, 'tts-connection-test', 'minimax'), ok: false };
    }
  }
  async saveConfig(input: TtsSaveInput): Promise<TtsOperationResult> {
    try {
      let tested: string | null = null;
      if (input.mode === 'real') {
        const result = await this.testConfig(input);
        if (!result.ok) return result;
        tested = new Date().toISOString();
      }
      await this.store.save(input, input.mode, input.playbackMode, tested);
      return { config: await this.getConfig(), ok: true };
    } catch (error) {
      return { error: toProviderError(error, undefined, 'minimax'), ok: false };
    }
  }
  async deleteCredential(): Promise<TtsOperationResult> {
    try {
      await this.store.deleteCredential();
      return { config: await this.getConfig(), ok: true };
    } catch (error) {
      return { error: toProviderError(error, undefined, 'minimax'), ok: false };
    }
  }
  async deleteProfile(profileId: string): Promise<TtsOperationResult> {
    try {
      await this.store.deleteProfile(profileId);
      return { config: await this.getConfig(), ok: true };
    } catch (error) {
      return { error: toProviderError(error, undefined, 'minimax'), ok: false };
    }
  }
  async installProfile(profile: VoiceProfile): Promise<TtsOperationResult> {
    try {
      await this.store.installProfile(profile);
      return { config: await this.getConfig(), ok: true };
    } catch (error) {
      return { error: toProviderError(error, undefined, 'minimax'), ok: false };
    }
  }
  async selectProfile(profileId: string): Promise<TtsOperationResult> {
    try {
      await this.store.selectProfile(profileId);
      return { config: await this.getConfig(), ok: true };
    } catch (error) {
      return { error: toProviderError(error, undefined, 'minimax'), ok: false };
    }
  }
  async synthesize(request: TtsSynthesisRequest, signal: AbortSignal): Promise<TtsSynthesisResult> {
    const started = performance.now();
    try {
      const config = await this.getConfig();
      if (config.mode !== 'real')
        throw new ProviderFailure('invalid_configuration', {
          safeTechnicalSummary: 'tts_real_mode_disabled',
        });
      const profile = await this.store.getProfile(request.voiceProfileId);
      if (!profile || !isProfileAvailable(profile))
        throw new ProviderFailure('invalid_configuration', {
          safeTechnicalSummary: 'voice_profile_unavailable',
        });
      const result = await this.provider.synthesize(
        {
          apiKey: await this.credential(),
          baseUrl: config.baseUrl,
          language: config.language,
          model: profile.model || config.model,
          timeoutMs: config.timeoutMs,
        },
        {
          ...request,
          signal,
          text: normalizeTextForSpeech(request.text),
          voiceId: profile.providerVoiceId,
        },
      );
      return {
        audio: result.audio,
        mimeType: 'audio/mpeg',
        metrics: {
          ...(result.audioLengthMs === undefined ? {} : { audioLengthMs: result.audioLengthMs }),
          providerId: 'minimax',
          totalMs: Math.max(0, Math.round(performance.now() - started)),
          ...(result.usageCharacters === undefined
            ? {}
            : { usageCharacters: result.usageCharacters }),
          ...(result.traceId === undefined ? {} : { traceId: result.traceId }),
        },
        ok: true,
        requestId: request.requestId,
      };
    } catch (error) {
      return { error: toProviderError(error, request.requestId, 'minimax'), ok: false };
    }
  }
}
