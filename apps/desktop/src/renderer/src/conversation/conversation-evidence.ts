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
  const isReal = evidence.startsWith('real-') || evidence === 'provider-offline';
  const status =
    evidence === 'real-complete'
      ? 'complete'
      : evidence === 'real-cancelled'
        ? 'cancelled'
        : evidence === 'provider-offline' || evidence === 'error'
          ? 'failed'
          : 'streaming';
  const userId = `evidence-${evidence}-user`;
  const responseId = `evidence-${evidence}-jarvis`;
  return {
    ...initial,
    activeResponseId: status === 'streaming' ? responseId : null,
    lastTextSessionId: 1,
    turns: [
      ...(isReal ? [] : initial.turns),
      ...(evidence === 'provider-offline'
        ? []
        : [
            {
              content: '如果每个人都只是在观察别人，群体最初的方向是怎样形成的？',
              createdAt: '2026-07-30T04:35:00.000Z',
              id: userId,
              isMock: false,
              role: 'user' as const,
              source: 'text' as const,
              status: 'complete' as const,
            },
          ]),
      {
        content:
          status === 'streaming'
            ? '不确定性会让人更依赖可见的社会线索，但这并不等于放弃独立判断。'
            : status === 'complete'
              ? '不确定性会提高独立判断的成本，因此群体选择既可能被当作信息，也可能成为分担责任的方式。值得区分的是：你借用的是他人的证据，还是他人的确定感？'
              : status === 'cancelled'
                ? '不确定性会提高独立判断的成本，因此我们会更留意他人的选择。'
                : evidence === 'provider-offline'
                  ? '你的问题已经保留在当前讨论中，没有切换为 Mock 回答。'
                  : '',
        createdAt: '2026-07-30T04:35:12.000Z',
        id: responseId,
        isMock: !isReal,
        ...(evidence === 'provider-offline'
          ? {
              providerError: {
                code: 'network' as const,
                message: '无法连接到 Provider，请检查网络和服务地址。',
                providerId: 'openai-compatible' as const,
                requestId: responseId,
                retryable: true,
                safeTechnicalSummary: 'evidence_network_unavailable',
              },
            }
          : {}),
        role: 'jarvis',
        source: 'text',
        status,
      },
    ],
  };
}
