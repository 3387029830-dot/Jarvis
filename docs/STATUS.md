# Jarvis 当前状态

最后更新：2026-07-30

当前版本：`0.1.0` / JAR-006A

当前阶段：Provider 基础与真实文字路径已实现，等待项目所有者完成真实 Provider 手工验收

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
- 真实模式失败不会悄悄回退 Mock，固定 Mock“思维交汇”在 real 模式下被替换为能力边界说明。
- 本地真实 HTTP 假 Provider 与 Electron 完整 IPC 链路已验证，包括加密保存、脱敏、SSE、取消和删除凭据。
- 默认“点击说话”及可选“按住说话”；两种模式在 Presence 和 Conversation 间共享。
- 手势适配层只发出 `startCapture`、`finishCapture`、`cancel`、`interruptAndCapture`，状态仍由单一 `VoiceController` 管理。
- 用户直接按住后才请求麦克风权限；权限请求期间不会显示为正在录音。
- `MediaRecorder` 内存录音、支持格式选择、真实录音时长和 analyser 音量波形。
- 鼠标、触控、Space / Enter 按住与松开、pointer capture、Escape、窗口失焦清理。
- `idle`、`listening`、`transcribing`、`understanding`、`responding_text`、`speaking`、`interrupted`、`cancelled`、`error` 强类型状态机。
- `sessionId` 隔离旧异步回调，播放期间再次按住可以立即停止并开始新录音。
- speechSynthesis 本地播放与不依赖系统中文语音包的 Web Audio 确定性短音回退。
- 录音只短暂保留在 renderer 内存；取消、错误或模拟转录完成后释放，不上传、不写盘、不通过 IPC。
- 键盘导航、清晰焦点、reduced-motion 和低性能静态 Orb 回退。
- format、lint、strict typecheck、单元/组件测试、build、Electron IPC smoke 和 GitHub CI 配置。

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

- 真实 STT 和真实 TTS。
- 对录音内容进行真实识别；当前转录是演示 Mock。
- Conversation、消息或探索的本地持久化。
- SQLite、本地会话持久化和认知事件。
- 真实认知提取、用户确认与观点修订历史。
- 星图、演变和档案页面。
- Obsidian 同步或导出。
- 项目所有者真实 OpenAI-compatible Provider 的手工验收；仓库中没有真实 API Key。
- Voice Profile 安装、预览、授权校验或 Provider binding。

## 当前可访问和体验的页面

- `#/presence`：默认 Presence「此刻」页面。
- `#/presence?variant=populated`：丰富 Mock 状态。
- `#/presence?variant=single`：单条探索 Mock 状态。
- `#/presence?variant=empty`：空状态。
- `#/conversation`：默认进入“不确定性与群体”讨论。
- `#/conversation?exploration=uncertainty-and-crowd`：心理学 × 经济学 × 群体行为。
- `#/conversation?exploration=money-consensus-institution`：货币 × 共识 × 制度。
- `#/conversation?exploration=knowledge-action-gap`：知识 × 行动 × 自我叙事。
- `#/settings`：配置、测试、启用或删除 OpenAI-compatible Conversation Provider。
- `#/design-system`：仅开发验证使用的设计系统展示页，不出现在产品导航中。

在 Presence 或 Conversation 中可体验真实录音与本地 Mock 闭环。默认点击开始、再次点击结束，也可切换到按住模式；模式会在两个页面共享。`state`、`voice` 等查询参数只用于生产 Electron 的视觉证据，不是产品设置。

## 已知问题

- Windows 是当前主要视觉验收环境；其他系统的中文字体渲染可能略有不同。
- Renderer 入口 bundle 从 JAR-005 的 689.62 kB 增至约 700.70 kB；Settings 另有
  15.58 kB JS / 5.99 kB CSS 懒加载分包。Conversation 拆分暂缓，避免在共享语音控制器上引入高风险切割。
- 200% 缩放下布局会转为顶部精简导航并依赖纵向滚动，功能可用但信息密度明显降低。
- speechSynthesis 的中文音色、语速和可用性受 Windows 已安装语音影响；不可用时只播放确定性短音，不会伪装成真实语音合成。
- 首次系统权限提示可能暂时抢走应用键盘焦点；界面在权限返回前保持 requesting，提前松开后会停止迟到的 stream。
- 没有麦克风、权限拒绝和浏览器能力缺失均有中文恢复提示，但不同 Windows 隐私设置的系统提示样式不受应用控制。
- 所有 Presence 内容均为开发 Mock，不代表用户数据已经被保存。
- 所有 Conversation 历史和跨领域联系均为开发 Mock，刷新后恢复到固定场景。
- 真实 Provider 回答不会持久化，刷新后丢失；当前也不会生成认知候选。
- 不同 OpenAI-compatible 服务对 `stream_options.include_usage` 和错误体的兼容程度可能不同。
- 真实 Provider 手工验收仍等待项目所有者在应用设置页输入自己的凭据并确认；不得在聊天或终端提供 Key。
- 浏览器 hash 路由足以覆盖当前两个产品页，但路由继续增加时应重新评估。
- Voice Profile 当前只有文档契约；仓库不内置未经授权的具体人物或演员声音。

## 下一步

项目所有者先完成 JAR-006A 真实 Provider 验收。确认通过并合并后，下一项才是
JAR-006B：真实 STT；不得在此之前实现 JAR-006B 或 JAR-006C。
