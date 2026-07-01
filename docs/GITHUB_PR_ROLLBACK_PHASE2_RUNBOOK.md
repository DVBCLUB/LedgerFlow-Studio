# GitHub PR Rollback Phase 2 - Runbook

## Muc tieu

Mo rong GitHub PR Control sau Phase 1.5:

1. Draft PR duoc tao qua approved-change endpoint.
2. PR digest co the refresh.
3. Workflow jobs co the refresh theo run id.
4. Release Gate chan release khi CI chua pass.

Phase 2 bo sung duong rollback/dong draft PR an toan.

## Guardrails

- Tuyet doi khong auto-merge.
- Tuyet doi khong auto-close neu chua co Founder approval.
- Khong xoa branch tu UI trong Phase 2.
- Rollback phai bat dau bang plan + audit note.
- Moi external GitHub write bat buoc Approval Gate + founder phrase.

## Truong du lieu de xuat

Bo sung vao GitHub PR plan:

```ts
rollbackStatus?: 'Not Requested' | 'Requested' | 'Approved' | 'Closed' | 'Cancelled';
rollbackReason?: string;
rollbackEvidence?: string;
closedAt?: string;
```

## Backend endpoint de xuat

```txt
POST /api/integrations/github/prs/:pullNumber/request-close
```

Payload:

```json
{
  "repo": "DVBCLUB/LedgerFlow-Studio",
  "approvalPhrase": "APPROVE AI GITHUB PUSH",
  "reason": "CI failed or release gate blocked",
  "auditNote": "Founder approved closing draft PR"
}
```

Response:

```json
{
  "ok": true,
  "repo": "DVBCLUB/LedgerFlow-Studio",
  "pullNumber": 123,
  "state": "closed",
  "closedAt": "2026-..."
}
```

## Luong UI

1. User thay CI failed hoac PR digest canh bao rui ro.
2. User nhap rollback reason.
3. User gui rollback plan qua Approval Gate.
4. Sau khi duoc phe duyet, user nhap founder phrase.
5. Ung dung goi close endpoint.
6. Audit event duoc ghi.
7. Release Notes hien PR da dong hoac archived.

## Audit events

- `GITHUB_PR_ROLLBACK_REQUESTED`
- `GITHUB_PR_ROLLBACK_APPROVED`
- `GITHUB_PR_CLOSE_REQUESTED`
- `GITHUB_PR_CLOSED`
- `GITHUB_PR_CLOSE_FAILED`

## Acceptance checklist

- Dong PR bat buoc ca Approval Gate va founder phrase.
- PR da dong khong con bi tinh la CI blocker trong Release Gate.
- PR da dong van giu audit history va rollback reason.
- Viec xoa branch van de thu cong trong Phase 2.
