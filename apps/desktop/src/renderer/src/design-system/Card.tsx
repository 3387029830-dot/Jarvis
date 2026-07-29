import type { HTMLAttributes } from 'react';

import { surfaceClassName, type SurfaceTone } from './variants';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: SurfaceTone;
}

export function Card({ className, tone = 'soft', ...props }: CardProps): React.JSX.Element {
  return <article className={surfaceClassName('ds-card', tone, className)} {...props} />;
}
