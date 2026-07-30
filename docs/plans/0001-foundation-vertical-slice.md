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

For the current JAR-003 milestone:

- the formal product shell and `#/presence` page become the default user experience;
- all visible product copy is Simplified-Chinese-first and comes from a typed `zh-CN` catalog;
- Presence uses typed mock view-models for empty, single, and populated development states;
- the Orb represents only an honest `idle` presence state with reduced-motion and static fallbacks;
- “continue exploring,” first-exploration, and text-entry affordances produce deterministic
  page-local feedback without opening an unfinished Conversation page;
- microphone capture, voice state transitions, providers, persistence, cognition extraction,
  Constellation, Evolution, Archive, and Settings implementations remain excluded.

For the current JAR-004 milestone:

- real microphone permission, in-memory MediaRecorder capture, analyser waveform, duration,
  cancellation, interruption, local playback, and cleanup enter scope;
- transcript, understanding, response content, streaming cadence, and playback content remain
  deterministic Mock behavior and are labelled as such;
- Presence displays only the current voice round; Conversation, history, persistence, cognition
  extraction, SQLite, provider credentials, VAD, wake word, and global shortcuts remain excluded;
- audio stays in renderer memory and never enters preload IPC, disk, console output, or a network
  request.

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

JAR-003 implementation details:

- Keep the renderer dependency-light: use the existing hash entry to select `#/presence` and the
  development-only `#/design-system` route without adding a router package.
- Add a typed `zh-CN` copy catalog and locale-aware date formatting through `Intl.DateTimeFormat`.
- Place the formal shell and Presence view under dedicated renderer directories, reusing JAR-002
  tokens and primitives instead of introducing parallel styling.
- Keep navigation items for unfinished spaces visibly disabled, with inline Chinese availability
  text and supplementary Tooltips; no dead routes or placeholder pages are created.
- Extend smoke evidence options only with renderer route, mock variant, focus, motion, and zoom
  controls. The preload bridge remains unchanged.
- Treat the mock cognition-change text as a provisional view explicitly in copy and visuals; no
  cognition item is persisted or promoted to a user belief.

JAR-004 implementation details:

- Keep the implementation in `renderer/src/voice/` for this local-only slice. A pure reducer and
  `VoiceController` own the canonical phase, permission state, session ID, transcript, response,
  duration, level, notice, and error.
- Use a monotonically increasing `sessionId`; the reducer ignores every stale asynchronous action.
- Request `getUserMedia` only from pointer or keyboard hold. Build capture through MediaRecorder,
  supported MIME selection, Web Audio analyser, a 300 ms minimum, and a 60 second maximum.
- Stop tracks, analyser RAF, AudioContext, recorder, timers, AbortController, and playback on every
  release, cancel, error, device-ended, interruption, and unmount path.
- Hold the Blob only in a private controller field and clear it when the Mock transcript arrives.
- Implement the Mock chain through injectable delays/callbacks. Prefer speechSynthesis for the
  fixed Chinese response and fall back to a deterministic Web Audio tone without remote audio.
- Keep the main hold button focusable with `aria-disabled` during non-interactive processing
  phases. Native `disabled` was rejected after real testing showed it loses keyboard focus and
  prevents the required speaking interruption.
- Extend the existing production evidence hash only with read-only voice snapshots. This does not
  change the preload surface or create product settings.

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

For JAR-003 specifically:

- Run format, lint, strict typecheck, all unit/component tests, production build, and the existing
  IPC smoke.
- Test typed copy, empty/single/populated view models, current and disabled navigation behavior,
  deterministic “continue exploring,” honest inactive voice affordance, and reduced-motion logic.
- Inspect Presence at 1440×900 and 1024×900, plus populated, single, empty, keyboard-only,
  reduced-motion, and 200% zoom states.
- Capture the six required Presence/showcase PNGs and the evidence manifest in
  `artifacts/jar-003/`.

