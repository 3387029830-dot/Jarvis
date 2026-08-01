# JAR-006C 视觉验收证据

日期：2026-08-01

这些截图来自生产 Electron evidence route，内容全部是仓库内确定性演示数据，不包含真实
API Key、私人回答、私人授权文件或真实音频。

## 截图说明

- `settings-tts-empty-1440x900.png`：未配置 TTS 的章节、官方默认地址与文字优先边界。
- `settings-tts-configured-masked-1440x900.png`：已配置状态，只展示 Key 末四位。
- `voice-profile-library-1440x900.png`：四个原创表达模板、绑定与选择状态。
- `voice-profile-preview-1440x900.png`：已绑定 profile 的试听入口与费用提示；截图不含音频。
- `voice-profile-custom-binding-1440x900.png`：类别、voice ID 与授权元数据表单。
- `conversation-tts-preparing-1440x900.png`：语音准备中，文字与 composer 几何保持稳定。
- `conversation-tts-playing-1440x900.png`：朗读中，回答固定位置切换为停止操作。
- `conversation-tts-stopped-1440x900.png`：停止后仍保留完整文字。
- `conversation-tts-error-text-fallback-1440x900.png`：分类错误与文字回退。
- `conversation-tts-1024x900.png`：最小目标宽度下仍可阅读、停止和继续录音。
- `conversation-tts-reduced-motion-1440x900.png`：reduced-motion 保留状态反馈，移除非必要连续运动。

## 真实能力与演示内容

真实实现包括 main-process MiniMax 契约、hex 解码、`safeStorage`、授权校验、试听/选择、
中文分段、两段预取、顺序播放、取消、Blob URL 清理和文字回退。截图中的 Provider 回答、
voice ID、授权编号、Key 后四位、播放状态与延迟都是无隐私的 evidence 数据。

本地假 Provider 验证真实 HTTP 与 IPC 形状，但不代表 MiniMax 音色质量。项目所有者尚未用
真实 MiniMax 账户完成最终验收，因此 JAR-006C 与 JAR-006 整体仍未完成。

## 复现

先执行 `corepack pnpm build`，再设置 `JARVIS_SHOWCASE_EVIDENCE=1`、
`JARVIS_EVIDENCE_ROUTE=settings|conversation`、相应 `JARVIS_SETTINGS_STATE` 或
`JARVIS_TTS_STATE`、窗口宽高与 `JARVIS_SMOKE_SCREENSHOT`，运行
`corepack pnpm --filter @jarvis/desktop smoke`。这些参数只用于视觉验收，不是产品设置。

## 已知限制

- 截图不验证真实音色、费用或真实首段延迟。
- 200% 缩放已用生产 Electron 人工检查，可滚动单列布局与键盘入口可用；该临时检查图未提交。
- `/get_voice` 尚未实现，真实 voice ID 必须手动绑定。
