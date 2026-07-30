export type AppRoute = 'conversation' | 'design-system' | 'presence' | 'settings';

export function resolveAppRoute(hash: string): AppRoute {
  if (hash.startsWith('#/design-system')) {
    return 'design-system';
  }
  if (hash.startsWith('#/settings')) {
    return 'settings';
  }
  return hash.startsWith('#/conversation') ? 'conversation' : 'presence';
}

export function readExplorationId(hash: string): string | null {
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) {
    return null;
  }
  return new URLSearchParams(hash.slice(queryIndex + 1)).get('exploration');
}
