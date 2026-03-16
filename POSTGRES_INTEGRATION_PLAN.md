# PostgreSQL Integration Plan

## Current State

Verified runtime persistence today:

- Sessions: file-based JSON store
  - `src/config/sessions/store.ts`
  - `src/config/sessions/paths.ts`
- Session transcripts/messages: file-based transcript files
  - `src/config/sessions/transcript.ts`
  - `src/config/sessions/session-file.ts`
- Memory search/vector storage: SQLite-based
  - `src/agents/memory-search.ts`
  - `src/memory/sqlite.ts`
  - `src/memory/sqlite-vec.ts`
- Memory backend selection:
  - `src/config/types.memory.ts`
  - only `"builtin"` or `"qmd"`
- Plugin install/config metadata:
  - stored in config under `plugins.*`
  - `src/plugins/installs.ts`

Verified unsupported status:

- No PostgreSQL runtime integration found in `src/`
- No PostgreSQL package/runtime dependency found in `package.json`
- No config key in current schema for a PostgreSQL store

## Where PostgreSQL Would Need To Plug In

### 1) Session store

Current files:

- `src/config/sessions/store.ts`
- `src/config/sessions/types.ts`
- `src/config/sessions/store-migrations.ts`

Recommended seam:

- Extract a `SessionStoreBackend` interface from current file-backed functions:
  - load
  - save
  - patch/merge
  - prune/archive

Why first:

- This is the main persistent state for routing/session continuity.
- It is the cleanest high-value place to introduce an external DB.

### 2) Transcript / message persistence

Current files:

- `src/config/sessions/transcript.ts`
- `src/config/sessions/session-file.ts`

Recommended seam:

- Separate transcript append/read operations from filesystem path resolution.
- Keep transcript event emission unchanged while swapping storage backend underneath.

Why:

- Session store alone is not enough if you want durable chat/message history in PostgreSQL.

### 3) Memory search metadata / vectors

Current files:

- `src/agents/memory-search.ts`
- `src/memory/search-manager.ts`
- `src/memory/manager.ts`
- `src/memory/sqlite.ts`
- `src/memory/sqlite-vec.ts`

Important current limitation:

- `ResolvedMemorySearchConfig.store.driver` is `"sqlite"` only in:
  - `src/agents/memory-search.ts`

Implication:

- PostgreSQL for memory/vector search is not a small config addition.
- It requires a new driver path and likely a new vector backend strategy.

### 4) Plugin metadata

Current files:

- `src/config/types.plugins.ts`
- `src/plugins/installs.ts`
- `src/plugins/config-state.ts`

Recommendation:

- Leave plugin config in `openclaw.json` initially.
- Do not move plugin metadata first.

Why:

- Lower value than sessions/messages.
- More coupling to config mutation and schema UI.

## Recommended Migration Order

### Phase 1: PostgreSQL-backed session store only

Scope:

- Replace `sessions.json` persistence with a DB-backed store abstraction.
- Keep transcript files on disk initially.

Benefits:

- Lowest-risk way to introduce PostgreSQL.
- Preserves current transcript tooling and archive behavior.

### Phase 2: PostgreSQL-backed transcripts/messages

Scope:

- Move assistant/user transcript append/read paths into PostgreSQL.
- Keep filesystem export as optional mirror/archive.

### Phase 3: PostgreSQL-backed memory metadata

Scope:

- Only after session/transcript backend is stable.
- Decide whether vectors remain SQLite/`sqlite-vec`, move to PostgreSQL, or split metadata/vectors.

## What Not To Change First

- do not replace `openclaw.json` config storage first
- do not move plugin config first
- do not couple PostgreSQL rollout to Ollama rollout
- do not couple PostgreSQL rollout to RTK rollout

## Minimal Future Config Shape

Not implemented today, but the likely future insertion points are:

- `session.*` for session/transcript backend selection
- `memory.*` or `agents.defaults.memorySearch.store.*` for memory backend selection

Reason:

- Those are the current ownership boundaries in the codebase.

Avoid:

- inventing a generic top-level `database` section before the store abstractions exist

## Required Refactor Boundaries Before Implementation

### Boundary A: abstract session store operations

Start from:

- `src/config/sessions/store.ts`

Goal:

- isolate file IO from session merge/prune logic

### Boundary B: abstract transcript append/read operations

Start from:

- `src/config/sessions/transcript.ts`
- `src/config/sessions/session-file.ts`

Goal:

- isolate transcript persistence from transcript eventing

### Boundary C: abstract memory storage driver

Start from:

- `src/agents/memory-search.ts`
- `src/memory/sqlite.ts`
- `src/memory/sqlite-vec.ts`

Goal:

- move from hard-coded SQLite driver assumptions to a backend interface

## Final Recommendation

If the goal is a future custom runtime:

1. add PostgreSQL for session store first
2. add transcript/message persistence second
3. keep memory on SQLite initially unless PostgreSQL vectors are a hard requirement

That sequence matches the current code boundaries and minimizes rewrite risk.
