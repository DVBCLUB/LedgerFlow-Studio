# GitHub PR Close Manual Test

Purpose: verify the safe rollback/close path after a draft PR was created from GitHub PR Control.

## Preconditions

- The app build is green.
- Backend has GitHub integration environment configured.
- A draft PR exists from the smoke test flow.
- The PR is not merged.

## Safety rules

- Do not run this on production source-code PRs first.
- Use a docs-only smoke PR.
- Do not delete the branch from the app.
- Do not merge automatically.
- Keep the rollback note in the PR discussion.

## Smoke data

Use the draft PR created by:

- Repo: `DVBCLUB/LedgerFlow-Studio`
- Base: `main`
- Branch example: `test/agentops-draft-pr-smoke`
- File example: `docs/smoke/GITHUB_PR_CONTROL_SMOKE.md`

## Steps

1. Open AgentOpsHub.
2. Open `GitHub PR`.
3. Confirm the PR plan has a pull request number.
4. Add or confirm rollback note.
5. Enter close founder phrase exactly:

```text
APPROVE AI GITHUB CLOSE
```

6. Click `Request close PR`.
7. Confirm the UI shows close result.
8. Open the GitHub PR page.
9. Confirm a rollback/close comment exists.
10. Confirm the PR is closed.
11. Confirm the branch was not deleted automatically.
12. Confirm audit includes one of:

```text
GITHUB_PR_CLOSED
GITHUB_PR_CLOSE_FAILED
```

## Expected result

- PR is closed only after the founder phrase is provided.
- PR discussion contains the rollback reason/note.
- Branch is still available for manual recovery.
- Release Notes should not mark release as ready if related PR CI/review is not clean.

## Fail conditions

- PR closes without the founder phrase.
- Branch is deleted automatically.
- No audit event is recorded.
- No PR comment is added before close.
- UI hides the error when backend route fails.

## Rollback

If the close action was tested on the wrong PR:

1. Reopen PR manually in GitHub if appropriate.
2. Add a comment explaining the accidental close.
3. Create a new GitHub PR Control plan documenting the correction.
4. Keep audit trail intact.
