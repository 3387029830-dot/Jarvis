export type ConversationEvidenceState = 'error' | 'normal' | 'offline' | 'streaming';

export interface ConversationOptions {
  readonly evidence: ConversationEvidenceState;
  readonly focusComposer: boolean;
  readonly reducedMotion: boolean;
  readonly voiceEvidence: VoiceEvidenceState | null;
}

export function parseConversationOptions(hash: string): ConversationOptions {
  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex < 0 ? '' : hash.slice(queryIndex + 1));
  const state = params.get('state');
  return {
    evidence: state === 'error' || state === 'offline' || state === 'streaming' ? state : 'normal',
    focusComposer: params.get('focus') === 'composer',
    reducedMotion: params.get('motion') === 'reduced',
    voiceEvidence: parseVoiceEvidenceState(params.get('voice')),
  };
}
import { parseVoiceEvidenceState, type VoiceEvidenceState } from '../voice/voice-evidence';
