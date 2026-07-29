# First prompt for Codex

Read `AGENTS.md`, `README.md`, `PLANS.md`, and all product documents referenced by the README before changing files.

We are starting Jarvis, a voice-first immersive personal cognition desktop application. It is not a coding assistant or productivity dashboard. The immediate goal is the foundation vertical slice defined in `docs/plans/0001-foundation-vertical-slice.md`.

Do the following:

1. Inspect the repository and summarize the product constraints you must preserve.
2. Review the ExecPlan and improve it only where implementation details are missing; do not expand product scope.
3. Implement **JAR-001 only** from `docs/CODEX_TASKS.md`.
4. Use Electron + React + TypeScript + Vite in a pnpm workspace.
5. Enable TypeScript strict mode, Electron context isolation, and a minimal typed preload bridge.
6. Add formatting, lint, typecheck, tests, build scripts, and GitHub CI.
7. Keep the renderer visually minimal for this task; do not prematurely implement the final Presence design.
8. Run every verification command and start the app to verify the health-check IPC.
9. Update the ExecPlan progress log and `PROJECT_LOG.md`.
10. Finish with a concise summary of changed files, commands run, risks, and the exact next issue.

Do not implement JAR-002 or later tasks in the same change. Do not add real model providers or API keys.
