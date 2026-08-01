# Jarvis

> 一个以语音为主要入口、以个人认知演变为核心的沉浸式桌面应用。

Jarvis 帮助用户持续探索问题、保留真正有意义的认知变化，并回看自己的理解如何随时间演变。它不是编程助手、任务管理器、企业仪表盘或普通聊天包装器。

## 当前版本

- 软件包版本：`0.1.0`
- 当前里程碑：**JAR-006C — 真实语音合成与声线系统（Draft，待真实 MiniMax 验收）**
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
- [x] vendor-neutral STT 契约与 OpenAI-compatible `/audio/transcriptions` 适配器
- [x] 二进制音频 IPC、main-process STT 网络、取消、大小/时长/格式限制和分类错误
- [x] 独立 STT 凭据或 Conversation 凭据引用、`safeStorage` 加密与末四位脱敏
- [x] “语音转录待确认”、可编辑确认、草稿替换/追加保护和 voice 来源元数据
- [x] Editorial Chapters 设置页与跨章节未保存状态保护
- [x] vendor-neutral TTS 契约、MiniMax `/t2a_v2` main-process 适配器与 hex 解码
- [x] 中文语音文本规范化、确定性语义分段、最多两段预取与顺序播放队列
- [x] 手动 / 自动 / 关闭播放模式、停止、Escape / 新录音打断、内存音频清理与文字回退
- [x] Original / Licensed Character / Consented Clone Voice Profile 契约与授权有效性校验
- [x] 四个原创声线人格模板、手动 Provider voice ID 绑定、试听与显式选择
- [x] reduced-motion 与低性能静态 Orb 回退
- [x] format、lint、typecheck、test、build、smoke 与 GitHub CI

## 当前开发阶段

**JAR-006C：真实语音合成与声线系统** 已完成代码、本地假 Provider、生产 Electron、
测试和视觉验收。MiniMax 真实适配器已实现，但仍等待项目所有者用自己的真实账户完成
最终验收，因此本任务和 JAR-006 整体尚未标记完成。

如果文字区已有草稿，Jarvis 默认保留原文，并要求明确选择“替换草稿”或“追加转录”。
项目所有者已验证真实麦克风中文、数字与英文缩写转录、取消、草稿保护、重启后配置恢复、
Key 脱敏以及音频资源释放。真实凭据、私人录音和私人转录均未进入仓库。

对话持久化和认知提取仍未实现。Mock STT 仍可独立使用，Conversation、STT 和 TTS 的
Mock / real 配置彼此独立。请以
[docs/STATUS.md](docs/STATUS.md) 为当前真实功能清单。

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

配置真实语音识别：

1. 打开“设置”并选择“语音识别”章节。
2. 选择独立 STT 凭据，或明确复用 Conversation 凭据引用。
3. 填写 OpenAI-compatible Base URL、STT 模型、语言和超时，先测试再保存 real 模式。
4. 在 Conversation 录音结束后检查“语音转录待确认”，必要时编辑，再主动发送。

本地假 STT 使用同一个 `provider:fake` 服务，模型填写 `jarvis-local-fake-stt`。它验证
multipart、二进制 IPC、取消和脱敏，不代表第三方识别质量。

配置真实语音合成：

1. 打开“设置 → 声线档案”，选择原创模板并填写 MiniMax voice ID 与完整授权元数据。
2. 安装绑定后显式设为当前声线；试听可能产生 Provider 费用，但不会自动改变当前声线。
3. 打开“设置 → 语音合成”，填写 MiniMax Key，选择 `speech-2.8-turbo` 或 `speech-2.8-hd`。
4. 选择手动（默认）、自动或不播放。失败时完整文字回答仍可阅读。

本地假 TTS 使用 `provider:fake`、`http://localhost:4317/v1` 和任意虚构 Key；它只验证
main IPC、MiniMax JSON/hex 契约、取消与清理，不代表真实声线质量。

体验语音闭环：

1. 默认点击“点击说话”开始录音，再点击一次结束；也可切换为“按住说话”。
2. 首次使用时允许麦克风权限；权限返回前界面只显示“正在请求麦克风权限”。
3. Mock STT 下，完成手势后进入本地 Mock 转录、理解、回答与播放。
4. real STT 下，完成手势后进入真实识别；转录会在文字区等待确认，绝不自动发送。
5. listening 或处理中按 Escape 可取消；播放时再次点击或按住可立即打断并开始新录音。

Mock 模式不上传音频。real STT 只把当前录音发送给用户配置的第三方 Provider；音频不写
磁盘，识别成功后释放，失败重试期间最多短暂保留当前一份。

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
   - JAR-006B：真实 STT — 已完成
   - JAR-006C：真实 TTS 与 Voice Profile binding — Draft，待真实 MiniMax 验收
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
