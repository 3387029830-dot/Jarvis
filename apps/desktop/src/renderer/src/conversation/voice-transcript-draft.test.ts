import { describe, expect, it } from 'vitest';

import {
  resolveVoiceTranscriptDraft,
  stageVoiceTranscript,
  wasTranscriptionEdited,
} from './voice-transcript-draft';

describe('voice transcript draft protection', () => {
  it('stages directly into an empty composer without auto-sending', () => {
    expect(stageVoiceTranscript('', '语音转录', 7)).toEqual({
      draft: '语音转录',
      pending: {
        originalDraft: '',
        resolution: 'direct',
        sessionId: 7,
        transcript: '语音转录',
      },
    });
  });

  it('preserves an existing draft until replace or append is explicit', () => {
    const staged = stageVoiceTranscript('原本正在编辑的草稿', '新的语音转录', 8);
    expect(staged.draft).toBe('原本正在编辑的草稿');
    expect(staged.pending.resolution).toBe('pending');
    expect(resolveVoiceTranscriptDraft(staged.pending, 'replace')).toBe('新的语音转录');
    expect(resolveVoiceTranscriptDraft(staged.pending, 'append')).toBe(
      '原本正在编辑的草稿\n新的语音转录',
    );
  });

  it('records whether the confirmed transcript was edited', () => {
    expect(wasTranscriptionEdited('原始转录', '原始转录')).toBe(false);
    expect(wasTranscriptionEdited('原始转录，已修正', '原始转录')).toBe(true);
  });
});
