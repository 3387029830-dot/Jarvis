import type {
  ConversationScenario,
  ConversationSource,
  ConversationState,
  ConversationTurn,
  VoiceTimelineSnapshot,
} from './types';

export type ConversationAction =
  | { readonly type: 'reset'; readonly state: ConversationState }
  | {
      readonly type: 'submit';
      readonly content: string;
      readonly createdAt: string;
      readonly responseId: string;
      readonly sessionId: number;
      readonly source: ConversationSource;
      readonly responseIsMock?: boolean;
      readonly transcriptionEdited?: boolean;
      readonly userId: string;
    }
  | { readonly type: 'response-chunk'; readonly chunk: string; readonly sessionId: number }
  | { readonly type: 'response-complete'; readonly sessionId: number }
  | { readonly type: 'response-cancelled'; readonly sessionId: number }
  | {
      readonly type: 'response-failed';
      readonly error?: import('../../../shared/provider').ProviderError;
      readonly sessionId: number;
    }
  | {
      readonly type: 'retry';
      readonly responseId: string;
      readonly sessionId: number;
    }
  | { readonly type: 'voice-snapshot'; readonly snapshot: VoiceTimelineSnapshot };

export function createInitialConversationState(
  scenario: ConversationScenario,
  offline = false,
): ConversationState {
  return {
    activeResponseId: null,
    lastTextSessionId: 0,
    lastVoiceSessionId: 0,
    offline,
    scenarioId: scenario.id,
    turns: scenario.turns,
  };
}

function updateActiveTurn(
  state: ConversationState,
  status: ConversationTurn['status'],
  content?: string,
): ConversationState {
  if (!state.activeResponseId) {
    return state;
  }
  return {
    ...state,
    activeResponseId: status === 'streaming' ? state.activeResponseId : null,
    turns: state.turns.map((turn) =>
      turn.id === state.activeResponseId
        ? { ...turn, ...(content === undefined ? {} : { content }), status }
        : turn,
    ),
  };
}

function syncVoiceSnapshot(
  state: ConversationState,
  snapshot: VoiceTimelineSnapshot,
): ConversationState {
  if (!snapshot.transcript || snapshot.sessionId < state.lastVoiceSessionId) {
    return state;
  }
  const userId = `voice-${snapshot.sessionId}-user`;
  const responseId = `voice-${snapshot.sessionId}-jarvis`;
  const existingUser = state.turns.some((turn) => turn.id === userId);
  const existingResponse = state.turns.some((turn) => turn.id === responseId);
  const responseStatus: ConversationTurn['status'] =
    snapshot.phase === 'error'
      ? 'failed'
      : snapshot.phase === 'cancelled'
        ? 'cancelled'
        : snapshot.phase === 'speaking' || (snapshot.phase === 'idle' && snapshot.response)
          ? 'complete'
          : 'streaming';
  const turns = [...state.turns];
  if (!existingUser) {
    turns.push({
      content: snapshot.transcript,
      createdAt: '2026-07-30T04:30:00.000Z',
      id: userId,
      isMock: true,
      role: 'user',
      source: 'voice',
      status: 'complete',
    });
  }
  if (snapshot.response && !existingResponse) {
    turns.push({
      content: snapshot.response,
      createdAt: '2026-07-30T04:30:18.000Z',
      id: responseId,
      isMock: true,
      role: 'jarvis',
      source: 'voice',
      status: responseStatus,
    });
  }
  return {
    ...state,
    lastVoiceSessionId: snapshot.sessionId,
    turns: turns.map((turn) =>
      turn.id === responseId
        ? { ...turn, content: snapshot.response || turn.content, status: responseStatus }
        : turn,
    ),
  };
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case 'reset':
      return action.state;
    case 'submit': {
      if (action.sessionId <= state.lastTextSessionId) {
        return state;
      }
      return {
        ...state,
        activeResponseId: action.responseId,
        lastTextSessionId: action.sessionId,
        turns: [
          ...state.turns,
          {
            content: action.content,
            createdAt: action.createdAt,
            id: action.userId,
            isMock: false,
            role: 'user',
            source: action.source,
            status: 'complete',
            ...(action.transcriptionEdited === undefined
              ? {}
              : { transcriptionEdited: action.transcriptionEdited }),
          },
          {
            content: '',
            createdAt: action.createdAt,
            id: action.responseId,
            isMock: action.responseIsMock ?? true,
            role: 'jarvis',
            source: action.source,
            status: 'streaming',
          },
        ],
      };
    }
    case 'response-chunk':
      if (action.sessionId !== state.lastTextSessionId || !state.activeResponseId) {
        return state;
      }
      return updateActiveTurn(
        state,
        'streaming',
        `${state.turns.find((turn) => turn.id === state.activeResponseId)?.content ?? ''}${action.chunk}`,
      );
    case 'response-complete':
      return action.sessionId === state.lastTextSessionId
        ? updateActiveTurn(state, 'complete')
        : state;
    case 'response-cancelled':
      return action.sessionId === state.lastTextSessionId
        ? updateActiveTurn(state, 'cancelled')
        : state;
    case 'response-failed':
      if (action.sessionId !== state.lastTextSessionId || !state.activeResponseId) {
        return state;
      }
      return {
        ...updateActiveTurn(state, 'failed'),
        turns: state.turns.map((turn) =>
          turn.id === state.activeResponseId
            ? {
                ...turn,
                ...(action.error === undefined ? {} : { providerError: action.error }),
                status: 'failed',
              }
            : turn,
        ),
      };
    case 'retry':
      if (action.sessionId <= state.lastTextSessionId) {
        return state;
      }
      return {
        ...state,
        activeResponseId: action.responseId,
        lastTextSessionId: action.sessionId,
        turns: state.turns.map((turn) => {
          if (turn.id !== action.responseId) {
            return turn;
          }
          const { providerError: omittedProviderError, ...rest } = turn;
          void omittedProviderError;
          return { ...rest, content: '', status: 'streaming' };
        }),
      };
    case 'voice-snapshot':
      return syncVoiceSnapshot(state, action.snapshot);
  }
}
