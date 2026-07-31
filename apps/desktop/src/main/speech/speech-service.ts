import type {
  SpeechDraftConfig,
  SpeechOperationResult,
  SpeechPublicConfig,
  SpeechSaveInput,
  SpeechTestResult,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
} from '../../shared/speech';
import { ProviderFailure, toProviderError } from '../providers/provider-error';
import { ProviderConfigStore } from '../providers/provider-config-store';
import { SpeechConfigStore } from './speech-config-store';
import type { SpeechToTextProvider } from './speech-provider';
import { filenameForSpeechRequest } from './speech-validation';

function createConnectionTestWave(): Uint8Array {
  const sampleRate = 8_000;
  const sampleCount = 2_400;
  const bytes = new Uint8Array(44 + sampleCount * 2);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, value: string): void => {
    for (let index = 0; index < value.length; index += 1) {
      bytes[offset + index] = value.charCodeAt(index);
    }
  };
  write(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, sampleCount * 2, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = Math.sin((Math.PI * index) / sampleCount);
    const sample = Math.round(Math.sin((2 * Math.PI * 440 * index) / sampleRate) * envelope * 900);
    view.setInt16(44 + index * 2, sample, true);
  }
  return bytes;
}

export class SpeechService {
  constructor(
    private readonly store: SpeechConfigStore,
    private readonly conversationStore: ProviderConfigStore,
    private readonly provider: SpeechToTextProvider,
  ) {}

  async getConfig(): Promise<SpeechPublicConfig> {
    return this.store.getPublicConfig(await this.conversationStore.getPublicConfig());
  }

  private async resolveCredential(input?: SpeechDraftConfig): Promise<string> {
    const source = input?.credentialSource ?? (await this.getConfig()).credentialSource;
    const credential =
      source === 'conversation'
        ? await this.conversationStore.getCredential()
        : input?.apiKey?.trim() || (await this.store.getIndependentCredential());
    if (!credential) {
      throw new ProviderFailure('invalid_configuration', {
        safeTechnicalSummary: 'speech_credential_missing',
      });
    }
    return credential;
  }

  async testConfig(input: SpeechDraftConfig): Promise<SpeechTestResult> {
    const startedAt = performance.now();
    const controller = new AbortController();
    try {
      await this.provider.transcribe(
        {
          apiKey: await this.resolveCredential(input),
          baseUrl: input.baseUrl,
          language: input.language,
          model: input.model,
          timeoutMs: input.timeoutMs,
        },
        {
          allowEmptyTranscript: true,
          audio: createConnectionTestWave(),
          filename: 'jarvis-stt-connection-test.wav',
          mimeType: 'audio/wav',
          requestId: 'speech-connection-test',
          signal: controller.signal,
        },
      );
      return { latencyMs: Math.max(1, Math.round(performance.now() - startedAt)), ok: true };
    } catch (error) {
      return { error: toProviderError(error, 'speech-connection-test'), ok: false };
    }
  }

  async saveConfig(input: SpeechSaveInput): Promise<SpeechOperationResult> {
    try {
      let lastTestedAt: string | null = null;
      if (input.mode === 'real') {
        const result = await this.testConfig(input);
        if (!result.ok) {
          return result;
        }
        lastTestedAt = new Date().toISOString();
      }
      await this.store.save(input, input.mode, lastTestedAt);
      return { config: await this.getConfig(), ok: true };
    } catch (error) {
      return { error: toProviderError(error), ok: false };
    }
  }

  async deleteCredential(): Promise<SpeechOperationResult> {
    try {
      await this.store.deleteCredential();
      return { config: await this.getConfig(), ok: true };
    } catch (error) {
      return { error: toProviderError(error), ok: false };
    }
  }

  async transcribe(
    request: SpeechTranscriptionRequest,
    signal: AbortSignal,
  ): Promise<SpeechTranscriptionResult> {
    const startedAt = performance.now();
    try {
      const config = await this.getConfig();
      if (config.mode !== 'real') {
        throw new ProviderFailure('invalid_configuration', {
          safeTechnicalSummary: 'speech_real_mode_disabled',
        });
      }
      const result = await this.provider.transcribe(
        {
          apiKey: await this.resolveCredential(),
          baseUrl: config.baseUrl,
          language: config.language,
          model: config.model,
          timeoutMs: config.timeoutMs,
        },
        {
          audio: request.audio,
          filename: filenameForSpeechRequest(request.requestId, request.mimeType),
          mimeType: request.mimeType,
          requestId: request.requestId,
          signal,
        },
      );
      return {
        metrics: {
          audioBytes: request.audio.byteLength,
          audioDurationMs: request.durationMs,
          providerId: this.provider.id,
          totalMs: Math.max(0, Math.round(performance.now() - startedAt)),
          uploadCompletedMs: result.uploadCompletedMs,
        },
        ok: true,
        requestId: request.requestId,
        transcript: result.transcript,
        ...(result.usage ? { usage: result.usage } : {}),
      };
    } catch (error) {
      return { error: toProviderError(error, request.requestId), ok: false };
    }
  }
}
