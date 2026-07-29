export interface ShowcaseEvidenceOptions {
  dialogOpen: boolean;
  enabled: boolean;
  focusTarget: boolean;
  height: number;
  reducedMotion: boolean;
  width: number;
}

function parseDimension(value: string | undefined, fallback: number, minimum: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

export function resolveShowcaseEvidenceOptions(
  environment: NodeJS.ProcessEnv,
): ShowcaseEvidenceOptions {
  return {
    dialogOpen: environment.JARVIS_SHOWCASE_DIALOG === '1',
    enabled: environment.JARVIS_SHOWCASE_EVIDENCE === '1',
    focusTarget: environment.JARVIS_SHOWCASE_FOCUS === '1',
    height: parseDimension(environment.JARVIS_SMOKE_HEIGHT, 800, 640),
    reducedMotion: environment.JARVIS_SHOWCASE_REDUCED_MOTION === '1',
    width: parseDimension(environment.JARVIS_SMOKE_WIDTH, 1280, 1024),
  };
}

export function createShowcaseHash(options: ShowcaseEvidenceOptions): string {
  const parameters = new URLSearchParams();

  if (options.dialogOpen) {
    parameters.set('dialog', 'open');
  }
  if (options.focusTarget) {
    parameters.set('focus', 'button');
  }
  if (options.reducedMotion) {
    parameters.set('motion', 'reduced');
  }

  const query = parameters.toString();
  return `/design-system${query ? `?${query}` : ''}`;
}