For JAR-004 specifically:

- Run format check, lint, strict typecheck, all unit/component tests, production build, and the
  existing IPC smoke.
- Test reducer happy/cancel/interrupt/error/stale/illegal paths; permissions, unavailable APIs,
  duration limits, early release, cleanup, pointer/keyboard hold, Escape, key repeat, playback
  fallback, focus retention, and playback failure text preservation.
- Launch visible Windows Electron with the live controller, allow microphone access, observe real
  analyser movement, release through the full Mock chain, interrupt speaking with a new hold, and
  cancel the new listening session with Escape.
- Inspect 1440×900, 1024×900, reduced-motion, error, and 200% zoom states.
- Capture the eight required PNGs and evidence manifest in `artifacts/jar-004/`.

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
- JAR-003 keeps the Orb as a CSS/SVG idle-state representation. This avoids introducing WebGL or a
  voice animation architecture before JAR-004 provides the canonical state machine.
- Hash-based development variants are intentionally small and deterministic; they are evidence
  controls, not product settings or a general routing abstraction.
- JAR-004 keeps audio entirely renderer-local because no real provider exists. Moving provider
  credentials or network calls into renderer remains prohibited; JAR-006 must introduce a
  separately reviewed main-process boundary.
- System speechSynthesis varies across Windows installations. The deterministic oscillator fallback
  guarantees playback lifecycle testing but is intentionally not presented as real synthesized
  speech.
- The production Renderer bundle is approximately 657 kB. No dependency was added for JAR-004, but
  route-level splitting should be reconsidered as JAR-005 adds UI.

## JAR-003 deviations and rationale

- The original foundation narrative described real microphone capture and a deterministic spoken
  loop in one broad plan. JAR-003 deliberately stops before those steps because `docs/CODEX_TASKS.md`
  assigns them to JAR-004. The current voice affordance therefore returns an explicit local
  “not recording” message and never calls `getUserMedia`.
- The approved Superdesign draft used dashboard-like equal cards, an active settings link, English
  synthesis labels, and wording that implied background cognition. Implementation retained its
  calm composition and spatial Orb direction but replaced those elements with editorial sections,
  disabled future navigation, Chinese-first copy, and honest Mock disclosures.
- A CSS Orb was selected instead of React Three Fiber. Only the idle semantic state exists in
  JAR-003, so WebGL would add bundle and accessibility cost before the JAR-004 state machine defines
  the real visual contract.
- The repository continues to use the small hash selector instead of adding React Router. There are
  only two renderer destinations, and the design-system route remains development-only.
- No new runtime dependency was required. Existing React, browser APIs, CSS tokens, and primitives
  cover the complete slice.

## JAR-004 deviations and rationale

- The early architecture sketch placed voice and model code in workspace packages. JAR-004 has no
  provider, cross-process consumer, or persistence boundary, so introducing packages would create
  premature abstractions. The implementation remains a cohesive renderer vertical slice with
  injectable adapters and can be extracted when JAR-006 creates a real second consumer.
- `docs/VOICE_SPEC.md` previously said renderer audio should cross preload IPC. That would violate
  this task's explicit no-audio-IPC boundary. The specification now separates the renderer-local
  JAR-004 Mock loop from the future main-process provider boundary.
- Superdesign listening and response drafts supplied the approved A+B composition, but implementation
  retained the repository font tokens, removed the draft's external Inter import, and used the
  actual editorial Presence shell.
- Native button `disabled` was initially used during processing. Visible Electron testing showed
  that focus was lost before speaking, making keyboard interruption fail. It was replaced with a
  focusable `aria-disabled` state plus guarded handlers and a regression test.
