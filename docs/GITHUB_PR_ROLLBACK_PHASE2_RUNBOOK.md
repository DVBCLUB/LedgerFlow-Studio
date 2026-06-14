# GitHub PR Rollback Phase 2 Runbook

## Goal

Extend GitHub PR Control after Phase 1.5:

1. Draft PR is created through approved-change endpoint.
2. PR digest can be refreshed.
3. Workflow jobs can be refreshed by run id.
4. Release Gate blocks release when CI is not passed.

Phase 2 adds a safe rollback/close path for draft PRs.

## Guardrails

- Never auto-merge.
- Never auto-close without Founder approval.
- Never delete branches from the UI in Phase 2.
- Rollback starts as a plan and audit note.
- External GitHub write must require Approval Gate + founder phrase.

## Proposed data fields

Add to GitHub PR plan:

```ts
rollbackStatus?: 'Not Requested' | 'Requested' | 'Approved' | 'Closed' | 'Cancelled';
rollbackReason?: string;
rollbackEvidence?: string;
closedAt?: string;
```

## Proposed backend endpoint

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

## UI flow

1. User sees CI failed or PR digest safety warning.
2. User writes rollback reason.
3. User sends rollback plan to Approval Gate.
4. After approval, user enters founder phrase.
5. App calls close endpoint.
6. Audit event is written.
7. Release Notes sees the PR as closed or archived.

## Audit events

- `GITHUB_PR_ROLLBACK_REQUESTED`
- `GITHUB_PR_ROLLBACK_APPROVED`
- `GITHUB_PR_CLOSE_REQUESTED`
- `GITHUB_PR_CLOSED`
- `GITHUB_PR_CLOSE_FAILED`

## Acceptance checklist

- Closing a PR requires both Approval Gate and founder phrase.
- Closed PR is no longer counted as a CI blocker in Release Gate.
- Closed PR keeps audit history and rollback reason.
- Branch deletion remains manual in Phase 2.
