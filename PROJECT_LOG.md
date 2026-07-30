# Jarvis 项目日志

本文件按时间记录有意义的产品切片和长期决定，不逐条抄录提交历史。所有面向项目所有者的状态说明使用简体中文。

---

## 2026-07-29 — 产品方向确立

### 本次目标

明确 Jarvis 的产品中心、第一阶段范围与桌面技术方向。

### 实现内容

- 将 Jarvis 定义为语音优先的个人认知陪伴空间。
- 明确排除编程助手、效率仪表盘和通用聊天包装器定位。
- 将认知关系与观点演变确定为核心差异。
- 将 Obsidian 定义为可选外部归档适配器。
- 选择 Electron 与 Web 技术构建桌面应用。

### 已知问题

- 第一套真实模型、STT、TTS 适配器尚未选择。
- Orb 的正式渲染技术仍需由后续语音状态需求决定。

### 下一步

JAR-001：建立可运行、安全、可验证的桌面仓库基础。

---

## 2026-07-29 — JAR-001 仓库基础

### 本次目标

建立 Electron、React、TypeScript strict、Vite 和 pnpm workspace 基础，并验证最小安全 IPC。

### 实现内容

- 初始化 main / preload / renderer 三层桌面应用。
- 开启 context isolation 与 Chromium sandbox，关闭 renderer node integration。
- 只公开 `window.jarvis.healthCheck()`。
- 增加 format、lint、typecheck、test、build、dev 和 smoke 命令。
- 增加 Windows GitHub Actions CI。
- 将开发数据放到操作系统临时目录。

### 用户现在可以做什么

- 安装依赖并启动 Electron 桌面窗口。
- 通过真实 Renderer 验证 main-process health-check。

### 本轮尚不能做什么

- 没有正式 Presence 页面。
- 不能录音、对话、保存认知或同步 Obsidian。

### 验证结果

- format、lint、typecheck、test、build、smoke：通过。
- 测试：5 个文件共 8 项。

### 已知问题

- 当时的 Renderer 只是安全基础验证页。

### 下一步

JAR-002：建立设计系统基础。

---

## 2026-07-29 — JAR-002 设计系统基础

### 本次目标

建立统一、可访问、中文友好的 Jarvis 视觉语言与基础组件。

### 实现内容

- 建立 CSS variables 运行时 token 真源。
- 增加 Button、IconButton、Panel、Card、Badge、Tooltip、Dialog、ScrollArea、Spinner 和 VisuallyHidden。
- 增加交互状态、Dialog 焦点管理、长文本溢出与 reduced-motion。
- 增加开发专用 `#/design-system` showcase。
- 确立“编辑性认知观测空间”的视觉方向。

### 用户现在可以做什么

- 打开设计系统展示页检查颜色、排版、组件与状态。
- 使用键盘操作组件与 Dialog。

### 本轮尚不能做什么

- 没有正式 App Shell 或 Presence。
- 不能录音、对话或保存数据。

### 验证结果

- format、lint、typecheck、test、build、smoke：通过。
- 测试：9 个文件共 18 项。
- 视觉证据：`artifacts/jar-002/`。

### 已知问题

- 系统字体在非 Windows 环境可能略有差异。
- showcase 是开发验证页，不是正式产品页面。

### 下一步

JAR-003：实现 App Shell 与 Presence「此刻」页面。

---

## 2026-07-30 — JAR-003 App Shell 与 Presence「此刻」页面

### 本次目标

完成 Jarvis 的正式应用外壳和 Presence「此刻」页面，同时准确区分真实功能、Mock 数据和后续能力。

### 实现内容

- 新增中文左侧导航：此刻、对话、星图、演变、档案与设置。
- 仅激活“此刻”；其他入口禁用并显示“后续开放”。
- 新增中文优先、响应式 Presence 页面。
- 新增只表达 idle / 安静待命的语义 Orb。
- 新增正在探索的问题、尚未解开的疑问和最近认知变化。
- 将认知变化明确标记为“待确认 · 暂存观察”。
- 新增诚实的“按住说话”入口，明确当前不会录音。
- 新增文本问题与“继续探索”的页面内反馈。
- 支持 empty / single / populated 三种 typed Mock 状态。
- 支持 reduced-motion、低性能静态 Orb 与 200% 缩放布局。
- 新增强类型 `zh-CN` 文案目录和 `Intl` 中文日期/数字格式。
- 有限中文化 `#/design-system` showcase。
- 新增简体中文文案规范与 ADR-0005。

### 用户现在可以做什么

