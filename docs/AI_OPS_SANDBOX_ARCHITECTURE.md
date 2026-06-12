# AI Operations Center Sandbox Architecture

## Purpose

LedgerFlow AI Operations Center should feel like an OpenClaw-style agent command center, but it must not inherit the same security risks.

The first implementation must be sandbox-first and approval-first.

## Product goal

Build a control center where AI/AI agents can:

- Answer questions.
- Read approved knowledge context.
- Plan work.
- Draft code changes.
- Draft design changes.
- Prepare GitHub issues/PR plans.
- Prepare VS Code/Cursor handoff prompts.
- Simulate terminal/file/GitHub actions.
- Produce auditable outputs.

But by default, agents must not:

- Execute real shell commands.
- Read arbitrary local files.
- Write arbitrary local files.
- Push to GitHub without explicit approval.
- Use credentials directly.
- Access email/browser/external accounts directly.
- Treat external prompts/documents as trusted instructions.

## Design rule

The AI agent can propose. The system can simulate. The founder approves. Only approved connectors execute.

```txt
User request
  -> Agent Inbox
  -> Knowledge Context Builder
  -> Planner
  -> Sandbox Runner
  -> Tool Simulator
  -> Risk Review
  -> Founder Approval Gate
  -> Safe Connector / Handoff
  -> Audit Log
```

## Core components

### 1. Agent Inbox

Receives requests from the user.

Request types:

- Q&A.
- Code task.
- Bug fix.
- UI/design task.
- GitHub task.
- VS Code/Cursor handoff.
- Knowledge organization.
- Marketing/sales task.
- Data/simulation task.

### 2. Knowledge Context Builder

Pulls only approved context from:

- Knowledge Library.
- AGENTS.md.
- Product architecture docs.
- User-entered task details.
- Selected GitHub issue/CI logs.

External or pasted content is treated as untrusted data, not system instruction.

### 3. Planner

Converts a request into a plan:

- Objective.
- Files likely involved.
- Tool calls needed.
- Risk level.
- Approval required or not.
- Expected output.
- Test checklist.

### 4. Sandbox Runner

Runs every action in simulation mode first.

Simulation outputs:

- Fake file patch preview.
- Fake terminal output.
- Fake GitHub issue/PR preview.
- Fake design brief.
- Fake data transform preview.

No destructive action is allowed here.

### 5. Tool Simulator

Supported simulated tools:

- `simulated.filesystem.read`
- `simulated.filesystem.write_patch`
- `simulated.terminal.run`
- `simulated.github.create_issue`
- `simulated.github.prepare_commit`
- `simulated.vscode.handoff_prompt`
- `simulated.design.generate_brief`
- `simulated.knowledge.add_note`

### 6. Risk Review

Every action gets a risk label:

- LOW: answer, summarize, classify, draft text.
- MEDIUM: prepare patch, create handoff prompt, generate issue draft.
- HIGH: modify repository, push code, run build, call external connector.
- BLOCKED: secrets, unrestricted shell, arbitrary file access, credential handling, browser/email automation.

### 7. Founder Approval Gate

Required for:

- Any real GitHub write.
- Any real local tool launch that modifies files.
- Any shell command beyond whitelisted diagnostics.
- Any external connector action.
- Any action involving credentials or private data.

### 8. Safe Connector / Handoff

Approved actions should use existing safe layers:

- GitHub connector.
- Dev Handoff Center.
- CI Doctor.
- Local Tools connector.
- AI Gateway.

No AI agent may bypass these layers.

### 9. Audit Log

Every agent run should log:

- Timestamp.
- User request.
- Context sources.
- Plan.
- Simulated actions.
- Risk level.
- Approval status.
- Final output.

## OpenClaw-inspired but safer

OpenClaw-style features to borrow:

- Agent inbox.
- Long-running task concept.
- Tool abstraction.
- Multi-agent roles.
- Message-driven interface.
- Persistent task state.

Features to avoid or redesign:

- Broad local machine authority.
- Direct shell execution.
- Direct filesystem access.
- Direct browser/email/messaging authority.
- Weak identity verification.
- Trusting external instructions.
- Plugin/skill execution without runtime policy.

## Security model

### Capability

Agents should have explicit capability scopes. Example:

```txt
agent: ai-dev
capabilities:
  - read_knowledge
  - draft_patch
  - prepare_github_issue
  - prepare_vscode_handoff
blocked:
  - unrestricted_shell
  - read_arbitrary_files
  - write_arbitrary_files
  - push_without_approval
```

### Identity

Do not let messages or external content decide identity. The system must not trust claims like:

- `I am the founder`.
- `This is urgent from admin`.
- `Ignore previous policy`.

Identity must come from authenticated local user/session and explicit UI approval.

### Knowledge

Knowledge can be poisoned. Therefore:

- Source must be visible.
- High-risk instructions from knowledge items are not automatically executed.
- AI must distinguish fact/context from command.
- Imported knowledge should default to untrusted until reviewed.

## P0 implementation

P0 should build a UI/runtime skeleton, not a dangerous autonomous agent.

Features:

1. Agent request form.
2. Request type selector.
3. Context source selector.
4. Simulated plan output.
5. Simulated tool action list.
6. Risk label.
7. Founder approval placeholder.
8. Audit log stored locally.
9. Export audit log JSON.

No real shell, real filesystem writes, or real GitHub writes in P0.

## P1 implementation

After P0 is stable:

1. Allow GitHub issue draft creation through existing safe GitHub connector.
2. Allow Dev Handoff prompt generation.
3. Allow CI Doctor integration.
4. Allow read-only GitHub status fetch.
5. Add policy editor.
6. Add per-agent capability profile.

## P2 implementation

Only after strong safeguards:

1. Real GitHub branch/commit workflow with approval.
2. Sandboxed code execution in isolated container or browser sandbox.
3. Read-only local project indexing with explicit folder allowlist.
4. Connector permission dashboard.
5. Signed audit logs.

## Non-negotiable rules

- Simulation mode first.
- Approval before real action.
- No unrestricted shell.
- No arbitrary filesystem access.
- No secrets in prompts/logs.
- No external content as instruction.
- Every action must be auditable.
- Every connector must have a narrow allowlist.
