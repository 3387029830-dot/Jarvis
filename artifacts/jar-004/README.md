# JAR-004 视觉验收证据

本目录保存 JAR-004 语音状态机与本地 Mock 闭环的正式视觉证据。PNG 由生产构建的 Electron Renderer 在 preload health-check 成功后使用 `capturePage()` 生成。

为保证截图可重复，phase 截图使用只读 URL evidence state；它们验证真实组件、布局、文案和状态派生，但不会伪装成截图时正在使用麦克风。真实麦克风闭环另行在可见 Windows Electron 窗口中人工验收。

## 截图

- `voice-idle-1440x900.png`：验证 idle Orb、按住入口、Mock 披露和应用启动时不主动请求权限。
- `voice-listening-1440x900.png`：验证 listening 文案、录音时长、波形、Esc 取消和同一 state 驱动的 Orb/按钮/当前轮。
- `voice-transcribing-1440x900.png`：验证录音已停止、模拟转录阶段和取消动作。
- `voice-responding-1440x900.png`：验证“模拟转录”、分段回答和 responding_text 状态。
- `voice-speaking-1440x900.png`：验证本地播放状态与“再次按住即可打断”。
- `voice-permission-denied-1440x900.png`：验证中文权限错误、重新尝试和继续使用文字。
- `voice-reduced-motion-1440x900.png`：验证 responding_text 在 reduced-motion 下保留静态 phase、文字和边框反馈，移除连续动画。
- `voice-listening-1024x900.png`：验证最小桌面宽度下真实波形区域、时间、取消和 Mock 边界仍同时可操作。

## 真实能力与 Mock 边界

真实：

- 用户操作后的麦克风权限请求。
- `MediaRecorder` 内存录音、支持 MIME 选择、真实时长。
- `AnalyserNode` 真实音量 level；实际 listening 波形不使用随机数。
- 按住、松开、pointer cancel、Escape、窗口失焦、停止 tracks 和资源清理。
- 本地 playback 生命周期与 speaking 打断。

Mock：

- 固定“模拟转录”。
- 固定 understanding 延迟与中文回答片段。
- speechSynthesis / 本地短音播放的内容。

## 进入状态

真实体验：

1. 运行 `pnpm dev`，打开默认 `#/presence`。
2. 按住语音按钮或聚焦后按住 Space / Enter。
3. 允许权限后说话；松开进入 Mock 链。
4. listening/处理中按 Escape 取消；speaking 时再次按住打断。

截图复现使用生产 evidence 环境变量 `JARVIS_VOICE_STATE`，支持 `idle`、`listening`、`transcribing`、`responding`、`speaking` 和 `permission-denied`；该入口不属于产品设置。

## 清理、取消与错误恢复

- release 后 recorder 停止并立即关闭 analyser、RAF、AudioContext 和所有 tracks。
- Blob 只保留到模拟转录回调。
- cancel、error、dispose 和设备 ended 都会停止当前 capture / playback。
- 权限返回前松开时，迟到 stream 会立即停止，不会进入 listening。
- 过短录音、权限拒绝、无设备、能力缺失、录音失败和播放失败均有中文恢复路径。
- 播放失败保留完整文字。

## 人工验收

- Windows 首次权限：requesting 状态真实出现；权限返回前没有显示 listening。
- 允许权限：真实录音时长与 analyser 波形可见。
- 完整回合：`listening → transcribing → understanding → responding_text → speaking → idle` 通过。
- 打断：speaking 再次按住立即进入新 session 的 listening。
- 取消：新 listening 按 Escape 回到 idle，麦克风占用结束。
- 200% 缩放：核心入口和当前轮通过纵向滚动可操作。
- 离线：生产构建从本地文件启动；Mock runner、speechSynthesis / Web Audio fallback 无 fetch、XHR 或远程音频依赖。没有关闭整机网卡。
- DevTools / stderr：人工运行没有未处理异常。

## 已知限制

- evidence listening 图中的 level 是确定性快照；真实 analyser 已在人工验收中单独检查。
- 系统中文语音缺失时 fallback 是短音，只验证播放、停止和打断，不提供真实发音。
- 首次系统权限 UI 的外观和焦点行为由 Windows / Electron 控制。
- 当前语音轮刷新后不恢复，也不保存多轮历史。
