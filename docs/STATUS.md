# Jarvis 当前状态

最后更新：2026-08-05

当前版本：`0.1.0` / JAR-006C Draft

当前阶段：JAR-006C 代码与本地验收已完成，安全边界回归通过；等待项目所有者真实 MiniMax TTS 验收

## 已真实实现

- Electron 桌面应用可以启动。
- main / preload / renderer 保持安全隔离，renderer 未获得 Node 能力。
- preload 公开最小强类型 health、Provider 配置和 Conversation streaming API；没有通用 IPC。
- 简体中文优先的设计系统、中文字体栈和中英文混排规范。
- Button、IconButton、Panel、Card、Badge、Tooltip、Dialog、ScrollArea 等基础组件。
- 中文 App Shell、当前导航状态与不可用入口说明。
- Presence「此刻」页面的响应式布局和 empty / single / populated 三种视图。
- Presence 的“继续探索”会携带 exploration id 进入对应 Conversation。
- Conversation 使用编辑性内容块而非聊天气泡，并显示讨论上下文和跨领域联系。
- `#/conversation` 与带 exploration 查询参数的三种确定性场景。
- 文字输入支持中文输入法组合、Enter 发送、Shift+Enter 换行。
- 语音与文字共用同一条 typed timeline，并保留来源、时间和 Mock 标记。
- Conversation 的流式输出、取消、相同回答重试、离线与可恢复错误状态。
- OpenAI-compatible Chat Completions SSE 适配器，支持自定义 Base URL、Bearer、timeout、取消、usage 与响应上限。
- Jarvis 中文系统提示会携带当前探索、领域和有限最近回合，不请求或展示模型隐藏推理。
- Provider URL 安全规则：远程只允许 HTTPS，localhost 开发例外，拒绝 URL 凭据、查询和重定向。
- Provider 网络请求与完整凭据只存在于 main process。
- API Key 使用 Electron `safeStorage` 加密写入 userData 下版本化配置；Renderer 只看到是否保存和末四位。
- 中文“设置”页支持连接测试、保存、删除、Mock / real 切换与分类错误。
- real 模式的文字回答通过 typed IPC 增量进入既有编辑性时间线；取消会中止 fetch，重试不复制用户消息。
- Conversation 输入区使用 identity / text / voice 命名布局区域；发送与停止生成在同一
  固定操作槽切换，生成、取消、失败和完成不会重新排列 Orb、文字输入或语音区域。
- 生成期间可以预先编辑下一条草稿；Enter 不会发起第二个并发请求，取消后草稿仍保留。
- 流式增长只滚动 Conversation 阅读区；接近底部时跟随，主动向上阅读后停止跟随并提供
  “回到最新回答”，同时预留稳定滚动条空间。
- 真实模式失败不会悄悄回退 Mock，固定 Mock“思维交汇”在 real 模式下被替换为能力边界说明。
- 本地真实 HTTP 假 Provider 与 Electron 完整 IPC 链路已验证，包括加密保存、脱敏、SSE、取消和删除凭据。
- 项目所有者已使用自己的真实 OpenAI-compatible Provider 完成最终手工验收：连接、
  中文流式回答、开始/持续/取消/结束布局稳定、主动上滚、回到最新回答、无迟到文本、
  草稿保留、中文输入法、无并发/重复消息、重启后配置恢复和 Key 末四位脱敏均通过。
- 默认“点击说话”及可选“按住说话”；两种模式在 Presence 和 Conversation 间共享。
- 手势适配层只发出 `startCapture`、`finishCapture`、`cancel`、`interruptAndCapture`，状态仍由单一 `VoiceController` 管理。
- 用户直接按住后才请求麦克风权限；权限请求期间不会显示为正在录音。
- `MediaRecorder` 内存录音、支持格式选择、真实录音时长和 analyser 音量波形。
- 鼠标、触控、Space / Enter 按住与松开、pointer capture、Escape、窗口失焦清理。
- `idle`、`listening`、`transcribing`、`understanding`、`responding_text`、`speaking`、`interrupted`、`cancelled`、`error` 强类型状态机。
- `sessionId` 隔离旧异步回调，播放期间再次按住可以立即停止并开始新录音。
- speechSynthesis 本地播放与不依赖系统中文语音包的 Web Audio 确定性短音回退。
- Mock STT 录音只短暂保留在 Renderer 内存并在模拟转录后释放；real STT 通过受控二进制
  IPC 发送当前录音，但两种模式都不写盘。
