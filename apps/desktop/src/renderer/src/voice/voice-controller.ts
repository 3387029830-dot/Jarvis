import { createLocalPlayback, type LocalPlayback } from './local-playback';
import type { ProviderError } from '../../../shared/provider';
import type {
  SpeechPublicConfig,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
} from '../../../shared/speech';
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
  readonly speech?: {
    readonly cancel: (requestId: string) => Promise<void>;
    readonly getConfig: () => Promise<SpeechPublicConfig>;
    readonly transcribe: (
      request: SpeechTranscriptionRequest,
    ) => Promise<SpeechTranscriptionResult>;
  };
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
    speech: window.jarvis?.speech,
    setTimeout: window.setTimeout.bind(window),
    stopStream: stopMediaStream,
  };
}

function mapSpeechError(error: ProviderError): VoiceError {
  const codeByProviderCode: Partial<Record<ProviderError['code'], VoiceError['code']>> = {
    audio_too_short: 'too-short',
    audio_too_large: 'audio-too-large',
    empty_transcript: 'empty-transcript',
    unsupported_audio_format: 'unsupported-audio-format',
  };
  return {
    code: codeByProviderCode[error.code] ?? 'transcription-failed',
    message: error.message,
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
  private capturedAudio: CapturedAudio | null = null;
  private disposed = false;
  private ephemeralAudio: Blob | null = null;
  private holdActive = false;
  private speechConfigPromise: Promise<SpeechPublicConfig | null> | null = null;
  private speechRequestId: string | null = null;
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
    if (this.dependencies.speech) {
      this.speechConfigPromise = this.dependencies.speech
        .getConfig()
        .then((config) => {
          this.dispatch({ sessionId, speechMode: config.mode, type: 'speech-mode-resolved' });
          return config;
        })
        .catch(() => null);
    } else {
      this.speechConfigPromise = null;
    }
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
    this.capturedAudio = null;
    this.speechConfigPromise = null;
    if (this.speechRequestId) {
      void this.dependencies.speech?.cancel(this.speechRequestId);
      this.speechRequestId = null;
    }
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

  confirmTranscript(transcript: string): boolean {
    const normalized = transcript.trim();
    if (
      !normalized ||
      this.state.phase !== 'transcribing' ||
      this.state.transcriptReview !== 'pending'
    ) {
      return false;
    }
    this.dispatch({
      sessionId: this.state.sessionId,
      transcript: normalized,
      type: 'transcript-confirmed',
    });
    return true;
  }

  beginExternalResponse(): void {
    this.dispatch({ sessionId: this.state.sessionId, type: 'understanding-finished' });
  }

  replaceExternalResponse(response: string): void {
    this.dispatch({ response, sessionId: this.state.sessionId, type: 'response-replaced' });
  }

  completeExternalResponse(): void {
    if (this.state.phase !== 'responding_text') {
      return;
    }
    const sessionId = this.state.sessionId;
    const response = this.state.response;
    this.dispatch({ sessionId, type: 'speaking-started' });
    const controller = new AbortController();
    this.abortController?.abort();
    this.abortController = controller;
    void this.dependencies.playback
      .play(response, controller.signal)
      .then(() => this.dispatch({ sessionId, type: 'completed' }))
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          this.dispatch({
            error: {
              code: 'playback-failed',
              message: '语音播放失败，文字回答仍可阅读。',
            },
            sessionId,
            type: 'failed',
          });
        }
      })
      .finally(() => {
        if (this.abortController === controller) {
          this.abortController = null;
        }
      });
  }

  settleExternalResponse(): void {
    if (this.state.phase !== 'responding_text') {
      return;
    }
    this.dispatch({ sessionId: this.state.sessionId, type: 'external-response-completed' });
  }

  failExternalResponse(message: string): void {
    if (!['understanding', 'responding_text'].includes(this.state.phase)) {
      return;
    }
    this.dispatch({
      error: { code: 'transcription-failed', message },
      sessionId: this.state.sessionId,
      type: 'failed',
    });
  }

  retryTranscription(): void {
    if (this.state.phase !== 'error' || !this.capturedAudio || !this.dependencies.speech) {
      return;
    }
    const sessionId = this.state.sessionId;
    this.dispatch({ sessionId, type: 'retry-transcription' });
    void this.runRealTranscription(sessionId, this.capturedAudio);
  }

  restartCapture(): void {
    this.cancel();
    this.pressStart();
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
    this.capturedAudio = null;
    this.speechConfigPromise = null;
    if (this.speechRequestId) {
      void this.dependencies.speech?.cancel(this.speechRequestId);
      this.speechRequestId = null;
    }
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
              '已达到最长录音时长，录音已自动结束并进入识别流程。',
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
          message: '这段声音太短，没有进入识别。',
        },
        sessionId,
        type: 'failed',
      });
      return;
    }

    this.ephemeralAudio = capturedAudio.blob;
    this.capturedAudio = capturedAudio;
    this.abortController = new AbortController();
    let speechConfig: SpeechPublicConfig | null;
    try {
      speechConfig = this.dependencies.speech
        ? await (this.speechConfigPromise ?? this.dependencies.speech.getConfig())
        : null;
    } catch {
      this.dispatch({
        error: {
          code: 'transcription-failed',
          message: '无法读取语音识别配置。录音未发送，可以重试或改用文字。',
        },
        sessionId,
        type: 'failed',
      });
      return;
    } finally {
      this.speechConfigPromise = null;
    }
    if (this.dependencies.speech && !speechConfig) {
      this.dispatch({
        error: {
          code: 'transcription-failed',
          message: '无法读取语音识别配置。录音未发送，可以重试或改用文字。',
        },
        sessionId,
        type: 'failed',
      });
      return;
    }
    if (speechConfig?.mode === 'real' && this.dependencies.speech) {
      this.dispatch({ sessionId, speechMode: 'real', type: 'speech-mode-resolved' });
      this.abortController = null;
      await this.runRealTranscription(sessionId, capturedAudio);
      return;
    }
    try {
      await this.dependencies.runMockLoop({
        callbacks: {
          onCompleted: () => this.dispatch({ sessionId, type: 'completed' }),
          onResponseChunk: (chunk) => this.dispatch({ chunk, sessionId, type: 'response-chunk' }),
          onSpeakingStarted: () => this.dispatch({ sessionId, type: 'speaking-started' }),
          onTranscript: (transcript) => {
            this.ephemeralAudio = null;
            this.capturedAudio = null;
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
      this.capturedAudio = null;
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

  private async runRealTranscription(
    sessionId: number,
    capturedAudio: CapturedAudio,
  ): Promise<void> {
    const speech = this.dependencies.speech;
    if (!speech || this.disposed || sessionId !== this.state.sessionId) {
      return;
    }
    const requestId = `speech-${sessionId}-${Date.now().toString(36)}`;
    this.speechRequestId = requestId;
    try {
      const audio = new Uint8Array(await capturedAudio.blob.arrayBuffer());
      if (this.disposed || sessionId !== this.state.sessionId) {
        return;
      }
      const result = await speech.transcribe({
        audio,
        durationMs: capturedAudio.durationMs,
        mimeType: capturedAudio.mimeType,
        requestId,
      });
      if (
        this.disposed ||
        sessionId !== this.state.sessionId ||
        this.speechRequestId !== requestId
      ) {
        return;
      }
      if (!result.ok) {
        if (result.error.code !== 'cancelled') {
          this.dispatch({
            error: mapSpeechError(result.error),
            sessionId,
            type: 'failed',
          });
        }
        return;
      }
      this.ephemeralAudio = null;
      this.capturedAudio = null;
      this.dispatch({
        requiresConfirmation: true,
        sessionId,
        speechMode: 'real',
        transcript: result.transcript,
        type: 'transcript-ready',
      });
    } catch {
      if (!this.disposed && sessionId === this.state.sessionId) {
        this.dispatch({
          error: {
            code: 'transcription-failed',
            message: '真实语音识别没有完成，可以重试识别、重新录音或改用文字。',
          },
          sessionId,
          type: 'failed',
        });
      }
    } finally {
      if (this.speechRequestId === requestId) {
        this.speechRequestId = null;
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
