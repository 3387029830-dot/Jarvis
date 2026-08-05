# Jarvis 项目记忆与新窗口交接

最后更新：2026-08-05

这不是旧聊天记录的副本，而是 Jarvis 的持久化项目上下文。新窗口、Codex 或其他执行者
应先读取本文件，再读取 `AGENTS.md`、`README.md`、`PLANS.md`、`docs/STATUS.md`、
`PROJECT_LOG.md`、当前 ExecPlan 以及与任务相关的产品文档。仓库文件和 Git 历史是事实来源；
聊天窗口中的临时约定不能覆盖这些长期约束。

## 如何使用这份记忆

Jarvis 的工作方式是“先建立计划，再执行计划”：项目所有者通常先让 GPT 形成开发计划，
再把计划交给 Codex 实现。执行者不应自行扩大任务范围；应先确认当前任务编号、有效分支、
排除项和验收条件，完成实现、测试、人工验证、视觉证据、文档同步，再提交并汇报。

每个任务的最终汇报固定包含：

- 任务编号；
- 修改范围和主要文件；
- commit SHA 或 PR 地址；
- 执行的命令与 CI 状态；
- 视觉证据路径（如适用）；
- 已知风险、当前不能做什么和下一项建议；
- 对实现的真实体验，不能把 Mock 或本地假 Provider 说成真实能力。

所有面向项目所有者的状态说明和日志使用简体中文。代码标识、API、类型名和命令保留英文。

## 产品身份

Jarvis 是一个语音优先、以个人认知演变为核心的沉浸式桌面应用。它帮助用户探索问题、
自然地进行语音和文字对话、保留有意义的观点变化，并回看理解如何随时间演变。

它不是编程助手、企业后台、任务管理器、生产力仪表盘、普通聊天包装器、霓虹 HUD，
也不是未经授权的影视角色声线产品。

长期优先级是：高级且连贯的桌面体验、语音作为一等入口、Presence 与连续性、可靠的认知
捕获与修订历史、本地优先的用户所有权，以及只服务于认知体验的外部工具。

## 不可违反的工程与产品边界

- TypeScript strict；React 函数组件；Electron `contextIsolation`、sandbox 开启，renderer
  `nodeIntegration` 关闭。
- Renderer 不得获得 Node、通用 IPC、任意网络请求、完整 API Key、Provider header 或凭据 getter。
- Provider、STT、TTS、文件系统、SQLite 和 Obsidian 操作只在 main-process 服务执行。
- 凭据只能使用 Electron `safeStorage` 或明确批准的 OS 安全存储；不可用时停止，不能退回明文。
- 真实 Provider 失败必须明确显示，不能悄悄换成 Mock 内容。
- 真实 STT 转录必须用户确认后才能发送；不得覆盖未发送文字草稿。
- STT 原始音频和 TTS 音频只在内存中短暂存在，使用命名 typed binary IPC，并及时释放资源。
- Voice Profile 必须携带授权元数据；仓库不能内置未经授权的人物、演员、角色声线、克隆声线、
  真实录音或真实 API Key。
- 认知数据必须 append-only；AI 提取结果是候选，不能静默写入或覆盖旧观点。
- 简体中文是正式产品默认语言；产品文案遵循 `docs/COPY_GUIDE_ZH_CN.md`。
- 不得漂移到自主编程、任务管理、移动端、唤醒词、插件市场或多 Agent 人格。

## 当前 Git 与里程碑

- 仓库：`D:\Jarvis`，远程为 `3387029830-dot/Jarvis`。
- 当前分支：`feat/jar-006c-real-tts`。
- 最近提交：`381edcbd9e4a94a92075009a8c06d99cd1a31a7a`，标题为
  `docs: preserve project memory for new sessions`；JAR-006C 实现提交为其父提交
  `7153a4ccd3048ae98b3aa1894c4b60e398fe8726`。
