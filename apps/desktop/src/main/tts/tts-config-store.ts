import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  TtsDraftConfig,
  TtsMode,
  TtsPlaybackMode,
  TtsPublicConfig,
  VoiceProfile,
  VoiceProfileTemplate,
} from '../../shared/tts';
import { ProviderFailure } from '../providers/provider-error';
import type { SafeStorageAdapter } from '../providers/provider-config-store';

interface StoredTtsConfig {
  readonly baseUrl: string;
  readonly encryptedApiKey?: string;
  readonly keySuffix?: string;
  readonly language: string;
  readonly lastTestedAt?: string;
  readonly mode: TtsMode;
  readonly model: string;
  readonly playbackMode: TtsPlaybackMode;
  readonly profiles: readonly VoiceProfile[];
  readonly selectedProfileId?: string;
  readonly timeoutMs: number;
  readonly version: 1;
}

export const voiceProfileTemplates: readonly VoiceProfileTemplate[] = [
  {
    description: '克制、从容，适合长时间陪伴。',
    displayName: '静默管家',
    id: 'silent-steward',
    locale: 'zh-CN',
  },
  {
    description: '温暖而不说教，适合梳理复杂问题。',
    displayName: '温和导师',
    id: 'gentle-mentor',
    locale: 'zh-CN',
  },
  {
    description: '清晰、平衡，适合日常认知对话。',
    displayName: '理性同伴',
    id: 'rational-companion',
    locale: 'zh-CN',
  },
  {
    description: '更轻、更慢，适合夜间回顾。',
    displayName: '夜间低语',
    id: 'night-whisper',
    locale: 'zh-CN',
  },
] as const;

const defaults: StoredTtsConfig = {
  baseUrl: 'https://api.minimax.io/v1',
  language: 'Chinese',
  mode: 'mock',
  model: 'speech-2.8-turbo',
  playbackMode: 'manual',
  profiles: [],
  timeoutMs: 45_000,
  version: 1,
};

function valid(value: unknown): value is StoredTtsConfig {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    r.version === 1 &&
    typeof r.baseUrl === 'string' &&
    typeof r.language === 'string' &&
    (r.mode === 'mock' || r.mode === 'real') &&
    typeof r.model === 'string' &&
    (r.playbackMode === 'off' || r.playbackMode === 'manual' || r.playbackMode === 'automatic') &&
    Array.isArray(r.profiles) &&
    typeof r.timeoutMs === 'number'
  );
}

export function isProfileAvailable(profile: VoiceProfile, now = new Date()): boolean {
  const { authorization } = profile;
  if (
    !authorization.rightsHolder.trim() ||
    !authorization.reference.trim() ||
    !authorization.permittedUse.trim()
  )
    return false;
  if (authorization.expiresAt && new Date(authorization.expiresAt).getTime() <= now.getTime())
    return false;
  return Boolean(
    profile.providerVoiceId.trim() && profile.displayName.trim() && profile.model.trim(),
  );
}

