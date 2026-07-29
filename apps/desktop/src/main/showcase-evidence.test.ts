import { describe, expect, it } from 'vitest';

import { createShowcaseHash, resolveShowcaseEvidenceOptions } from './showcase-evidence';

describe('showcase evidence options', () => {
  it('uses safe viewport defaults and leaves showcase evidence disabled', () => {
    expect(resolveShowcaseEvidenceOptions({})).toEqual({
      dialogOpen: false,
      enabled: false,
      focusTarget: false,
      height: 800,
      reducedMotion: false,
      width: 1280,
    });
  });

  it('accepts supported states and rejects dimensions below the app minimum', () => {
    const result = resolveShowcaseEvidenceOptions({
      JARVIS_SHOWCASE_DIALOG: '1',
      JARVIS_SHOWCASE_EVIDENCE: '1',
      JARVIS_SHOWCASE_FOCUS: '1',
      JARVIS_SHOWCASE_REDUCED_MOTION: '1',
      JARVIS_SMOKE_HEIGHT: '900',
      JARVIS_SMOKE_WIDTH: '800',
    });

    expect(result).toMatchObject({
      dialogOpen: true,
      enabled: true,
      focusTarget: true,
      height: 900,
      reducedMotion: true,
      width: 1280,
    });
    expect(createShowcaseHash(result)).toBe(
      '/design-system?dialog=open&focus=button&motion=reduced',
    );
  });
});
