import { describe, expect, it } from 'vitest';

import { buildConversationMessages } from './prompt';

describe('buildConversationMessages', () => {
  it('adds Jarvis principles, exploration context and only recent turns', () => {
    const messages = buildConversationMessages(
      {
        domains: ['经济学', '心理学'],
        exploration: '不确定性如何改变判断？',
        recentMessages: Array.from({ length: 10 }, (_, index) => ({
          content: `turn-${index}`,
          role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
        })),
      },
      '请继续。',
    );
    expect(messages[0]?.content).toContain('简体中文');
    expect(messages[0]?.content).toContain('不要展示隐藏推理过程');
    expect(messages[1]?.content).toContain('不确定性如何改变判断');
    expect(messages).toHaveLength(11);
    expect(messages[2]?.content).toBe('turn-2');
    expect(messages.at(-1)).toEqual({ content: '请继续。', role: 'user' });
  });
});
