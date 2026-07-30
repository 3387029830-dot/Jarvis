# ADR-0006 — Renderer 本地语音会话与临时内存音频

## 状态

已接受

## 背景

JAR-004 需要用真实麦克风验证按住说话、波形、取消、播放和打断，但明确禁止真实 STT、模型、云端 TTS、音频上传、磁盘写入和 preload 扩展。

如果把 Orb、按钮、转录和播放分别放在组件状态中，异步权限、录音、流式 chunk 和新一轮打断会产生互相矛盾的 UI。把音频送入 main 则会提前形成 JAR-006 的 provider 与 IPC 合同。

## 决定

- 在 renderer 使用纯 `voiceReducer` 和一个 `VoiceController` 作为单一状态源。
- canonical phase 与权限状态放在同一个强类型 state 中。
- 每轮生成递增 `sessionId`，reducer 拒绝旧 session action。
- 录音通过浏览器 `getUserMedia`、`MediaRecorder` 和 Web Audio 完成。
- Blob 只短暂保存在控制器字段中，模拟转录回调、取消、错误或 dispose 时立即清空。
- 音频不经 IPC、不写盘、不上传。
- Mock playback 优先 speechSynthesis，失败时使用 Web Audio 确定性短音；不建立厂商 Provider Gateway。

## 结果

优点：

- 状态一致、易于单元测试，并能安全处理权限迟到、打断和旧异步回调。
- 保持 JAR-001 Electron 安全边界和最小 preload。
- 音频生命周期短且可审计。
- JAR-006 可替换 Mock runner / playback，而不改变 Presence 的状态展示合同。

代价：

- JAR-004 只适合本地演示，不能调用真实 provider。
- speechSynthesis 体验依赖系统语音；短音 fallback 只验证播放生命周期，不模拟真实发音质量。
- 未来真实 provider 接入时需要新增经过单独 ADR 审查的 main-process service 与最小 typed IPC。
