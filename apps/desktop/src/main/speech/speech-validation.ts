import type {
  SpeechDraftConfig,
  SpeechSaveInput,
  SpeechTranscriptionRequest,
} from '../../shared/speech';
import { SPEECH_AUDIO_LIMITS, SPEECH_SUPPORTED_MIME_TYPES } from '../../shared/speech';
import { ProviderFailure } from '../providers/provider-error';
import { validateProviderBaseUrl } from '../providers/provider-validation';

const extensionByMimeType: Readonly<Record<string, string>> = {
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
};

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

export function normalizeSpeechMimeType(value: unknown): string {
  const mimeType =
    typeof value === 'string' ? value.split(';', 1)[0]?.trim().toLowerCase() : undefined;
  if (
    !mimeType ||
    !SPEECH_SUPPORTED_MIME_TYPES.includes(mimeType as (typeof SPEECH_SUPPORTED_MIME_TYPES)[number])
  ) {
    throw new ProviderFailure('unsupported_audio_format');
  }
  return mimeType;
}

export function filenameForSpeechRequest(requestId: string, mimeType: string): string {
  const extension = extensionByMimeType[mimeType];
  if (!extension) {
    throw new ProviderFailure('unsupported_audio_format');
  }
  const safeId = requestId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'request';
  return `jarvis-${safeId}.${extension}`;
}

export function validateSpeechDraft(value: unknown): SpeechDraftConfig {
  if (!value || typeof value !== 'object') {
    throw new ProviderFailure('invalid_configuration');
  }
  const draft = value as Record<string, unknown>;
  const credentialSource = draft.credentialSource;
  if (credentialSource !== 'conversation' && credentialSource !== 'independent') {
    throw new ProviderFailure('invalid_configuration');
  }
  const apiKey =
    draft.apiKey === undefined || draft.apiKey === ''
      ? undefined
      : requiredText(draft.apiKey, 4_096);
  const timeoutMs =
    typeof draft.timeoutMs === 'number' && Number.isFinite(draft.timeoutMs)
      ? Math.round(draft.timeoutMs)
      : Number.NaN;
  if (timeoutMs < 1_000 || timeoutMs > 120_000) {
    throw new ProviderFailure('invalid_configuration');
  }
  return {
    ...(apiKey ? { apiKey } : {}),
    baseUrl: validateProviderBaseUrl(draft.baseUrl),
    credentialSource,
    language: requiredText(draft.language, 24),
    model: requiredText(draft.model, 256),
    timeoutMs,
  };
}

export function validateSpeechSave(value: unknown): SpeechSaveInput {
  const draft = validateSpeechDraft(value);
  const mode = (value as Record<string, unknown>).mode;
  if (mode !== 'mock' && mode !== 'real') {
    throw new ProviderFailure('invalid_configuration');
  }
  return { ...draft, mode };
}

export function validateSpeechTranscriptionRequest(value: unknown): SpeechTranscriptionRequest {
  if (!value || typeof value !== 'object') {
    throw new ProviderFailure('invalid_configuration');
  }
  const request = value as Record<string, unknown>;
  if (!(request.audio instanceof Uint8Array)) {
    throw new ProviderFailure('unsupported_audio_format', {
      safeTechnicalSummary: 'speech_audio_not_binary',
    });
  }
  if (request.audio.byteLength === 0) {
    throw new ProviderFailure('audio_too_short');
  }
  if (request.audio.byteLength > SPEECH_AUDIO_LIMITS.maximumBytes) {
    throw new ProviderFailure('audio_too_large');
  }
  const durationMs =
    typeof request.durationMs === 'number' && Number.isFinite(request.durationMs)
      ? Math.round(request.durationMs)
      : Number.NaN;
  if (durationMs < SPEECH_AUDIO_LIMITS.minimumDurationMs) {
    throw new ProviderFailure('audio_too_short');
  }
  if (durationMs > SPEECH_AUDIO_LIMITS.maximumDurationMs) {
    throw new ProviderFailure('audio_too_large');
  }
  return {
    audio: request.audio,
    durationMs,
    mimeType: normalizeSpeechMimeType(request.mimeType),
    requestId: requiredText(request.requestId, 128),
  };
}
