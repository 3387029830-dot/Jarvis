import { ProviderFailure } from '../providers/provider-error';
import type {
  SpeechToTextProvider,
  SpeechToTextProviderConfig,
  SpeechToTextProviderRequest,
  SpeechToTextProviderResult,
} from './speech-provider';

const MAX_RESPONSE_BYTES = 256 * 1024;

export interface OpenAICompatibleSpeechProviderOptions {
  readonly fetch?: typeof fetch;
  readonly maxResponseBytes?: number;
}

function mapStatus(status: number): ProviderFailure {
  if (status === 401) {
    return new ProviderFailure('authentication', { status });
  }
  if (status === 403) {
    return new ProviderFailure('permission', { status });
  }
  if (status === 404) {
    return new ProviderFailure('invalid_model', { status });
  }
  if (status === 413) {
    return new ProviderFailure('audio_too_large', { status });
  }
  if (status === 415 || status === 422) {
    return new ProviderFailure('unsupported_audio_format', { status });
  }
  if (status === 429) {
    return new ProviderFailure('rate_limit', { status });
  }
  if (status === 402) {
    return new ProviderFailure('quota_exceeded', { status });
  }
  if (status >= 500) {
    return new ProviderFailure('provider_unavailable', { status });
  }
  return new ProviderFailure('transcription_failed', { status });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function readLimitedText(response: Response, maximumBytes: number): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length') ?? '0');
  if (declaredLength > maximumBytes) {
    throw new ProviderFailure('malformed_response', {
      safeTechnicalSummary: 'speech_response_too_large',
    });
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maximumBytes) {
    throw new ProviderFailure('malformed_response', {
      safeTechnicalSummary: 'speech_response_too_large',
    });
  }
  return text;
}

function parseResult(
  text: string,
  allowEmptyTranscript: boolean,
): Pick<SpeechToTextProviderResult, 'transcript' | 'usage'> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ProviderFailure('malformed_response', {
      cause: error,
      safeTechnicalSummary: 'speech_invalid_json',
    });
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ProviderFailure('malformed_response', {
      safeTechnicalSummary: 'speech_invalid_payload',
    });
  }
  const record = parsed as Record<string, unknown>;
  if (typeof record.text !== 'string') {
    throw new ProviderFailure('malformed_response', {
      safeTechnicalSummary: 'speech_missing_text',
    });
  }
  const transcript = record.text.trim();
  if (!transcript && !allowEmptyTranscript) {
    throw new ProviderFailure('empty_transcript');
  }
  const usageRecord =
    record.usage && typeof record.usage === 'object'
      ? (record.usage as Record<string, unknown>)
      : null;
  const inputSeconds =
    usageRecord && typeof usageRecord.seconds === 'number' && Number.isFinite(usageRecord.seconds)
      ? Math.max(0, usageRecord.seconds)
      : undefined;
  return {
    transcript,
    ...(inputSeconds === undefined ? {} : { usage: { inputSeconds } }),
  };
}

export class OpenAICompatibleSpeechToTextProvider implements SpeechToTextProvider {
  readonly id = 'openai-compatible' as const;

  constructor(private readonly options: OpenAICompatibleSpeechProviderOptions = {}) {}

  async transcribe(
    config: SpeechToTextProviderConfig,
    request: SpeechToTextProviderRequest,
  ): Promise<SpeechToTextProviderResult> {
    const startedAt = performance.now();
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), config.timeoutMs);
    const combinedSignal = AbortSignal.any([request.signal, timeoutController.signal]);
    try {
      const form = new FormData();
      const audioBuffer = new ArrayBuffer(request.audio.byteLength);
      new Uint8Array(audioBuffer).set(request.audio);
      form.append('file', new Blob([audioBuffer], { type: request.mimeType }), request.filename);
      form.append('model', config.model);
      if (config.language) {
        form.append('language', config.language);
      }
      if (request.prompt) {
        form.append('prompt', request.prompt);
      }
      const response = await (this.options.fetch ?? fetch)(
        `${config.baseUrl}/audio/transcriptions`,
        {
          body: form,
          headers: { Authorization: `Bearer ${config.apiKey}` },
          method: 'POST',
          redirect: 'manual',
          signal: combinedSignal,
        },
      );
      const uploadCompletedMs = Math.max(0, Math.round(performance.now() - startedAt));
      if (response.status >= 300 && response.status < 400) {
        throw new ProviderFailure('invalid_configuration', {
          safeTechnicalSummary: 'speech_redirect_rejected',
          status: response.status,
        });
      }
      if (!response.ok) {
        throw mapStatus(response.status);
      }
      const parsed = parseResult(
        await readLimitedText(response, this.options.maxResponseBytes ?? MAX_RESPONSE_BYTES),
        request.allowEmptyTranscript ?? false,
      );
      return { ...parsed, uploadCompletedMs };
    } catch (error) {
      if (error instanceof ProviderFailure) {
        throw error;
      }
      if (isAbortError(error)) {
        if (request.signal.aborted) {
          throw new ProviderFailure('cancelled');
        }
        throw new ProviderFailure('timeout');
      }
      throw new ProviderFailure('network', {
        cause: error,
        safeTechnicalSummary: 'speech_network_failed',
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
