import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  SpeechCredentialSource,
  SpeechDraftConfig,
  SpeechMode,
  SpeechPublicConfig,
} from '../../shared/speech';
import { ProviderFailure } from '../providers/provider-error';
import type { SafeStorageAdapter } from '../providers/provider-config-store';

interface StoredSpeechConfig {
  readonly baseUrl: string;
  readonly credentialSource: SpeechCredentialSource;
  readonly encryptedApiKey?: string;
  readonly keySuffix?: string;
  readonly language: string;
  readonly lastTestedAt?: string;
  readonly mode: SpeechMode;
  readonly model: string;
  readonly timeoutMs: number;
  readonly version: 1;
}

const defaultConfig: StoredSpeechConfig = {
  baseUrl: '',
  credentialSource: 'independent',
  language: 'zh',
  mode: 'mock',
  model: '',
  timeoutMs: 45_000,
  version: 1,
};

function isStoredConfig(value: unknown): value is StoredSpeechConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.version === 1 &&
    typeof record.baseUrl === 'string' &&
    typeof record.model === 'string' &&
    typeof record.language === 'string' &&
    typeof record.timeoutMs === 'number' &&
    (record.mode === 'mock' || record.mode === 'real') &&
    (record.credentialSource === 'independent' || record.credentialSource === 'conversation') &&
    (record.encryptedApiKey === undefined || typeof record.encryptedApiKey === 'string') &&
    (record.keySuffix === undefined || typeof record.keySuffix === 'string') &&
    (record.lastTestedAt === undefined || typeof record.lastTestedAt === 'string')
  );
}

export class SpeechConfigStore {
  private readonly configPath: string;

  constructor(
    userDataPath: string,
    private readonly safeStorage: SafeStorageAdapter,
  ) {
    this.configPath = path.join(userDataPath, 'speech-config.v1.json');
  }

  private async read(): Promise<StoredSpeechConfig> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.configPath, 'utf8'));
      return isStoredConfig(parsed) ? parsed : defaultConfig;
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'ENOENT' || error instanceof SyntaxError) {
        return defaultConfig;
      }
      throw error;
    }
  }

  private async write(config: StoredSpeechConfig): Promise<void> {
    await mkdir(path.dirname(this.configPath), { recursive: true });
    const temporaryPath = `${this.configPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.configPath);
  }

  async getPublicConfig(conversationCredential?: {
    readonly hasCredential: boolean;
    readonly keySuffix: string | null;
  }): Promise<SpeechPublicConfig> {
    const config = await this.read();
    const usesConversation = config.credentialSource === 'conversation';
    return {
      baseUrl: config.baseUrl,
      credentialSource: config.credentialSource,
      hasCredential: usesConversation
        ? Boolean(conversationCredential?.hasCredential)
        : Boolean(config.encryptedApiKey),
      keySuffix: usesConversation
        ? (conversationCredential?.keySuffix ?? null)
        : (config.keySuffix ?? null),
      language: config.language,
      lastTestedAt: config.lastTestedAt ?? null,
      mode: config.mode,
      model: config.model,
      providerId: 'openai-compatible',
      timeoutMs: config.timeoutMs,
    };
  }

  async getIndependentCredential(): Promise<string | null> {
    const config = await this.read();
    if (!config.encryptedApiKey) {
      return null;
    }
    if (!this.safeStorage.isEncryptionAvailable()) {
      throw new ProviderFailure('invalid_configuration', {
        safeTechnicalSummary: 'safe_storage_unavailable',
      });
    }
    try {
      return this.safeStorage.decryptString(Buffer.from(config.encryptedApiKey, 'base64'));
    } catch (error) {
      throw new ProviderFailure('invalid_configuration', {
        cause: error,
        safeTechnicalSummary: 'speech_safe_storage_decryption_failed',
      });
    }
  }

  async save(
    draft: SpeechDraftConfig,
    mode: SpeechMode,
    lastTestedAt: string | null,
  ): Promise<void> {
    const existing = await this.read();
    let encryptedApiKey = existing.encryptedApiKey;
    let keySuffix = existing.keySuffix;
    if (draft.apiKey && draft.credentialSource === 'independent') {
      if (!this.safeStorage.isEncryptionAvailable()) {
        throw new ProviderFailure('invalid_configuration', {
          safeTechnicalSummary: 'safe_storage_unavailable',
        });
      }
      encryptedApiKey = this.safeStorage.encryptString(draft.apiKey).toString('base64');
      keySuffix = draft.apiKey.slice(-4);
    }
    await this.write({
      baseUrl: draft.baseUrl,
      credentialSource: draft.credentialSource,
      ...(draft.credentialSource === 'independent' && encryptedApiKey
        ? { encryptedApiKey, keySuffix }
        : {}),
      language: draft.language,
      ...(lastTestedAt ? { lastTestedAt } : {}),
      mode,
      model: draft.model,
      timeoutMs: draft.timeoutMs,
      version: 1,
    });
  }

  async deleteCredential(): Promise<void> {
    const existing = await this.read();
    await this.write({
      baseUrl: existing.baseUrl,
      credentialSource: 'independent',
      language: existing.language,
      mode: 'mock',
      model: existing.model,
      timeoutMs: existing.timeoutMs,
      version: 1,
    });
  }
}
