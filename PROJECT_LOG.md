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
