# Repo Map

## What This Repo Is

OpenClaw is a local-first AI gateway and client suite:

- TypeScript CLI + Gateway backend in `src/`
- Web control UI in `ui/`
- Native client apps in `apps/macos`, `apps/ios`, and `apps/android`
- Extension/plugin packages in `extensions/*`

## Entry Points

- `openclaw.mjs`
  - Published Node entrypoint.
  - Enforces Node version and loads built output from `dist/entry.js`.
- `src/entry.ts`
  - Runtime bootstrap for the built CLI.
  - Normalizes env/argv, applies profile handling, then dispatches to `src/cli/run-main.ts`.
- `src/cli/run-main.ts`
  - Main source entry for CLI execution.
  - Loads `.env`, normalizes runtime state, lazy-registers commands, then parses CLI args.
- `src/cli/program/*`
  - Builds the Commander-based CLI tree.
  - Wires root commands like `agent`, `message`, `gateway`, `config`, `channels`, `nodes`, `doctor`, `onboard`.

## Backend Structure

- `src/gateway/`
  - WebSocket/HTTP gateway server.
  - Core startup lives in `src/gateway/server.impl.ts`.
  - RPC handlers live in `src/gateway/server-methods/*.ts`.
- `src/agents/`
  - Agent runtime, tool wiring, model/provider integration, auth profiles, sandbox logic.
  - `src/agents/openclaw-tools.ts` assembles the built-in tool catalog.
- `src/commands/`
  - Business actions behind CLI commands.
  - Examples: agent execution, channel setup, message sending, models, doctor, onboarding.
- `src/config/`
  - Config loading, validation, defaults, migration, path resolution, session storage.
- `src/channels/` plus channel-specific roots like `src/telegram`, `src/slack`, `src/discord`, `src/signal`, `src/imessage`, `src/web`
  - Channel abstractions, gating, allowlists, routing helpers, per-channel integrations.
- `src/routing/`
  - Maps inbound channel/account/group context to the right agent/session.
- `src/plugins/`
  - Runtime plugin/extension loading, registry, hooks, tools, HTTP surfaces.
- `src/cron/`
  - Scheduled jobs and isolated agent runs.
- `src/media/`, `src/browser/`, `src/canvas-host/`, `src/node-host/`
  - Media pipeline, browser control, canvas runtime, device/node capabilities.

## Frontend Structure

- `ui/`
  - Separate Vite app for the browser control UI.
  - Entry: `ui/src/main.ts`
  - Build config: `ui/vite.config.ts`
- Gateway serves built UI assets at runtime.
- Native frontends:
  - `apps/macos/`: macOS menu bar/control app
  - `apps/ios/`: SwiftUI iOS app + extensions + watch app
  - `apps/android/`: Kotlin Android app

## Main Business Logic

If you want the core behavior of the product, read these first:

- `src/gateway/server.impl.ts`
  - Gateway composition root.
  - Starts channels, plugins, HTTP/WS handlers, cron, health, discovery, auth, reloaders.
- `src/gateway/server-methods/*.ts`
  - RPC/business operations exposed by the gateway.
- `src/commands/*.ts`
  - CLI use cases and operator workflows.
- `src/agents/*.ts`
  - Agent execution, tool calling, model/provider selection, sandboxing, auth.
- `src/config/*.ts`
  - Runtime rules, defaults, schema enforcement, migration.
- `src/channels/*` and `src/*channel*/`
  - Message ingress/egress behavior and platform-specific integration logic.

## Config Files

- `package.json`
  - Root scripts, package metadata, dependencies, publish/build entrypoints.
- `tsconfig.json`
  - Main TypeScript config for source development.
- `tsconfig.plugin-sdk.dts.json`
  - Separate type build for plugin SDK declarations.
- `pnpm-workspace.yaml`
  - Workspace package layout.
- `ui/package.json`
  - UI-specific scripts and deps.
- `ui/vite.config.ts`
  - Web UI bundling.
- `vitest.*.config.ts`
  - Test suite segmentation.
- `.env.example`
  - Environment variable template.
- Runtime config:
  - Default state dir: `~/.openclaw`
  - Default config file: `~/.openclaw/openclaw.json`
  - Config path resolution lives in `src/config/paths.ts`

## Build And Dev Scripts

- `pnpm build`
  - Bundles A2UI assets, builds TypeScript with `tsdown`, writes generated metadata, copies runtime assets.
- `pnpm openclaw ...`
  - Runs from source via `scripts/run-node.mjs`.
  - Auto-builds `dist/` if stale, then runs `openclaw.mjs`.
- `pnpm dev`
  - Same source runner path for local CLI use.
- `pnpm gateway:watch`
  - File-watch loop for gateway development via `scripts/watch-node.mjs`.
- `pnpm ui:dev`
  - Starts the Vite UI dev server.
- `pnpm ui:build`
  - Builds the `ui/` app through `scripts/ui.js`.
- `pnpm test`
  - Main test runner wrapper.

## Running From Source Without Onboarding

Minimum local path:

1. Install deps:
   - `pnpm install`
2. Start from source in dev mode without the wizard:
   - `pnpm openclaw --dev gateway --allow-unconfigured`

Notes:

- `--dev` creates isolated dev config/state/workspace defaults.
- `--allow-unconfigured` bypasses the normal `gateway.mode=local` guard.
- This is the fastest source-only path if you explicitly do not want onboarding.

If you want a persistent minimal config instead of `--allow-unconfigured`, create `~/.openclaw/openclaw.json` like:

```json5
{
  gateway: {
    mode: "local",
  },
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
}
```

Then run:

- `pnpm openclaw gateway`

Useful optional commands:

- `pnpm gateway:watch`
- `pnpm ui:dev`
- `pnpm openclaw status`

## Directory Summary

- `src/`: TypeScript backend, CLI, gateway, agent runtime
- `ui/`: web control UI
- `apps/`: macOS/iOS/Android native apps
- `extensions/`: plugin packages and channel extensions
- `docs/`: product and operator docs
- `scripts/`: build/dev/release/test helper scripts
- `dist/`: generated build output
