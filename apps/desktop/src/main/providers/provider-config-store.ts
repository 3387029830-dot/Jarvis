import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  ConversationMode,
  ProviderDraftConfig,
  ProviderPublicConfig,
} from '../../shared/provider';
import { ProviderFailure } from './provider-error';

export interface SafeStorageAdapter {
  readonly decryptString: (encrypted: Buffer) => string;
  readonly encryptString: (plainText: string) => Buffer;
  readonly isEncryptionAvailable: () => boolean;
}

interface StoredProviderConfig {
  readonly baseUrl: string;
  readonly encryptedApiKey?: string;
  readonly keySuffix?: string;
  readonly lastTestedAt?: string;
  readonly mode: ConversationMode;
  readonly model: string;
  readonly version: 1;
}

const defaultConfig: StoredProviderConfig = {
  baseUrl: '',
  mode: 'mock',
  model: '',
  version: 1,
};

function isStoredConfig(value: unknown): value is StoredProviderConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.version === 1 &&
    typeof record.baseUrl === 'string' &&
    typeof record.model === 'string' &&
    (record.mode === 'mock' || record.mode === 'real') &&
    (record.encryptedApiKey === undefined || typeof record.encryptedApiKey === 'string') &&
    (record.keySuffix === undefined || typeof record.keySuffix === 'string') &&
    (record.lastTestedAt === undefined || typeof record.lastTestedAt === 'string')
  );
}

export class ProviderConfigStore {
  private readonly configPath: string;
  private readonly safeStorage: SafeStorageAdapter;

  constructor(userDataPath: string, safeStorage: SafeStorageAdapter) {
    this.configPath = path.join(userDataPath, 'provider-config.v1.json');
    this.safeStorage = safeStorage;
  }

  private async read(): Promise<StoredProviderConfig> {
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

  private async write(config: StoredProviderConfig): Promise<void> {
    await mkdir(path.dirname(this.configPath), { recursive: true });
    const temporaryPath = `${this.configPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.configPath);
  }

  async getPublicConfig(): Promise<ProviderPublicConfig> {
    const config = await this.read();
    return {
      baseUrl: config.baseUrl,
      hasCredential: Boolean(config.encryptedApiKey),
      keySuffix: config.keySuffix ?? null,
      lastTestedAt: config.lastTestedAt ?? null,
      mode: config.mode,
      model: config.model,
    };
  }

  async getCredential(): Promise<string | null> {
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
        safeTechnicalSummary: 'safe_storage_decryption_failed',
      });
    }
  }

  async resolveCredential(apiKey?: string): Promise<string | null> {
    return apiKey?.trim() || (await this.getCredential());
  }

  async save(
    draft: ProviderDraftConfig,
    mode: ConversationMode,
    lastTestedAt: string | null,
  ): Promise<ProviderPublicConfig> {
    const existing = await this.read();
    let encryptedApiKey = existing.encryptedApiKey;
    let keySuffix = existing.keySuffix;
    if (draft.apiKey) {
      if (!this.safeStorage.isEncryptionAvailable()) {
        throw new ProviderFailure('invalid_configuration', {
          safeTechnicalSummary: 'safe_storage_unavailable',
        });
      }
      encryptedApiKey = this.safeStorage.encryptString(draft.apiKey).toString('base64');
      keySuffix = draft.apiKey.slice(-4);
    }
    const next: StoredProviderConfig = {
      baseUrl: draft.baseUrl,
      ...(encryptedApiKey === undefined ? {} : { encryptedApiKey }),
      ...(keySuffix === undefined ? {} : { keySuffix }),
      ...(lastTestedAt === null ? {} : { lastTestedAt }),
      mode,
      model: draft.model,
      version: 1,
    };
    await this.write(next);
    return this.getPublicConfig();
  }

  async deleteCredential(): Promise<ProviderPublicConfig> {
    const existing = await this.read();
    await this.write({
      baseUrl: existing.baseUrl,
      mode: 'mock',
      model: existing.model,
      version: 1,
    });
    return this.getPublicConfig();
  }
}
