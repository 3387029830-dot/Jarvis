# Jarvis

> 一个以语音为主要入口、以个人认知演变为核心的沉浸式桌面应用。

Jarvis 帮助用户持续探索问题、保留真正有意义的认知变化，并回看自己的理解如何随时间演变。它不是编程助手、任务管理器、企业仪表盘或普通聊天包装器。

## 当前版本

- 软件包版本：`0.1.0`
- 当前里程碑：**JAR-005 — 沉浸式 Conversation 空间**
- 产品默认语言：简体中文
- 当前真实能力与 Mock 边界：[docs/STATUS.md](docs/STATUS.md)

## 已完成功能

- [x] Electron、React、TypeScript strict、Vite 与 pnpm workspace 基础
- [x] Electron main / preload / renderer 安全隔离
- [x] 最小强类型 preload health-check API
- [x] 中文友好的设计 token 与基础组件
- [x] App Shell 与中文左侧导航
- [x] Presence「此刻」页面
- [x] empty / single / populated 三种 Mock 展示状态
- [x] 真实麦克风权限、MediaRecorder 录音、时长与 analyser 波形
- [x] 强类型语音状态机、取消、错误恢复与播放打断
- [x] 确定性 Mock 转录、Mock 回答流和本地演示播放
- [x] Presence 到 Conversation 的连续探索入口
- [x] 语音与文字共用的编辑性对话时间线
- [x] 点击说话（默认）与按住说话（可选）两种共享交互模式
- [x] Conversation 流式、取消、重试、离线和错误状态
- [x] reduced-motion 与低性能静态 Orb 回退
- [x] format、lint、typecheck、test、build、smoke 与 GitHub CI

## 正在开发

本轮完成 **JAR-005：Conversation 空间**。下一项计划是 **JAR-006：Provider contracts 与一条真实语音路径**；本轮没有接入真实 STT、模型或云端 TTS。

默认“点击说话”会在用户直接操作后请求真实麦克风权限，第二次点击结束录音；也可切换为按住模式。转录、理解与回答仍是明确标注的本地 Mock。Conversation 历史来自固定场景，刷新后不会持久化。请以 [docs/STATUS.md](docs/STATUS.md) 为当前真实功能清单。

## 如何启动

环境要求：

- Node.js 24+
- pnpm 11+

```powershell
cd D:\Jarvis
corepack enable
pnpm install
pnpm dev
```

如果 PowerShell 仍提示无法识别 `pnpm`，可以直接使用：

```powershell
corepack pnpm install
corepack pnpm dev
```

开发模式默认打开 `#/presence`。可体验入口：

- `#/presence?variant=populated`
- `#/presence?variant=single`
- `#/presence?variant=empty`
- `#/conversation`
- `#/conversation?exploration=uncertainty-and-crowd`
- `#/conversation?exploration=money-consensus-institution`
- `#/conversation?exploration=knowledge-action-gap`
- `#/design-system`

体验语音闭环：

1. 默认点击“点击说话”开始录音，再点击一次结束；也可切换为“按住说话”。
2. 首次使用时允许麦克风权限；权限返回前界面只显示“正在请求麦克风权限”。
3. 看到“正在聆听”和真实波形后说话，完成手势后进入本地 Mock 转录、理解、回答与播放。
4. listening 或处理中按 Escape 可取消；播放时再次点击或按住可立即打断并开始新录音。

音频不会上传或写入磁盘，模拟转录生成后即释放内存引用。

质量验证命令：

```powershell
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm smoke
```

## 路线图

1. JAR-001：仓库与安全桌面基础 — 已完成
2. JAR-002：设计系统基础 — 已完成
3. JAR-003：App Shell 与 Presence — 已完成
4. JAR-004：语音状态机与 Mock 闭环 — 已完成
5. JAR-005：Conversation 空间 — 已完成
6. JAR-006：Provider contracts 与一条真实语音路径 — 下一步
7. JAR-007 及以后：本地持久化、认知事件、星图、演变与 Obsidian 导出

## 项目文档

- [产品章程](docs/PRODUCT_CHARTER.md)
- [体验规范](docs/EXPERIENCE_SPEC.md)
- [前端规范](docs/FRONTEND_SPEC.md)
- [简体中文文案规范](docs/COPY_GUIDE_ZH_CN.md)
- [语音体验规范](docs/VOICE_SPEC.md)
- [声线配置契约](docs/VOICE_PROFILES.md)
- [当前真实状态](docs/STATUS.md)
- [执行任务](docs/CODEX_TASKS.md)
- [项目日志](PROJECT_LOG.md)
- [当前 ExecPlan](docs/plans/0001-foundation-vertical-slice.md)
