import { useEffect, useState, useSyncExternalStore } from 'react';

import { VoiceController, type VoiceControllerDependencies } from './voice-controller';
import type { VoiceControllerState } from './voice-state';

export interface VoiceControllerBinding {
  readonly beginExternalResponse: () => void;
  readonly cancel: () => void;
  readonly completeExternalResponse: () => void;
  readonly confirmTranscript: (transcript: string) => boolean;
  readonly failExternalResponse: (message: string) => void;
  readonly pressStart: () => void;
  readonly recover: () => void;
  readonly replaceExternalResponse: (response: string) => void;
  readonly release: () => void;
  readonly restartCapture: () => void;
  readonly retryTranscription: () => void;
  readonly settleExternalResponse: () => void;
  readonly state: VoiceControllerState;
}

export function useVoiceController(
  dependencies?: VoiceControllerDependencies,
): VoiceControllerBinding {
  const [controller] = useState(() => new VoiceController(dependencies));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);

  useEffect(() => controller.attach(), [controller]);

  return {
    beginExternalResponse: () => controller.beginExternalResponse(),
    cancel: () => controller.cancel(),
    completeExternalResponse: () => controller.completeExternalResponse(),
    confirmTranscript: (transcript) => controller.confirmTranscript(transcript),
    failExternalResponse: (message) => controller.failExternalResponse(message),
    pressStart: () => controller.pressStart(),
    recover: () => controller.recover(),
    replaceExternalResponse: (response) => controller.replaceExternalResponse(response),
    release: () => controller.release(),
    restartCapture: () => controller.restartCapture(),
    retryTranscription: () => controller.retryTranscription(),
    settleExternalResponse: () => controller.settleExternalResponse(),
    state,
  };
}
