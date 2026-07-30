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

## Bundle

- JAR-005 Renderer entry：689.62 kB。
- JAR-006A Renderer entry：700.70 kB。
- Settings lazy JS：15.58 kB。
- Settings lazy CSS：5.99 kB。
- Provider SDK：未引入；网络实现只进入 main。

## 已知限制

- 不同兼容 Provider 对 usage 和流中错误格式可能存在差异。
- Conversation 尚未路由拆分；当前共享语音控制器使本轮拆分风险高于收益。
- 没有真实 STT、真实 TTS、SQLite、认知提取或 Voice Profile Provider binding。
- 未使用项目所有者真实凭据前，JAR-006A 不宣称完全验收通过。
