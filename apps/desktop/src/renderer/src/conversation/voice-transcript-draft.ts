export type VoiceDraftResolution = 'append' | 'direct' | 'pending' | 'replace';

export interface PendingVoiceDraft {
  readonly originalDraft: string;
  readonly resolution: VoiceDraftResolution;
  readonly sessionId: number;
  readonly transcript: string;
}

export function stageVoiceTranscript(
  originalDraft: string,
  transcript: string,
  sessionId: number,
): { readonly draft: string; readonly pending: PendingVoiceDraft } {
  const hasExistingDraft = Boolean(originalDraft.trim());
  return {
    draft: hasExistingDraft ? originalDraft : transcript,
    pending: {
      originalDraft,
      resolution: hasExistingDraft ? 'pending' : 'direct',
      sessionId,
      transcript,
    },
  };
}

export function resolveVoiceTranscriptDraft(
  pending: PendingVoiceDraft,
  resolution: Extract<VoiceDraftResolution, 'append' | 'replace'>,
): string {
  if (resolution === 'replace') {
    return pending.transcript;
  }
  const original = pending.originalDraft.trimEnd();
  return original ? `${original}\n${pending.transcript}` : pending.transcript;
}

export function wasTranscriptionEdited(draft: string, transcript: string): boolean {
  return draft.trim() !== transcript.trim();
}
