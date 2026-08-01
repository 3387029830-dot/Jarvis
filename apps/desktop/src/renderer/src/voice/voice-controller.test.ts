import { describe, expect, it, vi } from 'vitest';

import type { SpeechPublicConfig, SpeechTranscriptionResult } from '../../../shared/speech';
import type { LocalPlayback } from './local-playback';
import type { MockVoiceLoopOptions } from './mock-voice-loop';
import type { CaptureCallbacks, VoiceCaptureSession } from './voice-capture';
import {
  mapVoiceError,
  VoiceController,
  type VoiceControllerDependencies,
} from './voice-controller';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function fakeStream() {
  const stop = vi.fn();
  return {
    stop,
    stream: { getTracks: () => [{ stop }] } as unknown as MediaStream,
  };
}

function createDependencies(options?: {
  readonly durationMs?: number;
  readonly requestMicrophone?: () => Promise<MediaStream>;
  readonly runMockLoop?: (loop: MockVoiceLoopOptions) => Promise<void>;
  readonly speech?: VoiceControllerDependencies['speech'];
}) {
  let captureCallbacks: CaptureCallbacks | undefined;
  const capture: VoiceCaptureSession = {
    cancel: vi.fn(async () => undefined),
    stop: vi.fn(async () => ({
      blob: new Blob(['audio']),
      durationMs: options?.durationMs ?? 800,
      mimeType: 'audio/webm',
    })),
  };
  const playback: LocalPlayback = {
    play: vi.fn(async () => undefined),
    stop: vi.fn(),
  };
  const stream = fakeStream().stream;
  const dependencies: VoiceControllerDependencies = {
    createCapture: vi.fn((_stream, callbacks) => {
      captureCallbacks = callbacks;
      return capture;
    }),
    playback,
    requestMicrophone: options?.requestMicrophone ?? vi.fn(async () => stream),
    runMockLoop:
      options?.runMockLoop ??
      vi.fn(async ({ callbacks }) => {
        callbacks.onTranscript('模拟转录');
        callbacks.onUnderstandingFinished();
        callbacks.onResponseChunk('模拟回答');
        callbacks.onSpeakingStarted();
        callbacks.onCompleted();
      }),
    ...(options?.speech ? { speech: options.speech } : {}),
    setTimeout: vi.fn((callback) => {
      callback();
      return 1;
    }),
    stopStream: vi.fn(),
  };
  return {
    capture,
    dependencies,
    getCaptureCallbacks: () => captureCallbacks,
    playback,
  };
}

const realSpeechConfig: SpeechPublicConfig = {
  baseUrl: 'https://speech.example/v1',
  credentialSource: 'independent',
  hasCredential: true,
  keySuffix: '1357',
  language: 'zh',
  lastTestedAt: '2026-07-31T08:00:00.000Z',
  mode: 'real',
  model: 'speech-model',
  providerId: 'openai-compatible',
  timeoutMs: 45_000,
};

function successfulTranscription(transcript: string): SpeechTranscriptionResult {
  return {
    metrics: {
      audioBytes: 5,
      audioDurationMs: 800,
      providerId: 'openai-compatible',
      totalMs: 12,
      uploadCompletedMs: 4,
    },
    ok: true,
    requestId: 'request-1',
    transcript,
  };
}

