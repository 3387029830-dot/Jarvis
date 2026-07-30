# Jarvis

> 一个以语音为主要入口、以个人认知演变为核心的沉浸式桌面应用。

Jarvis 帮助用户持续探索问题、保留真正有意义的认知变化，并回看自己的理解如何随时间演变。它不是编程助手、任务管理器、企业仪表盘或普通聊天包装器。

## 当前版本

- 软件包版本：`0.1.0`
- 当前里程碑：**JAR-006A — Provider 基础与真实文字对话路径（已完成）**
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
- [x] OpenAI-compatible Conversation Provider、Chat Completions SSE 与统一错误契约
- [x] main-process Provider 网络边界、typed streaming IPC 与 `requestId` 隔离
- [x] `safeStorage` 加密凭据、脱敏展示、删除凭据与版本化配置
- [x] 中文 Provider 设置页、Mock / real 模式和连接测试
- [x] 真实文字回答进入现有 Conversation 编辑性时间线
- [x] reduced-motion 与低性能静态 Orb 回退
- [x] format、lint、typecheck、test、build、smoke 与 GitHub CI

## 正在开发

**JAR-006A：Provider 基础与真实文字对话路径** 已完成。项目所有者已在应用内使用自己的
OpenAI-compatible Provider 验证连接、中文流式回答、取消、滚动稳定性、草稿保留、配置
重启恢复与 Key 脱敏；流式生成不会重新排列输入框、Orb 或语音区。

下一项计划是 JAR-006B，但尚未创建分支或开始实现。

本轮只接通文字模型；真实 STT、真实 TTS、Voice Profile Provider binding、持久化和认知提取仍未实现。默认语音入口仍使用真实本地录音加明确标注的 Mock 转录与回答。请以 [docs/STATUS.md](docs/STATUS.md) 为当前真实功能清单。

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
- `#/settings`
- `#/design-system`

配置真实文字 Provider：

1. 打开“设置”，填写 OpenAI-compatible Base URL、模型 ID 和 API Key。
2. 先点击“测试连接”；选择“真实文字回答”并保存时会再次测试，失败不会切换到 Mock。
3. 保存后完整 Key 不再回显，只显示末四位；删除凭据会恢复为 Mock。
4. 回到 Conversation 发送中文文字，回答会通过 SSE 增量进入时间线；生成中可取消。

如需不使用真实凭据验证本地链路，可在另一个终端运行 `corepack pnpm provider:fake`，
并在设置页使用 `http://localhost:4317/v1`、模型 `jarvis-local-fake` 和任意测试 Key。

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
6. JAR-006：Provider contracts 与一条真实语音路径
   - JAR-006A：Provider 基础与真实文字对话 — 已完成
   - JAR-006B：真实 STT — 未开始
   - JAR-006C：真实 TTS 与 Voice Profile binding — 未开始
7. JAR-007 及以后：本地持久化、认知事件、星图、演变与 Obsidian 导出

## 项目文档

- [产品章程](docs/PRODUCT_CHARTER.md)
- [体验规范](docs/EXPERIENCE_SPEC.md)
- [前端规范](docs/FRONTEND_SPEC.md)
- [简体中文文案规范](docs/COPY_GUIDE_ZH_CN.md)
- [语音体验规范](docs/VOICE_SPEC.md)
- [声线配置契约](docs/VOICE_PROFILES.md)
- [Provider 配置与适配器](docs/PROVIDERS.md)
- [安全模型](docs/SECURITY_MODEL.md)
- [当前真实状态](docs/STATUS.md)
- [执行任务](docs/CODEX_TASKS.md)
- [项目日志](PROJECT_LOG.md)
- [当前 ExecPlan](docs/plans/0001-foundation-vertical-slice.md)
