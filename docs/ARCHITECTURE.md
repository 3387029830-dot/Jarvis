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

## 10. JAR-006A Provider boundary

```text
Settings / Conversation renderer
  → narrow typed preload methods
  → runtime-validated IPC handlers
  → ProviderService in Electron main
  → OpenAICompatibleConversationProvider
  → HTTPS (or explicit localhost development exception)
```

- `apps/desktop/src/shared/provider.ts` is the cross-process contract. It contains public
  configuration, request/event and error types but no credential-returning API.
- `ProviderConfigStore` writes `provider-config.v1.json` under Electron userData. Only the API Key
  ciphertext produced by `safeStorage` is stored; the Renderer receives `hasCredential` and
  `keySuffix`.
- `ProviderService` owns connection tests, the real-mode gate, prompt assembly and Provider
  selection. Conversation does not import Provider implementation code.
- `OpenAICompatibleConversationProvider` implements Chat Completions SSE with manual redirect
  handling, timeout, cancellation, cumulative response limit and usage events. It emits content
  only; Provider reasoning fields are ignored.
- Streaming events carry `requestId`. Main keys active abort controllers by Renderer WebContents
  ID plus request ID, and preload exposes an unsubscribe function rather than generic event access.
- Settings is lazy-loaded. The JAR-006A build produces a 700.70 kB Renderer entry plus a 15.58 kB
  Settings JS chunk and 5.99 kB Settings CSS chunk. Provider code is in the main bundle; no Provider
  SDK was added to Renderer.
- Conversation was assessed for splitting but remains in the entry bundle because it shares the
  current voice controller, evidence states and shell. Reassess after voice orchestration is
  extracted rather than introducing lifecycle risk in this slice.
