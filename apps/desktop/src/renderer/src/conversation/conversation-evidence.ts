import { createInitialConversationState } from './conversation-state';
import type { ConversationEvidenceState } from './conversation-options';
import type { ConversationScenario, ConversationState } from './types';

export function createConversationEvidenceState(
  scenario: ConversationScenario,
  evidence: ConversationEvidenceState,
): ConversationState {
  const initial = createInitialConversationState(scenario, evidence === 'offline');
  if (evidence === 'normal' || evidence === 'offline') {
    return initial;
  }
  const userId = `evidence-${evidence}-user`;
  const responseId = `evidence-${evidence}-jarvis`;
  return {
    ...initial,
    activeResponseId: evidence === 'streaming' ? responseId : null,
    lastTextSessionId: 1,
    turns: [
      ...initial.turns,
      {
        content: '如果每个人都只是在观察别人，群体最初的方向是怎样形成的？',
        createdAt: '2026-07-30T04:35:00.000Z',
        id: userId,
        isMock: false,
        role: 'user',
        source: 'text',
        status: 'complete',
      },
      {
        content:
          evidence === 'streaming'
            ? `${scenario.responseChunks[0]}\n\n${scenario.responseChunks[1]}`
            : '本地 Mock 回答没有完成。你的问题仍然保留，可以从同一条表达重新尝试。',
        createdAt: '2026-07-30T04:35:12.000Z',
        id: responseId,
        isMock: true,
        role: 'jarvis',
        source: 'text',
        status: evidence === 'streaming' ? 'streaming' : 'failed',
      },
    ],
  };
}
