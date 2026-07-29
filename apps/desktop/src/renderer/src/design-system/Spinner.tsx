import type { HTMLAttributes } from 'react';

export function Spinner({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={['ds-spinner', className ?? ''].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
