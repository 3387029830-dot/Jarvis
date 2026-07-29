# GitHub Workflow

## 1. Repository strategy

Use one repository during the modular-monolith phase.

Recommended branches:

- `main`: always runnable;
- `feat/JAR-###-short-name`;
- `fix/JAR-###-short-name`;
- `docs/JAR-###-short-name`.

## 2. Issues

Each issue should contain:

- user-visible goal;
- experience narrative;
- scope and non-scope;
- acceptance criteria;
- verification commands;
- screenshots or recordings required;
- documentation that must be updated.

Recommended labels:

- `area:experience`
- `area:voice`
- `area:cognition`
- `area:desktop`
- `area:persistence`
- `area:obsidian`
- `type:feature`
- `type:bug`
- `type:decision`
- `priority:foundation`
- `status:blocked`

## 3. Pull requests

A PR should be small enough to review as one product behavior.

PR description template:

```md
## User-visible outcome

## What changed

## What did not change

## Screenshots / recordings

## Verification

## Data or migration impact

## Risks

## Follow-up issues
```

## 4. Commit style

Use conventional, descriptive commits:

- `feat(voice): add cancellable push-to-talk state machine`
- `feat(cognition): persist accepted belief candidates`
- `fix(desktop): prevent duplicate microphone listeners`
- `docs(product): clarify Obsidian adapter boundary`

Do not require one commit per file. Prefer coherent checkpoints.

## 5. Main-branch discipline

Before merge:

- lint passes;
- typecheck passes;
- tests pass;
- build passes;
- affected flow manually verified;
- screenshots or recordings attached for UI changes;
- `PROJECT_LOG.md` updated for meaningful milestones;
- migration and privacy effects documented.

## 6. README and project record

Keep README stable. Do not turn it into a daily diary.

Use `PROJECT_LOG.md` for:

- milestone completion;
- product-direction changes;
- architecture decisions;
- important failures and lessons;
- next vertical slice.

Use GitHub Issues for granular work and `docs/decisions/` for lasting decisions.
