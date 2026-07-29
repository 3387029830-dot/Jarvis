# Personal Cognition Model

## 1. Design principle

The system does not treat chat history as the cognition map.

Chat is evidence. Cognition objects are curated structures derived from evidence and confirmed by the user.

## 2. Core objects

### Exploration

A continuing investigation around one or more questions.

Examples:

- Why does money have value?
- Why do people know something is harmful and still do it?
- How do freedom and order conflict?

### Question

A durable question. Questions may be open, partially answered, dormant, or revisited.

### Concept

A domain concept such as loss aversion, social trust, fiat currency, cognitive dissonance, or identity.

### Belief

The user’s current provisional understanding. A belief is not an objective fact.

### BeliefRevision

An append-only change from one belief version to another, including:

- previous belief;
- new belief;
- reason for change;
- triggering source;
- timestamp;
- confidence and uncertainty;
- user confirmation.

### Insight

A newly formed connection or concise realization that may not yet be a stable belief.

### Connection

A typed relation between nodes.

### Evidence

Material that supports, challenges, contextualizes, or exemplifies a belief.

### Reflection

A user-authored or user-confirmed observation about their own attention, assumptions, or reasoning process.

### Source

Conversation messages, voice clips, books, articles, videos, notes, or imported Obsidian pages.

## 3. Node types

```ts
type CognitionNodeType =
  | 'exploration'
  | 'question'
  | 'concept'
  | 'belief'
  | 'insight'
  | 'evidence'
  | 'reflection'
  | 'source';
```

## 4. Edge types

```ts
type CognitionEdgeType =
  | 'explores'
  | 'relates_to'
  | 'supports'
  | 'challenges'
  | 'causes'
  | 'contrasts_with'
  | 'applies_to'
  | 'derived_from'
  | 'revises'
  | 'example_of'
  | 'raises_question'
  | 'cross_domain_parallel';
```

Each edge stores:

- source node ID;
- target node ID;
- type;
- explanation;
- confidence;
- source IDs;
- confirmation state;
- created and updated timestamps.

## 5. Fact and belief separation

The interface and database must distinguish:

- `external_claim`: a claim from a source or model answer;
- `user_belief`: the user’s current interpretation;
- `jarvis_hypothesis`: a suggested connection or inference;
- `verified_fact`: a claim accepted only under a defined verification policy.

Never silently promote a model-generated statement into a user belief.

## 6. Append-only cognition events

Use an event log as the source of durable cognition changes.

```ts
type CognitionEvent =
  | NodeCreated
  | NodeUpdated
  | CandidateProposed
  | CandidateAccepted
  | CandidateRejected
  | EdgeCreated
  | BeliefRevised
  | SourceAttached
  | ObsidianExported
  | ItemArchived;
```

Materialized tables may be updated for fast reading, but event history remains immutable except for explicit privacy deletion.

## 7. Suggested SQLite tables

- `conversations`
- `messages`
- `audio_assets`
- `explorations`
- `cognition_nodes`
- `cognition_edges`
- `belief_revisions`
- `cognition_candidates`
- `sources`
- `node_sources`
- `cognition_events`
- `provider_runs`
- `exports`
- `settings`

Use SQLite FTS5 for local text search. Add embeddings only after meaningful retrieval failures are observed.

## 8. Candidate extraction

After an exchange, a model may propose:

```json
{
  "candidateType": "belief",
  "statement": "追涨可能不仅来自贪婪，也来自人在不确定环境中借用群体行为获得安全感。",
  "domains": ["finance", "psychology", "social_behavior"],
  "relatedQuestions": ["为什么人会追涨杀跌？"],
  "sourceMessageIds": ["msg_101", "msg_104"],
  "confidence": 0.84
}
```

The user can accept, edit, defer, or reject it.

## 9. Self-understanding boundaries

Jarvis may surface patterns such as:

- recurring questions;
- domains frequently connected;
- beliefs that changed often;
- unresolved tensions;
- changes in expressed confidence.

It must phrase these as observations with evidence, not definitive identity judgments.

Good:

> 最近三次讨论中，你都把“个体选择”连接到了“制度环境”。这可能是你当前特别关注的视角。

Bad:

> 你是一个制度决定论者。