describe('VoiceController', () => {
  it('does not request permission before a direct press', () => {
    const requestMicrophone = vi.fn();
    const { dependencies } = createDependencies({ requestMicrophone });
    new VoiceController(dependencies);
    expect(requestMicrophone).not.toHaveBeenCalled();
  });

  it('captures, processes, plays, and returns to idle', async () => {
    const { capture, dependencies } = createDependencies();
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.release();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('idle'));

    expect(capture.stop).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({
      response: '模拟回答',
      transcript: '模拟转录',
    });
  });

  it('reports permission denial and capability failures in Chinese', async () => {
    const { dependencies } = createDependencies({
      requestMicrophone: vi.fn(async () => {
        throw new DOMException('denied', 'NotAllowedError');
      }),
    });
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('error'));
    expect(controller.getSnapshot().error?.code).toBe('permission-denied');
    expect(controller.getSnapshot().error?.message).toContain('系统设置');

    expect(mapVoiceError(new DOMException('missing', 'NotFoundError')).error.code).toBe(
      'no-device',
    );
    expect(mapVoiceError(new DOMException('unsupported', 'NotSupportedError')).error.code).toBe(
      'unsupported',
    );
  });

  it('stops a late stream when the user releases before permission resolves', async () => {
    const microphone = deferred<MediaStream>();
    const { dependencies } = createDependencies({
      requestMicrophone: () => microphone.promise,
    });
    const controller = new VoiceController(dependencies);
    const { stream } = fakeStream();

    controller.pressStart();
    controller.release();
    microphone.resolve(stream);

    await vi.waitFor(() => expect(dependencies.stopStream).toHaveBeenCalledWith(stream));
    expect(controller.getSnapshot().phase).toBe('idle');
    expect(dependencies.createCapture).not.toHaveBeenCalled();
  });

  it('rejects recordings shorter than the centralized minimum', async () => {
    const { dependencies } = createDependencies({ durationMs: 120 });
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.release();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('error'));
    expect(controller.getSnapshot().error?.code).toBe('too-short');
    expect(dependencies.runMockLoop).not.toHaveBeenCalled();
  });

  it('auto-finishes at maximum duration and cleans up on dispose', async () => {
    const { capture, dependencies, getCaptureCallbacks } = createDependencies();
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    getCaptureCallbacks()?.onMaximumDuration();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('idle'));
    expect(controller.getSnapshot().notice).toContain('最长录音时长');

    const second = new VoiceController(dependencies);
    second.pressStart();
    await vi.waitFor(() => expect(second.getSnapshot().phase).toBe('listening'));
    second.dispose();
    expect(capture.cancel).toHaveBeenCalled();
  });

  it('interrupts speaking and starts a fresh session without stale writes', async () => {
    const { dependencies, playback } = createDependencies({
      runMockLoop: async ({ callbacks, signal }) => {
        callbacks.onTranscript('旧模拟转录');
        callbacks.onUnderstandingFinished();
        callbacks.onResponseChunk('旧回答');
        callbacks.onSpeakingStarted();
        await new Promise<void>((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        });
      },
    });
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.release();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('speaking'));

    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().sessionId).toBe(2));
    expect(playback.stop).toHaveBeenCalled();
    expect(controller.getSnapshot().response).toBe('');
  });

  it('cancels capture and clears active resources', async () => {
    const { capture, dependencies, playback } = createDependencies();
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.cancel();

    expect(capture.cancel).toHaveBeenCalled();
    expect(playback.stop).toHaveBeenCalled();
    expect(controller.getSnapshot().phase).toBe('idle');
  });

  it('keeps the text response readable when local playback fails', async () => {
    const { dependencies } = createDependencies({
      runMockLoop: async ({ callbacks }) => {
        callbacks.onTranscript('模拟转录');
        callbacks.onUnderstandingFinished();
        callbacks.onResponseChunk('仍可阅读的回答');
        callbacks.onSpeakingStarted();
        throw new Error('audio output failed');
      },
    });
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.release();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('error'));

    expect(controller.getSnapshot()).toMatchObject({
      error: { code: 'playback-failed' },
      response: '仍可阅读的回答',
    });
  });

  it('stages real transcription for confirmation and never runs the Mock loop', async () => {
    const speech = {
      cancel: vi.fn(async () => undefined),
      getConfig: vi.fn(async () => realSpeechConfig),
      transcribe: vi.fn(async () => successfulTranscription('真实转录文字')),
    };
    const { dependencies } = createDependencies({ speech });
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.release();
    await vi.waitFor(() =>
      expect(controller.getSnapshot()).toMatchObject({
        phase: 'transcribing',
        speechMode: 'real',
        transcript: '真实转录文字',
        transcriptReview: 'pending',
      }),
    );
    expect(dependencies.runMockLoop).not.toHaveBeenCalled();

    expect(controller.confirmTranscript('真实转录文字，已经修正。')).toBe(true);
    expect(controller.getSnapshot()).toMatchObject({
      phase: 'understanding',
      transcriptionEdited: true,
    });
  });

  it('cancels a real transcription and ignores its late result', async () => {
    const transcription = deferred<SpeechTranscriptionResult>();
    const speech = {
      cancel: vi.fn(async () => undefined),
      getConfig: vi.fn(async () => realSpeechConfig),
      transcribe: vi.fn(() => transcription.promise),
    };
    const { dependencies } = createDependencies({ speech });
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.release();
    await vi.waitFor(() => expect(speech.transcribe).toHaveBeenCalledOnce());
    controller.cancel();
    expect(speech.cancel).toHaveBeenCalledOnce();

    transcription.resolve(successfulTranscription('不应出现的迟到文字'));
    await Promise.resolve();
    expect(controller.getSnapshot().transcript).toBe('');
    expect(controller.getSnapshot().phase).toBe('idle');
  });

  it('retains one failed recording for retry and releases it after success', async () => {
    const speech = {
      cancel: vi.fn(async () => undefined),
      getConfig: vi.fn(async () => realSpeechConfig),
      transcribe: vi
        .fn()
        .mockResolvedValueOnce({
          error: {
            code: 'network',
            message: '网络失败',
            providerId: 'openai-compatible',
            requestId: 'request-1',
            retryable: true,
            safeTechnicalSummary: 'network',
          },
          ok: false,
        })
        .mockResolvedValueOnce(successfulTranscription('重试后的转录')),
    };
    const { dependencies } = createDependencies({ speech });
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.release();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('error'));

    controller.retryTranscription();
    await vi.waitFor(() =>
      expect(controller.getSnapshot()).toMatchObject({
        phase: 'transcribing',
        transcript: '重试后的转录',
        transcriptReview: 'pending',
      }),
    );
    expect(speech.transcribe).toHaveBeenCalledTimes(2);
    controller.cancel();
    controller.retryTranscription();
    expect(speech.transcribe).toHaveBeenCalledTimes(2);
  });

  it('does not silently fall back to Mock when real configuration cannot be read', async () => {
    const speech = {
      cancel: vi.fn(async () => undefined),
      getConfig: vi.fn(async () => {
        throw new Error('configuration unavailable');
      }),
      transcribe: vi.fn(),
    };
    const { dependencies } = createDependencies({ speech });
    const controller = new VoiceController(dependencies);
    controller.pressStart();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('listening'));
    controller.release();
    await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('error'));
    expect(controller.getSnapshot().error?.code).toBe('transcription-failed');
    expect(dependencies.runMockLoop).not.toHaveBeenCalled();
    expect(speech.transcribe).not.toHaveBeenCalled();
  });
});
