export const tokens = {
  background: {
    root: 'var(--color-bg-root)',
    elevated: 'var(--color-bg-elevated)',
    soft: 'var(--color-bg-soft)',
    overlay: 'var(--color-bg-overlay)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted: 'var(--color-text-muted)',
    inverse: 'var(--color-text-inverse)',
  },
  semantic: {
    accent: 'var(--color-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  },
  border: {
    subtle: 'var(--color-border-subtle)',
    interactive: 'var(--color-border-interactive)',
    focus: 'var(--color-border-focus)',
    error: 'var(--color-border-error)',
  },
  width: {
    compact: 'var(--content-width-compact)',
    readable: 'var(--content-width-readable)',
    wide: 'var(--content-width-wide)',
  },
} as const;

export type TokenGroup = keyof typeof tokens;
