import type {
  TtsDraftConfig,
  TtsSaveInput,
  TtsSynthesisRequest,
  VoiceProfileCategory,
  VoiceAuthorizationBasis,
  VoiceProfile,
} from '../../shared/tts';
import { ProviderFailure } from '../providers/provider-error';
import { validateProviderBaseUrl } from '../providers/provider-validation';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') throw new ProviderFailure('invalid_configuration');
  return value as Record<string, unknown>;
}
function string(r: Record<string, unknown>, key: string, max = 500): string {
  const value = r[key];
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new ProviderFailure('invalid_configuration', {
      safeTechnicalSummary: `tts_invalid_${key}`,
    });
  return value.trim();
}
function base(raw: unknown): TtsDraftConfig {
  const r = record(raw);
  const baseUrl = validateProviderBaseUrl(r.baseUrl);
  const timeoutMs = r.timeoutMs;
  if (typeof timeoutMs !== 'number' || timeoutMs < 3000 || timeoutMs > 120000)
    throw new ProviderFailure('invalid_configuration', {
      safeTechnicalSummary: 'tts_invalid_timeoutMs',
    });
  return {
    ...(typeof r.apiKey === 'string' && r.apiKey.trim() ? { apiKey: r.apiKey.trim() } : {}),
    baseUrl,
    language: string(r, 'language', 40),
    model: string(r, 'model', 100),
    timeoutMs,
  };
}
export const validateTtsDraft = base;
export function validateTtsSave(raw: unknown): TtsSaveInput {
  const r = record(raw);
  const draft = base(raw);
  if (r.mode !== 'mock' && r.mode !== 'real') throw new ProviderFailure('invalid_configuration');
  if (r.playbackMode !== 'off' && r.playbackMode !== 'manual' && r.playbackMode !== 'automatic')
    throw new ProviderFailure('invalid_configuration');
  return { ...draft, mode: r.mode, playbackMode: r.playbackMode };
}
export function validateTtsRequest(raw: unknown): TtsSynthesisRequest {
  const r = record(raw);
  return {
    requestId: string(r, 'requestId', 128),
    text: string(r, 'text', 4000),
    voiceProfileId: string(r, 'voiceProfileId', 128),
  };
}
export function validateVoiceProfile(raw: unknown): VoiceProfile {
  const r = record(raw);
  const a = record(r.authorization);
  const category = r.category;
  const basis = a.basis;
  const expectedBasis: Readonly<Record<VoiceProfileCategory, VoiceAuthorizationBasis>> = {
    original: 'original-work',
    'licensed-character': 'license',
    'consented-clone': 'explicit-consent',
  };
  if (
    (category !== 'original' &&
      category !== 'licensed-character' &&
      category !== 'consented-clone') ||
    (basis !== 'original-work' && basis !== 'license' && basis !== 'explicit-consent') ||
    expectedBasis[category] !== basis
  )
    throw new ProviderFailure('invalid_configuration');
  return {
    authorization: {
      basis,
      expiresAt: typeof a.expiresAt === 'string' && a.expiresAt ? a.expiresAt : null,
      permittedUse: string(a, 'permittedUse'),
      reference: string(a, 'reference'),
      rightsHolder: string(a, 'rightsHolder'),
    },
    category,
    description: string(r, 'description'),
    displayName: string(r, 'displayName', 80),
    id: string(r, 'id', 128),
    locale: string(r, 'locale', 30),
    model: string(r, 'model', 100),
    previewText: string(r, 'previewText', 300),
    providerId: 'minimax',
    providerVoiceId: string(r, 'providerVoiceId', 200),
    ...(typeof r.templateId === 'string' ? { templateId: r.templateId } : {}),
  };
}
