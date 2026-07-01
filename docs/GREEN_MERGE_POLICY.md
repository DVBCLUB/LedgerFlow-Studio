# Green Merge Policy (GitHub AI Platforms)

Muc tieu: ChatGPT, Gemini, Claude Code, Copilot, hoac bat ky AI nao code thang qua GitHub deu dat trang thai xanh truoc merge/deploy.

## Quick operator checklist

Truoc khi bam merge, kiem tra nhanh theo thu tu:

1. `npm run check:pr-readiness` da pass.
2. Neu PR co nhan `risk/ai-runtime`, cac gate runtime da pass.
3. Khong co comment tu dong nao con mo ta missing reviewer routing/delivery.
4. Rollback note da co neu PR dung daemon/runtime/approval.
5. Branch protection check required statuses da xanh.

## Why this exists

- Repo co nhieu khu vuc high-risk (assistant daemon, OpenClaw, robot, mission runtime).
- Neu chi check chung chung, code van de vo do route/contract khong khop.
- Chinh sach nay bat buoc dung gate theo rui ro cua file thay doi.

## 3 layers of gates

1. PR Readiness (risk-aware, ap dung cho moi PR)

- Tu dong scan file thay doi va chon dung bo checks.
- Mac dinh gom CODEMAP discipline + baseline lint/check + web build.
- Neu PR dung high-risk AI runtime/OpenClaw/robot, script tu mo rong bo checks bat buoc.
- Neu PR dung desktop packaging, script tu them desktop gate.
- Artifact `artifacts/pr-readiness/plan.json` hien co them `requiredReviewerRoutingVars` va `optionalPolicyVars` de huong dan setup repo variables theo risk profile.
- Workflow cung xuat `artifacts/pr-readiness/enforcement-status.json` de ghi trang thai enforcement/routing theo labels dang active.
- Trong `enforcement-status.json`, truong `reviewerDelivery` ghi chi tiet coverage theo track (configured/requested/reviewed/missing) de debug nhanh khi fail gate delivery.
- Workflow xuat them `artifacts/pr-readiness/run-summary.md` (ban tom tat de doc nhanh) va `artifacts/pr-readiness/metrics.json` (du lieu may doc cho dashboard/tong hop xu huong fail).
- Workflow xuat them `artifacts/pr-readiness/weekly-summary.json` va `artifacts/pr-readiness/weekly-summary.md` (snapshot trend 7 ngay).

Commands:

```bash
npm run check:pr-readiness
```

Che do xem truoc plan (khong chay checks):

```bash
npm run check:pr-readiness:dry
```

2. AI Runtime Green (tu dong kich hoat khi PR dung high-risk paths)

- OpenClaw/mission contracts
- Runtime API smoke + mission queue checks
- AI assistant safety checks
- Focused AI runtime tests

Commands:

```bash
npm run check:openclaw-plus
npm run check:runtime
npm run check:ai-assistant-safety
npm run test:ai-runtime
```

3. Vercel Preview Gate

- Vercel build command da duoc cai dat de chay strict type-check truoc build web.
- Vercel build command hien tai chay baseline lint gate + web build de dam bao preview khong vo do checks ma repo dang dung.
- Khi repo da clean TypeScript error ton dong, co the nang len `check:green:strict`.

## Workflows

- `.github/workflows/green-merge-guard.yml`
  - Chay `npm run check:pr-readiness` cho moi PR/push.
  - Gate risk-aware trong script se tu quyet dinh bo checks can chay theo file da sua.
  - Khi fail tren pull request, workflow tu dong comment lai command can chay theo dung profile rui ro.
  - Workflow tu dong gan nhan PR theo profile: `risk/docs-only`, `risk/standard`, `risk/desktop`, `risk/ai-runtime`.
  - Workflow bat buoc PR phai co it nhat 1 nhan `risk/*`.
  - Workflow kiem dinh cau hinh bien repo theo nhan rui ro trong plan va in canh bao ro rang vao job summary.
  - Workflow tu dong comment checklist cau hinh (`ledgerflow-risk-config`) neu thieu routing/approval config, va tu xoa comment khi da clean.
  - Workflow co the tu request reviewer theo nhan neu da cau hinh bien repo.

- `.github/workflows/openclaw-plus.yml`
  - OpenClaw-specific readiness workflow co san, van giu de bo sung chan cuoi.

## High-risk path groups

Nhung path duoi day se kich hoat AI Runtime Green:

