import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Spinner } from './Spinner';
import type { ButtonVariant } from './variants';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  'aria-label': string;
  children: ReactNode;
  error?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
}

export function IconButton({
  children,
  className,
  disabled = false,
  error = false,
  loading = false,
  type = 'button',
  variant = 'secondary',
  ...props
}: IconButtonProps): React.JSX.Element {
  const classes = [
    'ds-icon-button',
    `ds-icon-button--${variant}`,
    error ? 'is-error' : '',
    loading ? 'is-loading' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      aria-busy={loading || undefined}
      aria-invalid={error || undefined}
      className={classes}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
