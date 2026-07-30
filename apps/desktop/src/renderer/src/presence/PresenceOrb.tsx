import { copy } from '../copy';
import { presentVoiceState, type VoiceControllerState } from '../voice/voice-state';

export function PresenceOrb({
  motion,
  state,
}: {
  motion: 'ambient' | 'static';
  state: VoiceControllerState;
}): React.JSX.Element {
  const presentation = presentVoiceState(state, copy.voice.state);
  return (
    <div
      aria-label={`Jarvis 在场状态：${presentation.label}`}
      className="presence-orb"
      data-orb-motion={motion}
      data-voice-phase={state.phase}
      role="img"
      style={
        {
          '--voice-level': state.level,
          '--voice-scale': (1 + state.level * 0.32).toFixed(3),
        } as React.CSSProperties
      }
    >
      <span className="presence-orb__field" aria-hidden="true" />
      <span className="presence-orb__orbit presence-orb__orbit--outer" aria-hidden="true" />
      <span className="presence-orb__orbit presence-orb__orbit--inner" aria-hidden="true" />
      <span className="presence-orb__core" aria-hidden="true">
        <i />
      </span>
      <span className="presence-orb__state">{presentation.label}</span>
    </div>
  );
}
