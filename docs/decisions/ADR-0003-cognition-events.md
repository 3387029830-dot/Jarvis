# ADR-0003: Preserve cognition changes as append-only events

## Status

Accepted

## Decision

Confirmed cognition changes are recorded as append-only events with materialized read models.

## Rationale

The product’s defining feature is showing how beliefs and understanding change. Overwriting the latest state would destroy the history needed for the Evolution experience.

## Consequences

- Belief revisions link old and new versions.
- Materialized graph tables may be rebuilt from events.
- Privacy deletion requires explicit semantics rather than casual row deletion.