- 打开 Jarvis 并进入“此刻”。
- 查看 Mock 的最近探索、未解问题和候选认知变化。
- 选择一个问题并查看诚实的页面内继续反馈。
- 写下一个仅在当前页面暂存的问题。
- 使用键盘浏览和操作页面。
- 切换开发 URL 验证 empty / single / populated 状态。

### 本轮尚不能做什么

- 不能真实录音，也不会请求麦克风权限。
- 不能调用大模型、STT 或 TTS。
- 不能创建正式 Conversation。
- 不能保存会话、问题、认知候选或观点修订。
- 不能使用星图、演变、档案、设置或 Obsidian。

### 验证结果

- format：本地通过。
- lint：本地通过。
- typecheck：本地通过。
- test：本地通过，14 个文件共 32 项。
- build：本地通过。
- smoke：本地通过，真实 Electron 返回 `{"process":"main","status":"ok"}`。
- GitHub CI：通过，`Quality gates` 成功完成（Actions run `30510759971`）。
- 人工验收：1440×900、1024×900、empty、single、populated、键盘焦点、reduced-motion 和 200% 缩放均已检查。

### 视觉证据

- `artifacts/jar-003/presence-populated-1440x900.png`
- `artifacts/jar-003/presence-populated-1024x900.png`
- `artifacts/jar-003/presence-empty-1440x900.png`
- `artifacts/jar-003/presence-keyboard-focus-1440x900.png`
- `artifacts/jar-003/presence-reduced-motion-1440x900.png`
- `artifacts/jar-003/design-system-zh-cn-1440x900.png`
- 证据说明：`artifacts/jar-003/README.md`

### 已知问题

- Renderer bundle 约 620 kB，后续需要关注按路由拆分。
- Orb 只有 idle 状态，不应被误认为语音状态机。
- Presence 全部内容仍来自固定 Mock 数据。
- 非 Windows 系统字体可能导致换行略有差异。

### 下一步

JAR-004：接通真实麦克风权限、按住说话与语音状态机，并用确定性 Mock provider 验证录音、取消、错误恢复和打断。不得在 JAR-003 中提前实现。

---

## 2026-07-30 — JAR-004 语音状态机与 Mock 闭环

### 本次目标

建立第一条诚实、可取消、可恢复的语音交互闭环：真实麦克风录音与波形进入确定性 Mock 转录、理解、文字回答和本地播放。

### 实现内容

- 新增单一来源的强类型 reducer 与 `VoiceController`，覆盖九个 canonical phase 和独立权限状态。
- 每轮使用递增 `sessionId`，过期权限、录音、Mock chunk 和播放回调不会写入新一轮。
- 新增真实 `getUserMedia`、`MediaRecorder`、MIME 选择、Web Audio analyser、时长、300ms 最短与 60 秒最长边界。
- 支持 pointerdown / pointerup / pointercancel、pointer capture、Space / Enter 按住、key repeat 防重、Escape 与窗口失焦取消。
- 新增确定性模拟转录、理解延迟、中文回答分段输出。
- 新增本地 speechSynthesis 播放；系统语音不可用时使用 Web Audio 生成的温和确定性短音。
- 新增 speaking 再次按住的即时停止与新录音会话。
- Presence 新增紧凑“当前语音回合”，持续显示真实 / Mock 边界、阶段、时长、波形、转录、回答、取消与错误恢复。
- Orb、主按钮、状态文字、波形和当前回合全部从同一状态快照派生。
- 保持 preload 只有 health-check；音频不经 IPC、不上传、不写盘。
- 新增 reducer、控制器、录音边界、Mock loop、本地播放、交互与证据状态测试。

### 用户现在能做什么

- 首次按住时请求真实 Windows 麦克风权限。
- 允许后查看真实音量波形与录音时长，松开进入完整本地演示流程。
- 使用鼠标、触控、Space 或 Enter 按住说话。
- 在录音或处理中按 Escape 取消。
- 在 Jarvis 本地播放时再次按住，立即打断并开始下一次录音。
- 在权限拒绝、设备缺失、能力缺失、过短录音和播放失败后查看中文说明并恢复。

### 用户仍不能做什么

- 不能获得真实 STT 转录、模型理解或模型回答。
- 不能使用云端 TTS；仓库没有 API Key。
- 不能保存录音、语音回合、对话或认知数据。
- 不能进入正式 Conversation、星图、演变、档案或设置页面。

### 验证结果

