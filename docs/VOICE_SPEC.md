# Jarvis 语音体验规范

## 1. 原则

语音不是后续插件，而是 Jarvis 的第一入口。第一阶段优先保证按住说话可靠、状态可见、随时可取消，再考虑 VAD、全双工或唤醒词。

JAR-004 必须持续区分：

- 真实能力：权限请求、录音、时长、音量波形、本地播放、取消、打断和清理。
- Mock 能力：转录、理解、回答内容、文字流式输出和播放内容。

正式界面使用：

> 演示模式：录音与波形来自真实麦克风，转录和回答暂为模拟内容。

固定文本必须标为“模拟转录”，不得写成“你刚才说”。

## 2. Canonical state machine

标准路径：

```text
idle
  → listening
  → transcribing
  → understanding
  → responding_text
  → speaking
  → idle
```

取消与恢复路径：

```text
listening | transcribing | understanding | responding_text → cancelled → idle
speaking → interrupted → listening | idle
任意运行状态 → error → recoverable idle
```

Canonical phase：

- `idle`
- `listening`
- `transcribing`
- `understanding`
- `responding_text`
- `speaking`
- `interrupted`
- `cancelled`
- `error`

麦克风权限是同一 `VoiceControllerState` 的独立字段：

- `unknown`
- `requesting`
- `granted`
- `denied`
- `unavailable`

`permission=requesting` 时 phase 不得伪装为 `listening`。Orb、按钮、状态文案、波形、转录和播放必须从同一个 state snapshot 派生。

每轮使用 `sessionId`；与当前 session 不一致的异步 action 必须被 reducer 忽略。

## 3. JAR-004 实际行为

- 只在 pointerdown 或聚焦按钮后的 Space / Enter keydown 请求权限。
- 获得权限后使用 `MediaRecorder` 录音，并用 `AnalyserNode` 生成真实音量 level。
- 松开后停止 recorder、analyser、animation frame、tracks 和 AudioContext，再进入 Mock 链。
- 小于 300ms 的录音不进入模拟转录；60 秒时自动结束。
- pointercancel、Escape、窗口失焦和组件卸载都会清理当前资源。
- key repeat 不创建新 session；pointer capture 保证指针移出按钮仍可正确松开。
- speaking 时新的按住先停止 playback 和旧 AbortController，再创建新 session。
- Presence 只保留当前一轮，不创建消息时间线，不持久化。

## 4. 确定性 Mock 链

JAR-004 使用集中配置的固定中文内容与延迟：

1. `transcribing`：等待固定短延迟，生成明确标注的模拟转录。
2. `understanding`：显示可取消的本地 Mock 整理阶段。
3. `responding_text`：按固定片段输出中文回答。
4. `speaking`：本地播放同一固定回答；结束后返回 `idle`。

测试可注入零延迟、假 capture 和假 playback，不访问真实麦克风或系统语音。

## 5. 本地播放

JAR-004 不建立 JAR-006 的 Provider Gateway。

- 优先使用浏览器 `speechSynthesis` 播放固定 `zh-CN` Mock 回答。
- speechSynthesis 不可用或失败时，使用 Web Audio oscillator 在本地生成温和、确定性的短音。
- 不从网络加载音频。
- playback 适配层支持 start、stop、ended、error 和 interruption。
- 播放失败时进入可恢复 error，但保留完整文字并显示“语音播放失败，文字回答仍可阅读。”

## 6. 音频与清理边界

- 原始音频只存在于 renderer 内存。
- Blob 只保留到模拟转录回调；随后立即置空。
- 音频不上传、不写入磁盘、不记录到 console、不通过 IPC。
- 取消、错误、过短、设备断开、卸载和旧 session 都必须停止 tracks，并释放 recorder、AudioContext、RAF、timer、AbortController 与 playback。
- preload API 仍只有 `window.jarvis.healthCheck()`。

## 7. Electron 边界

JAR-004 是完全本地的 Mock 纵向切片：

- renderer 使用浏览器媒体 API 完成真实录音和本地播放。
- main / preload 不接收音频，不增加 voice IPC。
- renderer 不获得 Node 能力、文件系统或凭据。

JAR-006 接入真实 STT、模型与 TTS 时，凭据和网络调用必须进入 main-process service；届时再设计最小、强类型、不能传递任意 IPC 的 provider 边界。

## 8. 状态体验目标

- 按下后 100ms 内显示权限请求或 listening 状态，但不得提前声称录音。
- 每个阶段都有简体中文文本等价描述。
- 用户可取消所有处理阶段，并可在 speaking 时立即打断。
- reduced-motion 移除位移、缩放和连续动画，保留静态边框、文字、level 与 phase 差异。
- Orb 不使用粒子场、HUD、随机波形或与麦克风无关的 listening 动画。

## 9. 后续能力

以下不属于 JAR-004：

- 真实 STT / 模型 / 云端 TTS；
- Conversation 历史与持久化；
- VAD、持续监听、全局快捷键、全双工和唤醒词；
- 永久原始音频归档；
- provider 选择、凭据与自动删除设置。