- Draft PR：[#6](https://github.com/3387029830-dot/Jarvis/pull/6)。
- 当前里程碑：JAR-006C，真实 TTS 与 Voice Profile 系统。
- PR 必须保持 Draft；不要转 Ready、不要合并、不要创建 JAR-007 分支，也不要提前实现 JAR-007。

## 已完成的垂直切片

- JAR-001：Electron、React、TypeScript、Vite、pnpm workspace、安全隔离、typed health-check、CI 和 smoke。
- JAR-002：中文优先设计系统、tokens、基础组件、可访问性和 showcase。
- JAR-003：App Shell、中文导航和 Presence「此刻」页面。
- JAR-004：统一 VoiceController、真实麦克风采集、Mock STT/回答/播放、取消和恢复。
- JAR-005：编辑性 Conversation 空间、流式输出、取消、重试、离线/错误和真实 Provider 接入。
- JAR-006A：OpenAI-compatible Conversation Provider、main 网络边界、加密配置和布局稳定性；
  项目所有者已完成真实文字 Provider 验收。
- JAR-006B：真实 STT、二进制音频 IPC、待确认转录、草稿保护和 voice 元数据；项目所有者已完成
  真实 STT 验收。

## JAR-006C 当前事实

已实现：

- vendor-neutral `TextToSpeechProvider` 和 main-process MiniMax `/v1/t2a_v2` 适配器；
- Bearer、timeout、取消、响应大小限制、分类错误和 main 内 hex 解码；
- `safeStorage` TTS 配置、末四位脱敏、手动/自动/关闭播放模式；
- Markdown/链接/代码清理、中文语义分段、最多两段预取、顺序无重叠播放、Blob URL 清理；
- 回答完成后的朗读、停止、Escape、新录音、新文字、卸载清理和文字回退；
- Original / Licensed Character / Consented Clone Profile 契约、授权校验、过期拒绝、手动 binding；
- 四个无 Provider voice ID 的原创模板、试听、选择和 Editorial Chapters 设置页；
- 47 个测试文件、174 项测试、生产 Electron smoke、本地假 MiniMax HTTP/IPC 验收和 11 张视觉证据。
- 收尾复核确保 Renderer 公共 TTS profile 摘要不含 `providerVoiceId`；连接测试和合成会重新
  校验授权类别、授权依据、到期日和绑定完整性；TTS Base URL 复用统一 Provider URL 安全策略。

尚未完成：

- 项目所有者尚未用真实 MiniMax 账户完成最终 TTS 验收；因此不能宣称 JAR-006C 或 JAR-006 完成。
- 尚未验证真实音色自然度、费用、区域可用性、真实 voice ID 和首段延迟。
- 未实现 `/get_voice` 自动发现、跨重启音频、SQLite、Conversation 持久化、认知提取、星图或 Obsidian。
- 真实 MiniMax 账户验收前，PR #6 必须继续保持 Draft；本轮没有 Ready、合并或 JAR-007 分支动作。

## 继续工作时的顺序

1. 读取本文件与根目录 `AGENTS.md`、`README.md`、`PLANS.md`。
2. 读取 `docs/STATUS.md`、`PROJECT_LOG.md`、当前 `docs/plans/*.md` 和任务指定的产品规范。
3. 检查 `git status`、当前分支、PR 状态；不要假设聊天窗口记得这些信息。
4. 明确本轮只做哪个 JAR issue，先写/更新 ExecPlan，再修改代码。
5. 完成 `format:check`、`lint`、`typecheck`、`test`、`build`、`smoke` 和相关 Electron 人工验证。
6. 更新 README、STATUS、PROJECT_LOG、ExecPlan、视觉证据说明；有长期决定才新增 ADR。
7. 提交、推送、创建或更新 PR，并在汇报中诚实区分真实能力、Mock、遗留风险和下一项任务。

## 可信入口

- 当前真实功能清单：`docs/STATUS.md`
- 当前执行计划：`docs/plans/0001-foundation-vertical-slice.md`
- 产品入口与启动方式：`README.md`
- 时间线与历史决策：`PROJECT_LOG.md`
- 任务边界：`docs/CODEX_TASKS.md`
- 语音/Provider/安全约束：`docs/VOICE_SPEC.md`、`docs/VOICE_PROFILES.md`、
  `docs/PROVIDERS.md`、`docs/SECURITY_MODEL.md`