- format、lint、strict typecheck：本地通过。
- test：本地通过，21 个文件共 63 项。
- build：本地通过。
- smoke：本地通过，生产 Electron 返回 `{"process":"main","status":"ok"}`。
- 人工验收：真实权限 requesting、真实 listening 波形、松开后的 Mock 全链、speaking 打断、Escape 清理均通过。
- 视觉：1440×900 七种状态与 1024×900 listening 均已检查；200% 缩放依赖纵向滚动但可操作。
- GitHub CI：通过；Draft PR #2 的 `Quality gates` 首轮在 59 秒内完成（Actions run `30514214080`）。

### 视觉证据

- `artifacts/jar-004/voice-idle-1440x900.png`
- `artifacts/jar-004/voice-listening-1440x900.png`
- `artifacts/jar-004/voice-transcribing-1440x900.png`
- `artifacts/jar-004/voice-responding-1440x900.png`
- `artifacts/jar-004/voice-speaking-1440x900.png`
- `artifacts/jar-004/voice-permission-denied-1440x900.png`
- `artifacts/jar-004/voice-reduced-motion-1440x900.png`
- `artifacts/jar-004/voice-listening-1024x900.png`

### 已知问题

- 系统中文语音包不可用时只能播放短音回退，文字回答仍完整保留。
- Windows 首次权限提示可能抢走焦点；应用会保持 requesting，并安全处理提前松开和迟到 stream。
- Renderer bundle 约 657 kB，需要在 JAR-005 继续关注。
- 当前轮刷新即消失，不保存历史。

### 下一步

JAR-005：实现正式 Conversation 空间。本轮到此停止，不创建 JAR-005 分支。

---

## 2026-07-30 — JAR-005 沉浸式 Conversation 空间

### 本次目标

让用户从 Presence 延续一个探索，在不是聊天气泡、不是仪表盘的中文 Conversation 空间中，用文字或语音继续同一段思考。

### 实现内容

- 激活 App Shell 的“对话”入口，并支持 `#/conversation` 与 exploration 查询参数。
- Presence 三个探索主题可以携带 id 进入对应 Conversation。
- 新增不确定性与群体、货币与制度、知识与行动落差三套确定性中文 Mock 场景。
- 新增编辑性对话时间线、讨论上下文和跨领域联系，不使用左右聊天气泡。
- 文字输入支持中文输入法组合、Enter 发送与 Shift+Enter 换行。
- 语音和文字共享同一 timeline，并显示来源、时间和 Mock 边界。
- 新增流式、取消、相同回答重试、离线、错误和未知 exploration 恢复。
- 默认语音手势改为点击开始 / 再次点击结束，同时保留按住模式。
- Presence 与 Conversation 共享交互模式；手势层只发出四种 capture 命令，继续复用单一 `VoiceController`。
- 建立 Voice Profile 文档契约，覆盖原创、正式授权角色和经同意克隆三类声线及授权元数据。
- 新增 ADR-0007，固定语音手势与 Voice Profile / Provider / Conversation 的长期边界。

### 用户现在可以做什么

- 从 Presence 选择一个问题并进入对应 Conversation。
- 在三个固定中文讨论中阅读连续历史和跨领域联系。
- 用文字继续讨论，并取消或重试本地模拟回答。
- 默认点击开始和结束真实麦克风录音，也可切换为按住说话。
- 在 Presence 与 Conversation 间保留本次运行中的语音手势偏好。
- 使用键盘浏览、聚焦输入、发送、换行、取消和切换语音模式。

### 用户目前还不能做什么

- 不能获得真实 STT、模型推理或云端 TTS。
- 不能保存 Conversation、消息、探索或认知变化；刷新后恢复固定 Mock 场景。
- 不能安装、预览或选择真实 Voice Profile。
- 不能使用 SQLite、星图、演变、档案、设置或 Obsidian。

### 验证结果

- format：通过。
- lint：通过。
- typecheck：通过。
- test：通过，25 个文件共 77 项。
- build：通过。
- smoke：通过，生产 Electron 返回 `{"process":"main","status":"ok"}`。
- GitHub CI：通过，Draft PR #3 的 `Quality gates` 成功完成（Actions run
  `30517812568`，1 分 15 秒）。
- 人工验收：通过 Presence / Conversation 导航、中文文字发送、真实麦克风 toggle
  listening 与第二次点击结束、hold 模式切换、键盘焦点、1024、200% 缩放、
  reduced-motion、streaming、offline 和 error 状态检查。

### 视觉证据

- 9 张生产 Electron PNG 和复现说明保存于 `artifacts/jar-005/README.md`。

### 已知问题

