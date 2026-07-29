# Architecture

## 1. Strategy

Use a modular monolith for the foundation phase. The product requires strong coordination between voice, interaction state, cognition extraction, persistence, and animation. Premature microservices would slow iteration and complicate local-first ownership.

## 2. Top-level structure

```text
apps/
  desktop/
    main/          Electron main process
    preload/       typed IPC bridge
    renderer/      React application
packages/
  domain/          cognition and conversation types
  event-bus/       typed internal events
  voice/           recording, playback, voice state machine
  model-gateway/   chat/STT/TTS provider contracts and adapters
  cognition/       candidates, revisions, graph services
  memory/          context retrieval and continuity
  persistence/     SQLite repositories and migrations
  obsidian/        export adapter
  design-system/   tokens and reusable components
  shared/          utilities and schemas
```

A monorepo using `pnpm` workspaces is recommended.

## 3. Process boundaries

### Renderer

- UI and animation;
- microphone capture UI;
- local waveform rendering;
- text editing;
- TTS playback;
- graph visualization;
- no secrets, direct filesystem access, or database access.

### Preload

- minimal, typed APIs;
- no generic `invoke(channel, payload)` exposed to the renderer;
- validate payloads at the boundary.

### Main process

- API credentials;
- provider networking;
- SQLite;
- filesystem and Obsidian export;
- app lifecycle and global shortcut;
- background task coordination.

## 4. Internal event model

```ts
type JarvisEvent =
  | { type: 'voice.state_changed'; state: VoiceState }
  | { type: 'voice.transcript_delta'; text: string }
  | { type: 'conversation.response_delta'; text: string }
  | { type: 'conversation.audio_chunk'; chunkId: string }
  | { type: 'exploration.focus_changed'; explorationId: string }
  | { type: 'cognition.candidate_proposed'; candidateId: string }
  | { type: 'cognition.candidate_resolved'; candidateId: string; resolution: string }
  | { type: 'cognition.graph_changed'; eventId: string }
  | { type: 'export.status_changed'; exportId: string; status: string };
```

The UI should derive Orb and page state from these events rather than maintain unrelated animation state.

## 5. Model gateway

Provider-neutral services:

- `ConversationProvider`
- `SpeechToTextProvider`
- `TextToSpeechProvider`
- `EmbeddingProvider` (optional later)
- `CognitionExtractionProvider` (may use the same model with a different contract)

Start with:

1. deterministic mock adapters;
2. one real STT adapter;
3. one real conversation adapter;
4. one real TTS adapter.

Do not implement many providers before one complete voice path works.

## 6. Conversation orchestration

```text
Capture audio
  → transcribe
  → resolve current exploration context
  → request conversation response
  → stream text to renderer
  → synthesize response segments
  → play and allow interruption
  → propose cognition candidates
  → user resolves candidates
  → persist cognition events
```

## 7. Context assembly

The context builder should use:

- current conversation turns;
- active exploration summary;
- relevant confirmed beliefs and revisions;
- spoiler boundaries or domain preferences where applicable;
- a small number of related nodes;
- explicit source attribution.

Do not send the complete archive to every model call.

## 8. Persistence

SQLite is the local source of truth. Markdown and Obsidian are exports, not the canonical database.

Migrations must be versioned and tested. Development must use a disposable database and test vault.

## 9. Security

- API keys encrypted using OS-backed facilities through Electron main process.
- Content Security Policy enabled.
- Context isolation enabled.
- External navigation denied by default and opened through controlled handlers.
- No arbitrary shell tool.
- Logs redact secrets and do not include raw private conversations by default.
