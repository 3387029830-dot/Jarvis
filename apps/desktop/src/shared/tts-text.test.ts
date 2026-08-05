import { describe, expect, it } from 'vitest';
import { normalizeTextForSpeech, segmentTextForSpeech } from './tts-text';

describe('TTS text preparation', () => {
  it('removes visual-only Markdown and preserves readable mixed Chinese content', () => {
    expect(
      normalizeTextForSpeech('## 判断 **风险**，见 [来源](https://example.com) 与 `API`。'),
    ).toBe('判断 风险，见 来源 与 API。');
  });
  it('segments deterministically at Chinese semantic boundaries', () => {
    expect(segmentTextForSpeech('第一层判断。第二层证据！第三层仍需观察？')).toEqual([
      '第一层判断。',
      '第二层证据！',
      '第三层仍需观察？',
    ]);
  });
  it('splits an oversized sentence without losing content', () => {
    const text = '认知'.repeat(100);
    expect(segmentTextForSpeech(text, 40).join('')).toBe(text);
    expect(segmentTextForSpeech(text, 40)).toHaveLength(5);
  });
  it('handles URLs, code blocks, numbers, acronyms, short and empty text', () => {
    expect(
      normalizeTextForSpeech('GDP 3.5%，访问 https://example.com。```ts\nconst x = 1\n```'),
    ).toBe('GDP 3.5%，访问 链接 代码片段');
    expect(segmentTextForSpeech('好。')).toEqual(['好。']);
    expect(segmentTextForSpeech('   ')).toEqual([]);
  });
});
