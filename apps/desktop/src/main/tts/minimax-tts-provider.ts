import { ProviderFailure } from '../providers/provider-error';
import type {
  TextToSpeechProvider,
  TextToSpeechProviderConfig,
  TextToSpeechProviderRequest,
  TextToSpeechProviderResult,
} from './tts-provider';

const MAX_RESPONSE_BYTES = 24 * 1024 * 1024;

function mapStatus(status: number): ProviderFailure {
  if (status === 401) return new ProviderFailure('authentication', { status });
  if (status === 403) return new ProviderFailure('permission', { status });
  if (status === 404 || status === 422) return new ProviderFailure('invalid_model', { status });
  if (status === 429) return new ProviderFailure('rate_limit', { status });
  if (status === 402) return new ProviderFailure('quota_exceeded', { status });
  if (status >= 500) return new ProviderFailure('provider_unavailable', { status });
  return new ProviderFailure('unknown', { status, safeTechnicalSummary: 'tts_request_failed' });
}

function decodeHex(value: string): Uint8Array {
  if (!/^[\da-f]+$/i.test(value) || value.length % 2 !== 0) {
    throw new ProviderFailure('malformed_response', {
      safeTechnicalSummary: 'tts_invalid_hex_audio',
    });
  }
  const audio = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    audio[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return audio;
}

export class MiniMaxTextToSpeechProvider implements TextToSpeechProvider {
  readonly id = 'minimax' as const;
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async synthesize(
    config: TextToSpeechProviderConfig,
    request: TextToSpeechProviderRequest,
  ): Promise<TextToSpeechProviderResult> {
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), config.timeoutMs);
    try {
      const response = await this.fetcher(`${config.baseUrl.replace(/\/$/, '')}/t2a_v2`, {
        body: JSON.stringify({
          audio_setting: { bitrate: 128000, channel: 1, format: 'mp3', sample_rate: 32000 },
          language_boost: config.language,
          model: config.model,
          output_format: 'hex',
          stream: false,
          text: request.text,
          voice_setting: { pitch: 0, speed: 1, vol: 1, voice_id: request.voiceId },
        }),
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        method: 'POST',
        redirect: 'manual',
        signal: AbortSignal.any([request.signal, timeoutController.signal]),
      });
      if (response.status >= 300 && response.status < 400) {
        throw new ProviderFailure('invalid_configuration', {
          safeTechnicalSummary: 'tts_redirect_rejected',
          status: response.status,
        });
      }
      if (!response.ok) throw mapStatus(response.status);
      const declared = Number(response.headers.get('content-length') ?? '0');
      if (declared > MAX_RESPONSE_BYTES) {
        throw new ProviderFailure('malformed_response', {
          safeTechnicalSummary: 'tts_response_too_large',
        });
      }
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
        throw new ProviderFailure('malformed_response', {
          safeTechnicalSummary: 'tts_response_too_large',
        });
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (cause) {
        throw new ProviderFailure('malformed_response', {
          cause,
          safeTechnicalSummary: 'tts_invalid_json',
        });
      }
      const record = parsed as Record<string, unknown>;
      const base = record.base_resp as Record<string, unknown> | undefined;
      if (typeof base?.status_code === 'number' && base.status_code !== 0) {
        const message = typeof base.status_msg === 'string' ? base.status_msg.toLowerCase() : '';
        throw new ProviderFailure(
          message.includes('voice') ? 'invalid_configuration' : 'provider_unavailable',
          {
            safeTechnicalSummary: message.includes('voice')
              ? 'tts_invalid_voice'
              : 'tts_provider_status',
          },
        );
      }
      const data = record.data as Record<string, unknown> | undefined;
      if (typeof data?.audio !== 'string') {
        throw new ProviderFailure('malformed_response', {
          safeTechnicalSummary: 'tts_missing_audio',
        });
      }
      const extra = record.extra_info as Record<string, unknown> | undefined;
      return {
        audio: decodeHex(data.audio),
        ...(typeof record.trace_id === 'string' ? { traceId: record.trace_id } : {}),
        ...(typeof extra?.audio_length === 'number' ? { audioLengthMs: extra.audio_length } : {}),
        ...(typeof extra?.usage_characters === 'number'
          ? { usageCharacters: extra.usage_characters }
          : {}),
      };
    } catch (error) {
      if (error instanceof ProviderFailure) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderFailure(request.signal.aborted ? 'cancelled' : 'timeout');
      }
      throw new ProviderFailure('network', {
        cause: error,
        safeTechnicalSummary: 'tts_network_failed',
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
