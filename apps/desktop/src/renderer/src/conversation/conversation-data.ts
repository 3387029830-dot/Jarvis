import type { ConversationScenario } from './types';

const CREATED_AT = '2026-07-30T04:20:00.000Z';

export const conversationScenarios = [
  {
    id: 'uncertainty-and-crowd',
    title: '为什么人在不确定的时候更容易跟随群体？',
    domains: ['心理学', '经济学', '群体行为'],
    intersections: [
      {
        domain: '心理学',
        concepts: ['从众效应', '不确定性规避'],
        reflection: '他人的选择会暂时降低独立判断带来的心理负担。',
      },
      {
        domain: '经济学',
        concepts: ['信息瀑布', '羊群行为'],
        reflection: '当每个人都把前人的行动当作信息，错误也可能获得集体放大。',
      },
      {
        domain: '自我认知',
        concepts: ['判断压力', '责任转移'],
        reflection: '我们是否有时在借用群体，替自己承担判断错误的风险？',
      },
    ],
    responseChunks: [
      '可以先把“跟随群体”看成一种在信息不足时降低判断成本的策略，而不急着把它归结为软弱。',
      '\n\n从心理学看，他人的一致行动既像证据，也像安全线索。越难估计结果，我们越容易把“很多人这样做”误当成“这样做更正确”。',
      '\n\n从经济学看，这会形成信息瀑布：后来者观察前人的选择，却看不到他们掌握的信息，于是相同方向不断自我强化。市场中的羊群行为，常常就从这种局部理性开始。',
      '\n\n真正值得继续追问的是：当你发现自己想跟随多数时，你是在借用他们的信息，还是在借用他们替你承担判断责任？',
    ],
    turns: [
      {
        id: 'crowd-user-1',
        role: 'user',
        source: 'voice',
        content: '我发现越是不确定，越会下意识看别人怎么选。这是缺乏主见吗？',
        createdAt: CREATED_AT,
        status: 'complete',
        isMock: true,
      },
      {
        id: 'crowd-jarvis-1',
        role: 'jarvis',
        source: 'text',
        content:
          '不一定。它也可能是大脑在信息不足时使用的社会性线索。关键不只是“有没有跟随”，而是你是否知道自己借用了群体的哪一种信息。',
        createdAt: '2026-07-30T04:20:18.000Z',
        status: 'complete',
        isMock: true,
      },
    ],
  },
  {
    id: 'money-consensus-institution',
    title: '货币的价值，来自共识还是制度？',
    domains: ['经济学', '制度', '社会协调'],
    intersections: [
      {
        domain: '制度',
        concepts: ['税收需求', '国家能力'],
        reflection: '制度能创造持续需求，也能规定债务以何种单位结清。',
      },
      {
        domain: '社会学',
        concepts: ['信任', '协调'],
        reflection: '货币让陌生人围绕同一种计价语言进行协作。',
      },
      {
        domain: '价值共识',
        concepts: ['可接受性', '预期'],
        reflection: '共识不是纯粹信念，它也被日常支付与制度执行反复训练。',
      },
    ],
    responseChunks: [
      '把共识和制度完全分开，可能会错过货币最重要的部分：它们往往互相生产。',
      '\n\n制度通过税收、法律结算与国家能力制造稳定需求；共识则让货币超出强制边界，成为陌生人之间可以预期的协调工具。',
      '\n\n因此，货币价值更像一种被持续执行的社会关系，而不是只存放在纸张、数据库或集体想象中的属性。',
      '\n\n还可以继续问：当制度可信度下降时，究竟是哪一种日常经验最先让共识松动？',
    ],
    turns: [
      {
        id: 'money-user-1',
        role: 'user',
        source: 'text',
        content: '如果大家都相信一种东西有价值，它就自然成为货币了吗？',
        createdAt: CREATED_AT,
        status: 'complete',
        isMock: false,
      },
      {
        id: 'money-jarvis-1',
        role: 'jarvis',
        source: 'text',
        content:
          '相信很重要，但稳定结算、税收需求和制度执行同样塑造这种相信。共识通常不是凭空出现，而是在可重复的社会关系中被维持。',
        createdAt: '2026-07-30T04:20:18.000Z',
        status: 'complete',
        isMock: true,
      },
    ],
  },
  {
    id: 'knowledge-action-gap',
    title: '为什么明白很多道理，却仍然很难改变行为？',
    domains: ['心理学', '习惯', '自我认知'],
    intersections: [
      {
        domain: '行为心理学',
        concepts: ['即时奖励', '习惯回路'],
        reflection: '行为通常响应眼前线索，而不是抽象且遥远的正确答案。',
      },
      {
        domain: '情绪调节',
        concepts: ['压力', '安慰策略'],
        reflection: '旧行为可能仍在完成某种情绪功能，知识并没有替代它。',
      },
      {
        domain: '自我叙事',
        concepts: ['身份', '行动证据'],
        reflection: '改变不仅需要新解释，也需要足够小、可以重复的新经验。',
      },
    ],
    responseChunks: [
      '“明白”主要改变解释，而行为还受即时奖励、环境线索和情绪调节方式支配。',
      '\n\n习惯回路的力量，在于它把选择压缩成自动反应。即使新的道理更合理，旧行为仍可能更快地提供安慰、熟悉感或压力出口。',
      '\n\n行动差距不一定说明意志薄弱。它也可能说明：新的理解还没有被转译成足够小、足够具体、能够重复的新经验。',
      '\n\n可以继续想一想：你最想改变的那个行为，当前究竟在替你解决什么问题？',
    ],
    turns: [
      {
        id: 'action-user-1',
        role: 'user',
        source: 'text',
        content: '我知道应该早点休息，但每到晚上还是会继续刷信息。',
        createdAt: CREATED_AT,
        status: 'complete',
        isMock: false,
      },
      {
        id: 'action-jarvis-1',
        role: 'jarvis',
        source: 'text',
        content:
          '知识已经改变了你的判断，却未必改变夜晚的即时奖励和情绪需要。先理解旧行为在保护什么，可能比继续增加道理更接近改变。',
        createdAt: '2026-07-30T04:20:18.000Z',
        status: 'complete',
        isMock: true,
      },
    ],
  },
] as const satisfies readonly ConversationScenario[];

export const defaultConversationScenario = conversationScenarios[0];

export function findConversationScenario(id: string | null): ConversationScenario | null {
  if (!id) {
    return defaultConversationScenario;
  }
  return conversationScenarios.find((scenario) => scenario.id === id) ?? null;
}
