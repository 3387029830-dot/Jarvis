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

  it('builds deterministic real STT review and error states', () => {
    expect(parseVoiceEvidenceState('real-review')).toBe('real-review');
    expect(createVoiceEvidenceState('real-review')).toMatchObject({
      phase: 'transcribing',
      speechMode: 'real',
      transcriptReview: 'pending',
    });
    expect(createVoiceEvidenceState('real-error')).toMatchObject({
      error: { code: 'transcription-failed' },
      phase: 'error',
      speechMode: 'real',
    });
  });
});
