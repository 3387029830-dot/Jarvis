import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HEALTH_CHECK_CHANNEL } from '../shared/health';

const electronMocks = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: electronMocks.exposeInMainWorld,
  },
  ipcRenderer: {
    invoke: electronMocks.invoke,
  },
}));

describe('preload bridge', () => {
  beforeEach(() => {
    vi.resetModules();
    electronMocks.invoke.mockResolvedValue({ process: 'main', status: 'ok' });
  });

  it('exposes only the typed Jarvis health-check API', async () => {
    await import('./index');

    expect(electronMocks.exposeInMainWorld).toHaveBeenCalledOnce();
    expect(electronMocks.exposeInMainWorld).toHaveBeenCalledWith('jarvis', {
      healthCheck: expect.any(Function),
    });

    const exposedApi = electronMocks.exposeInMainWorld.mock.calls[0]?.[1] as
      { healthCheck(): Promise<unknown> } | undefined;

    await expect(exposedApi?.healthCheck()).resolves.toEqual({
      process: 'main',
      status: 'ok',
    });
    expect(electronMocks.invoke).toHaveBeenCalledWith(HEALTH_CHECK_CHANNEL);
  });
});
