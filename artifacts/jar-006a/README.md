# JAR-006A 视觉验收证据

生成日期：2026-07-30。所有图片由 production Electron 在固定 evidence 状态下生成，且在
截图前通过 `window.jarvis.healthCheck()` 验证 main / preload IPC。图片不包含真实
Provider 凭据或私人回答；`2468` 是虚构掩码。

## 截图

- `settings-provider-empty-1440x900.png`：未配置、Mock 默认、Base URL / 模型 / Key 空态
  和本轮安全边界。
- `settings-provider-configured-masked-1440x900.png`：已配置但仍为 Mock；只显示虚构末四位
  `2468`，不回显完整 Key。
- `settings-provider-success-1440x900.png`：连接测试成功、真实文字模式、最近验证时间和删除
  凭据入口。
- `settings-provider-error-1440x900.png`：authentication 分类、HTTP 状态、中文恢复提示；
  不显示请求头或 Provider 错误原文。
- `conversation-real-streaming-1440x900.png`：真实模式增量回答、停止按钮和真实 Provider
  标签。
- `conversation-real-complete-1440x900.png`：真实文字回答完成后保留编辑性时间线；右侧不
  展示固定 Mock 认知交汇。
- `conversation-real-cancelled-1440x900.png`：取消后保留已显示部分并停止继续追加。
- `conversation-provider-offline-1024x900.png`：最小支持宽度下的 network 错误、重试路径和
  响应式输入区。
- `conversation-composer-idle-1440x900.png`：空闲时的 composer 基准几何；identity、
  文字输入和语音区组成三个稳定区域。
- `conversation-composer-streaming-1440x900.png`：真实文字流式状态；原“发送文字”位置
  替换为“停止生成”，Orb、输入框宽度和语音区位置不变。
- `conversation-composer-streaming-1024x900.png`：最小支持宽度的命名区域重排；没有
  横向滚动，语音区不会被临时按钮挤入额外自动行。
- `conversation-composer-cancelled-1440x900.png`：取消后已显示片段保留，固定操作槽恢复
  “发送文字”，composer 外部位置与三大区域保持不变。

## Composer 阻塞问题与修复

原问题发生在 `activeResponseId` 为真时：一个“取消本轮”按钮被条件性插入
`.conversation-composer`，成为位于文字输入和 `VoiceInteraction` 之间的第 4 个直接
Grid child。父级只有三列且没有命名区域，浏览器自动放置会把语音区排到新行，因此回答开始
和结束时都出现明显跳动。

修复后，composer 的直接子元素固定为 `identity`、`text`、`voice` 三个命名区域；生成
控制始终存在于 `text` 内的固定槽，空闲显示“发送文字”，生成时在同一位置显示“停止生成”。
Voice Provider 状态不会改变 voice 容器结构。用户可以在生成期间编辑下一条草稿，Enter
不会并发提交，取消后草稿仍在。

时间线只使用 `.conversation-reading` 的内部滚动，并通过 `scrollbar-gutter: stable`
避免滚动条宽度抖动。用户接近底部时新片段会直接跟随；主动向上阅读后不会被每个 chunk
拉回，而是显示“回到最新回答”。只有用户点击该入口时使用一次平滑滚动，reduced-motion
下改为即时滚动。

## 真实能力与 Mock 边界

真实实现包括 main-process HTTP、OpenAI-compatible SSE、typed IPC、取消、分类错误、
safeStorage、配置脱敏与 Settings 交互。自动测试还使用真实 localhost HTTP server 验证
跨 chunk JSON、模型切换、usage 与 `[DONE]`。

截图中的 Provider 回答和配置状态是确定性 evidence 数据，不是第三方模型调用。语音录音
仍为真实本地麦克风，但 STT、理解、语音回答和播放仍是 JAR-004/005 Mock。本轮不持久化
消息，不生成认知候选。

## 复现

先执行 `corepack pnpm build`。截图由 `JARVIS_EVIDENCE=1`、
`JARVIS_EVIDENCE_ROUTE=settings|conversation`、对应的
`JARVIS_SETTINGS_STATE` / `JARVIS_CONVERSATION_STATE`、窗口尺寸和
`JARVIS_SMOKE_SCREENSHOT` 驱动 `corepack pnpm smoke` 生成。查询参数只服务开发证据，
不是产品设置。

本地完整链路可以先运行 `corepack pnpm provider:fake`，再用设置页配置
`http://localhost:4317/v1`、`jarvis-local-fake` 和任意虚构测试 Key。真实第三方
Provider 验收仍等待项目所有者在本机设置页完成。

## Composer 证据复现

先执行 `corepack pnpm build`，再以 production Electron smoke 运行：

- idle：`JARVIS_CONVERSATION_STATE=normal`
- streaming：`JARVIS_CONVERSATION_STATE=real-streaming`
- cancelled：`JARVIS_CONVERSATION_STATE=real-cancelled`
- 宽度：`JARVIS_SMOKE_WIDTH=1440` 或 `1024`

共同设置 `JARVIS_EVIDENCE=1`、`JARVIS_EVIDENCE_ROUTE=conversation`、
`JARVIS_VOICE_STATE=idle`、`JARVIS_SMOKE_HEIGHT=900`，并用
`JARVIS_SMOKE_SCREENSHOT` 指定对应文件。四张图使用确定性 evidence Provider 内容，
不是第三方真实输出，也不含 API Key。

## Bundle

- JAR-005 Renderer entry：689.62 kB。
- JAR-006A Composer 修复后 Renderer entry：704.65 kB。
- Settings lazy JS：15.58 kB。
- Settings lazy CSS：5.99 kB。
- Provider SDK：未引入；网络实现只进入 main。

## 已知限制

- 不同兼容 Provider 对 usage 和流中错误格式可能存在差异。
- Conversation 尚未路由拆分；当前共享语音控制器使本轮拆分风险高于收益。
- 没有真实 STT、真实 TTS、SQLite、认知提取或 Voice Profile Provider binding。
- 未使用项目所有者真实凭据前，JAR-006A 不宣称完全验收通过。
- 200% 缩放使用顶部精简导航和纵向回流，功能可操作但同屏可见内容明显减少。
