export interface VoiceTranscriptHandoff {
  readonly transcriptionEdited: boolean;
  readonly transcript: string;
}

let pendingHandoff: VoiceTranscriptHandoff | null = null;

export function setVoiceTranscriptHandoff(handoff: VoiceTranscriptHandoff): void {
  pendingHandoff = handoff;
}

export function takeVoiceTranscriptHandoff(): VoiceTranscriptHandoff | null {
  const handoff = pendingHandoff;
  pendingHandoff = null;
  return handoff;
}
