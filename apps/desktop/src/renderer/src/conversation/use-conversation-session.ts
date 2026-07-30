import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { ConversationStreamEvent, ProviderPublicConfig } from '../../../shared/provider';
import { createConversationEvidenceState } from './conversation-evidence';
import type { ConversationEvidenceState } from './conversation-options';
import { conversationReducer } from './conversation-state';
import type { ConversationScenario, ConversationState, VoiceTimelineSnapshot } from './types';

const STREAM_DELAY_MS = 260;
const mockProviderConfig: ProviderPublicConfig = {
  baseUrl: '',
  hasCredential: false,
  keySuffix: null,
  lastTestedAt: null,
  mode: 'mock',
  model: '',
};

export interface ConversationSessionBinding {
  readonly cancel: () => void;
  readonly retry: () => void;
  readonly state: ConversationState;
  readonly providerConfig: ProviderPublicConfig | null;
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
  const activeRequestRef = useRef<string | null>(null);
  const requestSessionsRef = useRef(new Map<string, number>());
  const sessionRef = useRef(1);
  const evidenceIsReal = evidence.startsWith('real-') || evidence === 'provider-offline';
  const [providerConfig, setProviderConfig] = useState<ProviderPublicConfig | null>(() =>
    evidenceIsReal
      ? {
          baseUrl: 'https://provider.example/v1',
          hasCredential: true,
          keySuffix: '2468',
          lastTestedAt: '2026-07-30T08:00:00.000Z',
          mode: 'real',
          model: 'evidence-model',
        }
      : mockProviderConfig,
  );

  useEffect(() => {
    abortRef.current?.abort();
    if (activeRequestRef.current) {
      void window.jarvis?.conversation.cancel(activeRequestRef.current);
      activeRequestRef.current = null;
    }
    dispatch({ state: createConversationEvidenceState(scenario, evidence), type: 'reset' });
  }, [evidence, scenario]);

  useEffect(() => {
    let mounted = true;
    if (evidenceIsReal) {
      return;
    }
    if (!window.jarvis?.provider) {
      return;
    }
    void window.jarvis.provider.getConfig().then((config) => {
      if (mounted) {
        setProviderConfig(config);
      }
    });
    return () => {
      mounted = false;
    };
  }, [evidenceIsReal]);

  useEffect(() => {
    if (!window.jarvis?.conversation) {
      return;
    }
    const handleEvent = (event: ConversationStreamEvent): void => {
      const sessionId = requestSessionsRef.current.get(event.requestId);
      if (sessionId === undefined) {
        return;
      }
      if (event.type === 'delta') {
        dispatch({ chunk: event.content, sessionId, type: 'response-chunk' });
      } else if (event.type === 'complete') {
        dispatch({ sessionId, type: 'response-complete' });
        requestSessionsRef.current.delete(event.requestId);
        if (activeRequestRef.current === event.requestId) {
          activeRequestRef.current = null;
        }
      } else if (event.type === 'error') {
        if (event.error.code !== 'cancelled') {
          dispatch({ error: event.error, sessionId, type: 'response-failed' });
        }
        requestSessionsRef.current.delete(event.requestId);
        if (activeRequestRef.current === event.requestId) {
          activeRequestRef.current = null;
        }
      }
    };
    return window.jarvis.conversation.onEvent(handleEvent);
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (activeRequestRef.current) {
        void window.jarvis?.conversation.cancel(activeRequestRef.current);
      }
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

  const startRealStream = useCallback(
    async (
      content: string,
      responseId: string,
      sessionId: number,
      turns: ConversationState['turns'],
    ): Promise<void> => {
      if (!window.jarvis?.conversation) {
        dispatch({
          error: {
            code: 'network',
            message: '真实 Provider bridge 当前不可用。',
            providerId: 'openai-compatible',
            requestId: responseId,
            retryable: true,
            safeTechnicalSummary: 'preload_bridge_unavailable',
          },
          sessionId,
          type: 'response-failed',
        });
        return;
      }
      activeRequestRef.current = responseId;
      requestSessionsRef.current.set(responseId, sessionId);
      const result = await window.jarvis.conversation.start({
        context: {
          domains: scenario.domains,
          exploration: scenario.title,
          recentMessages: turns
            .filter((turn) => turn.status === 'complete' && turn.content.trim())
            .slice(-8)
            .map((turn) => ({
              content: turn.content,
              role: turn.role === 'jarvis' ? 'assistant' : 'user',
            })),
        },
        requestId: responseId,
        userMessage: content,
      });
      if (!result.ok) {
        requestSessionsRef.current.delete(responseId);
        activeRequestRef.current = null;
        dispatch({ error: result.error, sessionId, type: 'response-failed' });
      }
    },
    [scenario.domains, scenario.title],
  );

  const submitText = useCallback(
    (rawContent: string): void => {
      const content = rawContent.trim();
      if (
        !content ||
        state.activeResponseId !== null ||
        abortRef.current !== null ||
        activeRequestRef.current !== null
      ) {
        return;
      }
      const sessionId = ++sessionRef.current;
      const responseId = `text-${sessionId}-jarvis`;
      dispatch({
        content,
        createdAt: new Date().toISOString(),
        responseId,
        responseIsMock: providerConfig?.mode !== 'real',
        sessionId,
        source: 'text',
        type: 'submit',
        userId: `text-${sessionId}-user`,
      });
      if (providerConfig?.mode === 'real') {
        void startRealStream(content, responseId, sessionId, state.turns);
      } else {
        void stream(sessionId);
      }
    },
    [providerConfig?.mode, startRealStream, state.activeResponseId, state.turns, stream],
  );

  const cancel = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (activeRequestRef.current) {
      void window.jarvis?.conversation.cancel(activeRequestRef.current);
      requestSessionsRef.current.delete(activeRequestRef.current);
      activeRequestRef.current = null;
    }
    dispatch({ sessionId: state.lastTextSessionId, type: 'response-cancelled' });
  }, [state.lastTextSessionId]);

  const retry = useCallback((): void => {
    const failed = [...state.turns].reverse().find((turn) => turn.status === 'failed');
    if (!failed) {
      return;
    }
    const sessionId = ++sessionRef.current;
    dispatch({ responseId: failed.id, sessionId, type: 'retry' });
    if (providerConfig?.mode === 'real' && !failed.isMock) {
      const failedIndex = state.turns.findIndex((turn) => turn.id === failed.id);
      const userTurn = [...state.turns.slice(0, failedIndex)]
        .reverse()
        .find((turn) => turn.role === 'user');
      if (userTurn) {
        void startRealStream(userTurn.content, failed.id, sessionId, state.turns);
        return;
      }
    }
    void stream(sessionId);
  }, [providerConfig?.mode, startRealStream, state.turns, stream]);

  const syncVoice = useCallback((snapshot: VoiceTimelineSnapshot): void => {
    dispatch({ snapshot, type: 'voice-snapshot' });
  }, []);

  return { cancel, providerConfig, retry, state, submitText, syncVoice };
}
