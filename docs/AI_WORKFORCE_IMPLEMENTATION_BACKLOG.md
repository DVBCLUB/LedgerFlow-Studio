# AI Workforce Implementation Backlog

This backlog keeps the AI Workforce/OpenClaw-alignment work continuous across sessions. It should be updated whenever a milestone is completed.

## Current Product Direction

AI Workforce should behave like a compact, safe, local autonomous-agent control room:

- Founder gives a command.
- LedgerFlow creates a mission.
- Agent runtime plans and executes safe steps.
- Risky steps pause in Approval Gate.
- Founder can advance, stop, approve, inspect artifacts, search memory and trigger emergency stop.
- Labs and raw diagnostics stay secondary.

## Implemented

### Mission Control

- `src/modules/ai-hr/AIWorkforceMissionControl.tsx`
- Shows command chat, mission builder, mission queue, approval gate, artifacts, memory search, system snapshot and emergency stop.
- Includes actions:
  - Create mission
  - Advance mission
  - Stop mission
  - Approve step
  - Emergency stop / release stop

### Mission Templates

- `src/modules/ai-hr/AIWorkforceMissionTemplates.tsx`
- Adds prompt templates for:
  - Safe Code Review
  - Build Fix Plan
  - Approval Audit
  - Memory Curation
  - Release Readiness
  - PR Prep
  - Plugin Security Review
  - Telegram Command Parity

### Tool Catalog

- `src/modules/ai-hr/AIWorkforceToolCatalog.tsx`
- Shows safe tools vs approval-gated tools.
- Shows risk, execution mode and permission scope.

### Primary AI Ops Composition

- `src/modules/ai-hr/AIOperationsCenter.tsx`
- Order:
  1. Mission Control
  2. Mission Templates
  3. Tool Catalog
  4. Advanced diagnostics expander

### Roadmap

- `docs/AI_WORKFORCE_OPENCLAW_ALIGNMENT.md`

## Next Milestone 1 — Backend Tool Schema Sync

Problem:

`server/assistant-daemon.ts` validates `requestedTools` against an older short list:

- `read_knowledge`
- `draft_plan`
- `draft_patch`
- `browser_check`
- `terminal_check`
- `external_connector`

But the agent registry also defines newer tools:

- `analyse_data`
- `generate_report`
- `send_notification`
- `search_web_context`
- `robot_inspect`
- `robot_move`

Required fix:

1. Create a single source of truth for agent tool IDs.
2. Reuse it in:
   - `server/services/agentToolRegistry.ts`
   - `server/services/agentPlanner.ts`
   - `server/assistant-daemon.ts`
3. Prevent drift with a test/check script.

Recommended implementation:

- Keep `AGENT_TOOL_IDS` in `agentPlanner.ts` or move it to `server/services/agentToolIds.ts`.
- Make `agentToolRegistry.ts` validate contracts against `AGENT_TOOL_IDS`.
- Update daemon Zod schema to use that shared list.

Acceptance criteria:

- Creating a mission with `requestedTools: ['analyse_data', 'generate_report']` passes validation.
- Creating a mission with unknown tool still fails validation.
- `npm run check:agentops-contracts` still passes.

## Next Milestone 2 — Approval Gate Hardening

Current state:

- Mission Control can approve a waiting step if fingerprint exists.
- Stop mission is available.

Needed:

- Add explicit Reject Step flow.
- Show approval metadata:
  - tool ID
  - permission
  - risk
  - execution mode
  - fingerprint
  - signed approval status
- After approve/reject, show audit event summary.

Acceptance criteria:

- Founder can approve or reject from one place.
- No approval action works while emergency stop is active.
- The UI makes high-risk tools visually obvious.

## Next Milestone 3 — Mission Trace Drawer

Add a compact drawer or expandable panel per mission showing:

- Plan
- Step timeline
- Tool call evidence
- Observations
- Approval decisions
- Artifacts
- Cost/latency if available
- Memory reads/writes

Acceptance criteria:

- Founder can inspect why an agent did something without opening raw JSON.
- Raw JSON remains available only in diagnostics.

## Next Milestone 4 — Reviewed Patch Sessions

Current state:

- `draft_patch` creates a virtual artifact/manifest.

Needed:

- Convert patch artifacts into reviewed patch sessions.
- Add diff preview.
- Apply only after approval.
- Preserve rollback metadata.

Acceptance criteria:

- No repository write happens without founder approval.
- Patch preview is inspectable before applying.
- Rollback path is visible.

## Next Milestone 5 — Telegram/Desktop Command Parity

Goal:

A founder should be able to run AI Workforce from desktop or phone.

Commands:

- Create mission
- Get mission status
- List waiting approvals
- Approve fingerprint
- Stop mission
- Fetch artifact summary

Acceptance criteria:

- Same backend endpoints serve desktop and Telegram.
- Approval requires a signed fingerprint or equivalent founder confirmation.

## Next Milestone 6 — Plugin Hardening

Problem:

Plugin execution is a major safety boundary.

Needed:

- Signed plugin manifest.
- Permission scopes.
- SAST/dependency preflight.
- Plugin execution sandbox.
- Runtime allowlist.

Acceptance criteria:

- Untrusted plugins cannot execute host-side code without review.
- All plugin invocations are audited.
- Tool Catalog can show plugin tools separately.

## Non-Negotiable Safety Rules

1. No external side effect without founder approval.
2. No direct LLM provider calls from React UI.
3. All agent tools must be registered server-side.
4. Write-capable tools require risk metadata, audit and rollback/artifact path.
5. Emergency stop must block new missions and stop active work.
6. Raw diagnostics are secondary; Mission Control is primary.
