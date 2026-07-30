import { describe, expect, it } from 'vitest';

import { copy, productCopy } from '.';

describe('Simplified Chinese product copy', () => {
  it('provides a complete default locale catalog', () => {
    expect(Object.keys(productCopy)).toEqual(['zh-CN']);
    expect(copy.navigation.current).toBe('此刻');
    expect(copy.presence.voiceAction).toBe('按住说话');
  });

  it('states unfinished behavior honestly', () => {
    expect(copy.presence.voiceDisclosure).toContain('当前不会录音');
    expect(copy.presence.localMockDisclosure).toContain('Mock');
    expect(copy.navigation.unavailable).toBe('后续开放');
  });
});