export class TtsConfigStore {
  private readonly configPath: string;
  constructor(
    userDataPath: string,
    private readonly safeStorage: SafeStorageAdapter,
  ) {
    this.configPath = path.join(userDataPath, 'tts-config.v1.json');
  }
  private async read(): Promise<StoredTtsConfig> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.configPath, 'utf8'));
      return valid(parsed) ? parsed : defaults;
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'ENOENT' || error instanceof SyntaxError) return defaults;
      throw error;
    }
  }
  private async write(config: StoredTtsConfig): Promise<void> {
    await mkdir(path.dirname(this.configPath), { recursive: true });
    const temporary = `${this.configPath}.tmp`;
    await writeFile(temporary, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    await rename(temporary, this.configPath);
  }
  async getPublicConfig(): Promise<TtsPublicConfig> {
    const c = await this.read();
    return {
      baseUrl: c.baseUrl,
      hasCredential: Boolean(c.encryptedApiKey),
      keySuffix: c.keySuffix ?? null,
      language: c.language,
      lastTestedAt: c.lastTestedAt ?? null,
      mode: c.mode,
      model: c.model,
      playbackMode: c.playbackMode,
      profiles: c.profiles,
      providerId: 'minimax',
      selectedProfileId: c.selectedProfileId ?? null,
      templates: voiceProfileTemplates,
      timeoutMs: c.timeoutMs,
    };
  }
  async getCredential(): Promise<string | null> {
    const c = await this.read();
    if (!c.encryptedApiKey) return null;
    if (!this.safeStorage.isEncryptionAvailable())
      throw new ProviderFailure('invalid_configuration', {
        safeTechnicalSummary: 'safe_storage_unavailable',
      });
    try {
      return this.safeStorage.decryptString(Buffer.from(c.encryptedApiKey, 'base64'));
    } catch (cause) {
      throw new ProviderFailure('invalid_configuration', {
        cause,
        safeTechnicalSummary: 'tts_safe_storage_decryption_failed',
      });
    }
  }
  async save(
    draft: TtsDraftConfig,
    mode: TtsMode,
    playbackMode: TtsPlaybackMode,
    lastTestedAt: string | null,
  ): Promise<void> {
    const c = await this.read();
    let encryptedApiKey = c.encryptedApiKey;
    let keySuffix = c.keySuffix;
    if (draft.apiKey) {
      if (!this.safeStorage.isEncryptionAvailable())
        throw new ProviderFailure('invalid_configuration', {
          safeTechnicalSummary: 'safe_storage_unavailable',
        });
      encryptedApiKey = this.safeStorage.encryptString(draft.apiKey).toString('base64');
      keySuffix = draft.apiKey.slice(-4);
    }
    await this.write({
      baseUrl: draft.baseUrl,
      ...(encryptedApiKey ? { encryptedApiKey, keySuffix } : {}),
      language: draft.language,
      ...(lastTestedAt ? { lastTestedAt } : {}),
      mode,
      model: draft.model,
      playbackMode,
      profiles: c.profiles,
      ...(c.selectedProfileId ? { selectedProfileId: c.selectedProfileId } : {}),
      timeoutMs: draft.timeoutMs,
      version: 1,
    });
  }
  async deleteCredential(): Promise<void> {
    const c = await this.read();
    await this.write({
      baseUrl: c.baseUrl,
      language: c.language,
      mode: 'mock',
      model: c.model,
      playbackMode: c.playbackMode,
      profiles: c.profiles,
      ...(c.selectedProfileId ? { selectedProfileId: c.selectedProfileId } : {}),
      timeoutMs: c.timeoutMs,
      version: 1,
    });
  }
  async installProfile(profile: VoiceProfile): Promise<void> {
    if (!isProfileAvailable(profile))
      throw new ProviderFailure('invalid_configuration', {
        safeTechnicalSummary: 'voice_authorization_incomplete_or_expired',
      });
    const c = await this.read();
    await this.write({
      ...c,
      profiles: [...c.profiles.filter((p) => p.id !== profile.id), profile],
    });
  }
  async selectProfile(profileId: string): Promise<void> {
    const c = await this.read();
    const profile = c.profiles.find((p) => p.id === profileId);
    if (!profile || !isProfileAvailable(profile))
      throw new ProviderFailure('invalid_configuration', {
        safeTechnicalSummary: 'voice_profile_unavailable',
      });
    await this.write({ ...c, selectedProfileId: profileId });
  }
  async deleteProfile(profileId: string): Promise<void> {
    const c = await this.read();
    await this.write({
      baseUrl: c.baseUrl,
      ...(c.encryptedApiKey ? { encryptedApiKey: c.encryptedApiKey } : {}),
      ...(c.keySuffix ? { keySuffix: c.keySuffix } : {}),
      language: c.language,
      ...(c.lastTestedAt ? { lastTestedAt: c.lastTestedAt } : {}),
      mode: c.mode,
      model: c.model,
      playbackMode: c.playbackMode,
      profiles: c.profiles.filter((profile) => profile.id !== profileId),
      ...(c.selectedProfileId && c.selectedProfileId !== profileId
        ? { selectedProfileId: c.selectedProfileId }
        : {}),
      timeoutMs: c.timeoutMs,
      version: 1,
    });
  }
}
