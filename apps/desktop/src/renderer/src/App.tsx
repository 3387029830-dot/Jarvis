import { useEffect, useState } from 'react';

import { ConversationPage } from './conversation/ConversationPage';
import { PresencePage } from './presence/PresencePage';
import { readExplorationId, resolveAppRoute } from './routing';
import { Showcase } from './showcase/Showcase';

export function App(): React.JSX.Element {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = (): void => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const route = resolveAppRoute(hash);
  if (route === 'design-system') {
    return <Showcase />;
  }
  if (route === 'conversation') {
    return <ConversationPage explorationId={readExplorationId(hash)} />;
  }
  return <PresencePage />;
}
