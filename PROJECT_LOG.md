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
