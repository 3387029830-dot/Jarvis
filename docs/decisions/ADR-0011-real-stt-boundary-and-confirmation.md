# ADR-0011：真实 STT 的二进制边界与确认契约

- 状态：已接受
- 日期：2026-07-31

## 背景

JAR-006B 需要把 Renderer 内存中的录音交给 main-process Provider，同时避免扩大通用 IPC、
泄漏凭据、持久化私人音频或把识别错误直接提交给 Conversation。文字区还可能存在用户
正在编辑的草稿。

## 决定

1. 音频只以 `Uint8Array` 通过命名、运行时验证的 preload API 进入 main。禁止 Base64、
   JSON number array、通用 fetch 或通用 IPC。
2. main 负责 MIME、时长、大小、文件名、凭据解析、multipart 网络、timeout 与取消。
3. 原始音频不写盘。失败重试期间最多短暂保留当前一份；成功、取消、重新录音、放弃或
   应用退出后释放。
4. STT 可以使用独立 `safeStorage` 凭据，或保存对 Conversation 凭据的显式引用；引用
   不复制密文，完整 Key 永不返回 Renderer。
5. 真实转录先进入现有文字区的 pending review，不自动发送。已有草稿保持不变，替换和
   追加都需要明确操作。
6. 用户确认后消息仍记录 `source: voice`，并记录 `transcriptionEdited`。

## 结果

- Conversation 核心只接收确认后的文字，不接收原始音频或未确认转录。
- Provider 适配器可替换，但安全边界、草稿保护和确认体验保持稳定。
- 失败后可以重试一次当前录音，但应用不承诺永久音频恢复。
