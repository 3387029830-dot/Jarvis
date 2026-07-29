import type { HTMLAttributes } from 'react';

export function VisuallyHidden({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      className={['ds-visually-hidden', className ?? ''].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
