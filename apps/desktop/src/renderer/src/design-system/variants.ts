export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type SurfaceTone = 'root' | 'elevated' | 'soft' | 'overlay';

export function buttonClassName(options: {
  className?: string | undefined;
  error?: boolean;
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}): string {
  const {
    className,
    error = false,
    loading = false,
    size = 'medium',
    variant = 'primary',
  } = options;

  return [
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    error ? 'is-error' : '',
    loading ? 'is-loading' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function badgeClassName(tone: BadgeTone, className?: string): string {
  return ['ds-badge', `ds-badge--${tone}`, className ?? ''].filter(Boolean).join(' ');
}

export function surfaceClassName(
  base: 'ds-panel' | 'ds-card',
  tone: SurfaceTone,
  className?: string,
): string {
  return [base, `${base}--${tone}`, className ?? ''].filter(Boolean).join(' ');
}
