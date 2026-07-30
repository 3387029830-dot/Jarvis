import { useSyncExternalStore } from 'react';

export type VoiceInteractionMode = 'hold' | 'toggle';

let currentMode: VoiceInteractionMode = 'toggle';
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export const voiceInteractionModeStore = {
  getSnapshot(): VoiceInteractionMode {
    return currentMode;
  },
  set(mode: VoiceInteractionMode): void {
    if (mode === currentMode) {
      return;
    }
    currentMode = mode;
    emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useVoiceInteractionMode(): readonly [
  VoiceInteractionMode,
  (mode: VoiceInteractionMode) => void,
] {
  const mode = useSyncExternalStore(
    voiceInteractionModeStore.subscribe,
    voiceInteractionModeStore.getSnapshot,
  );
  return [mode, voiceInteractionModeStore.set] as const;
}

export function resetVoiceInteractionModeForTests(): void {
  currentMode = 'toggle';
  emit();
}
