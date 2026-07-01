# GitHub Connector Phase 1 - Runbook

Runbook nay chuyen hoa muc **GitHub connector end-to-end** thanh ke hoach rollout an toan, uu tien phe duyet truoc.

## Guardrails

- Khong duoc ghi len GitHub truc tiep tu AI neu khong co ban ghi Founder approval.
- Khong commit secrets, API keys, gia tri `.env` hoac du lieu khach hang.
- Khong tu dong merge trong Phase 1.
- CI phai xanh truoc khi them tinh nang san pham moi.
- Moi hanh dong ghi phai co audit evidence: request, file thay doi, ket qua test, ghi chu rollback.

## Muc tieu Phase 1

Xay dung luong kiem soat tu ke hoach da duoc phe duyet den draft pull request:

```text
GitHub PR Control
  -> Approval Gate
  -> create branch
  -> commit controlled file set
  -> open draft PR
  -> wait for CI
  -> Founder review
```

Phase 1 chi nen mo allowlist hep:

- cap nhat docs
- cap nhat AgentOps tab local-only
- type-only fixes
- CI fixes nho

## Data Contract bat buoc

GitHub PR plan phai co:

- repository name
- base branch
- proposed branch name
- risk level
- title
- summary
- file scope
- test plan
- rollback plan
- approval request id
- evidence log id

## Quy tac phe duyet

| Risk | Duoc phep truoc approval | Can Founder approval |
|---|---|---|
| LOW | sao chep plan, dry-run summary | GitHub write |
| MEDIUM | draft branch name, file scope | branch, commit, PR |
| HIGH | chi duoc risk review | tung buoc write + rollback proof |

## Cac buoc trien khai

### 1. Them PR plan schema

Tao shared type cho PR plans. Uu tien frontend-safe va local-only trong giai doan dau.

Storage key de xuat:

```ts
ledgerflow_github_pr_plans_v1
```

### 2. Noi GitHub PR Control voi Approval Gate

Da co nen tang: tab da tao approval requests. Can harden de moi plan luu duoc approval id va status.

### 3. Them backend endpoint cho approved dry-run

Endpoint de xuat:

```text
POST /api/integrations/github/pr-dry-run
```

Can validate:

- approval ton tai
- approval status la Approved
- file scope nam trong allowlist
- khong co noi dung giong secret
- branch name an toan

### 4. Them endpoint branch + commit + draft PR

Endpoint de xuat:

```text
POST /api/integrations/github/create-draft-pr
```

Endpoint nay khong duoc merge. Chi tao draft PR va tra ve URL + commit SHA.

### 5. Them CI watcher

Sau khi tao draft PR, can ghi:

- workflow run URL
- CI status hien tai
- failed job summary (neu co)
- next action cho AI Dev

### 6. Them audit evidence

Moi hanh dong GitHub connector phai append mot audit event:

```text
GITHUB_PR_PLAN_CREATED
GITHUB_PR_APPROVAL_REQUESTED
GITHUB_DRY_RUN_PASSED
GITHUB_BRANCH_CREATED
GITHUB_COMMIT_CREATED
GITHUB_DRAFT_PR_OPENED
GITHUB_CI_FAILED
GITHUB_CI_PASSED
```

## Acceptance Checklist

- [ ] Co the tao PR plan ma khong ghi GitHub.
- [ ] Co the gui PR plan den Approval Gate.
- [ ] Chan external write khi thieu approval.
- [ ] Chan external write khi approval la Pending/Rejected/Expired.
- [ ] Branch name duoc sanitize.
- [ ] File scope nam trong allowlist.
- [ ] Noi dung giong secret bi tu choi.
- [ ] Tao draft PR, khong tao PR thuong.
- [ ] Founder xem duoc CI status.
- [ ] Bat buoc co rollback note truoc khi ready-for-review.

## Rollback

Neu Phase 1 tao du lieu loi:

1. Dong draft PR.
2. Xoa feature branch neu khong can nua.
3. Danh dau approval request la rejected hoac expired.
4. Them audit note mo ta ly do va file bi anh huong.
5. Cap nhat runbook voi failure mode vua gap.
