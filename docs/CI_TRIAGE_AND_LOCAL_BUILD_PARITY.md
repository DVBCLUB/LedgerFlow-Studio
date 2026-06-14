# CI Triage and Local Build Parity Runbook

This runbook is part of the Claude Company OS build brief. It exists because a desktop build can pass while the LedgerFlow Studio web CI still fails.

## Goal

Keep the repository stable before adding more Company OS features.

Priority order:

1. CI green first.
2. TypeScript schema correctness before UI polish.
3. Runtime safety for legacy localStorage data.
4. Feature work only after build confidence is restored.

## Why Windows Desktop can pass while LedgerFlow Studio CI fails

A desktop workflow may package a different target or skip the stricter web checks. The main LedgerFlow Studio CI can still fail on:

- `npm run lint`
- `npm run build`
- `tsc --noEmit`
- Vite production build
- enum mismatch in TypeScript
- object schema mismatch for shared types
- missing required fields
- stale localStorage data causing runtime crashes after build passes

## Local parity commands

Before pushing feature commits, run the same checks the CI expects:

```bash
npm install
npm run lint
npm run build
```

When debugging TypeScript only:

```bash
npx tsc --noEmit
```

## High-risk files after AgentOps expansion

These files should be checked whenever a new tab or workflow is added:

```text
src/types/agentOps.ts
src/components/agent-ops/AgentOpsHub.tsx
src/components/agent-ops/storage.ts
src/components/agent-ops/tabs/WorkboardTab.tsx
src/components/agent-ops/tabs/GateTab.tsx
src/components/agent-ops/tabs/ProductFactoryTab.tsx
src/components/agent-ops/tabs/TaskQueueTab.tsx
src/components/agent-ops/tabs/GitHubPRControlTab.tsx
```

## Shared schema rules

### WorkCard

Never invent a local WorkCard shape in a tab.

Import the shared type:

```ts
import type { WorkCard } from '../../../types/agentOps';
```

Check required fields:

```ts
kind
status
risk
request
plan
tools
approval
```

`plan` must be `string[]`, not a string.

`kind` must use the shared enum values only.

### ApprovalRequest

Never create a partial approval object without checking the shared type.

Import the shared type:

```ts
import type { ApprovalRequest } from '../../../types/agentOps';
```

Required fields must include:

```ts
id
title
source
risk
status
action
details
createdAt
expiresAt
```

Use the Approval Gate key:

```ts
ledgerflow_approval_gate_requests_v1
```

Do not write approval requests to old or duplicate keys.

## localStorage safety

AgentOps now has many tabs reading old browser data. Any reader should tolerate missing fields.

Use shared helpers:

```ts
readLocalStorageValue
writeLocalStorageValue
readLocalStorageArray
appendLocalStorageArrayItem
upsertLocalStorageArrayItem
appendAgentOpsAudit
useLocalStorageVersion
```

Avoid direct ad-hoc helpers inside tabs unless there is a strong reason.

## Common failure patterns already seen

- `Type 'string' is not assignable to type 'LOW | MEDIUM | HIGH'`
- invalid `WorkCard.kind`
- `WorkCard.plan` passed as string instead of `string[]`
- `ApprovalRequest` missing `expiresAt`
- approval written to a key not read by `GateTab`
- memory/RAG reading the wrong localStorage key
- legacy cards missing `tools` or `plan`

## CI fix workflow

When CI is red:

1. Do not add new features.
2. Open the failing CI step.
3. Copy the exact TypeScript or Vite error.
4. Fix the smallest file set possible.
5. Push one focused commit.
6. Re-run CI.
7. Only continue feature work after green or after the remaining failure is clearly unrelated.

## Acceptance checklist before feature continuation

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] New tabs are mounted in `AgentOpsHub` correctly.
- [ ] New WorkCards use shared `WorkCard` type.
- [ ] New Approval Gate requests use shared `ApprovalRequest` type.
- [ ] New localStorage keys are documented or intentionally reused.
- [ ] Legacy data is normalized before rendering.
- [ ] No secret values are stored in frontend code or localStorage.

## Next recommended action

If LedgerFlow Studio CI fails again, fix the exact CI error before continuing the Claude brief roadmap.