- vendor-neutral `SpeechToTextProvider` 契约和一个 OpenAI-compatible multipart
  `/audio/transcriptions` 适配器。
- 音频以 `Uint8Array` 通过命名、运行时验证的 preload IPC 进入 main；不使用 Base64、
  JSON number array、通用 IPC 或 Renderer 网络请求。
- STT 支持独立加密凭据，或显式复用 Conversation 凭据引用；完整 Key 只在 main 解密，
  Renderer 只看到可用状态和末四位。
- 真实 STT 支持连接测试、保存、删除、timeout、取消、请求隔离、格式/时长/大小限制、
  usage 和分类错误。
- 真实转录进入现有文字区并明确标记“语音转录待确认”；用户编辑确认前不会调用模型。
- 文字区已有未发送草稿时不会被覆盖；用户必须明确选择替换或追加，也可以保留原草稿。
- 确认后的消息仍记录 `source: voice`；编辑过的转录记录 `transcriptionEdited`。
- 取消、重新录音、识别失败和重试均不会清空录音前已有的文字草稿。
- 设置页使用 Editorial Chapters；切换章节保留未保存表单状态并给出克制提示。
- 本地假 Provider 与生产 Electron 已验证 STT 测试、保存、末四位遮罩、二进制 IPC、
  multipart 转录、取消和凭据删除。
- 项目所有者已使用自己的第三方 STT Provider 完成最终手工验收：连接测试、真实麦克风
  中文/数字/英文缩写识别、真实 Provider 标识、待确认与编辑、voice 来源元数据、草稿
  替换/追加/保留、取消无迟到结果、重新识别和文字回退、真实 Conversation 串联、重启
  配置恢复、Key 末四位脱敏、日志与仓库隐私检查，以及麦克风和音频资源释放均通过。
- 键盘导航、清晰焦点、reduced-motion 和低性能静态 Orb 回退。
- format、lint、strict typecheck、单元/组件测试、build、Electron IPC smoke 和 GitHub CI 配置。
- vendor-neutral `TextToSpeechProvider` 契约、main-process MiniMax `/t2a_v2` 适配器、
  Bearer 请求、timeout、取消、响应上限、分类错误和 main 内 hex 解码。
- TTS 配置、完整 Key 的 `safeStorage` 加密、末四位脱敏、版本化存储与独立播放模式。
- TTS 公共配置只返回可展示的 Voice Profile 摘要，不暴露 Provider voice ID；连接测试与合成
  都会重新校验授权类别、授权依据、到期日和绑定完整性。
- TTS Base URL 复用统一 Provider URL 安全规则，拒绝远程 HTTP、凭据、query、fragment
  和隐式重定向。
- 中文 Markdown/链接/代码清理、确定性语义分段、最多两段预取、严格顺序无重叠播放。
- `idle / preparing / playing / stopped / completed / error` 播放状态；停止、新录音、
  新文字、Escape 和卸载会取消请求、暂停音频并释放 Blob URL。
- Original / Licensed Character / Consented Clone Voice Profile 数据契约；产品 profile ID 与
  MiniMax voice ID 分离，缺少授权元数据或授权过期时不能安装、选择或试听。
- 四个不含 Provider voice ID 的原创表达模板，以及真实绑定安装、试听和显式选择 UI。
- TTS 错误不删除或遮挡文字回答；手动播放为默认，自动播放和关闭模式可持久化。

## 使用 Mock 数据模拟

- 问候语由本地 typed view-model 变体决定，不来自真实用户历史。
- “正在探索”的问题、领域和更新时间均为仓库内固定 Mock 数据。
- “尚未解开的疑问”为固定 Mock 数据。
- “最近的认知变化”为固定候选观察，并明确标记“待确认 · 暂存观察”。
- Presence 的文本问题只显示确定性页面反馈；“继续探索”会打开对应 Mock
  Conversation，但两者都不调用模型或持久化。
- Conversation 的三个探索主题、历史消息、跨领域联系和回答均为仓库内确定性 Mock。
- Conversation 流式输出由本地定时片段模拟；离线和错误为可重复验证状态。
- 当设置为 Mock 模式时，Conversation 继续使用确定性本地回答，不发送 Provider 网络请求。
- Voice Profile 摘要只展示未来契约与默认演示声线，不代表已安装真实或授权声线。
- “模拟转录”是固定中文演示问题，不声称还原用户刚才说出的内容。
- understanding 与回答内容是可取消的确定性 Mock。
- 回答按固定片段流式显示。
- 语音播放的内容来自固定 Mock 回答；优先使用本地 speechSynthesis，失败时播放本地生成短音。

