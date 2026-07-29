import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { Spinner } from './Spinner';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './variants';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  error?: boolean;
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled = false,
    error = false,
    loading = false,
    size = 'medium',
    type = 'button',
    variant = 'primary',
    ...props
  },
  ref,
): React.JSX.Element {
  return (
    <button
      aria-busy={loading || undefined}
      aria-invalid={error || undefined}
      className={buttonClassName({ className, error, loading, size, variant })}
      disabled={disabled || loading}
      ref={ref}
      type={type}
      {...props}
    >
      {loading ? <Spinner /> : null}
      <span>{children}</span>
    </button>
  );
});
