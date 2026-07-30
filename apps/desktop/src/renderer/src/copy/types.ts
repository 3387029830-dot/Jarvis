export interface ProductCopy {
  readonly app: {
    readonly name: string;
    readonly descriptor: string;
  };
  readonly navigation: {
    readonly label: string;
    readonly current: string;
    readonly conversation: string;
    readonly map: string;
    readonly evolution: string;
    readonly archive: string;
    readonly settings: string;
    readonly unavailable: string;
    readonly unavailableDescription: string;
  };
  readonly presence: {
    readonly eyebrow: string;
    readonly activeExplorations: string;
    readonly unresolvedQuestions: string;
    readonly recentCognition: string;
    readonly continueExploration: string;
    readonly continueResponse: string;
    readonly provisional: string;
    readonly updatedAt: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly emptyHint: string;
    readonly questionLabel: string;
    readonly questionPlaceholder: string;
    readonly questionAction: string;
    readonly questionResponse: string;
    readonly voiceAction: string;
    readonly voiceDisclosure: string;
    readonly voiceResponse: string;
    readonly idleState: string;
    readonly localMockDisclosure: string;
    readonly reducedMotionActive: string;
  };
  readonly voice: {
    readonly cancelAction: string;
    readonly demoDisclosure: string;
    readonly durationLabel: string;
    readonly mockBadge: string;
    readonly noRoundYet: string;
    readonly privacyDetails: readonly string[];
    readonly privacySummary: string;
    readonly responseLabel: string;
    readonly retryAction: string;
    readonly roundTitle: string;
    readonly state: {
      readonly cancelled: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
      readonly error: {
        readonly action: string;
        readonly label: string;
      };
      readonly idle: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
      readonly interrupted: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
      readonly listening: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
      readonly permissionRequest: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
      readonly respondingText: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
      readonly speaking: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
      readonly transcribing: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
      readonly understanding: {
        readonly action: string;
        readonly detail: string;
        readonly label: string;
      };
    };
    readonly transcriptLabel: string;
    readonly useTextAction: string;
  };
}

export type SupportedLocale = 'zh-CN';
