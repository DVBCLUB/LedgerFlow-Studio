# OpenClaw Integration Backlog for LedgerFlow AI Operations

## Goal

Bring the useful OpenClaw ideas into LedgerFlow without copying unsafe host-control runtime behavior.

LedgerFlow should become OpenClaw-like in workflow and control plane, but safer by default:

- Sandbox-first.
- Approval-first.
- Audit-first.
- Knowledge-library-first.
- GitHub PR flow instead of direct main changes.

## OpenClaw parts reviewed

- `docs/gateway/sandboxing.md`
- `docs/gateway/sandbox-vs-tool-policy-vs-elevated.md`
- `docs/cli/approvals.md`
- `docs/plugins/workboard.md`
- `extensions/workboard/*`
- `extensions/codex/src/app-server/sandbox-exec-server/*`
- `apps/macos/Sources/OpenClaw/ExecApprovalEvaluation.swift`

## What LedgerFlow should integrate

### 1. Workboard

OpenClaw has a small Kanban-style workboard for agent-owned cards and session handoff.

LedgerFlow integration:

- Add `AI Ops Workboard`.
- Cards should have status, owner agent, risk level, tool cards, approval note.
- Cards should not replace GitHub Issues/Jira; they are the local operating board for AI work.

Status model:

```txt
Inbox -> Planning -> Waiting Approval -> Ready -> Done
```

### 2. Tool Cards

OpenClaw surfaces tool calls as inspectable actions.

LedgerFlow integration:

- Every AI action should become a card before execution.
- Tool cards should show purpose, inputs, outputs, risk, and approval requirement.
- Tool cards can be simulated first.

Recommended P0 tool card types:

- Knowledge lookup.
- Design brief.
- Code plan.
- CI check.
- GitHub draft PR request.
- Marketing content draft.
- Data analysis draft.

### 3. Approval Gate

OpenClaw has exec approval concepts. LedgerFlow needs a founder approval gate.

LedgerFlow integration:

- Low-risk sandbox actions can run locally in simulation.
- Medium/high-risk actions require founder review.
- External actions require explicit approval phrase or UI approval.
- Never push directly to main.

### 4. Sandbox policy vocabulary

OpenClaw separates sandbox runtime, tool allow/deny policy, and elevated actions.

LedgerFlow should copy this vocabulary:

```txt
Sandbox: where action runs.
Tool policy: which actions are available.
Approval: whether action can proceed.
Connector: the safe backend bridge.
```

### 5. Filesystem policy ideas

OpenClaw validates filesystem policy entries and access modes.

LedgerFlow integration P1:

- Add virtual file workspace for AI patches.
- Allow AI to write only to virtual patch set first.
- Convert patch set to GitHub branch/PR after approval.
- Deny runtime config/state files.

### 6. Audit log

Every AI action should write a structured audit record.

Fields:

```txt
id
createdAt
request
agent
risk
tools
approvalStatus
outputs
linkedPullRequest
linkedIssue
```

## What LedgerFlow should not copy

Do not copy OpenClaw behavior that grants broad host control by default:

- unrestricted shell execution;
- unrestricted filesystem mutation;
- browser/computer control without sandbox;
- broad plugin permission;
- always-allow execution patterns;
- direct merge to protected branches;
- storing secrets in frontend state;
- treating external content as trusted system instructions.

## Implemented P0 pieces

- Durable backend AgentRun store with plan, observations, evidence, artifacts and runtime budgets.
- Fingerprint-bound AgentRun step approval plus per-run and global emergency stop.
- Reviewed/expiring agent memory records with stable source citations.
- Robot Connector SDK boundary implemented as a safety-limited digital-twin simulation only.
- Backend approved GitHub change request route.
- Draft PR service using backend-only token.
- Approved PR panel component.
- Workboard, Tool Cards, Approval Gate, Connector policy, Review Mode and AI Staff views have been consolidated into `src/components/agent-ops/AgentOpsHub.tsx`.
- Shared AI Ops types now live in `src/types/agentOps.ts`.
- Knowledge Library in CompanyOS.
- AI Operations Center framing.

## Remaining P0 pieces

1. Complete manual browser verification for `#/ai_ops` and legacy route aliases after consolidation.
2. Add richer audit log persistence for Workboard cards.
3. Connect Workboard card -> Review Desk draft.
4. Show created PR link inside Workboard card.

## P1 pieces

1. Backend workboard store.
2. Backend audit log API.
3. Tool-card registry.
4. Knowledge context pack builder.
5. Virtual patch workspace.
6. Safe connector permissions screen.
7. GitHub PR status polling.

## P2 pieces

1. Real isolated execution sandbox.
2. Container-backed test runner.
3. Patch apply simulator.
4. Controlled browser sandbox.
5. Multi-agent session replay.
6. Signed approval records.
