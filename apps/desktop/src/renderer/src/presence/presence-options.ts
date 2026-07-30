import { parsePresenceVariant } from './presence-data';
import type { PresenceVariant } from './types';

export interface PresenceOptions {
  readonly focusTarget: boolean;
  readonly reducedMotion: boolean;
  readonly variant: PresenceVariant;
}

export function parsePresenceOptions(hash: string): PresenceOptions {
  const hashQuery = hash.split('?')[1] ?? '';
  const parameters = new URLSearchParams(hashQuery);

  return {
    focusTarget: parameters.get('focus') === 'voice',
    reducedMotion: parameters.get('motion') === 'reduced',
    variant: parsePresenceVariant(parameters.get('variant')),
  };
}

export function resolveOrbMotion(options: {
  readonly prefersReducedMotion: boolean;
  readonly reducedMotionOverride: boolean;
  readonly hardwareConcurrency: number;
}): 'ambient' | 'static' {
  return options.prefersReducedMotion ||
    options.reducedMotionOverride ||
    options.hardwareConcurrency <= 4
    ? 'static'
    : 'ambient';
}
