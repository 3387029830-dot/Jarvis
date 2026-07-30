# ADR-0007：语音手势与 Voice Profile 边界

- 状态：已接受
- 日期：2026-07-30
- 任务：JAR-005

## 背景

JAR-004 以按住说话验证真实麦克风和 Mock 闭环。Conversation 需要支持更长、更自然的表达，同时未来还要接入原创声线、已授权角色声线和经同意的声音克隆。如果手势、状态机、声线或 Provider 彼此绑定，后续会出现重复状态、页面行为分叉和授权边界不清。

## 决定

1. Jarvis 默认使用点击开始、再次点击结束的 `toggle` 模式，并保留 `hold` 模式。
2. Presence 和 Conversation 共享当前模式；两种模式只将浏览器手势转换为 `startCapture`、`finishCapture`、`cancel`、`interruptAndCapture`。
3. `VoiceController` 仍是语音状态的唯一真源，页面和手势适配器不得复制状态机。
4. Voice Profile 与 Conversation 核心解耦，通过 vendor-neutral profile id 和 Provider binding 接入。
5. Voice Profile 分为 Original、Licensed Character、Consented Clone；所有类别都必须有可核验的授权依据。
6. 仓库不得内置未经授权的具体人物或演员声音。

## 结果

- 后续 VAD 可以替换结束手势，而不改动语音状态机或 Conversation timeline。
- 第三方正式授权角色声线可以新增 Provider binding，而不改动 Conversation 核心。
- 切换声线不会暗中改变 Jarvis 人格、记忆或认知数据。
- JAR-006 需要实现授权校验、profile 选择和一条真实中文 TTS 路径；这些均不属于 JAR-005。

## 被拒绝的方案

- 为点击、按住和未来 VAD 各建一套控制器：会造成阶段和取消语义漂移。
- 将具体 Provider voice id 直接写进 Conversation 消息：会污染领域模型并锁定供应商。
- 将知名人物或演员声音作为无来源演示资产：不满足明确授权要求。
