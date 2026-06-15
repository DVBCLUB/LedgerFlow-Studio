# V2 Low-Quota Codex Plan

This plan keeps Codex usage low by only asking for the smallest UI wiring tasks.

## Already committed by ChatGPT

Data and panel seeds:

- `src/data/accountingVietnamDeepDive.ts`
- `src/components/AccountingVietnamDeepDivePanel.tsx`
- `src/data/internalAuditDeepDive.ts`
- `src/data/customDataWorkbenchDeepDive.ts`
- `src/data/companyOSV2Backlog.ts`
- `src/data/commandCenterV2DailyBrief.ts`

## Do first: tiny UI wiring

### Task 1 — AccountingVietnam

Wire the existing `AccountingVietnamDeepDivePanel` into `src/components/AccountingVietnam.tsx`.

Required changes:

1. Import `AccountingVietnamDeepDivePanel`.
2. Add `deepdive` to the tab union.
3. Add `['deepdive', 'VN Deep Dive']` to the labels.
4. Render the panel only when `tab === 'deepdive'`.

Do not rewrite the file.

### Task 2 — CommandCenter

Create a small panel that imports `COMMAND_CENTER_V2_DAILY_BRIEF` and renders cards.

Recommended file:

- `src/components/CommandCenterV2DailyBriefPanel.tsx`

Then wire it into `CommandCenter.tsx` as an additive section.

### Task 3 — CustomDataWorkbench

Create a panel that imports `CUSTOM_DATA_SCHEMA_PREVIEWS`, `QUERY_BUILDER_RECIPES`, and `PIVOT_SIMULATION_TEMPLATES`.

Recommended file:

- `src/components/CustomDataWorkbenchDeepDivePanel.tsx`

Render schema preview first; query and pivot can be below.

### Task 4 — InternalAuditWorkspace

Create a compact panel that imports `INTERNAL_AUDIT_17_CYCLES` and renders only objective, procedures, and evidence first.

Recommended file:

- `src/components/InternalAuditDeepDivePanel.tsx`

## Guardrails

- Do not rewrite `App.tsx`.
- Do not rename routes or module IDs.
- Do not add dependencies.
- Do not call external APIs for static dashboards.
- Keep all data in `src/data`.
- Keep each commit limited to one module.

## Checks

Run:

```bash
npm run lint
npm run check:agentops-contracts
npm run check:simulations
npm run build
```
