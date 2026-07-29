import { useEffect, useState } from 'react';

import { Showcase } from './showcase/Showcase';

type BridgeState = 'checking' | 'ready' | 'unavailable';

function Foundation(): React.JSX.Element {
  const [bridgeState, setBridgeState] = useState<BridgeState>('checking');

  useEffect(() => {
    let active = true;

    window.jarvis
      .healthCheck()
      .then((result) => {
        if (active) {
          setBridgeState(result.status === 'ok' ? 'ready' : 'unavailable');
        }
      })
      .catch(() => {
        if (active) {
          setBridgeState('unavailable');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const statusText = {
    checking: 'Checking desktop bridge…',
    ready: 'Desktop bridge ready',
    unavailable: 'Desktop bridge unavailable',
  }[bridgeState];

  return (
    <main className="foundation">
      <section className="foundation__content" aria-labelledby="app-title">
        <p className="foundation__eyebrow">Secure desktop foundation</p>
        <h1 id="app-title">Jarvis</h1>
        <p className="foundation__description">
          The desktop boundary is running. Product presence and voice interaction remain outside
          this foundation slice.
        </p>
        <output
          className={`foundation__status foundation__status--${bridgeState}`}
          aria-live="polite"
        >
          <span aria-hidden="true" />
          {statusText}
        </output>
      </section>
    </main>
  );
}

export function App(): React.JSX.Element {
  return window.location.hash.startsWith('#/design-system') ? <Showcase /> : <Foundation />;
}
