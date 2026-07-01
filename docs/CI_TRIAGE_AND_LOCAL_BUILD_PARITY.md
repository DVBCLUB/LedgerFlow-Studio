# CI Triage va Local Build Parity Runbook

Runbook nay thuoc nhom Claude Company OS build brief. Tai lieu ton tai vi desktop build co the pass trong khi web CI cua LedgerFlow Studio van do.

## Muc tieu

Giu repository on dinh truoc khi them tinh nang Company OS moi.

Thu tu uu tien:

1. CI xanh truoc.
2. TypeScript schema dung truoc khi polish UI.
3. Runtime an toan cho du lieu localStorage cu.
4. Chi tiep tuc feature khi do tin cay build da khoi phuc.

## Vi sao Windows Desktop co the pass trong khi LedgerFlow Studio CI fail

Desktop workflow co the dong goi target khac hoac bo qua web checks nghiem ngat hon. CI chinh cua LedgerFlow Studio van co the do o:

- `npm run lint`
- `npm run build`
- `tsc --noEmit`
- Vite production build
- enum mismatch trong TypeScript
- object schema mismatch voi shared types
- thieu required fields
- du lieu localStorage cu gay crash runtime du build da pass

## Lenh parity o local

Truoc khi push commit feature, chay dung bo checks ma CI ky vong:

```bash
npm install
npm run lint
npm run build
```

Khi chi debug TypeScript:

```bash
npx tsc --noEmit
```

## File rui ro cao sau AgentOps expansion

Can kiem tra cac file sau moi khi them tab hoac workflow moi:

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

## Quy tac shared schema

### WorkCard

Khong tu dinh nghia WorkCard shape rieng trong tab.

Import shared type:

```ts
import type { WorkCard } from '../../../types/agentOps';
```

Kiem tra required fields:

```ts
kind
status
risk
request
plan
tools
approval
```

`plan` phai la `string[]`, khong phai string.

`kind` chi duoc dung cac gia tri enum da chia se.

### ApprovalRequest

Khong tao approval object thieu truong neu chua doi chieu shared type.

Import shared type:

```ts
import type { ApprovalRequest } from '../../../types/agentOps';
```

Required fields phai bao gom:

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

Su dung Approval Gate key:

```ts
ledgerflow_approval_gate_requests_v1
```

Khong ghi approval requests vao key cu hoac key trung lap.

## An toan localStorage

AgentOps co nhieu tab doc du lieu browser cu. Moi reader phai chiu duoc truong du lieu bi thieu.

Su dung shared helpers:

```ts
readLocalStorageValue
writeLocalStorageValue
readLocalStorageArray
appendLocalStorageArrayItem
upsertLocalStorageArrayItem
appendAgentOpsAudit
useLocalStorageVersion
```

Tranh viet ad-hoc helpers rieng trong tab neu khong co ly do that su can thiet.

## Mau loi thuong gap da ghi nhan

- `Type 'string' is not assignable to type 'LOW | MEDIUM | HIGH'`
- invalid `WorkCard.kind`
- `WorkCard.plan` passed as string instead of `string[]`
- `ApprovalRequest` missing `expiresAt`
- approval written to a key not read by `GateTab`
- memory/RAG reading the wrong localStorage key
- legacy cards missing `tools` or `plan`

## Quy trinh sua CI

Khi CI do:

1. Khong them feature moi.
2. Mo dung step CI dang fail.
3. Copy chinh xac loi TypeScript hoac Vite.
4. Sua tren tap file nho nhat co the.
5. Push mot commit co trong tam.
6. Chay lai CI.
7. Chi tiep tuc feature sau khi xanh, hoac khi loi con lai da xac dinh ro la khong lien quan.

## Acceptance checklist truoc khi tiep tuc feature

- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tab moi duoc mount dung trong `AgentOpsHub`.
- [ ] WorkCard moi dung shared `WorkCard` type.
- [ ] Approval Gate requests moi dung shared `ApprovalRequest` type.
- [ ] localStorage key moi da duoc document hoac tai su dung co chu dich.
- [ ] Legacy data duoc normalize truoc khi render.
- [ ] Khong luu secret trong frontend code hoac localStorage.

## Hanh dong de xuat tiep theo

Neu CI cua LedgerFlow Studio do lai, can sua dung loi CI cu the truoc khi tiep tuc roadmap Claude brief.
