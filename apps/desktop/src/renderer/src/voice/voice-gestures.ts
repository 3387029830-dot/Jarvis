import type { VoiceInteractionMode } from './interaction-mode';
import type { VoiceControllerBinding } from './use-voice-controller';
import type { VoiceControllerState } from './voice-state';

export interface VoiceCommands {
  cancel(): void;
  finishCapture(): void;
  interruptAndCapture(): void;
  startCapture(): void;
}

export function createVoiceCommands(controller: VoiceControllerBinding): VoiceCommands {
  return {
    cancel: controller.cancel,
    finishCapture: controller.release,
    interruptAndCapture: controller.pressStart,
    startCapture: controller.pressStart,
  };
}

export function activateToggleVoice(commands: VoiceCommands, state: VoiceControllerState): void {
  if (state.phase === 'listening' || state.permission === 'requesting') {
    commands.finishCapture();
    return;
  }
  if (state.phase === 'speaking') {
    commands.interruptAndCapture();
    return;
  }
  commands.startCapture();
}

export function voicePrimaryLabel(mode: VoiceInteractionMode, state: VoiceControllerState): string {
  if (mode === 'toggle') {
    return state.phase === 'listening' || state.permission === 'requesting'
      ? '点击发送'
      : '点击说话';
  }
  return state.phase === 'listening' || state.permission === 'requesting' ? '松开发送' : '按住说话';
}
