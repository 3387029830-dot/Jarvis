import { createLocalPlayback, type LocalPlayback } from './local-playback';
import { runMockVoiceLoop, type MockVoiceLoopOptions } from './mock-voice-loop';
import {
  createVoiceCaptureSession,
  stopMediaStream,
  VOICE_CAPTURE_LIMITS,
  type CaptureCallbacks,
  type CapturedAudio,
  type VoiceCaptureSession,
} from './voice-capture';
import {
  initialVoiceState,
  voiceReducer,
  type VoiceAction,
  type VoiceControllerState,
  type VoiceError,
} from './voice-state';

export interface VoiceControllerDependencies {
  readonly createCapture: (stream: MediaStream, callbacks: CaptureCallbacks) => VoiceCaptureSession;
  readonly playback: LocalPlayback;
  readonly requestMicrophone: () => Promise<MediaStream>;
  readonly runMockLoop: (options: MockVoiceLoopOptions) => Promise<void>;
  readonly setTimeout: (callback: () => void, delay: number) => number;
  readonly stopStream: (stream: MediaStream) => void;
}

function capabilityError(message: string): DOMException {
  return new DOMException(message, 'NotSupportedError');
}

export function browserVoiceControllerDependencies(): VoiceControllerDependencies {
  const playback = createLocalPlayback();
  return {
    createCapture: createVoiceCaptureSession,
    playback,
    async requestMicrophone() {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof window.MediaRecorder === 'undefined' ||
        typeof window.AudioContext === 'undefined'
      ) {
        throw capabilityError('Required browser recording APIs are unavailable.');
      }
      return navigator.mediaDevices.getUserMedia({ audio: true });
    },
    runMockLoop: runMockVoiceLoop,
    setTimeout: window.setTimeout.bind(window),
    stopStream: stopMediaStream,
  };
}