- `server/assistant-daemon.ts`
- `server/services/agentRuntime*.ts`
- `server/services/aiWorkforce*.ts`
- `server/services/openClaw*.ts`
- `server/services/robot*.ts`
- `server/services/telegramMissionCommands.ts`
- `scripts/patch-daemon-*.mjs`
- `scripts/check-openclaw-*.mjs`
- `scripts/check-robot-*.mjs`
- `scripts/check-ai-workforce-*.mjs`
- `scripts/openclaw-plus-doctor.mjs`

## Required merge discipline

- PR nho, 1 muc tieu ro rang.
- Mo ta rollback note neu dong vao daemon/runtime/approval.
- Khong merge khi co check do.
- Truong hop can emergency hotfix: merge gate van giu, khong bypass bang cach tat workflow.

## Optional reviewer routing config (repo variables)

Set cac bien sau trong GitHub repository variables (comma-separated values):

- `RISK_STANDARD_REVIEWERS`
- `RISK_DESKTOP_REVIEWERS`
- `RISK_AI_RUNTIME_REVIEWERS`
- `RISK_STANDARD_REVIEW_TEAMS`
- `RISK_DESKTOP_REVIEW_TEAMS`
- `RISK_AI_RUNTIME_REVIEW_TEAMS`
- `ENFORCE_REVIEWER_ROUTING` (`true` hoac `false`, mac dinh `false`)
- `ENFORCE_REVIEW_REQUEST_DELIVERY` (`true` hoac `false`, mac dinh `false`)
- `ENFORCE_AI_RUNTIME_APPROVAL` (`true` hoac `false`, mac dinh `false`)
- `AI_RUNTIME_MIN_APPROVALS` (so nguyen >= 1, mac dinh `1`)

Vi du:

```text
RISK_AI_RUNTIME_REVIEWERS=alice,bob
RISK_DESKTOP_REVIEWERS=windows-owner
RISK_AI_RUNTIME_REVIEW_TEAMS=runtime-guardians
ENFORCE_REVIEWER_ROUTING=true
ENFORCE_REVIEW_REQUEST_DELIVERY=true
ENFORCE_AI_RUNTIME_APPROVAL=true
AI_RUNTIME_MIN_APPROVALS=2
```

- Neu `ENFORCE_REVIEWER_ROUTING=true`, workflow se fail neu nhan rui ro dang active nhung chua co reviewer routing tuong ung.
- Neu `ENFORCE_REVIEW_REQUEST_DELIVERY=true`, workflow se fail neu nhan rui ro dang active nhung reviewer/teams trong routing chua duoc request hoac chua co user nao da review.

## Optional AI runtime approval gate

- Neu `ENFORCE_AI_RUNTIME_APPROVAL=true`, workflow se bat buoc du approval toi thieu cho PR co nhan `risk/ai-runtime`.
- So approval toi thieu duoc doc tu `AI_RUNTIME_MIN_APPROVALS`.
- Chi tinh approval hieu luc theo trang thai review moi nhat cua tung reviewer.
- Khong tinh self-approval cua tac gia PR.

## Branch protection baseline (khuyen nghi bat buoc)

Tai branch chinh (`main`/`master`), bat branch protection va yeu cau status checks sau phai xanh truoc merge:

- `PR Readiness (risk-aware)`
- `codemap-guard / Codemap Discipline`

Neu repo dang su dung them workflow bat buoc khac (vi du desktop release), them cac check do vao required status checks cung bo nay.

Khuyen nghi bat them:

- Require pull request reviews before merging
- Dismiss stale approvals when new commits are pushed
- Require conversation resolution before merging

## Fail-fast debugging rule

- Neu readiness fail, uu tien sua command dau tien bi fail trong comment tu dong.
- Khong sua ngan nhien nhieu khu vuc cung luc.
- Chay lai `npm run check:pr-readiness` sau moi nhom fix nho.

## Escalation rule

Escalate cho maintainer/phu trach runtime neu gap mot trong cac truong hop:

- Cung mot gate fail lap lai >= 3 lan du da sua dung theo command de xuat.
- PR bi gan `risk/ai-runtime` va co thay doi dong thoi o daemon + runtime queue + patch scripts.
- Enforcement status bao missing routing nhung repository variables da co day du.

## Local developer shortcut

- Cho moi feature/PR:

```bash
npm run check:pr-readiness
```

- Feature AI runtime/OpenClaw/robot:

```bash
npm run check:green:ai-runtime
```

- Tong hop trend readiness local:

```bash
npm run report:pr-readiness:weekly
npm run report:pr-readiness:30d
```
