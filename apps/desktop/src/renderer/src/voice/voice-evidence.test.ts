import { describe, expect, it } from 'vitest';

import { createVoiceEvidenceState, parseVoiceEvidenceState } from './voice-evidence';

describe('voice evidence state', () => {
  it('parses only supported deterministic states', () => {
    expect(parseVoiceEvidenceState('listening')).toBe('listening');
    expect(parseVoiceEvidenceState('unknown')).toBeNull();
  });

  it('builds honest listening and denied snapshots', () => {
    expect(createVoiceEvidenceState('listening')).toMatchObject({
      phase: 'listening',
      permission: 'granted',
    });
    expect(createVoiceEvidenceState('permission-denied')).toMatchObject({
      phase: 'error',
      permission: 'denied',
    });
  });
});
