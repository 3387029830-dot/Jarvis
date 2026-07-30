# Jarvis 安全模型

## 进程边界

- Renderer 负责 UI、文字输入、现有本地麦克风与演示播放；没有 Node、文件系统、自由网络
  或完整凭据能力。
- Preload 只公开命名、强类型的 health、Provider 配置和 Conversation streaming API；
  不公开通用 `invoke`、`send` 或 channel 名称。
- Main 负责 Provider 网络、凭据加解密、配置文件和请求取消。

Electron 保持 `contextIsolation: true`、`nodeIntegration: false`、sandbox 与 webSecurity。
窗口拒绝任意新窗口和外部导航。

## 凭据生命周期

API Key 通过 IPC 到达 main 后使用 Electron `safeStorage.encryptString()` 加密。版本化
`provider-config.v1.json` 位于 Electron userData，不位于仓库。配置文件只包含：

- Base URL、模型和 Mock / real 模式；
- 加密后的 Base64 ciphertext；
- 末四位掩码；
- 最近测试时间。

Renderer 永远没有读取或解密 Key 的方法。设置页保存后立即清空输入框；删除凭据会删除
ciphertext、末四位和测试时间，并强制恢复 Mock。如果 OS 加密不可用，保存会停止并返回
中文错误，绝不退化为明文。

## 网络策略

- 远程地址只允许 HTTPS；开发期 localhost 可明确使用 HTTP。
- 拒绝 URL 用户名、密码、query 和 fragment。
- `fetch` 使用 `redirect: "manual"`、45 秒默认超时和 1 MiB 累计流限制。
- 取消会中止对应 AbortController；活动请求按 WebContents ID 与 request ID 隔离。
- Renderer 不能指定任意请求头、HTTP 方法或任意网络 payload。

## 数据最小化与日志

当前没有请求或响应日志。错误只保留分类代码、HTTP 状态和安全摘要，不记录完整问题、
回答或 Authorization header。自动测试和 CI 使用虚构 Key、fetch stub 或 localhost 假
Provider；仓库、截图、日志与 fixtures 不包含真实 Key。

当前文字回答只保留在 Renderer 内存，刷新后消失。JAR-006A 不写 SQLite、不提取认知、
不上传音频，也不接通真实 STT/TTS。
