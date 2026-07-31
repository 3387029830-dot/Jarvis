import { MOCK_VOICE_CONTENT } from './mock-voice-loop';
import { initialVoiceState, type VoiceControllerState } from './voice-state';

export type VoiceEvidenceState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'responding'
  | 'speaking'
  | 'permission-denied'
  | 'real-transcribing'
  | 'real-review'
  | 'real-edited'
  | 'real-error';

export function parseVoiceEvidenceState(value: string | null): VoiceEvidenceState | null {
  return value === 'idle' ||
    value === 'listening' ||
    value === 'transcribing' ||
    value === 'responding' ||
    value === 'speaking' ||
    value === 'permission-denied' ||
    value === 'real-transcribing' ||
    value === 'real-review' ||
    value === 'real-edited' ||
    value === 'real-error'
    ? value
    : null;
}

export function createVoiceEvidenceState(evidence: VoiceEvidenceState): VoiceControllerState {
  const base: VoiceControllerState = {
    ...initialVoiceState,
    permission: evidence === 'idle' ? 'unknown' : 'granted',
    sessionId: 4,
  };
  switch (evidence) {
    case 'idle':
      return base;
    case 'listening':
      return {
        ...base,
        durationMs: 3_840,
        isPressing: true,
        level: 0.64,
        phase: 'listening',
      };
    case 'transcribing':
      return { ...base, durationMs: 3_840, phase: 'transcribing' };
    case 'responding':
      return {
        ...base,
        durationMs: 3_840,
        phase: 'responding_text',
        response: MOCK_VOICE_CONTENT.responseChunks.slice(0, 2).join(''),
        transcript: MOCK_VOICE_CONTENT.transcript,
      };
    case 'speaking':
      return {
        ...base,
        durationMs: 3_840,
        phase: 'speaking',
        response: MOCK_VOICE_CONTENT.responseChunks.join(''),
        transcript: MOCK_VOICE_CONTENT.transcript,
      };
    case 'permission-denied':
      return {
        ...base,
        error: {
          code: 'permission-denied',
          message: 'Jarvis 还不能使用麦克风。你可以在系统设置中允许权限后重试。',
        },
        permission: 'denied',
        phase: 'error',
      };
    case 'real-transcribing':
      return {
        ...base,
        durationMs: 6_420,
        phase: 'transcribing',
        speechMode: 'real',
      };
    case 'real-review':
    case 'real-edited':
      return {
        ...base,
        durationMs: 6_420,
        phase: 'transcribing',
        speechMode: 'real',
        transcript: '我想继续理解，为什么知识增加以后，行动却不一定变得更容易？',
        transcriptOriginal: '我想继续理解，为什么知识增加以后，行动却不一定变得更容易？',
        transcriptReview: 'pending',
      };
    case 'real-error':
      return {
        ...base,
        durationMs: 6_420,
        error: {
          code: 'transcription-failed',
          message: '无法连接到语音识别 Provider，可以重试识别、重新录音或改用文字。',
        },
        phase: 'error',
        speechMode: 'real',
      };
  }
}
