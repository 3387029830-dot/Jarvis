import type { HTMLAttributes } from 'react';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  'aria-label': string;
}

export function ScrollArea({ className, ...props }: ScrollAreaProps): React.JSX.Element {
  return (
    <div
      className={['ds-scroll-area', className ?? ''].filter(Boolean).join(' ')}
      role="region"
      tabIndex={0}
      {...props}
    />
  );
}
