import type { HTMLAttributes } from 'react';

import { surfaceClassName, type SurfaceTone } from './variants';

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  tone?: SurfaceTone;
}

export function Panel({ className, tone = 'elevated', ...props }: PanelProps): React.JSX.Element {
  return <section className={surfaceClassName('ds-panel', tone, className)} {...props} />;
}
