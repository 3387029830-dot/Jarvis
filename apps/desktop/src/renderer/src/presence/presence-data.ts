import type {
  CognitionCandidate,
  ExplorationItem,
  PresenceVariant,
  PresenceViewModel,
  UnresolvedQuestion,
} from './types';

const explorations = [
  {
    id: 'uncertainty-and-crowd',
    domain: '金融 · 心理学',
    title: '为什么人在不确定的时候更容易跟随群体？',
    summary: '从从众、不确定性规避与信息瀑布出发，辨认群体如何替个人承担判断压力。',
    updatedAt: '2026-07-30T08:20:00.000Z',
  },
  {
    id: 'money-consensus-institution',
    domain: '经济学 · 制度',
    title: '货币的价值，来自共识还是制度？',
    summary: '把信任、税收需求、国家能力与社会协调放在同一条讨论中重新观察。',
    updatedAt: '2026-07-29T13:40:00.000Z',
  },
  {
    id: 'knowledge-action-gap',
    domain: '心理学 · 自我认知',
    title: '为什么明白很多道理，却仍然很难改变行为？',
    summary: '沿着即时奖励、习惯回路和自我叙事，理解知识与行动之间为何仍有距离。',
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
