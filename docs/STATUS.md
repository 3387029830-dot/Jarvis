# Jarvis 当前状态

最后更新：2026-07-30

当前版本：`0.1.0` / JAR-004

当前阶段：真实麦克风与本地 Mock 语音闭环完成，等待进入 JAR-005

## 已真实实现

- Electron 桌面应用可以启动。
- main / preload / renderer 保持安全隔离，renderer 未获得 Node 能力。
- preload 只公开强类型 `window.jarvis.healthCheck()`。
- 简体中文优先的设计系统、中文字体栈和中英文混排规范。
- Button、IconButton、Panel、Card、Badge、Tooltip、Dialog、ScrollArea 等基础组件。
- 中文 App Shell、当前导航状态与不可用入口说明。
- Presence「此刻」页面的响应式布局和 empty / single / populated 三种视图。
- “继续探索”和文本问题的页面内诚实反馈。
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
- “继续探索”和文本问题只在当前页面显示确定性反馈，不调用模型、不创建对话、不持久化。
- “模拟转录”是固定中文演示问题，不声称还原用户刚才说出的内容。
- understanding 与回答内容是可取消的确定性 Mock。
- 回答按固定片段流式显示。
- 语音播放的内容来自固定 Mock 回答；优先使用本地 speechSynthesis，失败时播放本地生成短音。

## 尚未实现

- 真实 STT、模型理解、模型回答和云端 TTS。
- 对录音内容进行真实识别；当前转录是演示 Mock。
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

在 `#/presence` 的“当前语音回合”中可体验真实录音与本地 Mock 闭环。`voice` 查询参数只用于生产 Electron 的视觉证据，不是产品设置。

## 已知问题

- Windows 是当前主要视觉验收环境；其他系统的中文字体渲染可能略有不同。
- Renderer 生产 bundle 约为 657 kB，后续页面增多前需要持续观察并考虑按路由拆分。
- 200% 缩放下布局会转为顶部精简导航并依赖纵向滚动，功能可用但信息密度明显降低。
- speechSynthesis 的中文音色、语速和可用性受 Windows 已安装语音影响；不可用时只播放确定性短音，不会伪装成真实语音合成。
- 首次系统权限提示可能暂时抢走应用键盘焦点；界面在权限返回前保持 requesting，提前松开后会停止迟到的 stream。
- 没有麦克风、权限拒绝和浏览器能力缺失均有中文恢复提示，但不同 Windows 隐私设置的系统提示样式不受应用控制。
- 所有 Presence 内容均为开发 Mock，不代表用户数据已经被保存。

## 下一步

JAR-005：建立沉浸式 Conversation 空间，让语音与文字共享同一段可读的对话结构。进入前仍应保留 JAR-004 的真实录音 / Mock 内容边界，不得把固定转录描述为真实 STT。
