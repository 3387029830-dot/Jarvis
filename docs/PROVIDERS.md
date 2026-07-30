# Provider 配置与适配器

## 当前范围

JAR-006A 只实现真实文字 Conversation。真实 STT 属于 JAR-006B，真实 TTS 与 Voice
Profile Provider binding 属于 JAR-006C。

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
