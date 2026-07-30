import type { VoicePhase } from '../voice/voice-state';
import type { ProviderError } from '../../../shared/provider';

export type ConversationSource = 'text' | 'voice';
export type ConversationTurnStatus = 'cancelled' | 'complete' | 'failed' | 'streaming';

export interface DomainReference {
  readonly domain: string;
  readonly concepts: readonly string[];
  readonly reflection: string;
}

export interface ConversationTurn {
  readonly content: string;
  readonly createdAt: string;
  readonly id: string;
  readonly isMock: boolean;
  readonly providerError?: ProviderError;
  readonly relatedDomains?: readonly DomainReference[];
  readonly role: 'jarvis' | 'user';
  readonly source: ConversationSource;
  readonly status: ConversationTurnStatus;
}

export interface ConversationScenario {
  readonly domains: readonly string[];
  readonly id: string;
  readonly intersections: readonly DomainReference[];
  readonly responseChunks: readonly string[];
  readonly title: string;
  readonly turns: readonly ConversationTurn[];
}

export interface ConversationState {
  readonly activeResponseId: string | null;
  readonly lastTextSessionId: number;
  readonly lastVoiceSessionId: number;
  readonly offline: boolean;
  readonly scenarioId: string;
  readonly turns: readonly ConversationTurn[];
}

export interface VoiceTimelineSnapshot {
  readonly phase: VoicePhase;
  readonly response: string;
  readonly sessionId: number;
  readonly transcript: string;
}
