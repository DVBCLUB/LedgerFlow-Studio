# AI Operations Center - Approved GitHub Auto-Push Security Model

## Muc tieu

LedgerFlow AI Operations Center ve dai han can cho phep AI agents push code len GitHub tu dong, vi copy/paste thu cong lam mat y nghia cua mot AI operations system.

Tuy nhien, auto-push bat buoc phai duoc kiem soat. Mo hinh dung la:

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

AI tuyet doi khong push truc tiep vao `main`.

## Backend endpoint da trien khai

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

Backend se:

1. Bat buoc `GITHUB_TOKEN` hoac `GH_TOKEN` o server-side.
2. Bat buoc exact founder approval phrase.
3. Tao nhanh an toan `ai/*`.
4. Commit file thay the vao nhanh do.
5. Mo draft pull request.
6. Ghi Integration Hub event log.

## Quy tac bao mat da duoc trien khai

### Token handling

- GitHub token chi duoc doc tu backend environment variables.
- Token khong duoc truyen tu frontend.
- Token khong duoc luu trong localStorage.
- Token khong duoc in ra logs.

### Branch protection by design

- Branch name do AI tao bi ep nam duoi `ai/*`.
- Chan direct push vao `main`, `master`, `develop`, hoac `production`.
- Endpoint mo PR thay vi merge.
- Draft PR la mac dinh.

### File safety

Backend chan cac path nhay cam hoac runtime, gom:

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
- private key files nhu `.pem`, `.key`, `id_rsa`, `id_ed25519`

### Gioi han kich thuoc va review

- Toi da 10 files moi approved request.
- Toi da 250,000 ky tu moi file.
- Muc tieu la giu PR de review va giam blast radius.

## Buoc tiep theo bat buoc

### P0 UI

Them UI trong `AI Nhan su / AI Operations Center`:

1. Hien file changes de xuat.
2. Hien risk score.
3. Hien canh bao blocked paths.
4. Bat founder nhap `APPROVE AI GITHUB PUSH`.
5. Nut: `Create AI branch + draft PR`.
6. Hien link PR ket qua.
7. Them audit log card.

### P1 AI generation flow

1. AI tao plan.
2. AI tao replacement file content.
3. Founder review giao dien kieu diff.
4. Founder phe duyet.
5. Backend push branch va PR.

### P2 stronger security

1. Dung fine-grained GitHub token voi permission toi thieu.
2. Them allowlist cho writable paths.
3. Them diff preview va suspicious-content scanner.
4. Them PR label `ai-generated`.
5. Bat buoc CI pass truoc merge.
6. Them code-owner review tuy chon.
7. Them rate limit theo ngay cho auto-push.
8. Them local passphrase unlock truoc approved push.

## Quy tac khong the thuong luong

- AI chi duoc push branch/PR, khong duoc push main.
- Bat buoc co founder approval.
- Secrets khong duoc roi khoi backend.
- Frontend khong bao gio duoc thay GitHub token.
- Moi AI push bat buoc de lai audit trail.
- Moi hanh dong rui ro cao phai bi chan hoac can gate phe duyet manh hon.
