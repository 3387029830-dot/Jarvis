export type EvidenceRoute = 'conversation' | 'design-system' | 'presence' | 'settings';
export type ConversationEvidenceState =
  | 'error'
  | 'normal'
  | 'offline'
  | 'provider-offline'
  | 'real-cancelled'
  | 'real-complete'
  | 'real-streaming'
  | 'streaming';
export type SettingsEvidenceState =
  'configured' | 'empty' | 'error' | 'success' | 'stt-empty' | 'stt-configured' | 'stt-error';
export type PresenceEvidenceVariant = 'empty' | 'single' | 'populated';
export type VoiceEvidenceState =
  | 'live'
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'responding'
  | 'speaking'
  | 'permission-denied'
  | 'real-transcribing'
  | 'real-review'
  | 'real-edited'
  | 'real-error';

export interface ShowcaseEvidenceOptions {
  dialogOpen: boolean;
  conversationScenario: string;
  conversationState: ConversationEvidenceState;
  enabled: boolean;
  focusTarget: boolean;
  height: number;
  presenceVariant: PresenceEvidenceVariant;
  reducedMotion: boolean;
  route: EvidenceRoute;
  settingsState: SettingsEvidenceState;
  voiceState: VoiceEvidenceState;
  width: number;
  zoomFactor: number;
}

function parseDimension(value: string | undefined, fallback: number, minimum: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

function parseZoomFactor(value: string | undefined): number {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 2 ? parsed : 1;
}

function parseRoute(value: string | undefined): EvidenceRoute {
  return value === 'presence' || value === 'conversation' || value === 'settings'
    ? value
    : 'design-system';
}

function parseConversationState(value: string | undefined): ConversationEvidenceState {
  return value === 'error' ||
    value === 'offline' ||
    value === 'provider-offline' ||
    value === 'real-cancelled' ||
    value === 'real-complete' ||
    value === 'real-streaming' ||
    value === 'streaming'
    ? value
    : 'normal';
}

function parseSettingsState(value: string | undefined): SettingsEvidenceState {
  return value === 'configured' ||
    value === 'error' ||
    value === 'success' ||
    value === 'stt-empty' ||
    value === 'stt-configured' ||
    value === 'stt-error'
    ? value
    : 'empty';
}

function parsePresenceVariant(value: string | undefined): PresenceEvidenceVariant {
  return value === 'empty' || value === 'single' || value === 'populated' ? value : 'populated';
}

function parseVoiceState(value: string | undefined): VoiceEvidenceState {
  return value === 'idle' ||
    value === 'listening' ||
    value === 'transcribing' ||
    value === 'responding' ||
    value === 'speaking' ||
    value === 'permission-denied' ||
    value === 'real-transcribing' ||
    value === 'real-review' ||
    value === 'real-edited' ||
    value === 'real-error'
    ? value
    : 'live';
}

export function resolveShowcaseEvidenceOptions(
  environment: NodeJS.ProcessEnv,
): ShowcaseEvidenceOptions {
  return {
    conversationScenario: environment.JARVIS_CONVERSATION_SCENARIO ?? 'uncertainty-and-crowd',
    conversationState: parseConversationState(environment.JARVIS_CONVERSATION_STATE),
    dialogOpen: environment.JARVIS_SHOWCASE_DIALOG === '1',
    enabled: environment.JARVIS_SHOWCASE_EVIDENCE === '1' || environment.JARVIS_EVIDENCE === '1',
    focusTarget: environment.JARVIS_SHOWCASE_FOCUS === '1',
    height: parseDimension(environment.JARVIS_SMOKE_HEIGHT, 800, 640),
    presenceVariant: parsePresenceVariant(environment.JARVIS_PRESENCE_VARIANT),
    reducedMotion: environment.JARVIS_SHOWCASE_REDUCED_MOTION === '1',
    route: parseRoute(environment.JARVIS_EVIDENCE_ROUTE),
    settingsState: parseSettingsState(environment.JARVIS_SETTINGS_STATE),
    voiceState: parseVoiceState(environment.JARVIS_VOICE_STATE),
    width: parseDimension(environment.JARVIS_SMOKE_WIDTH, 1280, 1024),
    zoomFactor: parseZoomFactor(environment.JARVIS_EVIDENCE_ZOOM),
  };
}

export function createShowcaseHash(options: ShowcaseEvidenceOptions): string {
  const parameters = new URLSearchParams();

  if (options.route === 'presence') {
    parameters.set('variant', options.presenceVariant);
    if (options.voiceState !== 'live') {
      parameters.set('voice', options.voiceState);
    }
  }
  if (options.route === 'conversation') {
    parameters.set('exploration', options.conversationScenario);
    if (options.conversationState !== 'normal') {
      parameters.set('state', options.conversationState);
    }
    if (options.voiceState !== 'live') {
      parameters.set('voice', options.voiceState);
    }
  }
  if (options.route === 'settings') {
    parameters.set('state', options.settingsState);
  }
  if (options.dialogOpen && options.route === 'design-system') {
    parameters.set('dialog', 'open');
  }
  if (options.focusTarget) {
    parameters.set(
      'focus',
      options.route === 'presence'
        ? 'voice'
        : options.route === 'conversation'
          ? 'composer'
          : 'button',
    );
  }
  if (options.reducedMotion) {
    parameters.set('motion', 'reduced');
  }

  const query = parameters.toString();
  return `/${options.route}${query ? `?${query}` : ''}`;
}
