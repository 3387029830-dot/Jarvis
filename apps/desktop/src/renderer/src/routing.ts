export type AppRoute = 'design-system' | 'presence';

export function resolveAppRoute(hash: string): AppRoute {
  return hash.startsWith('#/design-system') ? 'design-system' : 'presence';
}
