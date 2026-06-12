# AgentOpsHub Consolidation

Agent / AI Ops / Approval UI has been consolidated under one mount point:

```text
src/components/agent-ops/AgentOpsHub.tsx
```

## New structure

```text
src/components/agent-ops/
  AgentOpsHub.tsx
  AgentOpsHubLauncher.tsx
  tabs/
    WorkboardTab.tsx
    RunTab.tsx
    SkillsTab.tsx
    PeopleTab.tsx
    GateTab.tsx
    ConnectorsTab.tsx
    ReviewModeTab.tsx

src/types/agentOps.ts
```

## Shared type source

`src/types/agentOps.ts` is the single source for shared AgentOps records:

- `WorkCard`
- `WorkStatus`
- `RiskLevel`
- `WorkKind`
- `SessionStep`
- `AgentSkill`
- `ApprovalRequest`
- `ApprovalStatus`
- `ConnectorDefinition`
- `PatchItem`

Future agents should import these types instead of redefining duplicate status/risk/session records inside UI components.

## Preserved localStorage keys

The hub keeps the existing browser storage keys so user data can continue to load:

- `ledgerflow_aiops_cards_v1`
- `ledgerflow_aiops_audit_v1`
- `ledgerflow_agent_sessions_v1`
- `ledgerflow_agent_skill_registry_v1`
- `ledgerflow_approval_gate_requests_v1`
- `ledgerflow_connector_sdk_registry_v1`
- `ledgerflow_review_mode_v1`

## Routes

`AgentOpsHubLauncher` opens the hub for these existing hash routes:

- `#/ai_ops`
- `#/ai-ops`
- `#/ai_nhan_su`
- `#/agent_sessions`
- `#/agent_skills`
- `#/ai_staff`
- `#/approvals`
- `#/connectors`
- `#/fast_mode`
- `#/fast-review`

## Current limitation

The initial consolidation mounts a lightweight hub and reads the old localStorage-backed data. Some legacy auxiliary ops panels still need a follow-up remount after the older launcher is safely split.
