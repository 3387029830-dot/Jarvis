import { describe, expect, it } from 'vitest';

import { initialVoiceState, voiceReducer } from './voice-state';

function listeningState() {
  let state = voiceReducer(initialVoiceState, { sessionId: 1, type: 'begin-session' });
  state = voiceReducer(state, { sessionId: 1, type: 'permission-granted' });
  return voiceReducer(state, { sessionId: 1, type: 'listening-started' });
}

describe('voiceReducer', () => {
  it('runs the canonical happy path and keeps the current round on completion', () => {
    let state = listeningState();
    state = voiceReducer(state, {
      durationMs: 800,
      level: 0.5,
      sessionId: 1,
      type: 'capture-sample',
    });
    state = voiceReducer(state, { sessionId: 1, type: 'listening-finished' });
    state = voiceReducer(state, {
      sessionId: 1,
      transcript: '模拟转录',
      type: 'transcript-ready',
    });
    state = voiceReducer(state, { sessionId: 1, type: 'understanding-finished' });
    state = voiceReducer(state, { chunk: '回答', sessionId: 1, type: 'response-chunk' });
    state = voiceReducer(state, { sessionId: 1, type: 'speaking-started' });
    state = voiceReducer(state, { sessionId: 1, type: 'completed' });

    expect(state).toMatchObject({
      phase: 'idle',
      response: '回答',
      transcript: '模拟转录',
    });
  });

  it.each(['listening', 'transcribing', 'understanding', 'responding_text'] as const)(
    'cancels safely from %s',
    (phase) => {
      let state = listeningState();
      if (phase !== 'listening') {
        state = voiceReducer(state, { sessionId: 1, type: 'listening-finished' });
      }
      if (phase === 'understanding' || phase === 'responding_text') {
        state = voiceReducer(state, {
          sessionId: 1,
          transcript: '模拟转录',
          type: 'transcript-ready',
        });
      }
      if (phase === 'responding_text') {
        state = voiceReducer(state, { sessionId: 1, type: 'understanding-finished' });
      }

      state = voiceReducer(state, { sessionId: 1, type: 'cancelled' });
      expect(state.phase).toBe('cancelled');
      expect(state.isPressing).toBe(false);
    },
  );

  it('interrupts speaking and recovers from an error', () => {
    let state = listeningState();
    state = voiceReducer(state, { sessionId: 1, type: 'listening-finished' });
    state = voiceReducer(state, {
      sessionId: 1,
      transcript: '模拟转录',
      type: 'transcript-ready',
    });
    state = voiceReducer(state, { sessionId: 1, type: 'understanding-finished' });
    state = voiceReducer(state, { sessionId: 1, type: 'speaking-started' });
    state = voiceReducer(state, { sessionId: 1, type: 'interrupted' });
    expect(state.phase).toBe('interrupted');

    state = voiceReducer(state, { sessionId: 2, type: 'begin-session' });
    state = voiceReducer(state, {
      error: { code: 'permission-denied', message: '无权限' },
      permission: 'denied',
      sessionId: 2,
      type: 'permission-failed',
    });
    expect(state.phase).toBe('error');
    expect(voiceReducer(state, { type: 'recover' }).phase).toBe('idle');
  });

  it('ignores stale sessions and illegal transitions', () => {
    const state = listeningState();
    expect(voiceReducer(state, { chunk: '旧回答', sessionId: 0, type: 'response-chunk' })).toBe(
      state,
    );
    expect(voiceReducer(state, { sessionId: 1, type: 'speaking-started' })).toBe(state);
  });
});
