import { describe, expect, it } from 'vitest';

import { parsePresenceOptions, resolveOrbMotion } from './presence-options';

describe('Presence development options', () => {
  it('parses deterministic evidence states from the hash', () => {
    expect(parsePresenceOptions('#/presence?variant=empty&focus=voice&motion=reduced')).toEqual({
      focusTarget: true,
      reducedMotion: true,
      variant: 'empty',
    });
  });

  it('uses a static Orb for reduced-motion and constrained hardware', () => {
    expect(
      resolveOrbMotion({
        hardwareConcurrency: 8,
        prefersReducedMotion: true,
        reducedMotionOverride: false,
      }),
    ).toBe('static');
    expect(
      resolveOrbMotion({
        hardwareConcurrency: 4,
        prefersReducedMotion: false,
        reducedMotionOverride: false,
      }),
    ).toBe('static');
    expect(
      resolveOrbMotion({
        hardwareConcurrency: 8,
        prefersReducedMotion: false,
        reducedMotionOverride: false,
      }),
    ).toBe('ambient');
  });
});
