import { describe, expect, it } from 'vitest';
import { validateTtsDraft, validateVoiceProfile } from './tts-validation';

const profile = {
  authorization: {
    basis: 'original-work',
    expiresAt: null,
    permittedUse: '个人使用',
    reference: 'original-record-1',
    rightsHolder: 'Jarvis 团队',
  },
  category: 'original',
  description: '清晰',
  displayName: '理性同伴',
  id: 'profile-1',
  locale: 'zh-CN',
  model: 'speech-2.8-turbo',
  previewText: '你好',
  providerId: 'minimax',
  providerVoiceId: 'voice-1',
};

describe('TTS validation', () => {
  it.each([
    'https://user:password@example.com/v1',
    'https://example.com/v1?key=value',
    'https://example.com/v1#fragment',
    'http://example.com/v1',
  ])('rejects unsafe Base URL %s', (baseUrl) => {
    expect(() =>
      validateTtsDraft({
        baseUrl,
        language: 'Chinese',
        model: 'speech-2.8-turbo',
        timeoutMs: 45_000,
      }),
    ).toThrowError();
  });

  it('requires an authorization basis matching the profile category', () => {
    expect(() => validateVoiceProfile(profile)).not.toThrow();
    expect(() =>
      validateVoiceProfile({
        ...profile,
        category: 'licensed-character',
      }),
    ).toThrowError();
  });
});
