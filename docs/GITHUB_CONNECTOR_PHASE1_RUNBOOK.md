# GitHub Connector Phase 1 Runbook

This runbook turns the Claude brief item **GitHub connector end-to-end** into a safe, approval-first rollout plan.

## Guardrails

- Do not write to GitHub directly from AI without a Founder approval record.
- Do not commit secrets, API keys, `.env` values or customer data.
- Do not merge automatically in Phase 1.
- CI must be green before adding new product features.
- Every write action needs audit evidence: request, changed files, test result, rollback note.

## Phase 1 Goal

Build a controlled path from an approved plan to a draft pull request:

```text
GitHub PR Control
  → Approval Gate
  → create branch
  → commit controlled file set
  → open draft PR
  → wait for CI
  → Founder review
```

Phase 1 should support a narrow allowlist only:

- docs updates
- local-only AgentOps tab updates
- type-only fixes
- small CI fixes

## Required Data Contract

A GitHub PR plan must include:

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

## Approval Rules

| Risk | Allowed before approval | Requires Founder approval |
|---|---|---|
| LOW | copy plan, dry-run summary | GitHub write |
| MEDIUM | draft branch name, file scope | branch, commit, PR |
| HIGH | risk review only | every write step + rollback proof |

## Implementation Steps

### 1. Add PR plan schema

Create a shared type for PR plans. Keep it frontend-safe and local-only first.

Suggested storage key:

```ts
ledgerflow_github_pr_plans_v1
```

### 2. Connect GitHub PR Control to Approval Gate

Already started: the tab creates approval requests. Harden it so each plan stores the approval id and status.

### 3. Add backend endpoint for approved dry-run

Proposed endpoint:

```text
POST /api/integrations/github/pr-dry-run
```

It should validate:

- approval exists
- approval status is Approved
- file scope is allowed
- no secret-looking content
- branch name is safe

### 4. Add branch + commit + draft PR endpoint

Proposed endpoint:

```text
POST /api/integrations/github/create-draft-pr
```

This endpoint should never merge. It only creates a draft PR and returns URL + commit SHA.

### 5. Add CI watcher

After draft PR, record:

- workflow run URL
- current CI status
- failed job summary if any
- next action for AI Dev

### 6. Add audit evidence

Every GitHub connector action must append an audit event:

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

- [ ] PR plan can be created without GitHub write.
- [ ] PR plan can be sent to Approval Gate.
- [ ] External write is blocked when approval is missing.
- [ ] External write is blocked when approval is Pending/Rejected/Expired.
- [ ] Branch name is sanitized.
- [ ] File scope is allowlisted.
- [ ] Secret-like content is rejected.
- [ ] Draft PR is created, not normal PR.
- [ ] CI status is visible to Founder.
- [ ] Rollback note is required before ready-for-review.

## Rollback

If Phase 1 creates bad data:

1. Close the draft PR.
2. Delete the feature branch if no longer needed.
3. Mark the approval request as rejected or expired.
4. Add audit note with reason and affected files.
5. Keep the runbook updated with the failure mode.
