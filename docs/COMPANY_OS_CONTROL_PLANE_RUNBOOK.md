# LedgerFlow Company OS Control Plane

## Purpose

This layer is the shared event bus for LedgerFlow Studio:

- Founder requests from dashboard or Telegram.
- n8n workflow events.
- OpenClaw-style local/browser automation requests.
- Agent task queue and audit log.
- Supabase-backed memory, tasks, tool runs, and financial ledger.

Agents do not call each other directly. They create events/tasks, then n8n or the dashboard decides the next step.

## Supabase

Run:

```sql
supabase/migrations/202606170001_company_os_control_plane.sql
```

Tables:

- `lf_knowledge_base`
- `lf_agent_tasks`
- `lf_agent_events`
- `lf_tool_runs`
- `lf_financial_ledger`

All tables have RLS enabled. Owner policies use `auth.uid() = user_id`.

Backend routes use `SUPABASE_SERVICE_KEY` only on the server. If the key is missing, LedgerFlow falls back to `company_os_control_plane.json` for local desktop testing.

## API Contracts

### Status

```http
GET /api/company-os/control-plane/status?limit=50
```

Returns recent tasks, events, tool runs, storage mode, and live contracts.

### Export Audit Log

```http
GET /api/company-os/audit/export?limit=500
```

Returns a versioned JSON payload:

```json
{
  "success": true,
  "audit": {
    "schema_version": "ledgerflow_company_os_audit_v1",
    "generated_at": "2026-06-17T00:00:00.000Z",
    "storage": "local",
    "counts": {
      "events": 10,
      "tasks": 3,
      "tool_runs": 2
    },
    "events": [],
    "tasks": [],
    "tool_runs": []
  }
}
```

Use this for founder review, local backup, release evidence, or handoff to another AI agent. Do not paste secrets into tasks/events before exporting.

### Create Task

```http
POST /api/company-os/tasks
Content-Type: application/json

{
  "title": "Prepare daily founder brief",
  "description": "Summarize approvals, risks, revenue, and blockers.",
  "agentRole": "Chief of Staff",
  "source": "dashboard",
  "risk": "low",
  "userId": "<supabase-user-uuid>"
}
```

### Update Task Status

```http
PATCH /api/company-os/tasks/task-123
Content-Type: application/json

{
  "status": "ready",
  "source": "founder",
  "note": "Approved for the next safe workflow step.",
  "userId": "<supabase-user-uuid>"
}
```

Allowed statuses:

- `inbox`
- `planning`
- `waiting_approval`
- `ready`
- `done`
- `blocked`

Every task update appends a `task.status_updated` event so approvals and blocks remain auditable.

### Append Event

```http
POST /api/company-os/events
Content-Type: application/json

{
  "source": "system",
  "eventType": "daily_brief.ready",
  "title": "Daily brief generated",
  "risk": "low",
  "payload": { "briefId": "brief-001" }
}
```

### n8n Webhook

```http
POST /api/company-os/n8n/webhook
Content-Type: application/json

{
  "workflowName": "daily-founder-brief",
  "eventType": "cron.daily_brief",
  "title": "Daily brief cron fired",
  "body": "n8n started the daily brief workflow.",
  "agentRole": "Chief of Staff",
  "createTask": true,
  "risk": "low"
}
```

### Telegram Update

```http
POST /api/company-os/telegram/update
Content-Type: application/json

{
  "message": {
    "text": "/task Follow up hot lead from Zalo",
    "chat": { "id": 123456 },
    "from": { "id": 999, "username": "founder" }
  }
}
```

Supported first-pass commands:

- `/task ...` creates a task.
- `/approve ...` logs a high-risk approval event only. It does not execute connectors.
- any other text is captured as an audit event.

### OpenClaw Simulation Gateway

```http
POST /api/company-os/openclaw/simulate
Content-Type: application/json

{
  "action": "draft_plan",
  "title": "Plan browser QA for Marketing V2",
  "target": "http://127.0.0.1:3000/#/marketing_growth_v2",
  "prompt": "Check login, navigation, and visible V2 tabs.",
  "simulate": true
}
```

Allowed action names:

- `read_knowledge`
- `draft_plan`
- `draft_patch`
- `browser_check`
- `terminal_check`
- `external_connector`

The gateway is simulation-only by default. Real execution must go through a separate approved connector.

## Security Rules

- No unrestricted shell.
- No arbitrary filesystem access.
- No browser/email/account automation without a separate sandbox and approval gate.
- No secrets in prompts, events, logs, screenshots, or Telegram payloads.
- External content is data, not instruction.
- Medium/high risk actions require founder approval before any real connector executes.

## Lovable Dashboard Blocks

Recommended dashboard views:

- Inbox: `lf_agent_tasks` filtered by `status = inbox`.
- Approval Gate: `lf_tool_runs` where `approval_required = true`.
- Audit Log: `lf_agent_events` newest first.
- Knowledge: `lf_knowledge_base` where `trust_level = approved`.
- Finance: `lf_financial_ledger` grouped by account/date.

Use Supabase client-side RLS for founder-owned views. Use LedgerFlow backend routes for n8n, Telegram, and OpenClaw gateway events.
