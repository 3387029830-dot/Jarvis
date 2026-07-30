import type { LocalPlayback } from './local-playback';

export const MOCK_VOICE_CONTENT = {
  responseChunks: [
    '因为群体不仅提供信息，也提供一种暂时的安全感。',
    '\n从心理学看，这是从众和不确定性规避；',
    '\n从经济学看，它还会形成信息瀑布，让个人判断被集体行为不断放大。',
  ],
  transcript: '为什么人在不确定的时候更容易跟随群体？',
} as const;

export const MOCK_VOICE_DELAYS = {
  responseChunkMs: 260,
  transcribingMs: 560,
  understandingMs: 460,
} as const;

export interface MockVoiceLoopCallbacks {
  onCompleted(): void;
  onResponseChunk(chunk: string): void;
  onSpeakingStarted(): void;
  onTranscript(transcript: string): void;
  onUnderstandingFinished(): void;
}

export interface MockVoiceLoopOptions {
  readonly callbacks: MockVoiceLoopCallbacks;
  readonly delays?: {
    readonly responseChunkMs: number;
    readonly transcribingMs: number;
    readonly understandingMs: number;
  };
  readonly playback: LocalPlayback;
  readonly signal: AbortSignal;
  readonly wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

function abortError(): DOMException {
  return new DOMException('Mock voice loop was cancelled.', 'AbortError');
}

export function waitForMockDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, milliseconds);

    function handleAbort(): void {
      window.clearTimeout(timer);
      reject(abortError());
    }

    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

export async function runMockVoiceLoop({
  callbacks,
  delays = MOCK_VOICE_DELAYS,
  playback,
  signal,
  wait = waitForMockDelay,
}: MockVoiceLoopOptions): Promise<void> {
  await wait(delays.transcribingMs, signal);
  callbacks.onTranscript(MOCK_VOICE_CONTENT.transcript);

  await wait(delays.understandingMs, signal);
  callbacks.onUnderstandingFinished();

  for (const chunk of MOCK_VOICE_CONTENT.responseChunks) {
    await wait(delays.responseChunkMs, signal);
    callbacks.onResponseChunk(chunk);
  }

  callbacks.onSpeakingStarted();
  await playback.play(MOCK_VOICE_CONTENT.responseChunks.join(''), signal);
  callbacks.onCompleted();
}
