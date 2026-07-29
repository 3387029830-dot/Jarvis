import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

export interface TooltipProps {
  children: ReactElement<{ 'aria-describedby'?: string }>;
  content: ReactNode;
  placement?: 'top' | 'bottom';
}

export function Tooltip({ children, content, placement = 'top' }: TooltipProps): React.JSX.Element {
  const id = useId();
  const trigger = isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': id })
    : children;

  return (
    <span className={`ds-tooltip ds-tooltip--${placement}`}>
      {trigger}
      <span className="ds-tooltip__content" id={id} role="tooltip">
        {content}
      </span>
    </span>
  );
}
