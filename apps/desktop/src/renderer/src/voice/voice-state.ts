export type VoicePhase =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'understanding'
  | 'responding_text'
  | 'speaking'
  | 'interrupted'
  | 'cancelled'
  | 'error';

export type MicrophonePermission = 'unknown' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export type VoiceErrorCode =
  | 'permission-denied'
  | 'no-device'
  | 'unsupported'
  | 'recording-failed'
  | 'too-short'
  | 'playback-failed'
  | 'audio-too-large'
  | 'unsupported-audio-format'
  | 'empty-transcript'
  | 'transcription-failed';

export type VoiceSpeechMode = 'mock' | 'real';
export type TranscriptReviewState = 'none' | 'pending' | 'confirmed';

export interface VoiceError {
  readonly code: VoiceErrorCode;
  readonly message: string;
}

export interface VoiceControllerState {
  readonly durationMs: number;
  readonly error: VoiceError | null;
  readonly isPressing: boolean;
  readonly level: number;
  readonly notice: string | null;
  readonly permission: MicrophonePermission;
  readonly phase: VoicePhase;
  readonly response: string;
  readonly sessionId: number;
  readonly speechMode: VoiceSpeechMode;
  readonly transcript: string;
  readonly transcriptOriginal: string;
  readonly transcriptReview: TranscriptReviewState;
  readonly transcriptionEdited: boolean;
}

export const initialVoiceState: VoiceControllerState = {
  durationMs: 0,
  error: null,
  isPressing: false,
  level: 0,
  notice: null,
  permission: 'unknown',
  phase: 'idle',
  response: '',
  sessionId: 0,
  speechMode: 'mock',
  transcript: '',
  transcriptOriginal: '',
  transcriptReview: 'none',
  transcriptionEdited: false,
};

export type VoiceAction =
  | { readonly type: 'begin-session'; readonly sessionId: number }
  | { readonly type: 'permission-granted'; readonly sessionId: number }
  | {
      readonly type: 'permission-failed';
      readonly error: VoiceError;
      readonly permission: Extract<MicrophonePermission, 'denied' | 'unavailable'>;
      readonly sessionId: number;
    }
  | { readonly type: 'listening-started'; readonly sessionId: number }
  | {
      readonly type: 'capture-sample';
      readonly durationMs: number;
      readonly level: number;
      readonly sessionId: number;
    }
  | {
      readonly type: 'listening-finished';
      readonly notice?: string;
      readonly sessionId: number;
    }
  | {
      readonly type: 'transcript-ready';
      readonly requiresConfirmation?: boolean;
      readonly sessionId: number;
      readonly speechMode?: VoiceSpeechMode;
      readonly transcript: string;
    }
  | {
      readonly type: 'speech-mode-resolved';
      readonly sessionId: number;
      readonly speechMode: VoiceSpeechMode;
    }
  | {
      readonly type: 'transcript-confirmed';
      readonly sessionId: number;
      readonly transcript: string;
    }
  | { readonly type: 'understanding-finished'; readonly sessionId: number }
  | { readonly type: 'response-chunk'; readonly chunk: string; readonly sessionId: number }
  | { readonly type: 'response-replaced'; readonly response: string; readonly sessionId: number }
  | { readonly type: 'retry-transcription'; readonly sessionId: number }
  | { readonly type: 'speaking-started'; readonly sessionId: number }
  | { readonly type: 'completed'; readonly sessionId: number }
  | { readonly type: 'interrupted'; readonly sessionId: number }
  | { readonly type: 'cancelled'; readonly sessionId: number }
  | { readonly type: 'settled'; readonly sessionId: number }
  | { readonly type: 'failed'; readonly error: VoiceError; readonly sessionId: number }
  | { readonly type: 'recover' };

function isCurrentSession(state: VoiceControllerState, action: VoiceAction): boolean {
  return (
    action.type === 'begin-session' ||
    action.type === 'recover' ||
    action.sessionId === state.sessionId
  );
}

