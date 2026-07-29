# Jarvis 项目总方案

## 一、项目定位

Jarvis 是一个以语音为主要入口、以个人认知演变为核心的沉浸式桌面智能应用。

它不是编程助手，也不是生产力控制台。它面向对金融、心理学、经济学、哲学、社会学、文学和现实世界保持广泛好奇的人，帮助用户：

- 自然提出尚未整理好的问题；
- 获得跨领域视角，而不是一次性标准答案；
- 保留真正属于自己的观点和疑惑；
- 发现不同问题之间的联系；
- 记录观点如何被修正；
- 通过长期轨迹认识自己的注意力、假设和思维方式。

产品核心句：

> 让好奇心有一个可以长期居住的地方。

## 二、核心差异

传统对话产品的闭环是“提问—回答—结束”。Jarvis 的闭环是：

```text
好奇
→ 语音或文字探索
→ 跨领域联系
→ 形成暂时理解
→ 用户确认保存
→ 进入认知地图
→ 后续讨论产生观点修正
→ 看见自己的认知变化
```

Jarvis 不以“知道更多”为唯一目标，而以“形成、检验和修正个人理解”为目标。

## 三、产品形态

第一载体为 Windows 桌面应用：

- Electron 提供桌面窗口、全局快捷键、麦克风、本地数据库和文件系统能力；
- React/TypeScript 提供高完成度界面；
- SQLite 作为本地主数据源；
- Obsidian 作为可选 Markdown 归档接口；
- 第三方模型、STT 和 TTS 通过可替换 Provider 接口接入。

应用的五个核心空间：

1. **Presence**：回到 Jarvis，看到仍在生长的问题。
2. **Conversation**：沉浸式语音与文字讨论。
3. **Constellation**：个人认知星图。
4. **Evolution**：观点变化与原因。
5. **Archive**：讨论、来源、语音与导出档案。

## 四、语音原则

语音不是附加按钮，而是第一等交互。

第一版使用可靠的按键说话：

- 按下立即进入 listening；
- Orb 与波形同步响应；
- 松开后转录；
- 文本流式回复；
- TTS 播放；
- 再次按下可以打断语音并继续说；
- 所有状态可取消、可恢复；
- API Key 不进入 Renderer。

后续再增加 VAD、连续会话和唤醒词。

## 五、认知数据核心

主数据不是聊天记录，而是经过确认的认知对象：

- Exploration：持续探索；
- Question：长期问题；
- Concept：概念；
- Belief：当前暂时观点；
- BeliefRevision：观点修正；
- Insight：新认识；
- Connection：跨领域联系；
- Evidence：支持、反对或示例材料；
- Reflection：对自身思考的反思；
- Source：对话、语音、书籍、文章或笔记来源。

观点变化采用追加历史，不覆盖旧版本。AI 生成的内容先成为候选，必须经过用户确认或明确规则才进入长期认知。

## 六、体验设计方向

界面是一座私人思想观测站，而不是 SaaS 后台。

视觉关键词：

- calm
- atmospheric
- premium
- spatial
- intelligent
- minimal but alive

避免：

- 廉价赛博朋克；
- 满屏霓虹；
- 企业仪表盘；
- 只剩消息气泡的聊天壳；
- 没有实际用途的随机节点图。

Orb 是语义状态显示器，应真实对应 listening、transcribing、understanding、responding、speaking、interrupted 和 error。

## 七、开发架构

采用模块化单体与 pnpm monorepo：

```text
apps/desktop
packages/domain
packages/event-bus
packages/voice
packages/model-gateway
packages/cognition
packages/memory
packages/persistence
packages/obsidian
packages/design-system
packages/shared
```

Electron Renderer 只负责界面、录音交互和音频播放；Main Process 负责模型 API、密钥、本地数据库、文件和 Obsidian。

## 八、里程碑

### M0 仓库基础

Electron/React/TypeScript、质量命令、CI、typed preload。

### M1 Presence 与模拟语音闭环

高级首页、Orb、真实麦克风录音、Mock STT/LLM/TTS、打断和取消。

### M2 真实第三方语音闭环

一个 STT、一个对话模型、一个 TTS Provider，凭据安全存储。

### M3 认知候选闭环

从对话提取问题、概念、观点与跨领域关联，由用户确认。

### M4 认知星图

可读、可解释、可筛选的图谱，不做无序“节点汤”。

### M5 观点演变

保留旧观点、变化原因和来源，形成 Evolution 时间线。

### M6 长期连续性

回到应用时能承接真实的旧探索，并说明引用了哪些记忆。

### M7 Obsidian 导出

将已确认认知安全同步为 Markdown，Jarvis 数据库仍是主数据源。

## 九、GitHub 推进方式

- `main` 始终保持可运行；
- 每个 JAR issue 对应一个用户可见行为；
- UI PR 必须带截图或录屏；
- 合并前运行 format、lint、typecheck、test、build；
- README 保持稳定；
- PROJECT_LOG 记录里程碑、决策、失败和下一步；
- 长期架构决策放入 `docs/decisions/`。

## 十、第一轮 Codex 任务

只做 JAR-001：

- 初始化 pnpm monorepo；
- Electron + React + TypeScript + Vite；
- 严格 TypeScript；
- main/preload/renderer 安全边界；
- typed health-check IPC；
- format、lint、typecheck、test、build；
- GitHub CI；
- 更新 ExecPlan 与 PROJECT_LOG。

第一轮不做最终首页、不接真实 API、不做认知地图。这样可以先建立可靠的开发地基，再从 JAR-002 开始正式塑造视觉体验。
