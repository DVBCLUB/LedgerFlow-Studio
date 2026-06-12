# OpenClaw Research Notes for LedgerFlow AI Operations Center

## Scope reviewed

User uploaded `openclaw-main.zip`. The archive was inspected statically only. Do not run OpenClaw code during this research pass.

Approximate archive shape:

- ~19,900 files.
- Main areas:
  - `src/agents` - agent runtime, sessions, tools, sandbox.
  - `src/gateway` - control plane and server methods.
  - `src/plugins` and `src/plugin-sdk` - plugin runtime and extension API.
  - `extensions/*` - channel/tool/provider integrations.
  - `ui/src/ui` - Control UI, chat, workboard, approvals, gateway connection.
  - `apps/macos`, `apps/ios`, `apps/android` - native companion apps.
  - `docs/*` - concepts, CLI, gateway, security, tools, automation.

## What OpenClaw is good at

OpenClaw is not just a chat UI. It is an always-on, local-first AI gateway with channels, agents, plugin tools, sessions, workboard, approvals, sandbox runtimes, and companion apps.

Design ideas worth learning from:

1. **Gateway-first architecture**
   - Gateway is the control plane.
   - UI, channels, native apps, and plugins connect to the gateway.
   - LedgerFlow should similarly keep AI actions behind backend APIs, not direct frontend execution.

2. **Multi-channel / multi-tool model**
   - OpenClaw supports many channels and extensions.
   - LedgerFlow should support connectors as controlled tool lanes: GitHub, VS Code/Cursor handoff, AI Gateway, Knowledge Library, local tools, marketing/sales data, and future apps.

3. **Workboard model**
   - OpenClaw has work items, statuses, execution engines, attempts, events, proof, artifacts, diagnostics, and links.
   - LedgerFlow should use a simpler Workboard for AI Operations Center: inbox -> plan -> simulated actions -> approval -> handoff -> audit log.

4. **Approval model**
   - OpenClaw has exec approval requests with allow-once, allow-always, deny.
   - LedgerFlow should use an even stricter default: simulate first, allow only safe handoff, no direct shell in P0.

5. **Tool policy model**
   - OpenClaw separates sandbox runtime, tool allow/deny policy, and elevated execution gates.
   - LedgerFlow should copy the concept, not the implementation.

6. **Sandbox model**
   - OpenClaw supports Docker/SSH/OpenShell-style sandboxing and fs bridges.
   - LedgerFlow P0 should not run commands at all; it should use a fake sandbox simulator first. Later P1 may add Docker/isolated process, but only after explicit policy gates.

7. **Secrets awareness**
   - OpenClaw docs warn that SecretRefs do not protect secrets if plaintext files remain readable by agents.
   - LedgerFlow should keep API keys server-side, masked, and never exposed to the agent context unless intentionally scoped.

8. **Control UI patterns**
   - Chat view, tool cards, run controls, approval prompts, workboard controller, gateway events, and sessions are useful UI ideas.
   - LedgerFlow should build a simpler business-oriented version, not copy the full OpenClaw UI stack.

## What must NOT be copied directly

OpenClaw is powerful and therefore risky. LedgerFlow should not import or reimplement high-power behavior directly.

Do not copy directly:

- Unrestricted shell execution.
- Direct filesystem mutation.
- Browser/computer-use automation that touches real user accounts.
- Always-on channel automation that can act without strong scope.
- Token/secret surfaces into agent-readable context.
- Plugin system with broad runtime capabilities before we have a stable permission model.
- Allow-always approvals in early versions.
- Remote HTTP tool invocation for dangerous tools.

## Security risks found by architecture review

### 1. Shell and exec are inherently dangerous

OpenClaw centralizes dangerous tools such as `exec`, `spawn`, `shell`, `fs_write`, `fs_delete`, `fs_move`, `apply_patch`, sessions spawning, cron, gateway, and nodes.

LedgerFlow rule:

- P0: no real shell.
- P0: no real filesystem write by agent.
- P0: no direct push.
- Only produce simulated actions and handoff prompts.

### 2. Sandbox is not the same as policy

OpenClaw docs separate:

- Sandbox: where tools run.
- Tool policy: which tools exist.
- Elevated: escape hatch.

LedgerFlow rule:

- The UI must show these separately:
  - Runtime mode: Simulation / Sandbox / Real connector.
  - Tool permission: allow/deny.
  - Approval status: pending/approved/blocked.

### 3. Workspace is not a hard sandbox

OpenClaw warns that workspace cwd is not a sandbox if absolute paths can reach outside.

LedgerFlow rule:

- The AI Operations Center must treat the workspace as data, not as a permission boundary.
- File actions in P0 are virtual only.
- Real file import/export must go through explicit user upload/download or safe connector APIs.

### 4. Secrets can leak through readable files

OpenClaw docs say SecretRefs reduce persistence but do not isolate against agents that can read local files.

LedgerFlow rule:

