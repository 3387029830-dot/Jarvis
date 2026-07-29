import { describe, expect, it } from 'vitest';

import { badgeClassName, buttonClassName, surfaceClassName } from './variants';

describe('design-system variants', () => {
  it('builds deterministic button classes for visual and async states', () => {
    expect(
      buttonClassName({
        className: 'specimen',
        error: true,
        loading: true,
        size: 'large',
        variant: 'secondary',
      }),
    ).toBe('ds-button ds-button--secondary ds-button--large is-error is-loading specimen');
  });

  it('uses stable semantic classes for badges and surfaces', () => {
    expect(badgeClassName('warning')).toBe('ds-badge ds-badge--warning');
    expect(surfaceClassName('ds-panel', 'overlay')).toBe('ds-panel ds-panel--overlay');
  });
});
