import { describe, expect, it, vi } from 'vitest';

import { createLocalPlayback } from './local-playback';

function speechEnvironment() {
  let utterance: SpeechSynthesisUtterance | undefined;
  const cancel = vi.fn();
  const speak = vi.fn((value: SpeechSynthesisUtterance) => {
    utterance = value;
  });
  return {
    environment: {
      AudioContext: undefined,
      createUtterance: (text: string) =>
        ({ onend: null, onerror: null, text }) as unknown as SpeechSynthesisUtterance,
      speechSynthesis: { cancel, speak },
    },
    getUtterance: () => utterance,
    synth: { cancel, speak },
  };
}

describe('local playback adapter', () => {
  it('starts and completes browser speech synthesis', async () => {
    const { environment, getUtterance, synth } = speechEnvironment();
    const playback = createLocalPlayback(environment);
    const promise = playback.play('固定中文回答', new AbortController().signal);
    getUtterance()?.onend?.({} as SpeechSynthesisEvent);
    await promise;
    expect(synth.speak).toHaveBeenCalledOnce();
  });

  it('stops active playback immediately', async () => {
    const { environment, synth } = speechEnvironment();
    const playback = createLocalPlayback(environment);
    const promise = playback.play('固定中文回答', new AbortController().signal);
    playback.stop();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('uses a deterministic Web Audio tone when system speech is unavailable', async () => {
    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      state = 'running';

      close = vi.fn(async () => undefined);
      resume = vi.fn(async () => undefined);
      createGain() {
        return {
          connect: vi.fn(),
          gain: {
            exponentialRampToValueAtTime: vi.fn(),
            setValueAtTime: vi.fn(),
          },
        };
      }
      createOscillator() {
        const oscillator = {
          connect: vi.fn(),
          frequency: {
            linearRampToValueAtTime: vi.fn(),
            setValueAtTime: vi.fn(),
          },
          onended: null as (() => void) | null,
          start: vi.fn(),
          stop: vi.fn(() => queueMicrotask(() => oscillator.onended?.())),
          type: 'sine',
        };
        return oscillator;
      }
    }

    const playback = createLocalPlayback({
      AudioContext: FakeAudioContext as unknown as typeof AudioContext,
      createUtterance: undefined,
      speechSynthesis: undefined,
    });
    await expect(
      playback.play('固定中文回答', new AbortController().signal),
    ).resolves.toBeUndefined();
  });
});
