import { describe, expect, it, vi } from 'vitest';

import type { LocalPlayback } from './local-playback';
import { MOCK_VOICE_CONTENT, runMockVoiceLoop } from './mock-voice-loop';

describe('deterministic Mock voice loop', () => {
  it('emits transcript, response chunks, playback, and completion in order', async () => {
    const events: string[] = [];
    const playback: LocalPlayback = {
      play: vi.fn(async () => {
        events.push('playback');
      }),
      stop: vi.fn(),
    };

    await runMockVoiceLoop({
      callbacks: {
        onCompleted: () => events.push('completed'),
        onResponseChunk: (chunk) => events.push(`chunk:${chunk}`),
        onSpeakingStarted: () => events.push('speaking'),
        onTranscript: (transcript) => events.push(`transcript:${transcript}`),
        onUnderstandingFinished: () => events.push('understanding'),
      },
      playback,
      signal: new AbortController().signal,
      wait: async () => undefined,
    });

    expect(events).toEqual([
      `transcript:${MOCK_VOICE_CONTENT.transcript}`,
      'understanding',
      ...MOCK_VOICE_CONTENT.responseChunks.map((chunk) => `chunk:${chunk}`),
      'speaking',
      'playback',
      'completed',
    ]);
  });

  it('does not continue after cancellation', async () => {
    const controller = new AbortController();
    const onTranscript = vi.fn();
    controller.abort();

    await expect(
      runMockVoiceLoop({
        callbacks: {
          onCompleted: vi.fn(),
          onResponseChunk: vi.fn(),
          onSpeakingStarted: vi.fn(),
          onTranscript,
          onUnderstandingFinished: vi.fn(),
        },
        playback: { play: vi.fn(), stop: vi.fn() },
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(onTranscript).not.toHaveBeenCalled();
  });
});
