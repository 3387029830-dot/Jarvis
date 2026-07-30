# JAR-003 视觉验收证据

本目录保存 JAR-003 App Shell 与 Presence「此刻」页面的正式视觉证据。所有图片均由生产构建的 Electron Renderer 在真实 preload health-check 成功后通过 `capturePage()` 生成，不是静态设计稿。

## 截图说明

### `presence-populated-1440x900.png`

- 展示 1440×900 丰富状态。
- 验证中文 App Shell、当前/禁用导航、问候、idle Orb、文本入口、诚实语音入口、正在探索、未解疑问和 Mock 边界。
- 复现：`#/presence?variant=populated`。

### `presence-populated-1024x900.png`

- 展示 1024 px 最小支持宽度。
- 验证导航、中文标题、Orb、输入区与内容列没有互相覆盖，页面可继续纵向滚动。
- 复现：在 1024×900 Electron 窗口打开 `#/presence?variant=populated`。

### `presence-empty-1440x900.png`

- 展示没有探索、疑问和认知候选时的完整空状态。
- 验证页面不会退化为“有什么可以帮助你”的普通聊天空白页，并明确说明何时才会保留认知。
- 复现：`#/presence?variant=empty`。

### `presence-keyboard-focus-1440x900.png`

- 展示“按住说话”按钮获得键盘焦点后的双层轮廓。
- 验证焦点不仅依赖颜色变化，同时保留深色间隔和外轮廓。
- 复现：`#/presence?variant=populated&focus=voice`；正常使用时可按 Tab 到达。

### `presence-reduced-motion-1440x900.png`

- 展示减少动态效果状态。
- 页面明确显示“已减少动态效果：Orb 保持静态”，Orb 仍表达“安静待命”。
- 复现：`#/presence?variant=populated&motion=reduced`，或在操作系统开启 reduced-motion。

### `design-system-zh-cn-1440x900.png`

- 展示有限中文化后的开发 design-system showcase。
- 验证正式方向改为中文优先，同时保留 JAR、React、CSS variables 等必要技术标识。
- 复现：`#/design-system`。该入口不出现在正式产品导航中。

## 真实功能与 Mock 边界

真实功能：

- Electron 安全启动与 preload health-check。
- hash 路由选择、响应式布局、键盘焦点、页面内交互反馈。
- empty / single / populated typed view-model 渲染。
- reduced-motion 与低性能静态 Orb 回退。

Mock 或未接通：

- 问候、探索、疑问、认知变化和更新时间来自固定 Mock 数据。
- “继续探索”与文本提问只产生页面内反馈，不创建 Conversation，也不保存。
- “按住说话”不会请求麦克风、不会录音、不会触发 STT/模型/TTS。
- 最近认知变化只是“待确认 · 暂存观察”，不是已确认记忆。

## 中文优先与英文边界

产品导航、标题、操作、状态、空状态和能力说明均使用简体中文。英文仅保留 Jarvis 品牌、`Presence` 弱辅助标签、`Mock` 与开发技术名词。规范见 `docs/COPY_GUIDE_ZH_CN.md` 和 ADR-0005。

## 其他人工验证

- `single`：使用 `#/presence?variant=single` 检查只有一条探索时的留白和内容宽度。
- 200% 缩放：在 1024×900 窗口设置 zoom factor 2，布局转为顶部精简导航；核心问候、Orb、入口与内容均可通过纵向滚动访问。
- 键盘：Tab 可到达当前导航、问题输入、暂存按钮、语音入口和继续探索；禁用入口不可触发。

## 当前不足

- Orb 只有 idle 表达；没有 listening、transcribing、responding 等语音状态。
- 页面内容未持久化，刷新或关闭后恢复固定 Mock 状态。
- 200% 缩放主要依赖纵向滚动，不追求在单屏同时展示全部内容。
- 非 Windows 系统字体可能导致字面宽度和换行略有变化。
