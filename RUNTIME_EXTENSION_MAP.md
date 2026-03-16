# Runtime Extension Map

## Verified Support Status

### 1) RTK / exec-output compression

Status: not officially supported as a named feature in this repository version.

What exists instead:

- Exec output truncation and pending-tail limits:
  - `src/agents/bash-tools.exec-runtime.ts:62`
  - `src/agents/bash-tools.exec-runtime.ts:67`
- Agent/session compaction for conversation history, not exec-specific transport compression:
  - `src/config/zod-schema.agent-defaults.ts`
  - `src/agents/compaction.ts`
  - `src/agents/pi-embedded-runner/compact.ts`

What I verified:

- No source-level support found for `RTK`, `execProxy`, or `exec proxy` in `src/`.
- No source-level support found for a dedicated exec-output compression layer.
- The exec path is currently: tool policy -> exec host selection -> approvals -> process execution -> capped output aggregation.

Relevant execution files:

- `src/agents/bash-tools.exec.ts`
- `src/agents/bash-tools.exec-runtime.ts`
- `src/agents/bash-tools.exec-host-gateway.ts`
- `src/agents/bash-tools.exec-host-node.ts`
- `src/process/supervisor/*`

Conclusion:

- RTK/execProxy is not a first-class built-in integration in this version.
- If you want it, it needs to be added as a new execution/output mediation layer.

### 2) External database layer / PostgreSQL

Status: PostgreSQL is not supported in the core runtime codepaths I inspected.

What exists instead:

- Session/message persistence is file-based:
  - `src/config/sessions/store.ts`
  - `src/config/sessions/paths.ts:33`
  - `src/config/sessions/transcript.ts`
- Memory search persistence is SQLite-backed:
  - `src/agents/memory-search.ts`
  - `src/memory/sqlite.ts`
  - `src/memory/sqlite-vec.ts`
- Memory backend selection is only:
  - `src/config/types.memory.ts:3`
  - `src/memory/backend-config.ts:72`

What I verified:

- No `postgres`, `postgresql`, `pg`, `prisma`, `typeorm`, `knex`, or `sequelize` runtime hits in `src/` or `package.json`.
- `src/agents/memory-search.ts` resolves `store.driver` to `"sqlite"` only.
- `src/config/types.memory.ts` exposes `MemoryBackend = "builtin" | "qmd"`, not PostgreSQL.

Important caveat:

- `docs/prose.md` mentions experimental `postgres`, but I found no matching runtime implementation in `src/`. That doc is not evidence of supported core persistence.

Conclusion:

- PostgreSQL is not currently a supported persistence backend in the main runtime.
- Adding it will require new abstractions around session store, transcript store, and optionally memory/vector storage.

### 3) Local Ollama models on another machine

Status: supported.

Verified provider/runtime support:

- Provider schema:
  - `src/config/types.models.ts`
- Provider resolution and Ollama provider construction:
  - `src/agents/models-config.providers.ts:232`
  - `src/agents/models-config.providers.ts:768`
  - `src/agents/models-config.providers.ts:1051`
- Native Ollama stream/runtime:
  - `src/agents/ollama-stream.ts:20`
- Ollama memory embeddings:
  - `src/memory/embeddings-ollama.ts`
- Memory search provider includes `ollama`:
  - `src/config/types.tools.ts:328`
  - `src/agents/memory-search.ts`

Operational meaning:

- `models.providers.ollama.baseUrl` can point at a remote machine.
- The provider code strips `/v1` when needed and uses the native Ollama API for chat/tool calling.
- Memory embeddings also support `provider: "ollama"`.

Conclusion:

- Remote/self-hosted Ollama is officially supported in this version.

## Exact Config Paths And Related Files

### Tool policy: `tools.profile` / `tools.allow` / `tools.deny`

Primary schema/types:

- `src/config/types.tools.ts:170`
- `src/config/types.tools.ts:431`
- `src/config/zod-schema.agent-runtime.ts:252`
- `src/config/zod-schema.agent-runtime.ts:358`

Related surfaces:

- Global tools config:
  - `tools.profile`
  - `tools.allow`
  - `tools.alsoAllow`
  - `tools.deny`
