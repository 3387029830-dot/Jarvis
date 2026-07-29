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
