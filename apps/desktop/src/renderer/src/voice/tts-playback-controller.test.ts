import { describe, expect, it, vi } from 'vitest';
import type { JarvisTtsApi } from '../../../shared/tts';
import { TtsPlaybackController } from './tts-playback-controller';

function success(requestId: string) {
  return Promise.resolve({
    audio: new Uint8Array([1, 2]),
    mimeType: 'audio/mpeg' as const,
    metrics: { providerId: 'minimax' as const, totalMs: 10 },
    ok: true as const,
    requestId,
  });
}
describe('TtsPlaybackController', () => {
  it('prefetches at most two, plays in order, and revokes object URLs', async () => {
    const listeners: Array<() => void> = [];
    const synthesize = vi.fn((request) => success(request.requestId));
    const revoke = vi.fn();
    let now = 0;
    const controller = new TtsPlaybackController({
      api: {
        cancel: vi.fn(),
        synthesize,
        getConfig: vi.fn(),
        saveConfig: vi.fn(),
        testConfig: vi.fn(),
        deleteCredential: vi.fn(),
        deleteProfile: vi.fn(),
        installProfile: vi.fn(),
        selectProfile: vi.fn(),
      } satisfies JarvisTtsApi,
      createAudio: () => ({
        addEventListener: (type, listener) => {
          if (type === 'ended') listeners.push(listener);
        },
        pause: vi.fn(),
        play: async () => {
          queueMicrotask(() => listeners.shift()?.());
        },
      }),
      createObjectUrl: () => `blob:${synthesize.mock.calls.length}`,
      now: () => {
        now += 25;
        return now;
      },
      revokeObjectUrl: revoke,
    });
    const playing = controller.play('turn-1', '第一段。第二段。第三段。', 'profile-1');
    expect(synthesize).toHaveBeenCalledTimes(2);
    await playing;
    expect(synthesize).toHaveBeenCalledTimes(3);
    expect(revoke).toHaveBeenCalledTimes(3);
    expect(controller.getSnapshot().status).toBe('completed');
  });
  it('cancels outstanding requests and prevents late playback', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof success>>) => void;
    const pending = new Promise<Awaited<ReturnType<typeof success>>>((done) => {
      resolve = done;
    });
    const cancel = vi.fn();
    const createAudio = vi.fn();
    const api = {
      cancel,
      synthesize: vi.fn(() => pending),
      getConfig: vi.fn(),
      saveConfig: vi.fn(),
      testConfig: vi.fn(),
      deleteCredential: vi.fn(),
      deleteProfile: vi.fn(),
      installProfile: vi.fn(),
      selectProfile: vi.fn(),
    } satisfies JarvisTtsApi;
    const controller = new TtsPlaybackController({
      api,
      createAudio,
      createObjectUrl: vi.fn(),
      now: () => 0,
      revokeObjectUrl: vi.fn(),
    });
    const playing = controller.play('turn', '第一段。第二段。', 'profile');
    controller.stop();
    resolve(await success('tts-1-0'));
    await playing;
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(createAudio).not.toHaveBeenCalled();
  });
  it('stops a failed segment, keeps replay available, and never overlaps audio', async () => {
    let active = 0;
    let maximumActive = 0;
    const synthesize = vi
      .fn()
      .mockResolvedValueOnce({
        error: {
          code: 'network',
          message: '失败',
          providerId: 'minimax',
          requestId: 'failed',
          retryable: true,
          safeTechnicalSummary: 'failed',
        },
        ok: false,
      })
      .mockImplementation((request) => success(request.requestId));
    const controller = new TtsPlaybackController({
      api: {
        cancel: vi.fn(),
        deleteCredential: vi.fn(),
        deleteProfile: vi.fn(),
        getConfig: vi.fn(),
        installProfile: vi.fn(),
        saveConfig: vi.fn(),
        selectProfile: vi.fn(),
        synthesize,
        testConfig: vi.fn(),
      } satisfies JarvisTtsApi,
      createAudio: () => ({
        addEventListener: (type, listener) => {
          if (type === 'ended')
            queueMicrotask(() => {
              active -= 1;
              listener();
            });
        },
        pause: vi.fn(),
        play: async () => {
          active += 1;
          maximumActive = Math.max(maximumActive, active);
        },
      }),
      createObjectUrl: () => 'blob:replay',
      now: () => 0,
      revokeObjectUrl: vi.fn(),
    });
    await controller.play('turn', '失败段。', 'profile');
    expect(controller.getSnapshot().status).toBe('error');
    await controller.play('turn', '重播第一段。重播第二段。', 'profile');
    expect(controller.getSnapshot().status).toBe('completed');
    expect(maximumActive).toBe(1);
  });
});