- Per-agent tools config:
  - `agents.list[].tools.profile`
  - `agents.list[].tools.allow`
  - `agents.list[].tools.alsoAllow`
  - `agents.list[].tools.deny`
- Provider-specific tool policy:
  - `tools.byProvider.<provider>.profile`
  - `tools.byProvider.<provider>.allow`
  - `tools.byProvider.<provider>.alsoAllow`
  - `tools.byProvider.<provider>.deny`

Runtime resolution:

- `src/agents/pi-tools.ts`
- `src/agents/pi-tools.policy.ts`
- `src/agents/tool-policy.ts`
- `src/agents/tool-policy-pipeline.ts`

### Exec / runtime tool execution

Config type:

- `src/config/types.tools.ts:228`

Validated schema:

- `src/config/zod-schema.agent-runtime.ts:414`
- `src/config/zod-schema.agent-runtime.ts:525`

Runtime resolution:

- `src/agents/pi-tools.ts:132`
- `src/agents/pi-tools.ts:394`

Execution path:

- `src/agents/bash-tools.exec.ts`
- `src/agents/bash-tools.exec-runtime.ts`
- `src/agents/bash-tools.exec-host-gateway.ts`
- `src/agents/bash-tools.exec-host-node.ts`
- `src/agents/bash-tools.exec-approval-request.ts`
- `src/infra/exec-approvals.js`
- `src/process/supervisor/*`

Important config keys under `tools.exec`:

- `host`
- `security`
- `ask`
- `node`
- `pathPrepend`
- `safeBins`
- `safeBinTrustedDirs`
- `safeBinProfiles`
- `backgroundMs`
- `timeoutSec`
- `approvalRunningNoticeMs`
- `cleanupMs`
- `notifyOnExit`
- `notifyOnExitEmptySuccess`
- `applyPatch.*`

### Model providers, especially Ollama

Provider types:

- `src/config/types.models.ts`

Config container:

- `src/config/types.openclaw.ts`

Provider resolution:

- `src/agents/models-config.providers.ts`

Ollama-specific references:

- `src/agents/models-config.providers.ts:232`
- `src/agents/models-config.providers.ts:768`
- `src/agents/models-config.providers.ts:1051`
- `src/agents/ollama-stream.ts:20`

Memory embeddings with Ollama:

- `src/agents/memory-search.ts`
- `src/memory/embeddings-ollama.ts`

### Persistence / session storage / message storage / plugins

Session store:

- `src/config/sessions/store.ts`
- `src/config/sessions/paths.ts`
- `src/config/sessions/types.ts`
- `src/config/sessions/store-migrations.ts`

Transcript/message persistence:

- `src/config/sessions/transcript.ts`
- `src/config/sessions/session-file.ts`
- `src/sessions/transcript-events.ts`

Memory/vector persistence:

- `src/agents/memory-search.ts`
- `src/memory/backend-config.ts`
- `src/memory/sqlite.ts`
- `src/memory/sqlite-vec.ts`
- `src/memory/search-manager.ts`
- `src/memory/manager.ts`

Plugin config and install persistence:

- `src/config/types.plugins.ts`
- `src/plugins/config-state.ts`
- `src/plugins/installs.ts`
- `src/plugins/loader.ts`
- `src/plugins/manifest-registry.ts`

What plugins persist:

- Config under `plugins.*`
- Install metadata under `plugins.installs.*`
- Enable/disable/load-path state via `plugins.enabled`, `plugins.allow`, `plugins.deny`, `plugins.load.paths`, `plugins.entries.*`

### Gateway startup and config validation

Config IO and loading:

- `src/config/io.ts`
- `src/config/config.ts`
- `src/config/paths.ts`

Schema validation:

- `src/config/validation.ts`
- `src/config/zod-schema.ts`

Gateway startup path:

- `src/cli/gateway-cli/run.ts`
- `src/gateway/server.impl.ts`
- `src/gateway/server-methods/config.ts`

Important startup guard:

- `src/cli/gateway-cli/run.ts:278`
  - blocks startup unless `gateway.mode=local` or `--allow-unconfigured`

## Final Verdict

- RTK / exec-output compression: not built in
- execProxy: not built in
- PostgreSQL persistence: not built in
- Remote Ollama: built in and verified
