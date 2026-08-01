import type { JarvisTtsApi } from '../../../shared/tts';
import { segmentTextForSpeech } from '../../../shared/tts-text';

export type TtsPlaybackStatus =
  'idle' | 'preparing' | 'playing' | 'stopped' | 'completed' | 'error';
export interface TtsPlaybackSnapshot {
  readonly activeTurnId: string | null;
  readonly error: string | null;
  readonly firstSegmentLatencyMs: number | null;
  readonly status: TtsPlaybackStatus;
}
interface AudioHandle {
  pause(): void;
  play(): Promise<void>;
  addEventListener(
    type: 'ended' | 'error',
    listener: () => void,
    options?: { once?: boolean },
  ): void;
}
export interface TtsPlaybackDependencies {
  readonly api: JarvisTtsApi;
  readonly createAudio: (url: string) => AudioHandle;
  readonly createObjectUrl: (blob: Blob) => string;
  readonly now: () => number;
  readonly revokeObjectUrl: (url: string) => void;
}
const unavailableApi: JarvisTtsApi = {
  cancel: async () => undefined,
  deleteCredential: async () => ({
    error: {
      code: 'invalid_configuration',
      message: 'TTS 不可用。',
      providerId: 'openai-compatible',
      requestId: 'tts',
      retryable: false,
      safeTechnicalSummary: 'tts_unavailable',
    },
    ok: false,
  }),
  deleteProfile: async () => {
    throw new Error('TTS unavailable');
  },
  getConfig: async () => {
    throw new Error('TTS unavailable');
  },
  installProfile: async () => {
    throw new Error('TTS unavailable');
  },
  saveConfig: async () => {
    throw new Error('TTS unavailable');
  },
  selectProfile: async () => {
    throw new Error('TTS unavailable');
  },
  synthesize: async () => {
    throw new Error('TTS unavailable');
  },
  testConfig: async () => {
    throw new Error('TTS unavailable');
  },
};
const browserDependencies = (): TtsPlaybackDependencies => ({
  api: window.jarvis?.tts ?? unavailableApi,
  createAudio: (url) => new Audio(url),
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  now: () => performance.now(),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
});

export class TtsPlaybackController {
  readonly getSnapshot = (): TtsPlaybackSnapshot => this.snapshot;
  private readonly listeners = new Set<() => void>();
  private session = 0;
  private activeAudio: AudioHandle | null = null;
  private activeUrl: string | null = null;
  private activeRequests = new Set<string>();
  private snapshot: TtsPlaybackSnapshot = {
    activeTurnId: null,
    error: null,
    firstSegmentLatencyMs: null,
    status: 'idle',
  };
  constructor(private readonly dependencies: TtsPlaybackDependencies = browserDependencies()) {}
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private emit(next: TtsPlaybackSnapshot): void {
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }
  stop(): void {
    this.session += 1;
    this.activeAudio?.pause();
    this.activeAudio = null;
    if (this.activeUrl) this.dependencies.revokeObjectUrl(this.activeUrl);
    this.activeUrl = null;
    for (const id of this.activeRequests) void this.dependencies.api.cancel(id);
    this.activeRequests.clear();
    if (this.snapshot.status !== 'idle')
      this.emit({ ...this.snapshot, activeTurnId: null, status: 'stopped' });
  }
  dispose(): void {
    this.stop();
    this.listeners.clear();
  }
  async play(turnId: string, text: string, profileId: string): Promise<void> {
    this.stop();
    const session = ++this.session;
    const startedAt = this.dependencies.now();
    const segments = segmentTextForSpeech(text);
    if (!segments.length) return;
    this.emit({
      activeTurnId: turnId,
      error: null,
      firstSegmentLatencyMs: null,
      status: 'preparing',
    });
    const pending = new Map<number, Promise<Awaited<ReturnType<JarvisTtsApi['synthesize']>>>>();
    const prefetch = (index: number): void => {
      if (index >= segments.length || pending.has(index)) return;
      const requestId = `tts-${session}-${index}`;
      const segment = segments[index];
      if (!segment) return;
      this.activeRequests.add(requestId);
      pending.set(
        index,
        this.dependencies.api
          .synthesize({ requestId, text: segment, voiceProfileId: profileId })
          .catch(() => ({
            error: {
              code: 'network' as const,
              message: '语音合成连接失败。',
              providerId: 'minimax' as const,
              requestId,
              retryable: true,
              safeTechnicalSummary: 'tts_ipc_failed',
            },
            ok: false as const,
          }))
          .finally(() => this.activeRequests.delete(requestId)),
      );
    };
    prefetch(0);
    prefetch(1);
    try {
      for (let index = 0; index < segments.length; index += 1) {
        const result = await pending.get(index);
        pending.delete(index);
        prefetch(index + 2);
        if (session !== this.session) return;
        if (!result?.ok) throw new Error(result?.error.message ?? '语音合成失败');
        const buffer = new ArrayBuffer(result.audio.byteLength);
        new Uint8Array(buffer).set(result.audio);
        const url = this.dependencies.createObjectUrl(
          new Blob([buffer], { type: result.mimeType }),
        );
        this.activeUrl = url;
        const audio = this.dependencies.createAudio(url);
        this.activeAudio = audio;
        if (index === 0)
          this.emit({
            activeTurnId: turnId,
            error: null,
            firstSegmentLatencyMs: Math.max(0, Math.round(this.dependencies.now() - startedAt)),
            status: 'playing',
          });
        await new Promise<void>((resolve, reject) => {
          audio.addEventListener('ended', resolve, { once: true });
          audio.addEventListener('error', () => reject(new Error('音频播放失败')), { once: true });
          void audio.play().catch(reject);
        });
        if (session !== this.session) return;
        this.dependencies.revokeObjectUrl(url);
        this.activeUrl = null;
        this.activeAudio = null;
      }
      if (session === this.session)
        this.emit({ ...this.snapshot, activeTurnId: null, status: 'completed' });
    } catch (error) {
      if (session === this.session) {
        this.stop();
        this.emit({
          activeTurnId: null,
          error: error instanceof Error ? error.message : '语音播放失败',
          firstSegmentLatencyMs: this.snapshot.firstSegmentLatencyMs,
          status: 'error',
        });
      }
    }
  }
}
