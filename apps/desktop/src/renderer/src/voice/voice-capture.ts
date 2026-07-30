export const VOICE_CAPTURE_LIMITS = {
  maximumDurationMs: 60_000,
  minimumDurationMs: 300,
} as const;

const supportedMimeTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
] as const;

export interface CapturedAudio {
  readonly blob: Blob;
  readonly durationMs: number;
  readonly mimeType: string;
}

export interface CaptureCallbacks {
  onFailure(error: Error): void;
  onMaximumDuration(): void;
  onSample(level: number, durationMs: number): void;
}

export interface VoiceCaptureSession {
  cancel(): Promise<void>;
  stop(): Promise<CapturedAudio>;
}

interface MediaRecorderConstructor {
  new (stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder;
  isTypeSupported(type: string): boolean;
}

export interface CaptureEnvironment {
  readonly AudioContext: typeof AudioContext | undefined;
  readonly MediaRecorder: MediaRecorderConstructor | undefined;
  readonly cancelAnimationFrame: (handle: number) => void;
  readonly clearTimeout: (handle: number) => void;
  readonly now: () => number;
  readonly requestAnimationFrame: (callback: FrameRequestCallback) => number;
  readonly setTimeout: (callback: () => void, delay: number) => number;
}

export function browserCaptureEnvironment(): CaptureEnvironment {
  return {
    AudioContext: window.AudioContext,
    MediaRecorder: window.MediaRecorder,
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    now: () => performance.now(),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    setTimeout: window.setTimeout.bind(window),
  };
}

export function selectRecordingMimeType(
  mediaRecorder: Pick<MediaRecorderConstructor, 'isTypeSupported'>,
): string {
  return supportedMimeTypes.find((type) => mediaRecorder.isTypeSupported(type)) ?? '';
}

export function stopMediaStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function calculateLevel(samples: Uint8Array<ArrayBuffer>): number {
  let squareSum = 0;
  for (const sample of samples) {
    const normalized = (sample - 128) / 128;
    squareSum += normalized * normalized;
  }
  return Math.min(1, Math.sqrt(squareSum / samples.length) * 3.2);
}

export function createVoiceCaptureSession(
  stream: MediaStream,
  callbacks: CaptureCallbacks,
  environment: CaptureEnvironment = browserCaptureEnvironment(),
): VoiceCaptureSession {
  const MediaRecorderClass = environment.MediaRecorder;
  const AudioContextClass = environment.AudioContext;
  if (!MediaRecorderClass || !AudioContextClass) {
    stopMediaStream(stream);
    throw new Error('Recording APIs are unavailable.');
  }

  const mimeType = selectRecordingMimeType(MediaRecorderClass);
  const recorder = new MediaRecorderClass(stream, mimeType ? { mimeType } : undefined);
  const audioContext = new AudioContextClass();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.72;
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const samples = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  const chunks: BlobPart[] = [];
  const startedAt = environment.now();
  let animationFrame = 0;
  let finishing = false;
  let maximumTimer = 0;

  const stopResult = new Promise<void>((resolve, reject) => {
    recorder.addEventListener('dataavailable', (event) => {
      if (!finishing && event.data.size > 0) {
        chunks.push(event.data);
      } else if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });
    recorder.addEventListener('stop', () => resolve(), { once: true });
    recorder.addEventListener(
      'error',
      () => reject(new Error('MediaRecorder reported an error.')),
      { once: true },
    );
  });

  function sample(): void {
    if (finishing) {
      return;
    }
    analyser.getByteTimeDomainData(samples);
    callbacks.onSample(calculateLevel(samples), environment.now() - startedAt);
    animationFrame = environment.requestAnimationFrame(sample);
  }

  function stopRealtimeResources(): void {
    if (animationFrame) {
      environment.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    if (maximumTimer) {
      environment.clearTimeout(maximumTimer);
      maximumTimer = 0;
    }
  }

  async function closeResources(): Promise<void> {
    source.disconnect();
    analyser.disconnect();
    stopMediaStream(stream);
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }

  async function finish(discard: boolean): Promise<CapturedAudio> {
    if (finishing) {
      throw new Error('Capture session has already finished.');
    }
    finishing = true;
    stopRealtimeResources();
    const durationMs = environment.now() - startedAt;

    try {
      if (recorder.state !== 'inactive') {
        recorder.stop();
        await stopResult;
      }
    } catch (error) {
      callbacks.onFailure(error instanceof Error ? error : new Error('Recording failed.'));
      throw error;
    } finally {
      await closeResources();
    }

    const blob = discard ? new Blob() : new Blob(chunks, { type: recorder.mimeType || mimeType });
    chunks.length = 0;
    return { blob, durationMs, mimeType: blob.type };
  }

  for (const track of stream.getTracks()) {
    track.addEventListener(
      'ended',
      () => {
        if (!finishing) {
          callbacks.onFailure(new Error('Microphone device disconnected.'));
        }
      },
      { once: true },
    );
  }

  void audioContext.resume().catch((error: unknown) => {
    callbacks.onFailure(
      error instanceof Error ? error : new Error('Audio analyser could not start.'),
    );
  });
  recorder.start(100);
  sample();
  maximumTimer = environment.setTimeout(
    callbacks.onMaximumDuration,
    VOICE_CAPTURE_LIMITS.maximumDurationMs,
  );

  return {
    async cancel() {
      await finish(true);
    },
    async stop() {
      return finish(false);
    },
  };
}
