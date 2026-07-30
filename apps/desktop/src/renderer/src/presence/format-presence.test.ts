import { describe, expect, it } from 'vitest';

import { formatPresenceCount, formatPresenceTimestamp } from './format-presence';

describe('zh-CN Presence formatting', () => {
  it('formats dates and numbers through Intl zh-CN', () => {
    expect(formatPresenceTimestamp('2026-07-30T08:20:00.000Z')).toBe('7月30日 16:20');
    expect(formatPresenceCount(12800)).toBe('12,800');
  });
});
