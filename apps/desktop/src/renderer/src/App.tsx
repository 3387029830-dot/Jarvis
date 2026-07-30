import { PresencePage } from './presence/PresencePage';
import { resolveAppRoute } from './routing';
import { Showcase } from './showcase/Showcase';

export function App(): React.JSX.Element {
  return resolveAppRoute(window.location.hash) === 'design-system' ? (
    <Showcase />
  ) : (
    <PresencePage />
  );
}
