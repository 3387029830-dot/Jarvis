export interface LocalPlayback {
  play(text: string, signal: AbortSignal): Promise<void>;
  stop(): void;
}

export interface PlaybackEnvironment {
  readonly AudioContext: typeof AudioContext | undefined;
  readonly createUtterance: ((text: string) => SpeechSynthesisUtterance) | undefined;
  readonly speechSynthesis: Pick<SpeechSynthesis, 'cancel' | 'speak'> | undefined;
}

function abortError(): DOMException {
  return new DOMException('Playback was interrupted.', 'AbortError');
}

export function browserPlaybackEnvironment(): PlaybackEnvironment {
  return {
    AudioContext: window.AudioContext,
    createUtterance:
      typeof SpeechSynthesisUtterance === 'undefined'
        ? undefined
        : (text) => new SpeechSynthesisUtterance(text),
    speechSynthesis: window.speechSynthesis,
  };
}

export function createLocalPlayback(
  environment: PlaybackEnvironment = browserPlaybackEnvironment(),
): LocalPlayback {
  let activeStop: (() => void) | null = null;

  function playWithSpeech(text: string, signal: AbortSignal): Promise<void> {
    const synth = environment.speechSynthesis;
    const createUtterance = environment.createUtterance;
    if (!synth || !createUtterance) {
      return Promise.reject(new Error('System speech synthesis is unavailable.'));
    }
    const activeSynth = synth;
    const utteranceFactory = createUtterance;

    return new Promise((resolve, reject) => {
      const utterance = utteranceFactory(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.96;
      utterance.pitch = 0.92;

      function cleanUp(): void {
        signal.removeEventListener('abort', handleAbort);
        activeStop = null;
      }
      function handleAbort(): void {
        activeSynth.cancel();
        cleanUp();
        reject(abortError());
      }

      utterance.onend = () => {
        cleanUp();
        resolve();
      };
      utterance.onerror = () => {
        cleanUp();
        reject(new Error('System speech synthesis failed.'));
      };
      activeStop = handleAbort;
      signal.addEventListener('abort', handleAbort, { once: true });
      activeSynth.cancel();
      activeSynth.speak(utterance);
    });
  }

  function playDeterministicTone(signal: AbortSignal): Promise<void> {
    const AudioContextClass = environment.AudioContext;
    if (!AudioContextClass) {
      return Promise.reject(new Error('Local audio playback is unavailable.'));
    }

    return new Promise((resolve, reject) => {
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = context.currentTime;
      const endAt = startAt + 1.8;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(196, startAt);
      oscillator.frequency.linearRampToValueAtTime(246.94, startAt + 0.6);
      oscillator.frequency.linearRampToValueAtTime(220, startAt + 1.2);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.055, startAt + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gain);
      gain.connect(context.destination);

      function cleanUp(): void {
        signal.removeEventListener('abort', handleAbort);
        activeStop = null;
        void context.close();
      }
      function handleAbort(): void {
        try {
          oscillator.stop();
        } catch {
          // The oscillator may already have ended.
        }
        cleanUp();
        reject(abortError());
      }

      oscillator.onended = () => {
        cleanUp();
        resolve();
      };
      activeStop = handleAbort;
      signal.addEventListener('abort', handleAbort, { once: true });
      void context.resume();
      oscillator.start(startAt);
      oscillator.stop(endAt);
    });
  }

  return {
    async play(text, signal) {
      if (signal.aborted) {
        throw abortError();
      }
      try {
        await playWithSpeech(text, signal);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
        await playDeterministicTone(signal);
      }
    },
    stop() {
      activeStop?.();
    },
  };
}
