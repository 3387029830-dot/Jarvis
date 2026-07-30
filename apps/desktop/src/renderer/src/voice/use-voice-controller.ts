import { useEffect, useState, useSyncExternalStore } from 'react';

import { VoiceController, type VoiceControllerDependencies } from './voice-controller';
import type { VoiceControllerState } from './voice-state';

export interface VoiceControllerBinding {
  readonly cancel: () => void;
  readonly pressStart: () => void;
  readonly recover: () => void;
  readonly release: () => void;
  readonly state: VoiceControllerState;
}

export function useVoiceController(
  dependencies?: VoiceControllerDependencies,
): VoiceControllerBinding {
  const [controller] = useState(() => new VoiceController(dependencies));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);

  useEffect(() => controller.attach(), [controller]);

  return {
    cancel: () => controller.cancel(),
    pressStart: () => controller.pressStart(),
    recover: () => controller.recover(),
    release: () => controller.release(),
    state,
  };
}
