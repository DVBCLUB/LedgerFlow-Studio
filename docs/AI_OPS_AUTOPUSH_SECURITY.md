# AI Operations Center - Approved GitHub Auto-Push Security Model

## Goal

LedgerFlow AI Operations Center must eventually allow AI agents to push code to GitHub automatically, because copying and pasting code manually defeats the purpose of an AI operations system.

However, auto-push must be controlled. The correct model is:

```txt
AI proposes change
  -> Founder approval phrase
  -> Backend validates files
  -> Create ai/* branch
  -> Commit files to branch
  -> Open draft PR
  -> GitHub Actions runs
  -> Founder reviews and merges
```

AI must not push directly to `main`.

## Current implemented backend endpoint

```txt
POST /api/integrations/github/approved-change-request
```

Input shape:

```json
{
  "repo": "DVBCLUB/LedgerFlow-Studio",
  "title": "AI change title",
  "summary": "What changed and why",
  "approvalPhrase": "APPROVE AI GITHUB PUSH",
  "baseBranch": "main",
  "branchName": "ai/my-safe-change",
  "draft": true,
  "files": [
    {
      "path": "src/components/Example.tsx",
      "content": "complete replacement file content"
    }
  ]
}
```

The backend will:

1. Require `GITHUB_TOKEN` or `GH_TOKEN` server-side.
2. Require exact founder approval phrase.
3. Create a safe `ai/*` branch.
4. Commit file replacements to the branch.
5. Open a draft pull request.
6. Write Integration Hub event log.

## Security rules already implemented

### Token handling

- GitHub token is read only from backend environment variables.
- Token must not be passed from frontend.
- Token must not be stored in localStorage.
- Token must not be printed in logs.

### Branch protection by design

- AI-generated branch names are forced under `ai/*`.
- Direct push to `main`, `master`, `develop`, or `production` is blocked.
- The endpoint opens a PR instead of merging.
- Draft PR is the default.

### File safety

The backend blocks sensitive or runtime paths, including:

- `.env*`
- `runtime/.ledgerflow_secret`
- `runtime/ai_keys.vault.json`
- `runtime/ai_usage.log.json`
- `runtime/integration_registry.json`
- `runtime/integration_events.log.json`
- `runtime/.ai_vault_session.json`
- `.git/`
- `node_modules/`
- `dist/`
- `release/`
- private key files such as `.pem`, `.key`, `id_rsa`, `id_ed25519`

### Size and review limits

- Max 10 files per approved request.
- Max 250,000 characters per file.
- This keeps PRs reviewable and reduces blast radius.

## Required next steps

### P0 UI

Add UI inside `AI Nhân sự / AI Operations Center`:

1. Show proposed file changes.
2. Show risk score.
3. Show blocked paths warning.
4. Require founder to type `APPROVE AI GITHUB PUSH`.
5. Button: `Create AI branch + draft PR`.
6. Show resulting PR link.
7. Add audit log card.

### P1 AI generation flow

1. AI creates plan.
2. AI creates replacement file content.
3. Founder reviews diff-like view.
4. Founder approves.
5. Backend pushes branch and PR.

### P2 stronger security

1. Use fine-grained GitHub token with minimal repo permissions.
2. Add allowlist of writable paths.
3. Add diff preview and suspicious-content scanner.
4. Add PR label `ai-generated`.
5. Add mandatory CI pass before merge.
6. Add optional code-owner review.
7. Add rate limit per day for auto-push.
8. Add local passphrase unlock before approved push.

## Non-negotiable rules

- AI can push branch/PR, not main.
- Founder approval is required.
- Secrets never leave backend.
- Frontend never sees GitHub token.
- Every AI push must leave an audit trail.
- Any high-risk action must be blocked or require a stronger approval gate.
