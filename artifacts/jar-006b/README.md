# JAR-006B 视觉与实机验收证据

本目录保存生产构建 Electron 的确定性视觉证据。截图不包含真实 API Key、私人音频或
私人转录；`example` 地址、模型和末四位均为仓库证据数据。

## 截图

- `settings-stt-empty-1440x900.png`：Editorial Chapters、空 STT 配置、Mock 默认状态和
  音频隐私说明。
- `settings-stt-configured-masked-1440x900.png`：真实 STT 已配置、Key 只显示末四位
  `1357`，完整凭据不回显。
- `voice-real-transcribing-1440x900.png`：real STT 正在识别，composer 三个顶层区域保持
  固定。
- `voice-real-transcript-review-1440x900.png`：“语音转录待确认”、现有文字区编辑和主动
  “发送给 Jarvis”。
- `voice-real-transcript-edited-1440x900.png`：用户修改识别结果后的待确认状态。
- `voice-real-stt-error-1440x900.png`：分类错误、重试识别、重新录音和文字回退。
- `voice-real-stt-1024x900.png`：最小桌面宽度下的确认区、Orb、文字与语音控制。
- `voice-real-stt-reduced-motion-1440x900.png`：相同确认状态在 reduced-motion 契约下
  保留静态状态反馈。
- `voice-real-stt-200-percent-1440x900.png`：200% 缩放下的精简顶部导航与纵向滚动。

## 真实功能与证据状态

真实实现：设置章节切换、脏表单提示、preload STT API、二进制 IPC、main 网络、凭据
遮罩、取消、转录确认、编辑元数据和草稿保护。

确定性证据：截图中的录音时长、转录、错误、Provider 地址和末四位来自
`JARVIS_EVIDENCE`，用于稳定复现视觉状态，不声称发生了第三方请求。

独立功能验收使用 `fake-openai-provider.mjs` 和生产 Electron，完成连接测试、配置保存、
typed binary IPC、multipart `/audio/transcriptions`、中文结果、取消、遮罩和凭据删除，
日志返回 `JARVIS_SPEECH_ACCEPTANCE_OK`。

## 复现

先运行 `corepack pnpm build`，再设置以下环境变量并执行 `corepack pnpm smoke`：

```powershell
$env:JARVIS_EVIDENCE = '1'
$env:JARVIS_EVIDENCE_ROUTE = 'conversation'
$env:JARVIS_VOICE_STATE = 'real-review'
$env:JARVIS_SMOKE_WIDTH = '1440'
$env:JARVIS_SMOKE_HEIGHT = '900'
$env:JARVIS_SMOKE_SCREENSHOT = 'D:\Jarvis\artifacts\jar-006b\review.png'
corepack pnpm smoke
```

设置页使用 `JARVIS_EVIDENCE_ROUTE=settings` 与
`JARVIS_SETTINGS_STATE=stt-empty|stt-configured|stt-error`。reduced-motion 使用
`JARVIS_SHOWCASE_REDUCED_MOTION=1`，200% 使用 `JARVIS_EVIDENCE_ZOOM=2`。

## 当前不足

- 项目所有者尚未用私人第三方 STT Provider 完成最终手工验收，因此 PR 保持 Draft。
- 不同兼容服务的 MIME、语言、usage 和错误行为仍可能不同。
- real TTS 与 Voice Profile binding 不属于本轮，回答播放仍是明确的本地演示路径。