export function voiceReducer(
  state: VoiceControllerState,
  action: VoiceAction,
): VoiceControllerState {
  if (!isCurrentSession(state, action)) {
    return state;
  }

  switch (action.type) {
    case 'begin-session':
      if (!['idle', 'error', 'interrupted', 'cancelled'].includes(state.phase)) {
        return state;
      }
      return {
        ...initialVoiceState,
        isPressing: true,
        permission: 'requesting',
        sessionId: action.sessionId,
      };
    case 'permission-granted':
      if (
        state.permission !== 'requesting' ||
        (state.phase !== 'idle' && state.phase !== 'cancelled')
      ) {
        return state;
      }
      return { ...state, permission: 'granted' };
    case 'permission-failed':
      if (state.phase !== 'idle' && state.phase !== 'cancelled') {
        return state;
      }
      return {
        ...state,
        error: action.error,
        isPressing: false,
        permission: action.permission,
        phase: state.phase === 'cancelled' ? 'cancelled' : 'error',
      };
    case 'listening-started':
      if (state.phase !== 'idle' || state.permission !== 'granted' || !state.isPressing) {
        return state;
      }
      return { ...state, phase: 'listening' };
    case 'capture-sample':
      if (state.phase !== 'listening') {
        return state;
      }
      return {
        ...state,
        durationMs: Math.max(0, action.durationMs),
        level: Math.min(1, Math.max(0, action.level)),
      };
    case 'listening-finished':
      if (state.phase !== 'listening') {
        return state;
      }
      return {
        ...state,
        isPressing: false,
        level: 0,
        notice: action.notice ?? null,
        phase: 'transcribing',
      };
    case 'transcript-ready':
      if (state.phase !== 'transcribing') {
        return state;
      }
      return {
        ...state,
        phase: action.requiresConfirmation ? 'transcribing' : 'understanding',
        speechMode: action.speechMode ?? state.speechMode,
        transcript: action.transcript,
        transcriptOriginal: action.transcript,
        transcriptReview: action.requiresConfirmation ? 'pending' : 'confirmed',
      };
    case 'speech-mode-resolved':
      return { ...state, speechMode: action.speechMode };
    case 'transcript-confirmed':
      if (state.phase !== 'transcribing' || state.transcriptReview !== 'pending') {
        return state;
      }
      return {
        ...state,
        phase: 'understanding',
        transcript: action.transcript,
        transcriptReview: 'confirmed',
        transcriptionEdited: action.transcript !== state.transcriptOriginal,
      };
    case 'understanding-finished':
      if (state.phase !== 'understanding') {
        return state;
      }
      return { ...state, phase: 'responding_text' };
    case 'response-chunk':
      if (state.phase !== 'responding_text') {
        return state;
      }
      return { ...state, response: `${state.response}${action.chunk}` };
    case 'response-replaced':
      if (state.phase !== 'responding_text' || state.response === action.response) {
        return state;
      }
      return { ...state, response: action.response };
    case 'retry-transcription':
      if (state.phase !== 'error') {
        return state;
      }
      return {
        ...state,
        error: null,
        notice: '正在重新识别上一次录音。',
        phase: 'transcribing',
        transcript: '',
        transcriptOriginal: '',
        transcriptReview: 'none',
        transcriptionEdited: false,
      };
    case 'speaking-started':
      if (state.phase !== 'responding_text') {
        return state;
      }
      return { ...state, phase: 'speaking' };
    case 'completed':
      if (state.phase !== 'speaking') {
        return state;
      }
      return { ...state, isPressing: false, level: 0, phase: 'idle' };
    case 'interrupted':
      if (state.phase !== 'speaking') {
        return state;
      }
      return { ...state, isPressing: false, level: 0, phase: 'interrupted' };
    case 'cancelled':
      if (state.phase === 'idle' && state.permission !== 'requesting') {
        return state;
      }
      return { ...state, isPressing: false, level: 0, phase: 'cancelled' };
    case 'settled':
      if (state.phase !== 'cancelled' && state.phase !== 'interrupted') {
        return state;
      }
      return { ...state, phase: 'idle' };
    case 'failed':
      if (state.phase === 'idle' && state.permission !== 'requesting') {
        return state;
      }
      return {
        ...state,
        error: action.error,
        isPressing: false,
        level: 0,
        phase: 'error',
      };
    case 'recover':
      if (state.phase !== 'error' && state.phase !== 'cancelled') {
        return state;
      }
      return {
        ...state,
        error: null,
        isPressing: false,
        level: 0,
        notice: null,
        phase: 'idle',
      };
  }
}

export interface VoicePresentation {
  readonly action: string;
  readonly detail: string;
  readonly label: string;
}

export interface VoiceStateCopy {
  readonly cancelled: VoicePresentation;
  readonly error: Omit<VoicePresentation, 'detail'>;
  readonly idle: VoicePresentation;
  readonly interrupted: VoicePresentation;
  readonly listening: VoicePresentation;
  readonly permissionRequest: VoicePresentation;
  readonly respondingText: VoicePresentation;
  readonly speaking: VoicePresentation;
  readonly transcribing: VoicePresentation;
  readonly understanding: VoicePresentation;
}

export function presentVoiceState(
  state: VoiceControllerState,
  stateCopy: VoiceStateCopy,
): VoicePresentation {
  if (state.permission === 'requesting' && state.phase === 'idle') {
    return stateCopy.permissionRequest;
  }

  const presentations: Record<VoicePhase, VoicePresentation> = {
    idle: stateCopy.idle,
    listening: stateCopy.listening,
    transcribing: stateCopy.transcribing,
    understanding: stateCopy.understanding,
    responding_text: stateCopy.respondingText,
    speaking: stateCopy.speaking,
    interrupted: stateCopy.interrupted,
    cancelled: stateCopy.cancelled,
    error: {
      ...stateCopy.error,
      detail: state.error?.message ?? stateCopy.error.label,
    },
  };

  return presentations[state.phase];
}
