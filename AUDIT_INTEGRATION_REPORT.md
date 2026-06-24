# LedgerFlow Studio AI Integration Audit

Date: 2026-06-24

## Current finding

The desktop executable starts Electron from `desktop/main.cjs`, then loads `dist/server.cjs` and attempts to load `dist/assistant-daemon.cjs`. The UI already contains AI Workforce subtabs for AI Operations, Robot Lab, and Automation Rules, but many of these panels depend on daemon routes.

## Highest priority fixes

1. Fix `src/App.tsx` React namespace import. The file uses `React.Component`, `React.ReactNode`, and `React.ErrorInfo`, so the import should be `import React, { Suspense, lazy } from 'react';`.
2. Ensure UI requests for daemon-only routes work from the desktop app origin. Either expose the same routes in `server.ts` or add a local proxy from the main Express app to the assistant daemon for these prefixes:
   - `/api/agent-runtime`
   - `/api/agent-memory`
   - `/api/robot-simulation`
   - `/api/automation-rules`
   - `/api/workflows`
   - `/api/telemetry`
   - `/api/rpa`
   - `/api/git`
   - `/api/deploy`
   - `/api/self-healing`
3. Run `npm run lint`, `npm test`, `npm run build`, `npm run check:desktop`, `npm run check:offline`, and `npm run desktop:pack` after patching.

## Integration status

- UI navigation includes six top-level workspaces: CEO Command, Product Studio, Growth & Sales, Finance & Accounting, AI Workforce & Labs, and System Settings.
- `WorkspaceRenderer.tsx` already imports and renders `AIOperationsCenter`, `RobotLabPanel`, and `AutomationRulesPanel` under AI Workforce.
- `server/assistant-daemon.ts` contains many advanced backend modules and routes for agent runtime, robot simulation, automation rules, memory, RAG, workflows, telemetry, RPA, plugin, deployment, security, and Git helper services.
- The likely missing bridge is not the React panel itself, but reliable same-origin access from packaged Electron to the assistant daemon endpoints.

## Next patch target

Create a small shared API helper such as `src/utils/assistantApi.ts` or add an Express proxy in `server.ts`. The safest desktop fix is an Express proxy because existing frontend code uses relative `/api/...` URLs.