export function mapVoiceError(error: unknown): {
  readonly error: VoiceError;
  readonly permission: 'denied' | 'unavailable';
} {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      error: {
        code: 'permission-denied',
        message: 'Jarvis 还不能使用麦克风。你可以在系统设置中允许权限后重试。',
      },
      permission: 'denied',
    };
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      error: { code: 'no-device', message: '没有检测到可用的麦克风。' },
      permission: 'unavailable',
    };
  }
  if (name === 'NotSupportedError') {
    return {
      error: {
        code: 'unsupported',
        message: '当前环境不支持录音，可以继续使用文字入口。',
      },
      permission: 'unavailable',
    };
  }
  return {
    error: { code: 'recording-failed', message: '这次录音没有完成，内容未被保存。' },
    permission: 'unavailable',
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isPlaybackPhase(state: VoiceControllerState): boolean {
  return state.phase === 'speaking';
}

export class VoiceController {
  readonly getSnapshot = (): VoiceControllerState => this.state;

  private abortController: AbortController | null = null;
  private attachmentCount = 0;
  private capture: VoiceCaptureSession | null = null;
  private disposed = false;
  private ephemeralAudio: Blob | null = null;
  private holdActive = false;
  private readonly listeners = new Set<() => void>();
  private sessionCounter = 0;
  private state = initialVoiceState;

  constructor(
    private readonly dependencies: VoiceControllerDependencies = browserVoiceControllerDependencies(),
  ) {}

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  attach(): () => void {
    this.attachmentCount += 1;
    return () => {
      this.attachmentCount = Math.max(0, this.attachmentCount - 1);
      queueMicrotask(() => {
        if (this.attachmentCount === 0) {
          this.dispose();
        }
      });
    };
  }

  pressStart(): void {
    if (this.disposed || this.holdActive) {
      return;
    }

    if (this.state.phase === 'speaking') {
      const interruptedSession = this.state.sessionId;
      this.abortController?.abort();
      this.dependencies.playback.stop();
      this.dispatch({ sessionId: interruptedSession, type: 'interrupted' });
    } else if (this.state.phase === 'error') {
      this.dispatch({ type: 'recover' });
    } else if (this.state.phase !== 'idle' && this.state.phase !== 'cancelled') {
      return;
    }

    this.holdActive = true;
    const sessionId = ++this.sessionCounter;
    this.dispatch({ sessionId, type: 'begin-session' });
    void this.requestAndStartCapture(sessionId);
  }

  release(): void {
    if (this.disposed || !this.holdActive) {
      return;
    }
    this.holdActive = false;
    const sessionId = this.state.sessionId;

    if (this.state.phase === 'listening') {
      void this.finishCapture(sessionId);
      return;
    }

    if (this.state.phase === 'idle' && this.state.permission === 'requesting') {
      this.dispatch({ sessionId, type: 'cancelled' });
    }
  }

  cancel(): void {
    if (this.disposed || (this.state.phase === 'idle' && this.state.permission !== 'requesting')) {
      return;
    }

    const sessionId = this.state.sessionId;
    this.holdActive = false;
    this.abortController?.abort();
    this.abortController = null;
    this.ephemeralAudio = null;
    this.dependencies.playback.stop();
    const capture = this.capture;
    this.capture = null;
    if (capture) {
      void capture.cancel().catch(() => undefined);
    }
    this.dispatch({ sessionId, type: 'cancelled' });
    this.settleSoon(sessionId);
  }

  recover(): void {
    this.dispatch({ type: 'recover' });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.holdActive = false;
    this.abortController?.abort();
    this.abortController = null;
    this.ephemeralAudio = null;
    this.dependencies.playback.stop();
    const capture = this.capture;
    this.capture = null;
    if (capture) {
      void capture.cancel().catch(() => undefined);
    }
    this.listeners.clear();
  }

  private dispatch(action: VoiceAction): void {
    const nextState = voiceReducer(this.state, action);
    if (nextState === this.state) {
      return;
    }
    this.state = nextState;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private async requestAndStartCapture(sessionId: number): Promise<void> {
    let stream: MediaStream;
    try {
      stream = await this.dependencies.requestMicrophone();
    } catch (error) {
      if (this.disposed || sessionId !== this.state.sessionId) {
        return;
      }
      this.holdActive = false;
      const mapped = mapVoiceError(error);
      this.dispatch({
        error: mapped.error,
        permission: mapped.permission,
        sessionId,
        type: 'permission-failed',
      });
      if (!this.holdActive) {
        this.settleSoon(sessionId);
      }
      return;
    }

    if (this.disposed || sessionId !== this.state.sessionId || !this.holdActive) {
      this.dependencies.stopStream(stream);
      if (!this.disposed && sessionId === this.state.sessionId) {
        this.dispatch({ sessionId, type: 'permission-granted' });
        this.settleSoon(sessionId);
      }
      return;
    }

    this.dispatch({ sessionId, type: 'permission-granted' });
    try {
      this.capture = this.dependencies.createCapture(stream, {
        onFailure: (error) => this.handleCaptureFailure(sessionId, error),
        onMaximumDuration: () => {
          if (sessionId === this.state.sessionId && this.state.phase === 'listening') {
            this.holdActive = false;
            void this.finishCapture(
              sessionId,
              '已达到最长录音时长，录音已自动结束并进入本地演示流程。',
            );
          }
        },
        onSample: (level, durationMs) => {
          this.dispatch({ durationMs, level, sessionId, type: 'capture-sample' });
        },
      });
      this.dispatch({ sessionId, type: 'listening-started' });
    } catch (error) {
      this.dependencies.stopStream(stream);
      this.handleCaptureFailure(sessionId, error);
    }
  }

  private async finishCapture(sessionId: number, notice?: string): Promise<void> {
    const capture = this.capture;
    if (!capture || sessionId !== this.state.sessionId || this.state.phase !== 'listening') {
      return;
    }
    this.capture = null;
    this.dispatch({
      ...(notice ? { notice } : {}),
      sessionId,
      type: 'listening-finished',
    });

    let capturedAudio: CapturedAudio;
    try {
      capturedAudio = await capture.stop();
    } catch (error) {
      this.handleCaptureFailure(sessionId, error);
      return;
    }
    if (this.disposed || sessionId !== this.state.sessionId) {
      return;
    }
    if (capturedAudio.durationMs < VOICE_CAPTURE_LIMITS.minimumDurationMs) {
      this.dispatch({
        error: {
          code: 'too-short',
          message: '这段声音太短，没有进入模拟识别。',
        },
        sessionId,
        type: 'failed',
      });
      return;
    }

    this.ephemeralAudio = capturedAudio.blob;
    this.abortController = new AbortController();
    try {
      await this.dependencies.runMockLoop({
        callbacks: {
          onCompleted: () => this.dispatch({ sessionId, type: 'completed' }),
          onResponseChunk: (chunk) => this.dispatch({ chunk, sessionId, type: 'response-chunk' }),
          onSpeakingStarted: () => this.dispatch({ sessionId, type: 'speaking-started' }),
          onTranscript: (transcript) => {
            this.ephemeralAudio = null;
            this.dispatch({ sessionId, transcript, type: 'transcript-ready' });
          },
          onUnderstandingFinished: () =>
            this.dispatch({ sessionId, type: 'understanding-finished' }),
        },
        playback: this.dependencies.playback,
        signal: this.abortController.signal,
      });
    } catch (error) {
      this.ephemeralAudio = null;
      if (!isAbortError(error) && !this.disposed && sessionId === this.state.sessionId) {
        const playbackFailed = isPlaybackPhase(this.state);
        this.dispatch({
          error: playbackFailed
            ? {
                code: 'playback-failed',
                message: '语音播放失败，文字回答仍可阅读。',
              }
            : {
                code: 'recording-failed',
                message: '这次本地演示没有完成，请重新尝试。',
              },
          sessionId,
          type: 'failed',
        });
      }
    } finally {
      this.ephemeralAudio = null;
      if (sessionId === this.state.sessionId) {
        this.abortController = null;
      }
    }
  }

  private handleCaptureFailure(sessionId: number, error: unknown): void {
    if (this.disposed || sessionId !== this.state.sessionId) {
      return;
    }
    this.holdActive = false;
    const capture = this.capture;
    this.capture = null;
    if (capture) {
      void capture.cancel().catch(() => undefined);
    }
    const mapped = mapVoiceError(error);
    this.dispatch({ error: mapped.error, sessionId, type: 'failed' });
  }

  private settleSoon(sessionId: number): void {
    this.dependencies.setTimeout(() => {
      this.dispatch({ sessionId, type: 'settled' });
    }, 220);
  }
}
