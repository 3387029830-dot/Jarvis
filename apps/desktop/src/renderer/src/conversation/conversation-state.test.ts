import { describe, expect, it } from 'vitest';

import { defaultConversationScenario } from './conversation-data';
import {
  conversationReducer,
  createInitialConversationState,
  type ConversationAction,
} from './conversation-state';

function reduce(actions: readonly ConversationAction[]) {
  return actions.reduce(
    conversationReducer,
    createInitialConversationState(defaultConversationScenario),
  );
}

describe('conversationReducer', () => {
  it('keeps text and voice turns in one typed timeline', () => {
    const state = reduce([
      {
        content: '我想继续理解群体判断。',
        createdAt: '2026-07-30T04:40:00.000Z',
        responseId: 'text-1-jarvis',
        sessionId: 1,
        source: 'text',
        type: 'submit',
        userId: 'text-1-user',
      },
      {
        snapshot: {
          phase: 'responding_text',
          response: '这是一段语音 Mock 回答。',
          sessionId: 8,
          transcript: '这是一段模拟转录。',
        },
        type: 'voice-snapshot',
      },
    ]);

    expect(state.turns.some((turn) => turn.source === 'text')).toBe(true);
    expect(state.turns.some((turn) => turn.source === 'voice')).toBe(true);
    expect(state.turns.find((turn) => turn.id === 'voice-8-user')?.isMock).toBe(true);
  });

  it('streams deterministically and ignores stale session chunks', () => {
    const submitted = reduce([
      {
        content: '继续',
        createdAt: '2026-07-30T04:40:00.000Z',
        responseId: 'response',
        sessionId: 2,
        source: 'text',
        type: 'submit',
        userId: 'user',
      },
    ]);
    const stale = conversationReducer(submitted, {
      chunk: '不应出现',
      sessionId: 1,
      type: 'response-chunk',
    });
    const streamed = conversationReducer(stale, {
      chunk: '第一段',
      sessionId: 2,
      type: 'response-chunk',
    });
    const completed = conversationReducer(streamed, {
      sessionId: 2,
      type: 'response-complete',
    });

    expect(completed.turns.find((turn) => turn.id === 'response')?.content).toBe('第一段');
    expect(completed.turns.find((turn) => turn.id === 'response')?.status).toBe('complete');
  });

  it('cancels partial output and retries without duplicating the user turn', () => {
    const submitted = reduce([
      {
        content: '同一个问题',
        createdAt: '2026-07-30T04:40:00.000Z',
        responseId: 'response',
        sessionId: 2,
        source: 'text',
        type: 'submit',
        userId: 'user',
      },
      { chunk: '已经显示的部分', sessionId: 2, type: 'response-chunk' },
      { sessionId: 2, type: 'response-failed' },
      { responseId: 'response', sessionId: 3, type: 'retry' },
    ]);

    expect(
      submitted.turns.filter((turn) => turn.role === 'user' && turn.id === 'user'),
    ).toHaveLength(1);
    expect(submitted.turns.find((turn) => turn.id === 'response')).toMatchObject({
      content: '',
      status: 'streaming',
    });
  });

  it('retains partial content when cancelled', () => {
    const state = reduce([
      {
        content: '问题',
        createdAt: '2026-07-30T04:40:00.000Z',
        responseId: 'response',
        sessionId: 2,
        source: 'text',
        type: 'submit',
        userId: 'user',
      },
      { chunk: '保留这一段', sessionId: 2, type: 'response-chunk' },
      { sessionId: 2, type: 'response-cancelled' },
    ]);
    expect(state.turns.find((turn) => turn.id === 'response')).toMatchObject({
      content: '保留这一段',
      status: 'cancelled',
    });
  });
});
