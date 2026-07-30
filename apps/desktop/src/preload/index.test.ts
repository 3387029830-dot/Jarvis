import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HEALTH_CHECK_CHANNEL } from '../shared/health';
import {
  CONVERSATION_CANCEL_CHANNEL,
  CONVERSATION_EVENT_CHANNEL,
  CONVERSATION_START_CHANNEL,
  PROVIDER_DELETE_CREDENTIAL_CHANNEL,
  PROVIDER_GET_CONFIG_CHANNEL,
  PROVIDER_SAVE_CONFIG_CHANNEL,
  PROVIDER_TEST_CONFIG_CHANNEL,
} from '../shared/provider';

const electronMocks = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(),
  invoke: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: electronMocks.exposeInMainWorld,
  },
  ipcRenderer: {
    invoke: electronMocks.invoke,
    on: electronMocks.on,
    removeListener: electronMocks.removeListener,
  },
}));

describe('preload bridge', () => {
  beforeEach(() => {
    vi.resetModules();
    electronMocks.invoke.mockResolvedValue({ process: 'main', status: 'ok' });
  });

  it('exposes the minimal typed health, provider and conversation APIs', async () => {
    await import('./index');

    expect(electronMocks.exposeInMainWorld).toHaveBeenCalledOnce();
    expect(electronMocks.exposeInMainWorld).toHaveBeenCalledWith('jarvis', {
      conversation: {
        cancel: expect.any(Function),
        onEvent: expect.any(Function),
        start: expect.any(Function),
      },
      healthCheck: expect.any(Function),
      provider: {
        deleteCredential: expect.any(Function),
        getConfig: expect.any(Function),
        saveConfig: expect.any(Function),
        testConfig: expect.any(Function),
      },
    });

    const exposedApi = electronMocks.exposeInMainWorld.mock.calls[0]?.[1] as
      | {
          conversation: {
            cancel(requestId: string): Promise<unknown>;
            onEvent(listener: (event: unknown) => void): () => void;
            start(request: unknown): Promise<unknown>;
          };
          healthCheck(): Promise<unknown>;
          provider: {
            deleteCredential(): Promise<unknown>;
            getConfig(): Promise<unknown>;
            saveConfig(input: unknown): Promise<unknown>;
            testConfig(input: unknown): Promise<unknown>;
          };
        }
      | undefined;

    await expect(exposedApi?.healthCheck()).resolves.toEqual({
      process: 'main',
      status: 'ok',
    });
    expect(electronMocks.invoke).toHaveBeenCalledWith(HEALTH_CHECK_CHANNEL);

    await exposedApi?.provider.getConfig();
    await exposedApi?.provider.testConfig({ baseUrl: 'https://example.com/v1', model: 'model' });
    await exposedApi?.provider.saveConfig({
      baseUrl: 'https://example.com/v1',
      mode: 'mock',
      model: 'model',
    });
    await exposedApi?.provider.deleteCredential();
    await exposedApi?.conversation.start({ requestId: 'request' });
    await exposedApi?.conversation.cancel('request');
    expect(electronMocks.invoke).toHaveBeenCalledWith(PROVIDER_GET_CONFIG_CHANNEL);
    expect(electronMocks.invoke).toHaveBeenCalledWith(PROVIDER_TEST_CONFIG_CHANNEL, {
      baseUrl: 'https://example.com/v1',
      model: 'model',
    });
    expect(electronMocks.invoke).toHaveBeenCalledWith(PROVIDER_SAVE_CONFIG_CHANNEL, {
      baseUrl: 'https://example.com/v1',
      mode: 'mock',
      model: 'model',
    });
    expect(electronMocks.invoke).toHaveBeenCalledWith(PROVIDER_DELETE_CREDENTIAL_CHANNEL);
    expect(electronMocks.invoke).toHaveBeenCalledWith(CONVERSATION_START_CHANNEL, {
      requestId: 'request',
    });
    expect(electronMocks.invoke).toHaveBeenCalledWith(CONVERSATION_CANCEL_CHANNEL, 'request');

    const listener = vi.fn();
    const unsubscribe = exposedApi?.conversation.onEvent(listener);
    const bridgeHandler = electronMocks.on.mock.calls[0]?.[1] as
      ((event: unknown, payload: unknown) => void) | undefined;
    bridgeHandler?.({}, { requestId: 'request', type: 'complete' });
    expect(listener).toHaveBeenCalledWith({ requestId: 'request', type: 'complete' });
    unsubscribe?.();
    expect(electronMocks.removeListener).toHaveBeenCalledWith(
      CONVERSATION_EVENT_CHANNEL,
      bridgeHandler,
    );
  });
});
