# AI Workforce Backend Patch Guide

This guide documents the backend changes needed before LedgerFlow AI Workforce can be reported as the closest OpenClaw-style match.

## Current status

Implemented:

- Shared `AGENT_TOOL_IDS` in `server/services/agentToolIds.ts`.
- `agentPlanner.ts` now consumes the shared tool ID source.
- `check:agent-tool-ids` validates shared IDs against the registry.
- Daemon schema drift is currently a non-blocking warning so builds are not blocked while the large daemon file is patched safely.

Still needed:

- `server/assistant-daemon.ts` should validate `requestedTools` from the same shared source, not a duplicated literal list.

## Required daemon patch

In `server/assistant-daemon.ts`, add an import near the other agent runtime imports:

```ts
import { AGENT_TOOL_IDS } from './services/agentToolIds.ts';
```

Then replace the current schema:

```ts
const agentRunCreateSchema = z.object({
  goal: z.string().min(3).max(4000),
  requestedBy: z.string().max(100).optional(),
  requestedTools: z.array(z.enum(["read_knowledge", "draft_plan", "draft_patch", "browser_check", "terminal_check", "external_connector"])).max(8).optional(),
  toolInputs: z.record(z.string(), z.record(z.string(), z.any())).optional(),
  maxSteps: z.number().int().min(1).max(12).optional(),
  maxRuntimeMs: z.number().int().min(5000).max(600000).optional(),
  plannerMode: z.enum(["auto", "ai", "deterministic"]).optional()
});
```

with:

```ts
const agentRunCreateSchema = z.object({
  goal: z.string().min(3).max(4000),
  requestedBy: z.string().max(100).optional(),
  requestedTools: z.array(z.enum(AGENT_TOOL_IDS)).max(8).optional(),
  toolInputs: z.record(z.string(), z.record(z.string(), z.any())).optional(),
  maxSteps: z.number().int().min(1).max(12).optional(),
  maxRuntimeMs: z.number().int().min(5000).max(600000).optional(),
  plannerMode: z.enum(["auto", "ai", "deterministic"]).optional()
});
```

## Acceptance tests

After patching daemon schema, run:

```bash
npm run check:agent-tool-ids
npm run lint
npm run build
```

Expected:

- `check:agent-tool-ids` should not warn about daemon schema.
- `lint` should type-check `z.enum(AGENT_TOOL_IDS)`.
- Mission create payloads with these tools should pass daemon validation:

```json
{
  "goal": "Analyse data and generate a report for AI Workforce readiness.",
  "requestedTools": ["analyse_data", "generate_report"],
  "plannerMode": "deterministic",
  "maxSteps": 5
}
```

Payloads with unknown tools should still fail:

```json
{
  "goal": "Use an unknown tool.",
  "requestedTools": ["unknown_tool"]
}
```

## OpenClaw parity impact

This patch closes the `Tool Registry + Policy` blocker in the OpenClaw Readiness Meter.

After this is done, remaining major blockers are:

1. Telegram command handlers for mission create/status/approvals/approve/stop/artifact.
2. Reviewed patch sessions with diff preview/apply/rollback.
3. Plugin signature/sandbox/permission enforcement.
