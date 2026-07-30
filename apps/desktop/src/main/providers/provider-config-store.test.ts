import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { ProviderConfigStore, type SafeStorageAdapter } from './provider-config-store';

const directories: string[] = [];
const safeStorage: SafeStorageAdapter = {
  decryptString: (value) => Buffer.from(value.toString('utf8'), 'base64').toString('utf8'),
  encryptString: (value) => Buffer.from(Buffer.from(value).toString('base64')),
  isEncryptionAvailable: () => true,
};

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { force: true, recursive: true });
  }
});

describe('ProviderConfigStore', () => {
  it('persists only encrypted credentials and returns a masked suffix', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'jarvis-provider-test-'));
    directories.push(directory);
    const store = new ProviderConfigStore(directory, safeStorage);
    const saved = await store.save(
      {
        apiKey: 'secret-test-key-9876',
        baseUrl: 'https://provider.example/v1',
        model: 'model',
      },
      'real',
      '2026-07-30T08:00:00.000Z',
    );
    expect(saved).toMatchObject({ hasCredential: true, keySuffix: '9876', mode: 'real' });
    expect(await store.getCredential()).toBe('secret-test-key-9876');

    const raw = await readFile(path.join(directory, 'provider-config.v1.json'), 'utf8');
    expect(raw).not.toContain('secret-test-key-9876');
    expect(JSON.parse(raw)).toMatchObject({ version: 1 });
  });

  it('deletes the credential and forces mock mode', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'jarvis-provider-test-'));
    directories.push(directory);
    const store = new ProviderConfigStore(directory, safeStorage);
    await store.save(
      {
        apiKey: 'temporary-secret',
        baseUrl: 'https://provider.example/v1',
        model: 'model',
      },
      'real',
      '2026-07-30T08:00:00.000Z',
    );
    expect(await store.deleteCredential()).toMatchObject({
      hasCredential: false,
      mode: 'mock',
    });
    expect(await store.getCredential()).toBeNull();
  });

  it('never falls back to plaintext when encryption is unavailable', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'jarvis-provider-test-'));
    directories.push(directory);
    const store = new ProviderConfigStore(directory, {
      ...safeStorage,
      isEncryptionAvailable: () => false,
    });
    await expect(
      store.save(
        {
          apiKey: 'must-not-write',
          baseUrl: 'https://provider.example/v1',
          model: 'model',
        },
        'real',
        null,
      ),
    ).rejects.toMatchObject({
      code: 'invalid_configuration',
      safeTechnicalSummary: 'safe_storage_unavailable',
    });
  });

  it('ignores a corrupted config instead of exposing arbitrary fields', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'jarvis-provider-test-'));
    directories.push(directory);
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, 'provider-config.v1.json'),
      '{"apiKey":"plaintext-must-not-surface"',
      'utf8',
    );
    const store = new ProviderConfigStore(directory, safeStorage);
    expect(await store.getPublicConfig()).toEqual({
      baseUrl: '',
      hasCredential: false,
      keySuffix: null,
      lastTestedAt: null,
      mode: 'mock',
      model: '',
    });
  });
});
