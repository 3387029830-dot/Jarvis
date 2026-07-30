# ADR-0010：将 JAR-006 拆分为 A / B / C

## 状态

已接受，2026-07-30。

## 决定

JAR-006 保持路线图中的一个父任务，但按顺序交付：

1. JAR-006A：Provider 基础与真实文字 Conversation；
2. JAR-006B：真实中文 STT；
3. JAR-006C：真实 TTS 与 Voice Profile Provider binding。

## 原因与后果

文字 Provider 先验证凭据、网络、错误和 streaming IPC，不把音频隐私、授权声线和播放
失败同时引入。任何子任务完成都不代表父任务完成，也不授权提前执行下一个子任务。
