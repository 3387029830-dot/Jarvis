import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { SafeStorageAdapter } from '../providers/provider-config-store';
import { SpeechConfigStore } from './speech-config-store';

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

async function createStore(): Promise<{ directory: string; store: SpeechConfigStore }> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'jarvis-speech-test-'));
  directories.push(directory);
  return { directory, store: new SpeechConfigStore(directory, safeStorage) };
}

describe('SpeechConfigStore', () => {
  it('persists an independent credential encrypted and exposes only its suffix', async () => {
    const { directory, store } = await createStore();
    await store.save(
      {
        apiKey: 'speech-secret-1357',
        baseUrl: 'https://speech.example/v1',
        credentialSource: 'independent',
        language: 'zh',
        model: 'speech-model',
        timeoutMs: 45_000,
      },
      'real',
      '2026-07-31T08:00:00.000Z',
    );

    expect(await store.getIndependentCredential()).toBe('speech-secret-1357');
    expect(await store.getPublicConfig()).toMatchObject({
      hasCredential: true,
      keySuffix: '1357',
      mode: 'real',
    });
    const raw = await readFile(path.join(directory, 'speech-config.v1.json'), 'utf8');
    expect(raw).not.toContain('speech-secret-1357');
  });

  it('stores only a reference when reusing the Conversation credential', async () => {
    const { directory, store } = await createStore();
    await store.save(
      {
        baseUrl: 'https://speech.example/v1',
        credentialSource: 'conversation',
        language: 'zh',
        model: 'speech-model',
        timeoutMs: 45_000,
      },
      'real',
      null,
    );
    expect(await store.getPublicConfig({ hasCredential: true, keySuffix: '2468' })).toMatchObject({
      credentialSource: 'conversation',
      hasCredential: true,
      keySuffix: '2468',
    });
    const raw = await readFile(path.join(directory, 'speech-config.v1.json'), 'utf8');
    expect(raw).not.toContain('encryptedApiKey');
  });

  it('deletes independent credentials and returns to Mock', async () => {
    const { store } = await createStore();
    await store.save(
      {
        apiKey: 'temporary-key',
        baseUrl: 'https://speech.example/v1',
        credentialSource: 'independent',
        language: 'zh',
        model: 'speech-model',
        timeoutMs: 45_000,
      },
      'real',
      null,
    );
    await store.deleteCredential();
    expect(await store.getIndependentCredential()).toBeNull();
    expect(await store.getPublicConfig()).toMatchObject({
      hasCredential: false,
      mode: 'mock',
    });
  });
});
