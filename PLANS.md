# PLANS.md — ExecPlan Contract

Use an ExecPlan for any task that:

- changes more than one package or application layer;
- introduces a new persistent domain object;
- adds or changes an external provider;
- changes the voice state machine;
- changes cognition extraction or revision semantics;
- requires several coordinated implementation steps.

Each plan lives at `docs/plans/NNNN-short-name.md` and must contain:

## Goal

Describe the user-visible outcome, not only the code change.

## Experience narrative

Describe exactly what the user does, sees, hears, and can cancel.

## Scope

List what is included and explicitly excluded.

## Existing code and documents

Record files that were inspected and constraints discovered.

## Architecture

Describe components, IPC boundaries, domain events, persistence changes, and provider contracts.

## Milestones

Use independently verifiable milestones. Each milestone must leave the repository runnable.

## Acceptance criteria

Use observable behavior. Avoid vague criteria such as “looks modern” or “works well.”

## Verification

List commands, automated tests, manual interactions, screenshots, and failure cases.

## Risks and decisions

Record unresolved risks and decisions made during implementation.

## Progress log

Update this section while working. Do not rewrite history to make execution look cleaner than it was.
