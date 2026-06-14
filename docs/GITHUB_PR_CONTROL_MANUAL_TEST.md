# GitHub PR Control - Manual Test

Use this checklist before enabling any larger GitHub automation.

## Goal

Verify the Phase 1 flow:

```text
GitHub PR Control -> backend approved-change endpoint -> branch -> commit -> draft PR -> audit note
```

The flow must stay founder-approved and draft-only.

## Preconditions

- Backend server is running.
- GitHub integration is configured on the backend.
- The working repo is `DVBCLUB/LedgerFlow-Studio`.
- The frontend is served from the same app origin as the backend API.
- The target branch exists.

## Test data

Use a harmless documentation-only file first.

```text
Repo: DVBCLUB/LedgerFlow-Studio
Base branch: main
Branch name: test/agentops-draft-pr-smoke
File path: docs/smoke/GITHUB_PR_CONTROL_SMOKE.md
File content: # Smoke test\n\nCreated by GitHub PR Control Phase 1 smoke test.
Title: Smoke test GitHub PR Control
Summary: Verify draft PR creation from approved GitHub change endpoint.
Approval phrase: APPROVE AI GITHUB PUSH
```

## Steps

1. Open AgentOps Hub.
2. Open GitHub PR tab.
3. Fill repo, base branch, branch name, title and summary.
4. Fill file path and file content.
5. Enter the approval phrase exactly.
6. Click Create draft PR.
7. Confirm the UI shows repo, base branch, head branch, commit count and PR link.
8. Open the PR in GitHub.
9. Confirm the PR is draft and targets `main`.
10. Confirm only the smoke document was changed.
11. Close the PR without merging.
12. Delete the test branch if desired.

## Expected result

- A new branch is created.
- A commit is created only for the requested file.
- A draft PR is opened.
- The UI shows the draft PR result.
- AgentOps audit records the action.

## Failure checklist

If the request fails, check:

- Backend env config for GitHub access.
- Repo full name typo.
- Base branch typo.
- Branch already exists.
- Approval phrase mismatch.
- File path is unsafe or empty.
- Backend logs for the exact error.

## Guardrail

Do not test with app source files first. Start with docs-only smoke files until the full create branch -> commit -> draft PR path is proven stable.
