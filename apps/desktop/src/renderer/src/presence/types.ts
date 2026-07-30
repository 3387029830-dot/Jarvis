export type PresenceVariant = 'empty' | 'single' | 'populated';

export interface ExplorationItem {
  readonly id: string;
  readonly domain: string;
  readonly title: string;
  readonly summary: string;
  readonly updatedAt: string;
}

export interface UnresolvedQuestion {
  readonly id: string;
  readonly question: string;
  readonly context: string;
  readonly updatedAt: string;
}

export interface CognitionCandidate {
  readonly id: string;
  readonly statement: string;
  readonly reflection: string;
  readonly updatedAt: string;
  readonly status: 'provisional';
}

export interface PresenceViewModel {
  readonly variant: PresenceVariant;
  readonly referenceTime: string;
  readonly greeting: {
    readonly title: string;
    readonly orientation: string;
  };
  readonly explorations: readonly ExplorationItem[];
  readonly unresolvedQuestions: readonly UnresolvedQuestion[];
  readonly cognitionCandidates: readonly CognitionCandidate[];
}
