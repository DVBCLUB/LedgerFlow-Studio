# n8n, Telegram, and OpenClaw Contracts

## Event-Driven Rule

Agents never call each other directly. Every external entrypoint writes one of:

- `lf_agent_events`
- `lf_agent_tasks`
- `lf_tool_runs`

n8n reads new rows or receives route responses, then decides the next workflow branch.

## n8n Workflow Skeletons

### Daily Founder Brief

1. Cron trigger at 08:00.
2. HTTP POST `/api/company-os/n8n/webhook` with `createTask: true`.
3. Query Supabase for open tasks, waiting approvals, and yesterday revenue.
4. Call `/api/pipelines/start` with `pipelineType: daily_brief`.
5. Send Telegram summary draft.
6. Write final event `daily_brief.sent`.

### OpenClaw Safe Browser QA

1. n8n receives QA request.
2. HTTP POST `/api/company-os/openclaw/simulate` with `action: browser_check`.
3. If response `approvalRequired = true`, create Approval Gate row.
4. Founder marks the related task `ready`, `done`, or `blocked` through `PATCH /api/company-os/tasks/:id`.
5. Only after founder approval, hand off to a future sandbox connector.

### Lead Follow-Up

1. Telegram `/task Follow up lead...`.
2. LedgerFlow creates `lf_agent_tasks` row.
3. n8n routes to AI Sales pipeline.
4. Draft reply is sent back to Telegram for founder approval.

### Task Approval Loop

1. Any connector creates a task in `waiting_approval`.
2. Founder reviews the task in AgentOps Control Plane.
3. Dashboard calls `PATCH /api/company-os/tasks/:id`.
4. LedgerFlow writes `task.status_updated` to the audit event log.
5. n8n only advances tasks with `status = ready`.

### Audit Export

1. Founder clicks `Export audit JSON` in AgentOps Control Plane.
2. Dashboard calls `GET /api/company-os/audit/export?limit=500`.
3. LedgerFlow returns tasks, tool runs, and events with schema `ledgerflow_company_os_audit_v1`.
4. The JSON file can be attached to release notes, QA evidence, or an AI handoff prompt.

## OpenClaw Least-Privilege Model

OpenClaw is treated as a connector, not as a trusted root agent.

The backend tool registry is the source of truth for permission, risk, approval, timeout, retry, and execution mode. It is exposed in `GET /api/company-os/control-plane/status` under `contracts.tools`.

Pipeline state is written to the ignored local `agent_pipelines.local.json` store before optional Supabase synchronization. Approval resumes must include the current `stepId`, the returned SHA-256 `fingerprint`, and the exact phrase `APPROVE PIPELINE STEP`; approval for an older output cannot resume a changed step.

Tool execution uses a three-call lifecycle: `POST /api/company-os/tools/preview`, `POST /api/company-os/tools/approve` when required, then `POST /api/company-os/tools/execute`. Approval tokens expire after two minutes, are bound to the preview fingerprint, and are consumed once. P1 execution remains simulation-only; sandbox and connector writes are not opened by these routes.

Cron and manual scheduled work is persisted in the ignored `agent_jobs.local.json` queue before execution. Workers claim jobs with a 60-second lease, retry failures with exponential backoff, and move exhausted jobs to `dead_letter`. Inspect counts and recent jobs with `GET /api/cron/queue`; restarting the desktop app resumes due queued/retry jobs.

Founder recovery uses `PATCH /api/cron/queue/:id` with action `retry` or `cancel`. Only dead-letter jobs can be retried; only queued/retry/dead-letter jobs can be cancelled, and running leases cannot be interrupted. `POST /api/cron/queue/prune` removes terminal history older than the retention window while preserving all active work.

P0 capabilities:

- simulate a plan;
- simulate a browser check;
- draft a patch description;
- write audit rows.

Blocked by default:

- real shell execution;
- real file writes;
- direct browser control;
- reading arbitrary folders;
- sending Telegram messages;
- changing Supabase schema.

## Telegram Bot Commands

- `/task <text>`: create task.
- `/approve <text>`: log high-risk approval event only.
- `/status`: should call `/api/company-os/control-plane/status`.

Keep bot token only in n8n credentials or backend env. Never store it in frontend code.
