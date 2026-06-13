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
  storage.ts
  useApprovalGateSync.ts
  useConnectorPolicySync.ts
  useFastReviewRouting.ts
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

## Bridge logic after consolidation

Legacy bridge components were removed as standalone UI, but their localStorage sync logic now lives in hub hooks:

- `ApprovalReviewDeskBridge` + `ApprovalSessionBridge` -> `src/components/agent-ops/useApprovalGateSync.ts`
- `ConnectorPolicyBridge` -> `src/components/agent-ops/useConnectorPolicySync.ts`
- `FastReviewRoutingBridge` -> `src/components/agent-ops/useFastReviewRouting.ts`

These hooks are mounted from the relevant hub tabs, not from the old overlay launcher.

## Preserved localStorage keys

The hub keeps the existing browser storage keys so user data can continue to load:

- `ledgerflow_aiops_cards_v1`
- `ledgerflow_aiops_audit_v1`
- `ledgerflow_agent_sessions_v1`
- `ledgerflow_agent_skill_registry_v1`
- `ledgerflow_approval_gate_requests_v1`
- `ledgerflow_connector_sdk_registry_v1`
- `ledgerflow_review_mode_v1`

The hub also reads legacy hyphenated keys created by the deleted components:

- `ledgerflow-agent-session-queue-v1`
- `ledgerflow-agent-skill-registry-v1`
- `ledgerflow-approval-gate-v1`
- `ledgerflow-connector-sdk-registry-v1`
- `ledgerflow-ai-staff-assignment-v1`

## Routes

`AgentOpsHubLauncher` opens the hub for these existing hash routes:

- `#/ai_ops` -> Workboard
- `#/ai-ops` -> Workboard
- `#/ai_nhan_su` -> Workboard
- `#/agent_sessions` -> Runtime
- `#/agent_skills` -> Skills
- `#/ai_staff` -> AI Staff
- `#/approvals` -> Approvals
- `#/connectors` -> Connectors
- `#/fast_mode` -> Review Mode
- `#/fast-review` -> Review Mode

## Manual smoke test

Track manual verification in GitHub issue #3. Before starting the next brief, run:

```bash
npm run lint
npm run build
npm run dev
```

Then click through every route listed above and confirm legacy localStorage data still renders.
