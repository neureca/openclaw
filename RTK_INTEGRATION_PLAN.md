# RTK Integration Plan

## Current State

Verified current exec pipeline:

1. Tool policy resolution
   - `src/agents/pi-tools.ts`
   - `src/agents/pi-tools.policy.ts`
2. Exec tool dispatch
   - `src/agents/bash-tools.exec.ts`
3. Host-specific execution
   - `src/agents/bash-tools.exec-host-gateway.ts`
   - `src/agents/bash-tools.exec-host-node.ts`
   - sandbox/host execution via `src/agents/bash-tools.exec-runtime.ts`
4. Background/process supervision
   - `src/process/supervisor/*`
5. Result aggregation
   - `src/agents/bash-tools.exec-runtime.ts`

Current token-saving behavior is limited to:

- output caps
- pending tail truncation
- global conversation compaction outside the exec transport path

There is no verified RTK/execProxy layer.

## Best Integration Seams

### Seam A: post-process exec output before final tool result

Primary files:

- `src/agents/bash-tools.exec.ts`
- `src/agents/bash-tools.exec-runtime.ts`

Why:

- This is the narrowest place to compress large stdout/stderr before it becomes a tool result.
- It works for gateway-host and sandbox-host execution.

Recommended shape:

- Add a new optional exec result processor stage after `runExecProcess(...)`.
- Preserve raw output for operator/debug use.
- Return compressed/summarized output to the model-facing tool result.

### Seam B: host-specific compression before approval-backed notices/events

Primary files:

- `src/agents/bash-tools.exec-host-gateway.ts`
- `src/agents/bash-tools.exec-host-node.ts`

Why:

- Lets you keep approval UX readable and avoid shipping full raw output across node/gateway boundaries.
- Useful if the future RTK layer becomes a remote service.

### Seam C: process supervisor / session tail handling

Primary files:

- `src/process/supervisor/*`
- `src/agents/bash-process-registry.ts`

Why:

- If you want streaming compression or incremental summaries, this is the place to intercept long-running sessions.

## Proposed Config Surface

Do not implement yet, but the safest future config home is:

- `tools.exec.<new-rtk-config>`

Reason:

- Exec behavior already lives under `tools.exec`.
- It avoids inventing a separate unrelated top-level runtime section.

Avoid:

- inventing `execProxy` at top-level without threading it through `tools.exec`
- mixing RTK config into general `tools.profile`

## Recommended Rollout

### Phase 1: local compression only

- Add an internal exec-output reducer/compressor.
- No network hop.
- Keep raw output on disk/in memory for operator inspection.
- Model sees compressed summary + small excerpts + metadata.

### Phase 2: optional remote RTK service

- Add a pluggable compressor interface.
- Allow local implementation first, remote implementation second.
- Reuse existing host distinction:
  - sandbox
  - gateway
  - node

### Phase 3: policy-aware compression

- Apply stronger compression for non-owner or high-volume contexts.
- Integrate with current tool policy pipeline in:
  - `src/agents/tool-policy-pipeline.ts`
  - `src/agents/pi-tools.policy.ts`

## Constraints From Current Code

- Tool schemas are validated and exposed through existing tool wiring.
- Exec approvals inspect command intent before execution.
- Background processes emit lifecycle events and tails.
- Any RTK layer must not break:
  - approval flows
  - background process sessions
  - `process` tool follow-up behavior
  - node-host execution parity

## Recommended First Implementation Target

Start here:

- `src/agents/bash-tools.exec-runtime.ts`
- `src/agents/bash-tools.exec.ts`

Reason:

- smallest surface area
- easiest to keep backward compatible
- no config schema change required for an initial internal prototype

## Non-Goals For First Pass

- do not change approval semantics
- do not change session store format
- do not add remote proxying first
- do not mix history compaction and exec-output compression into one feature
