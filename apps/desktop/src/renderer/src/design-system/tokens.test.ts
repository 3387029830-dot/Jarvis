import { describe, expect, it } from 'vitest';

import { tokens } from './tokens';

describe('design tokens', () => {
  it('maps every TypeScript helper to the CSS-variable runtime source', () => {
    const values = Object.values(tokens).flatMap((group) => Object.values(group));

    expect(values.length).toBeGreaterThan(16);
    expect(values.every((value) => /^var\(--[a-z0-9-]+\)$/.test(value))).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });

  it('exposes the required color hierarchy and readable widths', () => {
    expect(Object.keys(tokens.background)).toEqual(['root', 'elevated', 'soft', 'overlay']);
    expect(Object.keys(tokens.text)).toEqual(['primary', 'secondary', 'muted', 'inverse']);
    expect(Object.keys(tokens.semantic)).toEqual(['accent', 'success', 'warning', 'danger']);
    expect(Object.keys(tokens.border)).toEqual(['subtle', 'interactive', 'focus', 'error']);
    expect(Object.keys(tokens.width)).toEqual(['compact', 'readable', 'wide']);
  });
});
