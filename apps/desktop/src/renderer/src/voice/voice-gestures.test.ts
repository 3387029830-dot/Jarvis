import { describe, expect, it, vi } from 'vitest';

import { initialVoiceState } from './voice-state';
import { activateToggleVoice, voicePrimaryLabel, type VoiceCommands } from './voice-gestures';

function commands(): VoiceCommands {
  return {
    cancel: vi.fn(),
    finishCapture: vi.fn(),
    interruptAndCapture: vi.fn(),
    startCapture: vi.fn(),
  };
}

describe('voice gesture adapter', () => {
  it('uses toggle as click-to-start and click-to-finish without owning voice state', () => {
    const voiceCommands = commands();
    activateToggleVoice(voiceCommands, initialVoiceState);
    expect(voiceCommands.startCapture).toHaveBeenCalledOnce();

    activateToggleVoice(voiceCommands, {
      ...initialVoiceState,
      isPressing: true,
      permission: 'granted',
      phase: 'listening',
    });
    expect(voiceCommands.finishCapture).toHaveBeenCalledOnce();
  });

  it('maps speaking activation to interruption and exposes mode-specific labels', () => {
    const voiceCommands = commands();
    activateToggleVoice(voiceCommands, { ...initialVoiceState, phase: 'speaking' });
    expect(voiceCommands.interruptAndCapture).toHaveBeenCalledOnce();
    expect(voicePrimaryLabel('toggle', initialVoiceState)).toBe('点击说话');
    expect(voicePrimaryLabel('toggle', { ...initialVoiceState, phase: 'listening' })).toBe(
      '点击发送',
    );
    expect(voicePrimaryLabel('hold', initialVoiceState)).toBe('按住说话');
  });
});
