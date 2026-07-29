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

For the current JAR-002 milestone:

- the JAR-001 Electron security and health-check boundaries remain unchanged;
- only design tokens, reusable UI primitives, accessibility behavior, component-state tests, and a
  development-only showcase enter scope;
- Presence, the application shell, Orb, voice state, conversation, persistence, cognition, and
  provider behavior remain excluded.

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

JAR-002 implementation details:

- Keep CSS custom properties as the runtime source of truth in `design-system/tokens.css`.
- Place React primitives and their component styles under `renderer/src/design-system/`.
- Use dependency-free React and browser APIs for focus management, tooltip behavior, and scrolling;
  do not add a component framework for this slice.
- Render a single development showcase from the existing root entry. It is verification content,
  not a product route or Presence screen.
- Add an optional smoke evidence mode that can set viewport size and showcase state without
  expanding the preload bridge.

## Milestones

1. Initialize repository and quality gates.
2. Build design tokens, reusable primitives, accessibility behavior, and the development showcase.
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

For JAR-002 specifically:

- Run format, lint, strict typecheck, unit tests, production build, and the existing IPC smoke.
- Inspect the showcase at 1440×900 and 1024×900.
- Capture the full showcase, minimum-width layout, open Dialog, keyboard focus, and reduced-motion
  evidence in `artifacts/jar-002/`.
- Verify keyboard traversal, Dialog focus trap/return, Escape close, overflow behavior, Chinese and
  mixed-language typography, hover/active/error/loading/disabled states, and reduced motion.

## Risks and decisions

- WebGL Orb can delay the vertical slice. Implement a semantic 2D fallback first if WebGL blocks interaction work.
- Browser MediaRecorder formats differ. Encapsulate audio-format detection.
- Global shortcut may conflict with text entry. Begin with a configurable shortcut and UI hold control.
- JAR-002 uses CSS custom properties as the only concrete token-value source. TypeScript exports
  typed CSS-variable references rather than duplicating values.
- JAR-002 primitives use React and browser semantics without a component framework. The native
  Dialog top layer is supplemented with tested initial focus, focus wrapping, Escape close, and
  return focus.
- Visual evidence is driven by main-process environment flags available only to smoke runs; the
  preload bridge remains the single health-check method introduced by JAR-001.
- System-font rendering may vary slightly outside Windows. Chinese acceptance is based on the
  Windows-first font stack required by the current desktop target.

## Progress log

- 2026-07-29: Read `AGENTS.md`, `README.md`, `PLANS.md`, every product document listed by README, the three accepted ADRs, the GitHub workflow, JAR task list, and this ExecPlan before modifying repository files.
- 2026-07-29: Refined the plan with the JAR-001 workspace shape, IPC boundary, development-data location, and production-build smoke verification. Product scope was not expanded.
- 2026-07-29: Added the pnpm workspace, Electron main/preload/React renderer entry points, strict TypeScript projects, formatting and lint configuration, unit tests, build scripts, and Windows GitHub CI.
- 2026-07-29: Added a single typed `window.jarvis.healthCheck()` bridge. Main/preload use CommonJS output because Electron sandboxed preloads do not run as ESM; renderer context isolation and sandboxing are enabled and Node integration is disabled.
- 2026-07-29: Replaced the initially selected TypeScript 7 and Vite 8 versions after validation showed current `typescript-eslint` and `electron-vite` peer incompatibilities. The compatible locked versions are TypeScript 6.0.3 and Vite 7.3.6; `pnpm peers check` then passed.
- 2026-07-29: The Electron runtime download from GitHub stalled in the local network environment. Retried the official Electron installer through its supported mirror environment variable; no mirror or credential was committed.
- 2026-07-29: Completed format, lint, strict typecheck, 8 unit tests, production build, production IPC smoke, and development-mode IPC smoke. Both real Electron launches returned the exact main-process health response and exited cleanly.
- 2026-07-29: Began JAR-002 after re-reading the required product documents and current ExecPlan
  with explicit UTF-8 decoding. Confirmed the execution boundary excludes JAR-003 and all product
  functionality.
- 2026-07-29: Initialized Superdesign repository context from the real JAR-001 renderer and recorded
  the “editorial observatory” design direction before implementing UI.
- 2026-07-29: Received user approval for Superdesign draft
  `3ce57b74-d60e-48d6-9b2a-881ac9737c3a`, then implemented the approved luminance, typography,
  spacing, and editorial-folio direction while correcting scope and accessibility gaps in the
  generated reference.
- 2026-07-29: Added CSS runtime tokens, typed CSS-variable helpers, Button, IconButton, Panel, Card,
  Badge, Tooltip, Dialog, ScrollArea, Spinner, and VisuallyHidden under the renderer design-system
  directory. No preload API or product feature was added.
- 2026-07-29: Added the `#/design-system` development showcase with Chinese/mixed typography,
  tokens, primitive variants, forced visual comparisons, real keyboard focus, semantic success /
  warning / error examples, long overflow content, Dialog behavior, and normal/reduced motion.
- 2026-07-29: Added token, variant, evidence-option, component-state, Tooltip association,
  ScrollArea keyboard, and Dialog focus/Escape/return tests. The full suite now contains 18 tests
  across 9 files, including every JAR-001 smoke/security test.
- 2026-07-29: Captured five production-Electron evidence images in `artifacts/jar-002/` at exact
  1440×900 and 1024×900 pixel sizes. A visible production Electron window launched, responded, and
  closed normally during manual review.
- 2026-07-29: Completed the final JAR-002 quality gate: format check, lint, strict typecheck, 18
  tests, production build, and `pnpm smoke` all passed. The final smoke returned
  `{"process":"main","status":"ok"}`; JAR-002 is complete and work stopped before JAR-003.