## 尚未实现

- 项目所有者真实 MiniMax TTS 最终验收（当前仅完成 fetch stub、本地假 Provider 与生产 Electron 验收）。
- Conversation、消息或探索的本地持久化。
- SQLite、本地会话持久化和认知事件。
- 真实认知提取、用户确认与观点修订历史。
- 星图、演变和档案页面。
- Obsidian 同步或导出。

## 当前可访问和体验的页面

- `#/presence`：默认 Presence「此刻」页面。
- `#/presence?variant=populated`：丰富 Mock 状态。
- `#/presence?variant=single`：单条探索 Mock 状态。
- `#/presence?variant=empty`：空状态。
- `#/conversation`：默认进入“不确定性与群体”讨论。
- `#/conversation?exploration=uncertainty-and-crowd`：心理学 × 经济学 × 群体行为。
- `#/conversation?exploration=money-consensus-institution`：货币 × 共识 × 制度。
- `#/conversation?exploration=knowledge-action-gap`：知识 × 行动 × 自我叙事。
- `#/settings`：分章节配置 Conversation、Speech-to-Text、Text-to-Speech 与 Voice Profiles。
- `#/design-system`：仅开发验证使用的设计系统展示页，不出现在产品导航中。

在 Presence 或 Conversation 中可体验真实录音与本地 Mock 闭环；配置 real STT 后，
录音会进入真实识别和人工确认路径。默认点击开始、再次点击结束，也可切换到按住模式；
模式会在两个页面共享。`state`、`voice` 等查询参数只用于生产 Electron 的视觉证据，
不是产品设置。

## 已知问题

- Windows 是当前主要视觉验收环境；其他系统的中文字体渲染可能略有不同。
- Renderer 入口 bundle 约 802 kB；为消除 Electron 视觉验收中 Settings 懒加载偶发停留，
  当前 Settings 已回到主入口，后续应在不破坏语音生命周期的前提下重新拆分。
- 200% 缩放下布局会转为顶部精简导航并依赖纵向滚动，功能可用但信息密度明显降低。
- speechSynthesis 的中文音色、语速和可用性受 Windows 已安装语音影响；不可用时只播放确定性短音，不会伪装成真实语音合成。
- 首次系统权限提示可能暂时抢走应用键盘焦点；界面在权限返回前保持 requesting，提前松开后会停止迟到的 stream。
- 没有麦克风、权限拒绝和浏览器能力缺失均有中文恢复提示，但不同 Windows 隐私设置的系统提示样式不受应用控制。
- 所有 Presence 内容均为开发 Mock，不代表用户数据已经被保存。
- 所有 Conversation 历史和跨领域联系均为开发 Mock，刷新后恢复到固定场景。
- 真实 Provider 回答不会持久化，刷新后丢失；当前也不会生成认知候选。
- 不同 OpenAI-compatible 服务对 `stream_options.include_usage` 和错误体的兼容程度可能不同。
- 真实 Provider 最终验收已通过，但仓库、测试、截图和日志仍不得包含真实 API Key 或
  私人 Provider 回答。
- 浏览器 hash 路由足以覆盖当前两个产品页，但路由继续增加时应重新评估。
- 仓库不内置任何具体人物、演员或角色 voice ID / 音频；四个模板均未绑定，必须由用户
  提供可验证授权与 Provider voice ID。
- MiniMax 真实账户、费用、区域、voice ID 与中文自然度尚待项目所有者最终验收。
- 本轮本地回归为 47 个测试文件、174 项测试；生产构建 Renderer 入口约 802.68 kB。
- 不同 OpenAI-compatible STT 服务对 MIME、语言、usage 和错误状态的实现仍可能不同；
  当前结论只覆盖本地假 Provider 和项目所有者实际使用的第三方 Provider。
- real STT 失败重试会在 Renderer 内存中短暂保留当前一份录音；应用退出、取消、成功、
  重新录音或放弃后释放，不提供永久音频恢复。

## 下一步

先完成 JAR-006C 项目所有者真实 MiniMax TTS 验收并收尾 Draft PR；在此之前不建议进入
JAR-007，也不创建 JAR-007 分支。