- Do not include `.env`, API keys, vault files, or raw connector credentials in AI context.
- Knowledge Library must not auto-ingest secret files.
- Any future file import should warn and scan for key-like patterns.

### 5. Browser/computer-use is high risk

OpenClaw supports browser/computer-use paths and notes permission boundaries. These can touch real logged-in accounts.

LedgerFlow rule:

- P0: no browser automation.
- P1: only simulated browser action plans.
- P2+: real browser automation only inside dedicated isolated profile with approval.

### 6. Persistent agent state can become poisoned

OpenClaw has durable sessions, memory, context, workboard, cron, standing orders, and task flow. These are powerful but can carry bad instructions forward.

LedgerFlow rule:

- Knowledge Library entries must be source-labeled.
- Imported knowledge is untrusted by default.
- AI Operations Center should build context packs explicitly, not blindly inject all memory.

## Target LedgerFlow design inspired by OpenClaw

### P0: AI Operations Sandbox

Default mode: `SIMULATION ONLY`.

Components:

1. Agent Inbox
   - Founder enters request.
   - Select work type: Q&A, code, design, GitHub, VS Code/Cursor, marketing, data, accounting, sandbox.

2. Knowledge Context Builder
   - Select relevant library entries.
   - Build a visible context pack.
   - Show source and trust level.

3. Planner
   - Break request into steps.
   - Assign lane: AI coordinator, AI code, AI design, AI data, AI marketing, AI auditor.

4. Tool Simulator
   - Virtual GitHub action.
   - Virtual VS Code/Cursor handoff.
   - Virtual file patch.
   - Virtual terminal command.
   - Virtual design task.
   - Virtual report/export.

5. Risk Engine
   - LOW: answer / summarize / draft.
   - MEDIUM: create patch plan / file edit plan / GitHub issue draft.
   - HIGH: real file write / real git push / real command / real browser action.
   - BLOCKED: secret access / unrestricted shell / destructive command / credential exfiltration.

6. Approval Gate
   - Founder approval required for MEDIUM+.
   - P0 approval only unlocks handoff text, not real execution.

7. Audit Log
   - Record request, context used, plan, simulated actions, risk score, approval state, output.
   - Export JSON.

### P1: Safe connector handoff

Still no direct shell.

Allowed:

- Create GitHub issue draft.
- Generate PR checklist.
- Generate VS Code/Cursor prompt.
- Export patch text for manual review.
- Read GitHub Actions status through safe API.

Blocked:

- Automatic push without explicit controlled connector design.
- Automatic terminal execution.
- Automatic filesystem mutation outside app data.

### P2: Controlled execution

Only after P0 and P1 are stable.

Possible additions:

- Containerized command runner.
- Per-task temporary workspace.
- Read-only source mirror.
- Patch generation to a virtual filesystem.
- Human diff review.
- GitHub branch creation through connector after approval.

## UI pieces LedgerFlow should build

1. AI Ops Console header
   - Mode badge: Simulation / Sandbox / Real connector.
   - Risk badge.
   - Approval badge.

2. Agent Inbox panel
   - Request text.
   - Work type.
   - Target system.
   - Expected output.

3. Knowledge Context panel
   - Search/select from Knowledge Library.
   - Trust/source labels.
   - Context preview.

4. Plan panel
   - Steps.
   - Assigned AI lane.
   - Expected output.

5. Tool Action Cards
   - Similar idea to OpenClaw tool cards.
   - Each card shows tool, arguments, simulated result, risk, permission state.

6. Approval panel
   - Approve simulation output.
   - Convert to handoff.
   - Block dangerous action.

7. Audit Log panel
   - Timeline of decisions and generated outputs.
   - Export JSON.

## Implementation order for LedgerFlow

1. Add `AIOperationsSandbox.tsx` UI component.
2. Add local-only simulator state using React/localStorage.
3. Add tool simulation registry.
4. Add risk scoring function.
5. Add approval state model.
6. Add audit log/export.
7. Link it from `CompanyOS.tsx > AI Nhân sự`.
8. Only after that, wire safe GitHub/VS Code handoff paths.

## Non-negotiable guardrails

- Do not run uploaded OpenClaw code inside LedgerFlow.
- Do not vendor OpenClaw wholesale.
- Do not enable shell execution by default.
- Do not expose secrets to agent context.
- Do not use real filesystem writes in P0.
- Do not auto-push GitHub in P0.
- Do not treat sandbox as a complete security boundary.
- Always log actions and approvals.
- Always keep founder as final approver for real-world actions.

## Recommended first code task

Build `src/components/AIOperationsSandbox.tsx` with:

- Request form.
- Work type select.
- Context selector from local Knowledge Library storage.
- Simulated plan generator.
- Tool action cards.
- Risk labels.
- Approval gate.
- Audit log.
- Export JSON.

Then link it into `CompanyOS.tsx` under `AI Nhân sự`.
