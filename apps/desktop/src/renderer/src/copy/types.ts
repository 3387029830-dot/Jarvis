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
}

export type SupportedLocale = 'zh-CN';
