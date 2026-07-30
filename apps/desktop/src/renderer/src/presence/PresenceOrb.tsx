import { copy } from '../copy';

export function PresenceOrb({ motion }: { motion: 'ambient' | 'static' }): React.JSX.Element {
  return (
    <div
      aria-label={copy.presence.idleState}
      className="presence-orb"
      data-orb-motion={motion}
      role="img"
    >
      <span className="presence-orb__field" aria-hidden="true" />
      <span className="presence-orb__orbit presence-orb__orbit--outer" aria-hidden="true" />
      <span className="presence-orb__orbit presence-orb__orbit--inner" aria-hidden="true" />
      <span className="presence-orb__core" aria-hidden="true">
        <i />
      </span>
      <span className="presence-orb__state">{copy.presence.idleState}</span>
    </div>
  );
}
