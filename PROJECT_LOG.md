# Jarvis Project Log

This file records product progress, not every commit. Add a new entry after each meaningful vertical slice or decision.

---

## 2026-07-29 — Product direction established

### What changed

- Defined Jarvis as a voice-first personal cognition companion.
- Removed programming assistant and productivity dashboard from the product center.
- Established personal cognition mapping and belief evolution as the core differentiation.
- Defined Obsidian as an optional external archive adapter.
- Chose a desktop application built with Electron and Web technologies.

### Why

Traditional model interfaces isolate conversations in separate windows and provide weak continuity, immersion, and belonging. Jarvis should become a persistent personal space where curiosity, cross-domain exploration, and self-understanding accumulate over time.

### Current priority

Build the first high-fidelity vertical slice:

1. Presence home;
2. push-to-talk voice interaction;
3. spoken and textual response;
4. cognition candidate card;
5. saved exploration visible in a small constellation view.

### Open questions

- Which third-party model/STT/TTS provider should be the first production adapter?
- Whether “REMADE” refers to README or another project-recording tool.
- Whether the first Orb implementation should use WebGL immediately or begin with a lower-risk Canvas/CSS prototype.

---

## 2026-07-29 — JAR-001 repository foundation completed

### What changed

- Initialized a pnpm workspace with an Electron, React, TypeScript, and Vite desktop application.
- Added strict TypeScript projects for Electron main/preload code and the React renderer.
- Enforced context isolation, Chromium sandboxing, disabled renderer Node integration, blocked new windows, and blocked renderer navigation.
- Exposed one namespaced, strongly typed preload API: `window.jarvis.healthCheck()`.
- Routed development user data to the operating-system temporary directory.
- Added Prettier, ESLint, typecheck, Vitest, build, development, and Electron smoke commands.
- Added Windows GitHub Actions CI for format checking, linting, typechecking, tests, and production build.
- Kept the renderer intentionally minimal; no Presence, voice, model, persistence, or cognition behavior was introduced.

### Verification

- `pnpm install` completed and the lockfile was generated.
- `pnpm peers check` reported no peer dependency issues.
- `pnpm format:check`, `pnpm lint`, and `pnpm typecheck` passed.
- `pnpm test` passed 8 tests across 5 files.
- `pnpm build` produced main, preload, and renderer production bundles.
- `pnpm smoke` launched the production Electron application and returned the expected typed IPC result.
- `pnpm dev` was launched with the smoke flag and returned the same IPC result through the development renderer.

### Decisions and lessons

- Use CommonJS output for the sandboxed preload bundle. Electron ESM preloads require an unsandboxed renderer, which conflicts with the repository security boundary.
- Lock TypeScript to 6.0.3 and Vite to 7.3.6 until `typescript-eslint` and `electron-vite` support their next major versions together.
- The local network could not complete the Electron runtime download from GitHub. The official installer succeeded through a temporary supported mirror configuration; repository configuration remains registry-neutral.

### Remaining risk

- GitHub CI has been defined but will only be proven on GitHub after the initial push.
- The current renderer is foundation evidence, not the final Presence experience.

### Next priority

Implement **JAR-002 — Build the design-system foundation**. Do not begin Presence or voice implementation before its tokens, primitives, accessibility states, and reduced-motion behavior are verified.

---

## 2026-07-29 — JAR-002 design-system foundation completed

### What changed

- Established the “editorial observatory” visual direction: graphite luminance layers,
  warm-neutral text, one restrained ice-blue accent, generous space, and quiet structural rules.
- Added CSS-variable tokens for backgrounds, text, semantic colors, borders, spacing, typography,
  radii, border widths, shadows, restrained glow, motion, easing, opacity, z-index, focus rings,
  and readable content widths.
- Added reusable Button, IconButton, Panel, Card, Badge, Tooltip, Dialog, ScrollArea, Spinner, and
  VisuallyHidden primitives with typed props.
- Added a development-only design-system showcase with token specimens, Chinese and mixed-language
  typography, component variants, every requested interaction state, semantic feedback,
  long-content overflow, Dialog, and reduced-motion simulation.
- Added deterministic production-Electron evidence modes for viewport and showcase state without
  modifying the typed preload health-check API.

### Verification

- `pnpm format:check`, `pnpm lint`, and strict `pnpm typecheck` passed.
- `pnpm test` passed 18 tests across 9 files, including all JAR-001 tests.
- `pnpm build` produced main, preload, and renderer production bundles.
- `pnpm smoke` launched the production Electron application and returned
  `{"process":"main","status":"ok"}`.
- A visible production Electron showcase window launched, remained responsive, and closed
  normally after manual inspection.
- Five exact-size screenshots were reviewed under `artifacts/jar-002/`.

### Decisions and lessons

- CSS custom properties are the runtime source of truth; TypeScript helpers reference those
  variables without duplicating values.
- Purpose-built primitives preserve the Jarvis visual language without importing a component
  framework. Testing Library and jsdom were added only for DOM and keyboard behavior tests.
- Native Dialog semantics are supplemented with explicit initial focus, Tab wrapping, Escape
  handling, and return focus.
- Reduced motion removes translation, scale, spinning, and continuous animation while retaining
  static color and boundary feedback.

### Remaining risk

- Windows system-font availability is intentional; typography may differ slightly on non-Windows
  developer machines.
- The showcase proves the shared language, not the final Presence composition.
- GitHub CI status must be confirmed after this commit is pushed.

### Next priority

Proceed to **JAR-003 — Implement the app shell and Presence page** only after the JAR-002 commit and
CI run are confirmed. Do not introduce voice state, providers, persistence, or cognition-map
features in that issue.
