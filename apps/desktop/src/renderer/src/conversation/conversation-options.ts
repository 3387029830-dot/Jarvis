export type ConversationEvidenceState =
  | 'error'
  | 'normal'
  | 'offline'
  | 'provider-offline'
  | 'real-cancelled'
  | 'real-complete'
  | 'real-streaming'
  | 'streaming';

export interface ConversationOptions {
  readonly evidence: ConversationEvidenceState;
  readonly focusComposer: boolean;
  readonly reducedMotion: boolean;
  readonly voiceEvidence: VoiceEvidenceState | null;
  readonly ttsEvidence: 'preparing' | 'playing' | 'stopped' | 'error' | null;
}

export function parseConversationOptions(hash: string): ConversationOptions {
  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex < 0 ? '' : hash.slice(queryIndex + 1));
  const state = params.get('state');
  return {
    evidence:
      state === 'error' ||
      state === 'offline' ||
      state === 'provider-offline' ||
      state === 'real-cancelled' ||
      state === 'real-complete' ||
      state === 'real-streaming' ||
      state === 'streaming'
        ? state
        : 'normal',
    focusComposer: params.get('focus') === 'composer',
    reducedMotion: params.get('motion') === 'reduced',
    voiceEvidence: parseVoiceEvidenceState(params.get('voice')),
    ttsEvidence:
      params.get('tts') === 'preparing' ||
      params.get('tts') === 'playing' ||
      params.get('tts') === 'stopped' ||
      params.get('tts') === 'error'
        ? (params.get('tts') as 'preparing' | 'playing' | 'stopped' | 'error')
        : null,
  };
}
import { parseVoiceEvidenceState, type VoiceEvidenceState } from '../voice/voice-evidence';
