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
- a clear push-to-talk action;
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

- User holds the configured key or presses the microphone control.
- Visual response begins immediately.
- Waveform and live/partial transcript appear.
- Releasing the key ends capture.

### C. Understand

- Transcript remains editable before submission when transcription confidence is low.
- Current question and likely domains appear subtly.
- The user can cancel.

### D. Respond

- Text streams in.
- TTS begins when enough content is available.
- User may interrupt playback and speak again.
- Related concepts emerge in the side context, not as intrusive popups.

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
