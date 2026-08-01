# Provider 配置与适配器

## 当前范围

JAR-006A 已完成真实文字 Conversation，JAR-006B 已完成真实 STT。JAR-006C 已实现真实
MiniMax TTS 代码、本地假 Provider、生产 Electron 和视觉验收，仍等待项目所有者真实
MiniMax 账户最终验收。

当前适配器名为 `OpenAICompatibleConversationProvider`，实现 OpenAI-compatible Chat
Completions SSE，但核心契约不绑定 OpenAI、OpenRouter 或某个模型。模型 ID 由用户填写，
仓库不硬编码“最新模型”。

## 配置

在 `#/settings` 填写：

- Base URL：例如 Provider 给出的 `/v1` 根地址；
- 模型名称：Provider 实际支持的模型 ID；
- API Key：只从受控 preload 交给 main process。

公网 Base URL 必须使用 HTTPS。开发环境只对 `localhost`、`127.0.0.1` 和 `::1` 允许
HTTP。URL 中的用户名、密码、查询参数和 fragment 会被拒绝，HTTP 重定向不会自动跟随。

连接测试不会单独保存新 Key。选择 real 并保存时会再次执行连接测试；只有成功才会保存
配置并开启 real。失败不会静默使用 Mock。

## 运行时契约

请求包含 Jarvis 原则、当前探索、相关领域、最多八个最近回合和当前用户文字。系统提示要求：

- 默认简体中文；
- 说明跨领域连接与边界；
- 区分事实、外部主张、用户信念和 Jarvis 解释；
- 明确不确定性；
- 不输出隐藏推理或 chain of thought。

流式事件只有 `started`、`delta`、`usage`、`complete` 和 `error`。每个事件携带
`requestId`；usage 不进入用户正文。Provider 返回的 reasoning 字段会被忽略。

## 错误

稳定错误代码为：

`authentication`、`permission`、`invalid_configuration`、`invalid_model`、
`rate_limit`、`quota_exceeded`、`timeout`、`network`、`provider_unavailable`、
`content_rejected`、`cancelled`、`malformed_response`、`unknown`。

错误对象包含中文消息、是否可重试、request ID、Provider ID、安全技术摘要和可选 HTTP
状态。它不包含 API Key、Authorization header、完整用户问题或完整 Provider 回答。

## 本地假 Provider

```powershell
corepack pnpm provider:fake
```

然后在设置页使用：

- Base URL：`http://localhost:4317/v1`
- 模型：`jarvis-local-fake`
- Key：任意仅用于本地测试的虚构值

该服务用于验证真实 HTTP、SSE 分片、usage 和取消链路，不代表第三方模型质量。

## Speech-to-Text Provider

当前 STT 适配器为 `OpenAICompatibleSpeechToTextProvider`，向：

```text
{Base URL}/audio/transcriptions
```

发送 multipart `file`、`model`、`language` 和可选 `prompt`。支持 `audio/webm`、
`audio/ogg`、`audio/mp4`、`audio/wav` 与 `audio/mpeg`，限制单次 16 MiB、300 ms 至
60.5 秒。重定向不会自动跟随，响应上限为 256 KiB。

STT 配置独立于 Conversation，可保存独立加密 Key，也可保存对 Conversation Key 的引用。
引用不会复制 ciphertext；main 在请求时解析实际凭据。real 模式保存前会用仓库生成的短
WAV 做连接测试，可能产生少量 Provider 费用。

稳定 STT 错误包括 `audio_too_short`、`audio_too_large`、
`unsupported_audio_format`、`empty_transcript` 与 `transcription_failed`，并复用
authentication、permission、model、quota、rate limit、network、timeout、cancelled 和
malformed response 等 Provider 错误。

本地假 STT 使用同一服务：

- Base URL：`http://localhost:4317/v1`
- 模型：`jarvis-local-fake-stt`
- Key：任意仅用于本地测试的虚构值

它验证真实 multipart HTTP、typed binary IPC、取消和遮罩，不代表第三方语音识别质量。

## Text-to-Speech Provider

`TextToSpeechProvider` 是 vendor-neutral main-process 契约；首个适配器
`MiniMaxTextToSpeechProvider` 调用 `{Base URL}/t2a_v2`。默认 Base URL 为
`https://api.minimax.io/v1`，默认模型 `speech-2.8-turbo`，可选 `speech-2.8-hd`，输出 mp3。
请求固定为非流式 hex 输出，hex 只在 main 解码成 `Uint8Array`，不会进入 React state。

Renderer 只能提交 `requestId / text / voiceProfileId`；不能指定任意 URL、header、voice ID
或 Provider payload。main 从已安装且授权有效的 Voice Profile 解析 voice ID，并负责
凭据、timeout、取消和响应限制。本地假 Provider 的 `/v1/t2a_v2` 用于验证契约，不代表
真实 MiniMax 声线质量。`/get_voice` 尚未实现；用户必须手动绑定 voice ID。
