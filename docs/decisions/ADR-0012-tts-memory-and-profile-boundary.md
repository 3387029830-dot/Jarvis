# ADR-0012：TTS 内存音频与授权声线边界

日期：2026-08-01

## 决定

TTS Provider 请求、凭据解析、授权校验和传输格式解码全部位于 Electron main process。
Renderer 只通过命名强类型 IPC 请求某个已安装 `VoiceProfile` 朗读一段文字，并接收
`Uint8Array` 音频。音频只形成内存 Blob，不写盘；停止、替换、错误、完成与卸载必须撤销 URL。

产品 `VoiceProfile.id` 与 Provider `voiceId` 永久分离。安装、选择、试听和正式合成都要求
权利人、授权引用、允许用途和有效期校验通过。内置模板不携带真实 voice ID 或音频。

## 原因

该边界避免 Renderer 获得凭据或任意 TTS 网络能力，限制私人回答和音频的持久化风险，
并允许未来替换 Provider 而不修改 Conversation 核心。授权元数据成为运行时约束，而不是
发布说明中的非强制承诺。

## 影响

- MiniMax hex 必须在 main 解码。
- Renderer 队列只维护状态、文本分段和短期音频引用。
- `/get_voice` 可以未来增加，但手动授权绑定仍是最终安装门槛。
- 音频无法跨重启恢复；失败始终回到完整文字路径。
