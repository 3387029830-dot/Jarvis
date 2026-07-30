# Experience Specification

## 1. Desired feeling

Jarvis should feel like returning to a private observatory for thought:

- calm rather than urgent;
- intelligent rather than performative;
- intimate without pretending to be human;
- futuristic without visual noise;
- alive without demanding attention;
- continuous rather than session-bound.

## 2. Opening experience

The app must not begin with an empty chat box.

The Presence screen should show:

- the current Jarvis state;
- one contextual greeting;
- two or three active explorations;
- one unresolved question worth continuing;
- a clear voice action, defaulting to click-to-start / click-to-finish;
- a subtle indication of recent cognitive change.

Example:

> 下午好。上次我们把“货币价值”暂时理解为社会信任与制度能力的共同结果，但“国家强制力究竟占多大比重”仍没有解决。

## 3. Main interaction principles

### Natural input

The user may speak incompletely, change topics, pause, or revise a statement. The system should preserve the raw expression and clarify only when necessary.

### No manual mode switching

Conversation, exploration, reflection, and saving use one continuous interface. Internal routing is invisible unless the system needs approval.

### Curiosity is not a task

Do not convert ideas into deadlines or checklists unless the user asks.

### Save with consent

A subtle cognition candidate can appear after meaningful discussion. It must show exactly what will be stored and allow edit, accept, defer, or discard.

### Honest continuity

Jarvis may say what it remembers and why a past item is relevant. It must not imply memory that does not exist.

## 4. Primary flow

### A. Return

- User opens application.
- Orb is idle and softly active.
- Presence page shows current explorations.

### B. Speak

- User clicks the microphone control to start and clicks again to finish by default.
- A hold-to-talk preference remains available for pointer and keyboard users.
- Visual response begins immediately.
- Waveform and live/partial transcript appear.
- The selected gesture only adapts capture commands; both modes share the same canonical voice state.
- Future VAD may replace the finishing gesture, but it must not create a separate conversation path.

### C. Understand

- Transcript remains editable before submission when transcription confidence is low.
- Current question and likely domains appear subtly.
- The user can cancel.

### D. Respond

- Text streams in.
- TTS begins when enough content is available.
- User may interrupt playback and speak again.
- Related concepts emerge in the side context, not as intrusive popups.
- Voice and typed turns remain in one editorial timeline rather than separate modes or chat bubbles.

### E. Reflect

- After a meaningful exchange, Jarvis may present:
  - the user’s current belief;
  - a new connection;
  - an unresolved question;
  - the source messages.

### F. Save

- User confirms or edits.
- The map changes visibly but calmly.
- A revision is appended if the topic already has a belief.

## 5. Failure behavior

- Microphone failure: explain the concrete cause and retain text input.
- STT failure: preserve audio locally until retry/discard decision.
- Model failure: keep transcript and allow retry with another provider.
- TTS failure: show the text answer without claiming spoken completion.
- Persistence failure: do not show a saved state; preserve a recoverable candidate.
- Obsidian failure: keep local record and mark export as pending/failed.

## 6. Accessibility

- Full keyboard navigation.
- Visible focus states.
- Reduced motion mode.
- Captions/transcript always available.
- TTS can be disabled independently.
- Minimum text contrast should meet WCAG AA.
- Voice must never be the only way to complete an action.

## JAR-006A：真实文字 Provider 体验

- “设置”是正式产品入口，但保持私人认知空间的安静层级，不呈现为企业集成控制台。
- 页面始终明确显示 Mock 或真实文字模式。未通过测试时不能保存并启用 real。
- 连接失败必须说明 authentication、model、quota、network、timeout 等具体类别，并提供
  修改配置、重新测试或回到 Mock 的路径。
- 已保存 Key 只显示末四位，保存后输入框清空；删除凭据必须明确说明会恢复 Mock。
- real 模式的新文字回答以增量内容进入现有讨论手稿。既有 Mock 历史继续显示 Mock
  标记，固定“思维交汇”不冒充从真实回答提取的认知。
- 取消保留已经显示的部分；失败保留用户表达；重试复用原用户消息。
- 文字完成后不调用真实 TTS。语音入口继续明确标注真实录音 + Mock 转录/回答，直到
  JAR-006B/C。
