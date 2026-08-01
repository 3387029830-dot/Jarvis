import { describe, expect, it } from 'vitest';

import { parseConversationOptions } from './conversation-options';

describe('parseConversationOptions', () => {
  it('parses deterministic evidence without turning it into product settings', () => {
    expect(
      parseConversationOptions(
        '#/conversation?state=offline&voice=listening&focus=composer&motion=reduced',
      ),
    ).toEqual({
      evidence: 'offline',
      focusComposer: true,
      reducedMotion: true,
      ttsEvidence: null,
      voiceEvidence: 'listening',
    });
  });

  it('falls back safely for unknown values', () => {
    expect(parseConversationOptions('#/conversation?state=unknown').evidence).toBe('normal');
  });
});
