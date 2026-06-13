# AgentOps Storage Helpers

This note documents the shared localStorage and audit helpers used by the AgentOps / AI Workforce workspace.

## Source file

`src/components/agent-ops/storage.ts`

## Required helpers

Use these helpers instead of hand-rolled `readLocal`, `writeLocal`, `pushAudit`, or hardcoded audit constants inside tabs:

- `readLocalStorageValue<T>(key, fallback)`
- `writeLocalStorageValue<T>(key, value)`
- `readLocalStorageArray<T>(keys)`
- `appendLocalStorageArrayItem<T>(key, item, limit)`
- `upsertLocalStorageArrayItem<T extends { id: string }>(key, item, limit)`
- `appendAgentOpsAudit(action, cardId, detail)`
- `useLocalStorageVersion(events)`
- `AGENT_OPS_AUDIT_KEY`

## Rules

1. New AgentOps tabs must use the shared helpers.
2. Do not create new tab-level `AUDIT_KEY` constants for `ledgerflow_aiops_audit_v1`.
3. Do not write directly to `localStorage.setItem` unless the helper cannot cover the use case.
4. Any action that changes cards, approvals, prompts, product ideas, tool cards, feedback, or snapshots must call `appendAgentOpsAudit`.
5. If a tab reads data that can be changed by another tab, call `useLocalStorageVersion()` so the UI refreshes after shared events.
6. Medium/high risk actions must create an Approval Gate request before external execution.
7. Runtime-only logs must not contain API keys, tokens, PATs, or secrets.

## Why this exists

The Company OS grew several tabs quickly: Workboard, Approval Gate, Product Factory, Tool Cards, Prompt Pack, Feedback, AI Cost, Daily Standup, and Company Memory. Early versions repeated localStorage/audit logic inside each tab, increasing CI/typecheck risk.

This helper layer keeps the project closer to the brief principles:

- offline-ready;
- localStorage-first before backend;
- approval-first;
- audit-first;
- no hardcoded secret;
- incremental changes instead of rebuilding from scratch.

## Manual test checklist

After changing a tab that uses these helpers:

1. Open AgentOps Hub.
2. Create or edit one item in the changed tab.
3. Check that the item persists after refresh.
4. Check that the audit counter changes in Workboard/Gate/Company Memory.
5. Check that another tab observing the same key updates without manual refresh.
6. Run `npm run lint` and `npm run build` before deploy.
