# AGENTS.md — Jarvis Repository Instructions

## Product identity

Jarvis is a voice-first, immersive personal cognition companion.
It is not primarily a coding assistant, productivity dashboard, automation console, or generic chat wrapper.

The product helps a curious user:

- explore questions across domains;
- converse naturally by voice and text;
- preserve meaningful questions and beliefs;
- connect economics, psychology, finance, philosophy, sociology, literature, and other domains;
- observe how their cognition changes over time;
- understand themselves without pretending to diagnose them.

## Required reading

Before modifying code, read the relevant documents under `docs/`.
For work spanning multiple modules or more than one vertical slice, create or update an ExecPlan under `docs/plans/` according to `PLANS.md`.

## Current product priority

1. Premium and coherent desktop experience.
2. Voice interaction as a first-class path, not an optional add-on.
3. Presence, continuity, and low-friction conversation.
4. Reliable cognition capture and revision history.
5. Local-first user ownership and optional Obsidian export.
6. External tools only when they support the cognition experience.

## Non-goals for the foundation phase

Do not add unless a task explicitly requires it:

- autonomous programming;
- unrestricted shell execution;
- GitHub coding-agent features;
- task-management dashboards;
- multiple agent personas;
- mobile clients;
- always-on wake-word listening;
- a large plugin marketplace;
- gamified streaks or manipulative engagement mechanics.

## Technical rules

- TypeScript strict mode is mandatory.
- Use React functional components.
- Keep Electron `contextIsolation` enabled.
- Disable renderer `nodeIntegration`.
- Expose a minimal typed preload API.
- API keys must never be stored or used in the renderer process.
- Provider URLs, credentials, request headers, redirects, timeouts, cancellation, response limits,
  and networking are owned by main-process services.
- Provider credentials must use Electron `safeStorage` or an explicitly approved OS-backed
  alternative. If encryption is unavailable, stop; never fall back to plaintext.
- The renderer may receive only public Provider configuration and a masked suffix. Never expose a
  credential getter, generic IPC, arbitrary fetch bridge, or raw Provider headers.
- Real Provider failure must remain explicit and must never silently substitute Mock content.
- Provider logs, errors, tests, screenshots, and fixtures must not contain full API keys or complete
  private conversations.
- Real STT transcripts must require explicit confirmation before Conversation submission.
- Never overwrite an unsent text draft with a transcript; replace and append require explicit user
  actions, and cancel/re-record/failure must preserve the original draft.
- Raw STT audio is memory-only. Use named typed binary IPC, enforce size/duration/MIME limits in
  main, and retain at most one current recording briefly for retry.
- TTS audio is memory-only. Decode Provider transport formats in main; Renderer may receive only
  typed audio bytes, must revoke Blob URLs, and must stop/cancel on new recording, new text,
  Escape, replacement playback or unmount.
- Voice Profile installation requires authorization metadata. Missing or expired rights make a
  profile unavailable; never ship an unauthorized person, actor or character voice ID/audio.
- All model, STT, TTS, filesystem, SQLite, and Obsidian operations run through main-process services.
- Persist cognition changes as append-only events; do not silently overwrite belief history.
- Every durable cognition item must retain source message IDs and timestamps.
- AI-extracted cognition is a candidate until user confirmation or an explicit trusted rule accepts it.
- Separate facts, external claims, user beliefs, and Jarvis interpretations in the data model.
- Never infer a clinical diagnosis, protected trait, or definitive personality label from conversations.
- Do not place real API keys, private transcripts, or a real Obsidian vault in tests or fixtures.

## UX rules

- The default screen must not look like a SaaS dashboard.
- The app must never open to an empty “How can I help?” page.
- Voice state must be visible within 100 ms of user interaction.
- Motion communicates state; decorative motion must remain subtle.
- The user should not need to choose chat/work/learning modes.
- Do not turn every curiosity into a task.
- Do not save every utterance as long-term memory.
- Show what will be saved before committing cognition changes.
- Support interruption and cancellation in the interaction model, even when a provider adapter does not yet implement full duplex audio.
- Respect reduced-motion settings.

## Product language rules

- Simplified Chinese is the default language for the formal product experience.
- Use English only for the Jarvis brand, code/API identifiers, necessary proper nouns, and weak
  secondary technical labels.
- Navigation, actions, state, error, empty-state, privacy, accessibility, and help copy must be
  understandable in Simplified Chinese without relying on English.
- Keep formal product copy in the typed `zh-CN` renderer catalog and follow
  `docs/COPY_GUIDE_ZH_CN.md`.
- Never describe mock, disconnected, or unsaved behavior as if it were a working provider,
  persistent memory, or background cognition process.

## Design rules

- Dark-first, calm, premium, atmospheric.
- Avoid cheap cyberpunk, neon overload, game HUD aesthetics, and excessive glassmorphism.
- Use a restrained color system and consistent typography, spacing, radii, borders, shadows, and motion curves.
- The Orb is a semantic state display, not a decorative logo.
- The cognition map must remain readable and purposeful; avoid random force-directed “node soup.”

## Architecture rules

- Start as a modular monolith.
- Use typed domain events internally.
- Keep provider interfaces vendor-neutral.
- Build one working provider adapter only after mock adapters and contracts are tested.
- Prefer vertical slices over broad unfinished abstractions.
- Add dependencies only when they solve a documented requirement.

## Verification rules

For every task:

1. Run formatting, lint, typecheck, unit tests, and relevant integration tests.
2. Start the app and verify the affected flow manually.
3. For UI work, verify the rendered result at desktop widths and capture evidence.
4. Test loading, empty, success, failure, and cancellation states.
5. Update `PROJECT_LOG.md` and relevant documentation.
6. Summarize files changed, commands run, remaining risks, and next recommended issue.

## Code review rules

Review especially for:

- generic-chat-app drift;
- voice being treated as secondary;
- hidden persistence or silent memory writes;
- loss of belief revision history;
- renderer exposure of secrets or Node APIs;
- inaccessible motion, poor contrast, or keyboard traps;
- fake tool progress not connected to actual state;
- overly broad abstractions introduced before a vertical slice needs them.
