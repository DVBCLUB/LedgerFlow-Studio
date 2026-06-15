# LedgerFlow Studio — Brief 3 Post-Merge QA Runbook

PR #7 merged Brief 1/2 + Brief 3 activation-layer features into `main`.
Use this runbook before deploying to staging/production.

## 1. Local commands

```bash
npm install
npm run check:new-features-brief
npm run build
npm run dev
```

Expected:
- Type-check passes.
- Vite/server build passes.
- PWA Workbox precache should not fail for the current bundle because `maximumFileSizeToCacheInBytes` is configured to 5 MiB.

## 2. Required environment variables

Server-side features rely on service/admin keys. Do not expose service keys to the browser.

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
```

Notes:
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is needed for cron, notifications, affiliate backend, and server-side inserts.
- `GEMINI_API_KEY` is needed for Invoice OCR.
- Facebook routes degrade gracefully when Facebook env vars are missing.

## 3. Supabase migrations to verify

Run/check all new migrations after pulling `main`:

- `company_memory`
- `agent_pipelines`
- `revenue_records`
- `notifications`
- `referral_codes`
- `referral_events`

Quick manual checks:

```sql
select count(*) from public.notifications;
select count(*) from public.referral_codes;
select count(*) from public.agent_pipelines;
select count(*) from public.company_memory;
```

## 4. Backend API smoke tests

Replace UUID values with a real user id from Supabase Auth.

### Cron

```bash
curl http://localhost:3000/api/cron/status
curl -X POST http://localhost:3000/api/cron/trigger \
  -H "Content-Type: application/json" \
  -d '{"jobName":"daily_brief","userId":"00000000-0000-0000-0000-000000000000"}'
```

### Notifications

```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000000","message":"QA notification"}'
```

Expected: notification appears in AgentOps → Notifications without refresh when Supabase Realtime is active.

### Pipelines

```bash
curl http://localhost:3000/api/pipelines/types
```

Start a pipeline from DevRoom UI first, then approve when status is `waiting_approval`.

### Agent roles / executor

```bash
curl http://localhost:3000/api/agents/roles
curl -X POST http://localhost:3000/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{"agentRole":"AI Game Dev","prompt":"Tạo 3 câu hỏi kế toán VAT dạng JSON array"}'
```

Known limit: `/api/agents/execute` is a minimal executor because the repository still has no dedicated `server/services/agentExecutor.ts`.

### Affiliate

```bash
curl -X POST http://localhost:3000/api/affiliate/codes \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000000","partnerName":"Ketoan Partner","commissionRate":20}'

curl "http://localhost:3000/api/affiliate/stats?userId=00000000-0000-0000-0000-000000000000"
```

### Facebook connector

```bash
curl http://localhost:3000/api/integrations/facebook/test
curl http://localhost:3000/api/integrations/facebook/insights
```

Expected without env vars: graceful error, not server crash.

## 5. AgentOps UI smoke tests

Open AgentOps and verify quick actions/tabs:

- Notifications
- MISA Bridge
- PDF Reports
- Game Studio
- Affiliate Backend
- DevRoom
- Revenue
- Invoice OCR
- VietQR Reconcile
- Company Memory

Minimum checks:

1. Notifications loads an empty state or real notifications.
2. PDF Reports exports a PDF file.
3. Game Studio can generate or manually edit questions and export JSON.
4. Affiliate Backend can create a referral code and show stats.
5. MISA Bridge can upload an Excel file and preview journal rows.
6. DevRoom can list pipeline types and start a pipeline.
7. Company Memory can add/deactivate records.
8. VietQR Reconcile can parse sample bank statement rows.
9. Invoice OCR shows a clear missing-key or OCR result depending on `GEMINI_API_KEY`.

## 6. Common issues

### Workbox 2 MiB precache error

Already mitigated by setting Workbox maximum precache size to 5 MiB. If the bundle grows again, prefer code-splitting before raising the limit further.

### Supabase service key missing

Cron/notifications/affiliate backend will return configuration errors. Configure service role key server-side only.

### Facebook token missing

Facebook routes should return a clear disconnected response.

### AI key missing

Invoice OCR and AI-generated game questions will not produce real AI output. Use manual content entry for QA.

## 7. Merge/deploy rule

Do not deploy to production until:

- CI is green.
- Supabase migrations are applied.
- AgentOps quick actions above are manually tested.
- Secrets are configured on the target environment.
