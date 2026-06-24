# LedgerFlow AI Workforce — OpenClaw Alignment Roadmap

This document defines the implementation direction for making LedgerFlow's AI Workforce behave more like an OpenClaw-style local autonomous agent system while preserving LedgerFlow's founder-first safety model.

## Product Target

AI Workforce should feel like a compact mission-control console:

1. Founder gives a command.
2. System turns the command into a mission.
3. Agent runtime plans and executes safe steps.
4. Risky steps pause at an approval gate.
5. Artifacts, memory, audit and safety state remain visible.
6. Labs, robot, automation, sandbox and diagnostics run behind the main control surface unless explicitly opened.

## Current Implementation

The first implementation pass adds `AIWorkforceMissionControl` and surfaces it as the primary view in `AIOperationsCenter`.

Main UX sections:

- Command Chat
- Mission Builder
- Mission Queue
- Approval Gate
- Artifacts
- Memory Search
- System Snapshot
- Emergency Stop

The previous raw AI Command Center and Governance panels are preserved under an Advanced diagnostics expander.

## Alignment With OpenClaw-Style Agents

| Capability | LedgerFlow Status | Next Step |
|---|---|---|
| Local daemon | Present | Keep daemon as the only UI-to-AI execution bridge |
| Chat/messaging command surface | Partial | Add Telegram/desktop command parity and mission templates |
| Agent planning | Present | Improve planner with mission classes and explicit output schemas |
| Tool registry | Present | Add stricter policy metadata, scopes and execution adapters |
| Approval gates | Present | Add approve/reject buttons directly in Mission Control |
| Filesystem/code action | Partial | Move from virtual patch artifacts to reviewed patch sessions |
| Sandbox verification | Partial | Show test runs and repair attempts in Mission Control |
| Plugin ecosystem | Partial | Harden plugin signing, sandbox and permission review |
| Memory/RAG | Present | Promote mission outcomes into reviewed long-term memory |
| Observability | Present | Add compact trace timeline per mission |

## Required Safety Rules

1. No external side effect without explicit founder approval.
2. No direct LLM provider calls from React UI.
3. All agent tools must be registered in the server-side tool registry.
4. All write-capable tools require risk metadata, audit log and reversible artifact.
5. Plugins must be treated as untrusted until signed, scanned and scoped.
6. Emergency stop must prevent new runs and stop active runs.

## Next Engineering Milestones

### Milestone 1 — Mission Control MVP

- Add primary AI Workforce mission-control UI.
- Collapse old raw panels behind diagnostics.
- Display missions, approvals, artifacts, memory and safety in one place.

Status: implemented.

### Milestone 2 — Approval Actions

- Add approve/reject controls for waiting steps.
- Display approval fingerprint and tool risk.
- Record founder approval in audit trail.

### Milestone 3 — Reviewed Patch Sessions

- Convert `draft_patch` artifacts into patch-review sessions.
- Add diff preview.
- Apply only after approval.
- Keep rollback metadata.

### Milestone 4 — Telegram/Desktop Parity

- The same mission can be created from desktop UI, CLI or Telegram.
- Mission status can be queried from Telegram.
- Approval can be confirmed only with signed fingerprint or local founder confirmation.

### Milestone 5 — Plugin Hardening

- Replace unrestricted runtime loading with a signed plugin manifest.
- Add permission scopes.
- Add preflight SAST and dependency scan.
- Add plugin execution sandbox.

### Milestone 6 — Compact Agent Trace

- Add a mission trace drawer:
  - Plan
  - Tool calls
  - Observations
  - Cost
  - Memory writes
  - Approval decisions
  - Artifacts

## UI Principle

The AI Workforce module should not expose every lab as a top-level operational surface. Labs are powerful but should be secondary. The main screen should always answer:

- What did I ask the AI to do?
- What is running now?
- What needs my approval?
- What did it produce?
- What memory/context did it use?
- Can I stop it immediately?