- 全部 Conversation 内容、跨领域联系和回答仍为确定性 Mock。
- Renderer 生产 bundle 约 689.62 kB，后续应评估按路由拆分。
- Voice Profile 当前只有规范和 ADR，尚未实现安装或 Provider binding。
- 当前 hash 路由适合小范围页面，路由继续增长时需要重新评估。

### 下一步

JAR-006：实现 vendor-neutral Provider contracts、Voice Profile 代码契约与一条真实中文语音路径。未经授权的具体人物或演员声音不得作为内置资产。本轮不创建或实现 JAR-006。

## 2026-07-30 — JAR-006A Provider 基础与真实文字对话路径

### 本次目标

在不改变 Conversation 编辑性体验的前提下，建立 vendor-neutral Provider 边界，并接通
一条安全、可取消的 OpenAI-compatible 真实文字流。真实 STT、真实 TTS、持久化和认知
提取均不在本轮范围。

### 实现内容

- 新增 Provider 公开配置、Conversation 请求/事件和 13 类统一错误契约。
- 新增 OpenAI-compatible Chat Completions SSE 适配器，支持分片、`[DONE]`、usage、
  timeout、取消、非 2xx、流中错误和累计响应上限。
- 新增 Jarvis 中文 prompt assembly：当前探索、领域、有限最近回合、跨领域边界与不确定性。
- 新增 main-process Provider service、运行时 payload 验证和按 WebContents / request ID
  隔离的 typed streaming IPC。
- 新增 Electron `safeStorage` 凭据加密、版本化 userData 配置、末四位脱敏与删除能力。
- 启用中文“设置”入口，支持连接测试、保存、删除、Mock / real 模式和分类错误。
- real 文字回答进入现有 Conversation 时间线；取消保留部分、失败保留用户输入、重试不
  复制用户消息，且不静默回退 Mock。
- Settings 使用 React lazy import；未增加 Provider SDK 或其他运行时依赖。
- 新增 localhost 假 Provider、Electron 完整 IPC 验收脚本和 8 张视觉证据。

### 用户现在可以做什么

- 在设置页配置并测试 OpenAI-compatible Base URL、模型和 API Key。
- 安全保存 Key，重启后只看到是否保存和末四位；也可以删除凭据并恢复 Mock。
- 在 Mock 与真实文字回答之间明确切换。
- 在 Conversation 中获得增量中文文字回答、取消、查看分类错误并从同一问题重试。
- 使用本地假 Provider 在没有真实 Key 的情况下验证完整网络与 IPC 链路。

### 用户目前还不能做什么

- 不能进行真实 STT 或真实 TTS。
- 不能安装、预览或绑定 Voice Profile。
- 不能持久化 Conversation、保存认知、使用 SQLite 或导出 Obsidian。
- 项目所有者尚未用自己的真实第三方 Provider 完成最终手工验收。

### 验证结果

- format：通过。
- lint：通过。
- typecheck：通过。
- test：104 项通过，包含真实 localhost HTTP 假 Provider。
- build：通过。
- smoke：通过；实际 Electron 返回 `JARVIS_IPC_SMOKE_OK`。
- Electron Provider acceptance：通过；加密保存、脱敏、完整 SSE 和取消均返回
  `JARVIS_PROVIDER_ACCEPTANCE_OK`，测试后删除虚构凭据。
- GitHub CI：等待 Draft PR。

### 视觉证据

- `artifacts/jar-006a/settings-provider-empty-1440x900.png`
- `artifacts/jar-006a/settings-provider-configured-masked-1440x900.png`
- `artifacts/jar-006a/settings-provider-success-1440x900.png`
- `artifacts/jar-006a/settings-provider-error-1440x900.png`
- `artifacts/jar-006a/conversation-real-streaming-1440x900.png`
- `artifacts/jar-006a/conversation-real-complete-1440x900.png`
- `artifacts/jar-006a/conversation-real-cancelled-1440x900.png`
- `artifacts/jar-006a/conversation-provider-offline-1024x900.png`

### 已知问题

- OpenAI-compatible Provider 的 usage 和流中错误细节并不完全一致，后续需要按真实服务
  验收结果补充兼容性。
- Renderer entry 为约 700.70 kB；Settings 已拆分为 15.58 kB JS / 5.99 kB CSS，Conversation
  因共享语音控制器暂未拆分。
- JAR-006A 在项目所有者完成真实 Provider 验收前不得宣称完全完成或自动合并。

### 下一步

先由项目所有者在应用设置页完成真实 Provider 测试并确认。通过、CI 和合并完成后才建议
进入 JAR-006B；本轮不创建 JAR-006B 分支。
