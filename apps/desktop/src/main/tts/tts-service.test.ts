import { describe, expect, it, vi } from 'vitest';
import type { TtsConfigStore } from './tts-config-store';
import { TtsService } from './tts-service';
import type { TextToSpeechProvider } from './tts-provider';

const draft = {
  apiKey: 'test-key',
  baseUrl: 'https://api.minimax.io/v1',
  language: 'Chinese',
  model: 'speech-2.8-turbo',
  timeoutMs: 5000,
};

const expiredProfile = {
  authorization: {
    basis: 'original-work' as const,
    expiresAt: '2020-01-01T00:00:00.000Z',
    permittedUse: '测试',
    reference: 'test-reference',
    rightsHolder: 'Jarvis 团队',
  },
  category: 'original' as const,
  description: '测试声线',
  displayName: '测试声线',
  id: 'profile-expired',
  locale: 'zh-CN',
  model: 'speech-2.8-turbo',
  previewText: '你好',
  providerId: 'minimax' as const,
  providerVoiceId: 'voice-expired',
};

describe('TtsService', () => {
  it('does not test an expired selected profile', async () => {
    const provider: TextToSpeechProvider = {
      id: 'minimax',
      synthesize: vi.fn(),
    };
    const store = {
      getSelectedProfile: vi.fn().mockResolvedValue(expiredProfile),
    } as unknown as TtsConfigStore;
    const service = new TtsService(store, provider);

    const result = await service.testConfig(draft);

    expect(result).toMatchObject({ ok: false, error: { code: 'invalid_configuration' } });
    expect(provider.synthesize).not.toHaveBeenCalled();
  });
});
