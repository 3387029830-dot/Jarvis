# Codex Execution Tasks

Complete tasks in order. Each issue should end with a runnable repository and evidence.

## JAR-001 — Initialize the repository

### Goal

Create the Electron/React/TypeScript monorepo and quality gates.

### Acceptance criteria

- `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` work.
- Electron opens a React renderer.
- Context isolation is enabled and node integration is disabled.
- A typed preload health-check API works.
- CI runs lint, typecheck, tests, and build.
- Development data does not write into the repository.

## JAR-002 — Build the design-system foundation

### Goal

Create tokens and reusable primitives that establish the Jarvis visual language.

### Acceptance criteria

- Color, typography, spacing, radius, border, shadow, and motion tokens exist.
- Components include Button, IconButton, Panel, Card, Badge, Tooltip, Dialog, and ScrollArea.
- Focus, hover, disabled, loading, and error states exist.
- Reduced-motion behavior is implemented.
- A development showcase route demonstrates all states.

## JAR-003 — Implement the app shell and Presence page

### Goal

Create the first high-fidelity screen with real responsive state.

### Acceptance criteria

- Compact navigation rail.
- Atmospheric background.
- Semantic Orb area.
- Contextual greeting from typed mock state.
- Active exploration cards.
- Unresolved question and recent cognition-change card.
- Push-to-talk affordance.
- Empty and populated states both look intentional.

## JAR-004 — Implement the voice state machine and mock loop

### Goal

Make voice visibly foundational before integrating a real provider.

### Acceptance criteria

- Voice state machine matches `VOICE_SPEC.md`.
- Press-and-hold records from a real microphone after permission.
- Mock provider returns deterministic transcript, response text, and local/generated demo audio.
- Orb, transcript, controls, and playback use the same state source.
- Playback can be interrupted by a new press.
- Cancel and error recovery are tested.

## JAR-005 — Implement Conversation space

### Goal

Create an immersive conversation view rather than a generic bubble chat.

### Acceptance criteria

- User transcript and Jarvis response render as readable editorial blocks.
- Streaming response simulation works.
- Related domain concepts appear contextually.
- Voice and typed messages share one timeline.
- A conversation can be resumed from Presence.
- Loading, retry, cancel, and offline states are designed.

## JAR-006 — Add provider contracts and one real voice path

### Goal

Replace mocks behind interfaces without changing the UI contract.

### Acceptance criteria

- Vendor-neutral STT, conversation, and TTS interfaces.
- Credentials stored outside renderer and encrypted locally.
- One real adapter for each required capability.
- Provider errors map to domain errors.
- Text-only fallback works when TTS fails.
- Mock adapters remain available for tests and demos.

## JAR-007 — Add SQLite and conversation persistence

### Goal

Persist conversations, messages, voice metadata, and application settings.

### Acceptance criteria

- Versioned migrations.
- Repository interfaces separate domain from SQLite.
- Restarting the application preserves conversation history.
- Temporary audio deletion policy is honored.
- Tests use a disposable database.

## JAR-008 — Implement cognition candidate extraction

### Goal

Convert meaningful conversation into user-reviewable cognition candidates.

### Acceptance criteria

- Candidate types include question, belief, insight, concept, and connection.
- Candidate retains source message IDs.
- Inline card supports accept, edit, defer, and discard.
- No candidate becomes confirmed without an explicit resolution.
- Facts, user beliefs, and Jarvis hypotheses are visually distinguished.

## JAR-009 — Persist cognition events and revisions

### Goal

Create the durable cognition model.

### Acceptance criteria

- Append-only cognition event table.
- Materialized nodes and edges.
- Belief revisions preserve all versions.
- Event replay test produces the same materialized state.
- Privacy deletion is explicit and audited.

## JAR-010 — Implement Constellation

### Goal

Show a meaningful, curated personal cognition map.

### Acceptance criteria

- Graph supports question, concept, belief, insight, and reflection nodes.
- Filter by exploration and domain.
- Clicking an edge explains the connection.
- Newly accepted cognition animates into the graph.
- Large graphs are initially limited or clustered.
- Accessible list alternative exists.

## JAR-011 — Implement Evolution

### Goal

Let the user see how a belief changes.

### Acceptance criteria

- Select a belief thread.
- View each version, date, trigger, source, confidence, and unresolved tension.
- Propose and confirm a new revision from conversation.
- Old belief remains visible.
- Current belief is clearly marked as provisional.

## JAR-012 — Implement Obsidian export

### Goal

Export confirmed cognition to a test vault without making Obsidian canonical.

### Acceptance criteria

- User selects a test vault.
- Export uses stable IDs in frontmatter.
- Re-export updates only the owned generated region or creates a revision-safe file.
- Conflicts are shown before destructive changes.
- Export status is recorded locally.
- Real user vault is never used in automated tests.

## JAR-013 — Polish the first daily-use loop

### Goal

Make the complete path feel coherent and premium.

### Demo path

1. Open Presence.
2. Continue an exploration.
3. Ask a question by voice.
4. Receive spoken and written response.
5. See a psychology/economics cross-domain connection.
6. Confirm a belief.
7. Watch the constellation update.
8. Reopen the exploration and revise the belief.
9. View the evolution timeline.
10. Export to Obsidian.

### Acceptance criteria

- No dead-end interaction.
- Every stage is cancellable or recoverable.
- No placeholder-looking production UI.
- No console errors.
- Manual test notes and visual evidence are attached to the PR.
