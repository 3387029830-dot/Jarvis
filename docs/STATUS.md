# Jarvis 当前状态

最后更新：2026-07-30

当前版本：`0.1.0` / JAR-003

当前阶段：App Shell 与 Presence「此刻」页面完成，等待进入 JAR-004

## 已真实实现

- Electron 桌面应用可以启动。
- main / preload / renderer 保持安全隔离，renderer 未获得 Node 能力。
- preload 只公开强类型 `window.jarvis.healthCheck()`。
- 简体中文优先的设计系统、中文字体栈和中英文混排规范。
- Button、IconButton、Panel、Card、Badge、Tooltip、Dialog、ScrollArea 等基础组件。
- 中文 App Shell、当前导航状态与不可用入口说明。
- Presence「此刻」页面的响应式布局和 empty / single / populated 三种视图。
- “继续探索”、文本问题和语音入口的页面内诚实反馈。
- 键盘导航、清晰焦点、reduced-motion 和低性能静态 Orb 回退。
- format、lint、strict typecheck、单元/组件测试、build、Electron IPC smoke 和 GitHub CI 配置。

## 使用 Mock 数据模拟

- 问候语由本地 typed view-model 变体决定，不来自真实用户历史。
- “正在探索”的问题、领域和更新时间均为仓库内固定 Mock 数据。
- “尚未解开的疑问”为固定 Mock 数据。
- “最近的认知变化”为固定候选观察，并明确标记“待确认 · 暂存观察”。
- “继续探索”和文本问题只在当前页面显示确定性反馈，不调用模型、不创建对话、不持久化。

## 尚未实现

- 真实麦克风输入和权限流程。
- 语音状态机、录音、STT、模型回复、TTS、播放与打断。
- Conversation 正式页面。
- SQLite、本地会话持久化和认知事件。
- 真实认知提取、用户确认与观点修订历史。
- 星图、演变、档案和设置页面。
- Obsidian 同步或导出。
- 真实模型、STT 或 TTS API；仓库中没有真实 API Key。

## 当前可访问和体验的页面

- `#/presence`：默认 Presence「此刻」页面。
- `#/presence?variant=populated`：丰富 Mock 状态。
- `#/presence?variant=single`：单条探索 Mock 状态。
- `#/presence?variant=empty`：空状态。
- `#/design-system`：仅开发验证使用的设计系统展示页，不出现在产品导航中。

## 已知问题

- Windows 是当前主要视觉验收环境；其他系统的中文字体渲染可能略有不同。
- Renderer 生产 bundle 约为 620 kB，后续页面增多前需要持续观察并考虑按路由拆分。
- 200% 缩放下布局会转为顶部精简导航并依赖纵向滚动，功能可用但信息密度明显降低。
- 当前 Orb 只是 idle 语义状态的 CSS 表达，不代表语音状态机已经存在。
- 所有 Presence 内容均为开发 Mock，不代表用户数据已经被保存。

## 下一步

JAR-004：接通真实麦克风权限与按住说话输入，建立单一来源的语音状态机，并通过确定性 Mock STT / 模型 / TTS 闭环验证录音、取消、错误恢复和打断。开始前不得把当前页面内反馈误当作真实对话能力。
