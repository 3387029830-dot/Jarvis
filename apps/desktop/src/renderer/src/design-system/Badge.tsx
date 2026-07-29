import type { HTMLAttributes } from 'react';

import { badgeClassName, type BadgeTone } from './variants';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps): React.JSX.Element {
  return <span className={badgeClassName(tone, className)} {...props} />;
}
