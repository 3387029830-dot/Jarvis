# ADR-0008：Provider 边界与 typed streaming IPC

## 状态

已接受，2026-07-30。

## 决定

Conversation 核心依赖 vendor-neutral 请求与流事件。首个适配器实现 OpenAI-compatible
Chat Completions SSE，但网络和适配器只存在于 Electron main。Preload 公开命名方法与
单一事件订阅，并要求调用方解除订阅；所有流事件使用 request ID，main 进一步按
WebContents ID 隔离取消控制器。

## 原因与后果

这保持 Renderer 无密钥、无自由网络，也允许未来更换 Provider 而不改 Conversation。
代价是需要维护跨进程运行时验证和显式事件生命周期。STT、TTS 和认知提取不会借用本轮
接口提前实现。
