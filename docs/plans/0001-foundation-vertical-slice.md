# ExecPlan 0001 — Foundation Vertical Slice

## Goal

Deliver a runnable Windows desktop prototype in which a user opens Jarvis, sees a high-fidelity Presence screen, presses to talk, receives a deterministic spoken response, interrupts it, and returns to a stable state.

## Experience narrative

1. User launches Jarvis.
2. Presence screen shows an active exploration and unresolved question from mock state.
3. User holds Space or clicks and holds the voice control.
4. Orb responds immediately and waveform appears.
5. Releasing ends capture.
6. Mock transcript appears.
7. Jarvis streams a mock cross-domain response.
8. Mock speech plays.
9. User presses again during speech; playback stops and listening begins.
10. User cancels and returns to idle.

## Scope

Included:

- repository scaffold;
- design tokens and application shell;
- Presence page;
- Orb state representation;
- real microphone capture;
- deterministic mock STT/chat/TTS flow;
- interruption, cancel, and recoverable error;
- automated tests for state transitions.

Excluded:

- real model API;
- SQLite persistence;
- cognition map;
- Obsidian export;
- wake word;
- background listening.

## Existing code and documents

The repository begins as a documentation-only project. The implementation must preserve:

- the voice-first personal-cognition positioning in `AGENTS.md` and `docs/PRODUCT_CHARTER.md`;
- the Electron main/preload/renderer security boundary in `docs/ARCHITECTURE.md` and ADR-0002;
- the JAR-001-only execution boundary in `docs/CODEX_TASKS.md`;
- the requirement that development data, credentials, and private user content never enter the repository.

For the current JAR-001 milestone, no cognition objects, voice state machine, provider contracts, persistence, or final Presence design are introduced.

## Architecture

- Electron main/preload/renderer separation.
- Voice state machine in `packages/voice`.
- Mock providers in `packages/model-gateway`.
- Renderer subscribes to typed domain events.
- Orb derives visuals from voice state.

JAR-001 implementation details:

- Use a `pnpm` workspace with the runnable desktop application in `apps/desktop`.
- Use `electron-vite` to build independent main, preload, and React renderer entry points.
- Keep shared IPC channel names and result types in a dependency-free shared module.
- Expose only `window.jarvis.healthCheck()` from preload; do not expose generic IPC primitives.
- Configure the renderer with context isolation and Chromium sandboxing enabled and Node integration disabled.
- Route development user data to an OS temporary directory, with an explicit environment override available for disposable test runs.
- Verify the production build by launching Electron and calling the preload health check from the real renderer context.

## Milestones

1. Initialize repository and quality gates.
2. Build design system and app shell.
3. Build Presence with typed mock data.
4. Implement voice state machine and microphone capture.
5. Implement mock provider orchestration.
6. Add interruption, failure states, tests, and UI polish.

## Acceptance criteria

Use JAR-001 through JAR-004 in `docs/CODEX_TASKS.md`.

## Verification

- Run format, lint, typecheck, tests, and build.
- Launch desktop app.
- Test microphone allowed and denied.
- Test press, release, cancel, and interrupt.
- Test reduced motion.
- Capture screenshots of idle, listening, responding, and error states.
- Record a short demo of the complete interaction.

For JAR-001 specifically:

- Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Run the Electron IPC smoke command against the production build and require an exact typed health response.
- Inspect the built renderer and window configuration to confirm that no Node API or generic IPC bridge is exposed.
- Defer microphone, voice-state, reduced-motion, and multi-state screenshot verification to JAR-002 through JAR-004, where those behaviors enter scope.

## Risks and decisions

- WebGL Orb can delay the vertical slice. Implement a semantic 2D fallback first if WebGL blocks interaction work.
- Browser MediaRecorder formats differ. Encapsulate audio-format detection.
- Global shortcut may conflict with text entry. Begin with a configurable shortcut and UI hold control.

## Progress log

- 2026-07-29: Read `AGENTS.md`, `README.md`, `PLANS.md`, every product document listed by README, the three accepted ADRs, the GitHub workflow, JAR task list, and this ExecPlan before modifying repository files.
- 2026-07-29: Refined the plan with the JAR-001 workspace shape, IPC boundary, development-data location, and production-build smoke verification. Product scope was not expanded.
- 2026-07-29: Added the pnpm workspace, Electron main/preload/React renderer entry points, strict TypeScript projects, formatting and lint configuration, unit tests, build scripts, and Windows GitHub CI.
- 2026-07-29: Added a single typed `window.jarvis.healthCheck()` bridge. Main/preload use CommonJS output because Electron sandboxed preloads do not run as ESM; renderer context isolation and sandboxing are enabled and Node integration is disabled.
- 2026-07-29: Replaced the initially selected TypeScript 7 and Vite 8 versions after validation showed current `typescript-eslint` and `electron-vite` peer incompatibilities. The compatible locked versions are TypeScript 6.0.3 and Vite 7.3.6; `pnpm peers check` then passed.
- 2026-07-29: The Electron runtime download from GitHub stalled in the local network environment. Retried the official Electron installer through its supported mirror environment variable; no mirror or credential was committed.
- 2026-07-29: Completed format, lint, strict typecheck, 8 unit tests, production build, production IPC smoke, and development-mode IPC smoke. Both real Electron launches returned the exact main-process health response and exited cleanly.
