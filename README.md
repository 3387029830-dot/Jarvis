# Jarvis Cognition

> 一个以语音为主要入口、以个人认知演变为核心的沉浸式桌面智能应用。

## 1. 项目使命

Jarvis 不以“完成更多任务”或“替用户编程”为核心。它服务于一个更长期的问题：

- 用户对金融、心理学、经济学、哲学、社会学、文学等领域保持好奇；
- 用户可以自然地用语音或文字发问、讨论、反思；
- Jarvis 使用跨领域视角帮助用户建立联系，而不是只给出一次性答案；
- 有价值的问题、观点、疑惑和观点修正会沉淀为个人认知地图；
- 用户可以回看自己如何逐渐理解世界、改变观点并认识自己；
- Obsidian 是可选的外部归档接口，不是系统主体。

一句话定义：

> Jarvis 是一个会陪用户把世界想明白一点，并让用户看见自己如何变化的智能空间。

## 2. 第一阶段目标

第一阶段不追求复杂 Agent、电脑控制或大量第三方集成，而是完成一个可日常使用的桌面应用垂直闭环：

1. 打开应用时具有明确的“在场感”；
2. 用户按键说话，看到实时或准实时的语音状态反馈；
3. Jarvis 理解问题并用语音与文字回复；
4. 对话中逐步浮现跨领域概念和关联；
5. 用户可确认保存本次形成的观点；
6. 观点进入个人认知地图；
7. 后续讨论形成观点的新版本，而不是覆盖旧观点；
8. 可将确认后的内容同步到 Obsidian Markdown。

## 3. 核心产品空间

- **Presence**：回到 Jarvis，继续最近的探索。
- **Conversation**：沉浸式语音与文字对话。
- **Constellation**：个人认知星图，展示问题、概念、观点与跨领域关系。
- **Evolution**：展示观点如何随时间变化。
- **Archive**：保存讨论、来源、语音和 Obsidian 同步记录。

## 4. 第一阶段技术选择

- Electron
- React
- TypeScript（strict）
- Vite
- Tailwind CSS
- Framer Motion
- Zustand
- TanStack Query
- SQLite
- React Three Fiber：Orb 与环境视觉
- `@xyflow/react`：第一版可交互认知地图

后续认知图规模增大后，可评估 Graphology + Sigma.js。

## 5. 仓库阅读顺序

Codex 开始工作前必须依次阅读：

1. `AGENTS.md`
2. `docs/PRODUCT_CHARTER.md`
3. `docs/EXPERIENCE_SPEC.md`
4. `docs/FRONTEND_SPEC.md`
5. `docs/VOICE_SPEC.md`
6. `docs/COGNITIVE_MODEL.md`
7. `docs/ARCHITECTURE.md`
8. `docs/ROADMAP.md`
9. `docs/CODEX_TASKS.md`
10. 当前任务对应的 `docs/plans/*.md`

## 6. 开工方法

将本目录复制到新 GitHub 仓库后，把 `prompts/CODEX_FIRST_PROMPT.md` 的内容交给 Codex。

Codex 不应一次性实现整个产品。每次只完成一个可验证的垂直切片，并在代码、测试、截图验证和项目记录全部完成后再进入下一项。

## 7. 项目记录

你提到的“REMADE”没有检索到明确对应的开发记录工具。本方案暂按 **README.md 项目主页 + PROJECT_LOG.md 开发日志** 理解：

- `README.md`：稳定愿景、当前版本、运行方式；
- `PROJECT_LOG.md`：每次开发的重要变化、决策、问题和下一步；
- GitHub Issues：任务单元；
- Pull Requests：代码变化与验收证据；
- `docs/decisions/`：不可轻易更改的架构决策。

如果 REMADE 是某个具体工具，只需新增相应同步适配，不改变项目核心结构。

## 8. 当前状态

- [x] 产品定位确定
- [x] 第一阶段范围确定
- [x] 前端与语音优先级确定
- [x] 认知数据模型草案确定
- [x] Electron 项目初始化
- [ ] 设计系统与 App Shell
- [ ] Presence 页面
- [ ] 真实按键语音闭环
- [ ] Conversation 页面
- [ ] 认知提取确认卡
- [ ] Constellation 页面
- [ ] Evolution 页面
- [ ] Obsidian 导出

## 9. 本地开发

环境要求：

- Node.js 24+
- pnpm 11+

```bash
pnpm install
pnpm dev
```

质量与构建命令：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm smoke
```

开发模式的数据目录位于操作系统临时目录，不写入仓库。`pnpm smoke` 会启动生产构建，
并从真实 Renderer 上下文调用强类型 preload health-check API。
