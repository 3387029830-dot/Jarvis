# ADR-0009：使用 safeStorage 保存 Provider 凭据

## 状态

已接受，2026-07-30。

## 决定

API Key 只在 main process 使用 Electron `safeStorage` 加密，ciphertext 写入 userData
下的版本化 JSON。Renderer 只能获得 `hasCredential` 和末四位。删除配置同时删除
ciphertext 并恢复 Mock；OS 加密不可用时停止保存，不提供明文 fallback。

## 原因与后果

该方案复用操作系统凭据保护，避免自制加密与仓库内 secret。它不是账户级跨设备密钥
管理；更换系统账户或 OS 安全存储失效时，用户需要重新输入 Key。
