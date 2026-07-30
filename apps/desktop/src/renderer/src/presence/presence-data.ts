import type {
  CognitionCandidate,
  ExplorationItem,
  PresenceVariant,
  PresenceViewModel,
  UnresolvedQuestion,
} from './types';

const explorations = [
  {
    id: 'limits-and-freedom',
    domain: '哲学 · 心理学',
    title: '边界究竟限制了自由，还是让自由成为可能？',
    summary: '从选择过载与自我约束出发，继续辨认“能够做”与“真正想做”之间的差别。',
    updatedAt: '2026-07-30T08:20:00.000Z',
  },
  {
    id: 'uncertainty-and-price',
    domain: '经济学 · 金融',
    title: '市场为不确定性定价时，究竟在衡量什么？',
    summary: '把风险、模糊性与叙事预期拆开，观察价格如何容纳彼此冲突的未来。',
    updatedAt: '2026-07-29T13:40:00.000Z',
  },
  {
    id: 'memory-and-self',
    domain: '文学 · 认知',
    title: '如果记忆持续被重写，“我”如何保持连续？',
    summary: '沿着叙事身份与回忆偏差，重新审视一个人为何仍会相信自己是同一个人。',
    updatedAt: '2026-07-27T10:15:00.000Z',
  },
] as const satisfies readonly ExplorationItem[];

const unresolvedQuestions = [
  {
    id: 'conviction-and-evidence',
    question: '当新证据与长期信念冲突时，什么才算真正改变了看法？',
    context: '尚未分清：是证据不足，还是旧叙事仍然提供着安全感。',
    updatedAt: '2026-07-28T15:00:00.000Z',
  },
] as const satisfies readonly UnresolvedQuestion[];

const cognitionCandidates = [
  {
    id: 'order-without-control',
    statement: '你似乎开始把“秩序”理解为持续协商的结果，而不是预先完成的结构。',
    reflection: '这只是从近期问题中浮现的候选观察，需要你确认或修正。',
    status: 'provisional',
    updatedAt: '2026-07-30T07:45:00.000Z',
  },
] as const satisfies readonly CognitionCandidate[];

const greetingByVariant = {
  empty: {
    title: '下午好。这里会慢慢长成你的认知现场。',
    orientation: '没有需要追赶的进度，也不会把每句话都变成长久记忆。',
  },
  single: {
    title: '下午好。一个问题仍在这里，等你回来。',
    orientation: '它没有被催促成答案，只保留了下一次继续思考的入口。',
  },
  populated: {
    title: '下午好。几条思绪仍在缓慢靠近彼此。',
    orientation: '你可以从一个未完成的问题继续，不必先选择模式。',
  },
} as const satisfies Record<PresenceVariant, PresenceViewModel['greeting']>;

export function createPresenceViewModel(variant: PresenceVariant): PresenceViewModel {
  const content = {
    empty: {
      cognitionCandidates: [],
      explorations: [],
      unresolvedQuestions: [],
    },
    single: {
      cognitionCandidates: [],
      explorations: explorations.slice(0, 1),
      unresolvedQuestions: [],
    },
    populated: {
      cognitionCandidates,
      explorations,
      unresolvedQuestions,
    },
  }[variant];

  return {
    variant,
    referenceTime: '2026-07-30T09:00:00.000Z',
    greeting: greetingByVariant[variant],
    ...content,
  };
}

export function parsePresenceVariant(value: string | null): PresenceVariant {
  return value === 'empty' || value === 'single' || value === 'populated' ? value : 'populated';
}
