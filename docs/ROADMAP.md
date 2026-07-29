# Product Roadmap

The roadmap is organized by verifiable capabilities, not dates.

## Milestone 0 — Repository foundation

Deliver:

- repository documentation;
- Electron + React + TypeScript monorepo;
- lint, format, typecheck, unit test, and build commands;
- typed main/preload/renderer boundary;
- GitHub issue and pull-request workflow;
- disposable development data directory.

Exit condition:

The application opens reliably and CI validates the repository.

## Milestone 1 — Presence and voice vertical slice

Deliver:

- premium design system;
- app shell and Presence page;
- semantic Orb with real state machine;
- push-to-talk microphone capture;
- mock STT, conversation, and TTS providers;
- deterministic demo conversation;
- interruption and cancellation behavior.

Exit condition:

A user can press to talk, see every state, hear a mock response, interrupt it, and return to idle without broken UI state.

## Milestone 2 — Real provider voice loop

Deliver:

- provider settings;
- encrypted local credentials;
- one real STT provider;
- one real conversation provider;
- one real TTS provider;
- recoverable errors and provider fallback to text;
- local conversation persistence.

Exit condition:

A user can conduct a real spoken exchange and no credential is exposed to the renderer.

## Milestone 3 — Cognition candidate loop

Deliver:

- cognition candidate extraction;
- inline confirmation/edit/defer/discard card;
- questions, concepts, beliefs, insights, and cross-domain connections;
- source-message links;
- append-only cognition event persistence.

Exit condition:

A spoken conversation can produce a user-confirmed belief with traceable sources.

## Milestone 4 — Constellation

Deliver:

- curated cognition graph;
- domain and exploration filtering;
- node detail panel;
- connection explanations;
- visual graph update after a candidate is accepted;
- accessible list fallback.

Exit condition:

The saved belief appears in a meaningful map and the user can understand why it is connected to other domains.

## Milestone 5 — Evolution

Deliver:

- revisiting an existing belief;
- belief revision proposal;
- preserved old versions;
- change reason and triggering sources;
- editorial evolution timeline.

Exit condition:

The user can visibly compare an old belief with a new one without loss of history.

## Milestone 6 — Continuity and retrieval

Deliver:

- active exploration summaries;
- retrieval of relevant confirmed cognition;
- opening Presence content based on real state;
- explicit memory citations in conversation;
- controls for what Jarvis remembers.

Exit condition:

A later conversation naturally and accurately continues an earlier exploration.

## Milestone 7 — Obsidian archive adapter

Deliver:

- configurable test vault;
- Markdown export templates;
- export status and conflict handling;
- source links and revision history;
- no automatic destructive edits.

Exit condition:

A confirmed exploration can be exported, reopened, and traced back without making Obsidian the system of record.

## Later directions

- source capture from browser and files;
- richer cross-domain research with verified citations;
- mobile capture companion;
- optional VAD and wake word;
- larger graph engine;
- privacy-preserving local models;
- personal weekly cognition review.
