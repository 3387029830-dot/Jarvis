# Jarvis 语音体验规范

## 1. 原则

语音不是后续插件，而是 Jarvis 的第一入口。JAR-005 默认使用“点击开始、再次点击结束”，同时保留可选“按住说话”；两者共享同一个控制器、状态机和页面间偏好。状态可见、随时可取消优先于 VAD、全双工或唤醒词。

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

## 3. JAR-004 / JAR-005 实际行为

- `toggle` 是默认模式：点击或聚焦后按 Space / Enter 开始，再次激活结束。
- `hold` 是可选模式：pointerdown / keydown 开始，pointerup / keyup 结束。
- 两种模式在 Presence 和 Conversation 之间共享，但刷新后恢复默认；它不是持久设置。
- 模式切换只适配手势，统一发出 `startCapture`、`finishCapture`、`cancel`、`interruptAndCapture`，不得复制状态机。
- 只在明确的开始录音手势后请求权限，应用启动和页面切换不会预先请求。
- 获得权限后使用 `MediaRecorder` 录音，并用 `AnalyserNode` 生成真实音量 level。
- 松开后停止 recorder、analyser、animation frame、tracks 和 AudioContext，再进入 Mock 链。
- 小于 300ms 的录音不进入模拟转录；60 秒时自动结束。
- pointercancel、Escape、窗口失焦和组件卸载都会清理当前资源。
- key repeat 不创建新 session；pointer capture 保证指针移出按钮仍可正确松开。
- speaking 时新的点击或按住先停止 playback 和旧 AbortController，再创建新 session。
- Presence 只保留当前一轮；Conversation 会把文字和模拟语音结果投影到同一时间线，但不持久化。

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

- 用户激活语音入口后 100ms 内显示权限请求或 listening 状态，但不得提前声称录音。
- 每个阶段都有简体中文文本等价描述。
- 用户可取消所有处理阶段，并可在 speaking 时立即打断。
- reduced-motion 移除位移、缩放和连续动画，保留静态边框、文字、level 与 phase 差异。
- Orb 不使用粒子场、HUD、随机波形或与麦克风无关的 listening 动画。

## 9. 交互模式演进

- 当前默认：`toggle`，适合桌面持续思考和较长表达。
- 当前可选：`hold`，适合短句、明确的开始/结束边界和已有肌肉记忆。
- 后续候选：VAD 或连续对话，但必须作为适配层接入同一命令契约，不能建立第二套 `VoiceController`。
- 文字输入始终是同等可用的回退路径；TTS 失败不得隐藏已经生成的文字。
- 交互模式与 Voice Profile 相互独立：切换声线不会改变录音手势、Conversation 记忆或 Jarvis 人格。

## 10. JAR-006B 真实 STT

- canonical phase 不新增第二套状态机；real STT 只替换 `transcribing` 的 Mock 实现。
- 真实转录到达后保持 `phase=transcribing`，并进入 `transcriptReview=pending`。
- 用户确认后才进入 `understanding`；未确认文字不进入 Conversation timeline。
- 修改后的转录仍是 voice 来源，并记录 `transcriptionEdited`。
- 如果 composer 已有草稿，转录先进入冲突缓冲区，必须明确替换或追加。
- 失败可重试当前一份内存录音；重新录音、取消、成功或卸载释放它。
- STT 配置读取或真实请求失败不得静默回退 Mock。
- 音频以二进制 typed IPC 交给 main，Renderer 不持有凭据，也不直接请求 Provider。

## 11. 后续能力

以下不属于 JAR-004：

- 真实 STT / 模型 / 云端 TTS；
- Conversation 历史与持久化；
- VAD、持续监听、全局快捷键、全双工和唤醒词；
- 永久原始音频归档；
- provider 选择、凭据与自动删除设置。

Voice Profile 的类别、授权来源和 Provider binding 见 `docs/VOICE_PROFILES.md`。

## 12. JAR-006C 真实语音合成

- TTS 是 Conversation 完成后的独立播放维度，不把文字 Provider 状态伪装成 speaking。
- 可见状态由 recording/STT、Conversation、TTS 三个维度按优先级派生；只有真实音频开始
  播放才显示 speaking，preparing 仍保留明确文字说明。
- 回答先规范化并按中文语义边界确定性分段；第一段可用即播放，最多并行预取两段，
  严格按原顺序且不重叠。
- 手动播放为默认；自动与关闭可持久化。每个完成回答都有固定朗读/停止入口。
- 新录音、新文字、Escape、停止、错误和卸载会取消未完成请求、暂停当前音频并撤销 Blob URL。
- 任一分段失败即停止后续队列；完整文字不受影响，可重新朗读。
- 只有经过 main 重新验证、仍然有效且已绑定的 Voice Profile 才能进入连接测试或正式合成；
  profile 过期、授权依据不匹配或配置损坏时，界面显示明确的中文错误并保留文字回答。

## JAR-006A 边界（历史）

JAR-006A 只替换文字 Conversation Provider，不改变语音状态机：

- 麦克风采集仍是 Renderer 本地、短暂且不通过 Provider IPC；
- STT、understanding、语音回答与播放仍是明确标注的确定性 Mock；
- real 文字回答完成后不会进入真实或系统 TTS；
- `VoiceProfile` 不安装、不预览、不选择，也不绑定 Provider voice ID；
- JAR-006B 已引入真实 STT；JAR-006C 才能引入真实 TTS 与授权声线 binding。