- Evidence phase screenshots use deterministic state snapshots so they remain repeatable. Real
  microphone analyser, complete playback, interruption, and cancellation were separately exercised
  in a visible live Electron run and are not inferred from those snapshots.

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
- 2026-07-30: Began JAR-003 on `feat/jar-003-presence` after reading the repository instructions,
  product, experience, frontend, voice, task, current-plan, architecture, roadmap, cognition, ADR,
  JAR-002 evidence, Superdesign context, and the complete task attachment. Confirmed that JAR-004
  voice capture/state/provider work remains explicitly excluded.
- 2026-07-30: Generated Superdesign Presence draft
  `9962bb3f-9bc1-4823-8d17-5d40338036c2` from the approved JAR-002 source and existing renderer
  files. The user approved the visual direction before implementation.
- 2026-07-30: Added the typed Simplified-Chinese copy catalog, zh-CN Intl formatting, typed
  empty/single/populated Presence view-models, the compact application shell, disabled future
  navigation, page-local continuation/text feedback, and an honest inactive voice affordance.
- 2026-07-30: Added the semantic idle Orb with reduced-motion and constrained-hardware static
  fallbacks. The preload API remains the single JAR-001 health check; no microphone, provider,
  persistence, or hidden Node capability was introduced.
- 2026-07-30: Revised the development showcase toward Chinese-first copy and established
  `docs/COPY_GUIDE_ZH_CN.md` plus ADR-0005 for the long-term language decision.
- 2026-07-30: Added tests for locale copy, zh-CN formatting, view-model variants, evidence routing,
  navigation active/disabled behavior, local continuation, inactive voice behavior, and Orb motion.
  The suite contains 32 passing tests across 14 files.
- 2026-07-30: Launched production Electron repeatedly and confirmed the typed IPC response while
  inspecting 1440×900, 1024×900, populated, single, empty, keyboard-focus, reduced-motion, and 200%
  zoom states. Six final screenshots are documented under `artifacts/jar-003/`; temporary single
  and zoom inspection images remain outside the evidence directory.
- 2026-07-30: Local format, lint, strict typecheck, test, build, and Electron smoke gates passed.
  Draft PR #1 was created and GitHub Actions `Quality gates` run `30510759971` completed
  successfully for the implementation commit.
- 2026-07-30: Began JAR-004 on `feat/jar-004-voice-mock-loop` after re-reading repository,
  product, experience, voice, frontend, architecture, status, task, plan, copy, and JAR-003
  evidence documents. Confirmed that Conversation, persistence, real providers, VAD, wake word,
  global shortcuts, and JAR-005 remain excluded.
- 2026-07-30: Generated two Superdesign branches from the approved Presence source for real
  permission/listening and current-round response/playback states. The user approved the combined
  A+B direction before implementation.
- 2026-07-30: Added the pure typed reducer, `VoiceController`, browser capture adapter, deterministic
  Mock loop, local playback adapter, evidence snapshots, Presence current-round UI, and semantic
  Orb states without adding dependencies or expanding preload.
- 2026-07-30: Added tests for nine canonical phases, stale sessions, invalid transitions,
  permission errors, early release, minimum/maximum duration, track cleanup, pointer/keyboard
  holds, key repeat, Escape, reduced motion, playback fallback/failure, speaking interruption, and
  keyboard focus retention. The suite now contains 63 passing tests across 21 files.
- 2026-07-30: Launched visible Electron with the live controller. Verified requesting before
  permission, real microphone listening/analyser, full Mock processing to speaking, speaking
  interruption into a new listening session, and Escape cleanup back to idle. The first live run
  exposed native-disabled focus loss; the corrected `aria-disabled` implementation passed the
  repeated live run.
- 2026-07-30: Generated eight production Electron evidence PNGs at 1440×900 and 1024×900, including
  error and reduced-motion states. The production health-check continued to return
  `{"process":"main","status":"ok"}` for every capture.
- 2026-07-30: Local format, lint, strict typecheck, 63 tests, build, and smoke passed before
  publication. Draft PR creation and GitHub CI remain the final publication gate; JAR-004 must not
  be considered complete until those checks and the requested squash merge succeed.
