import { useCallback, useEffect, useReducer, useRef } from 'react';

import { createConversationEvidenceState } from './conversation-evidence';
import type { ConversationEvidenceState } from './conversation-options';
import { conversationReducer } from './conversation-state';
import type { ConversationScenario, ConversationState, VoiceTimelineSnapshot } from './types';

const STREAM_DELAY_MS = 260;

export interface ConversationSessionBinding {
  readonly cancel: () => void;
  readonly retry: () => void;
  readonly state: ConversationState;
  readonly submitText: (content: string) => void;
  readonly syncVoice: (snapshot: VoiceTimelineSnapshot) => void;
}

export function useConversationSession(
  scenario: ConversationScenario,
  evidence: ConversationEvidenceState,
): ConversationSessionBinding {
  const [state, dispatch] = useReducer(conversationReducer, undefined, () =>
    createConversationEvidenceState(scenario, evidence),
  );
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(1);

  useEffect(() => {
    abortRef.current?.abort();
    dispatch({ state: createConversationEvidenceState(scenario, evidence), type: 'reset' });
  }, [evidence, scenario]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const stream = useCallback(
    async (sessionId: number): Promise<void> => {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;
      try {
        for (const chunk of scenario.responseChunks) {
          await new Promise<void>((resolve, reject) => {
            const timer = window.setTimeout(resolve, STREAM_DELAY_MS);
            abortController.signal.addEventListener(
              'abort',
              () => {
                window.clearTimeout(timer);
                reject(new DOMException('Conversation stream cancelled.', 'AbortError'));
              },
              { once: true },
            );
          });
          dispatch({ chunk, sessionId, type: 'response-chunk' });
        }
        dispatch({ sessionId, type: 'response-complete' });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          dispatch({ sessionId, type: 'response-failed' });
        }
      } finally {
        if (abortRef.current === abortController) {
          abortRef.current = null;
        }
      }
    },
    [scenario.responseChunks],
  );

  const submitText = useCallback(
    (rawContent: string): void => {
      const content = rawContent.trim();
      if (!content) {
        return;
      }
      const sessionId = ++sessionRef.current;
      dispatch({
        content,
        createdAt: '2026-07-30T04:40:00.000Z',
        responseId: `text-${sessionId}-jarvis`,
        sessionId,
        source: 'text',
        type: 'submit',
        userId: `text-${sessionId}-user`,
      });
      void stream(sessionId);
    },
    [stream],
  );

  const cancel = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ sessionId: state.lastTextSessionId, type: 'response-cancelled' });
  }, [state.lastTextSessionId]);

  const retry = useCallback((): void => {
    const failed = [...state.turns].reverse().find((turn) => turn.status === 'failed');
    if (!failed) {
      return;
    }
    const sessionId = ++sessionRef.current;
    dispatch({ responseId: failed.id, sessionId, type: 'retry' });
    void stream(sessionId);
  }, [state.turns, stream]);

  const syncVoice = useCallback((snapshot: VoiceTimelineSnapshot): void => {
    dispatch({ snapshot, type: 'voice-snapshot' });
  }, []);

  return { cancel, retry, state, submitText, syncVoice };
}
