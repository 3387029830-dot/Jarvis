import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { TtsConfigStore, isProfileAvailable } from './tts-config-store';

const safeStorage = {
  decryptString: (value: Buffer) => value.toString('utf8'),
  encryptString: (value: string) => Buffer.from(value),
  isEncryptionAvailable: () => true,
};
const profile = {
  authorization: {
    expiresAt: null,
    permittedUse: '个人使用',
    reference: 'contract-1',
    rightsHolder: 'Jarvis 团队',
  },
  category: 'original' as const,
  description: '清晰',
  displayName: '理性同伴',
  id: 'profile-1',
  locale: 'zh-CN',
  model: 'speech-2.8-turbo',
  previewText: '你好',
  providerId: 'minimax' as const,
  providerVoiceId: 'voice-1',
  templateId: 'rational-companion',
};

describe('TtsConfigStore', () => {
  it('encrypts credentials, exposes only suffix, and persists playback/profile selection', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'jarvis-tts-'));
    const store = new TtsConfigStore(directory, safeStorage);
    await store.installProfile(profile);
    await store.selectProfile(profile.id);
    await store.save(
      {
        apiKey: 'private-secret',
        baseUrl: 'https://api.minimax.io/v1',
        language: 'Chinese',
        model: 'speech-2.8-turbo',
        timeoutMs: 45000,
      },
      'real',
      'automatic',
      '2026-08-01T00:00:00.000Z',
    );
    const publicConfig = await store.getPublicConfig();
    expect(publicConfig.keySuffix).toBe('cret');
    expect(publicConfig.selectedProfileId).toBe(profile.id);
    expect(publicConfig.playbackMode).toBe('automatic');
    expect(await store.getCredential()).toBe('private-secret');
    const raw = await readFile(path.join(directory, 'tts-config.v1.json'), 'utf8');
    expect(raw).not.toContain('private-secret');
    await store.installProfile({ ...profile, description: '已编辑' });
    expect((await store.getPublicConfig()).profiles[0]?.description).toBe('已编辑');
    await store.deleteProfile(profile.id);
    const deleted = await store.getPublicConfig();
    expect(deleted.profiles).toEqual([]);
    expect(deleted.selectedProfileId).toBeNull();
  });
  it('rejects expired authorization', () => {
    expect(
      isProfileAvailable(
        { ...profile, authorization: { ...profile.authorization, expiresAt: '2020-01-01' } },
        new Date('2026-01-01'),
      ),
    ).toBe(false);
  });
  it.each(['original', 'licensed-character', 'consented-clone'] as const)(
    'accepts complete %s authorization and rejects missing binding metadata',
    (category) => {
      expect(isProfileAvailable({ ...profile, category })).toBe(true);
      expect(isProfileAvailable({ ...profile, category, providerVoiceId: '' })).toBe(false);
      expect(
        isProfileAvailable({
          ...profile,
          category,
          authorization: { ...profile.authorization, reference: '' },
        }),
      ).toBe(false);
    },
  );
});
