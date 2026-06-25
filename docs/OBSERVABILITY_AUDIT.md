# Observability and Audit Baseline

LedgerFlow Studio is local-first. Observability must help the owner debug safely without sending telemetry to external services by default.

## Goals

- Structured logs for local API, assistant daemon, imports, connectors, auth, AI Gateway, and background jobs.
- Correlation IDs across request/job boundaries.
- User-visible audit events for sensitive state changes.
- Secret redaction by default.
- Diagnostic export that is safe to share with support after review.

## Non-goals

- No automatic telemetry upload.
- No external log vendor dependency.
- No prompt, API key, token, password, workbook, customer data, or local file content in logs.

## Core helper

`server/services/observability.ts` provides:

- `createCorrelationId()`
- `redactSensitive()`
- `logEvent()`
- `auditEvent()`

## Log event shape

```ts
{
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  message: string;
  correlationId: string;
  actorId?: string;
  actorType?: 'user' | 'system' | 'agent' | 'connector';
  module?: string;
  route?: string;
  jobId?: string;
  details?: Record<string, unknown>;
}
```

## Audit categories

- `auth`
- `ai-key`
- `connector-write`
- `automation`
- `job`
- `import`
- `system`

## Audit event shape

```ts
{
  timestamp: string;
  category: AuditCategory;
  action: string;
  result: 'success' | 'failure' | 'blocked' | 'pending';
  correlationId: string;
  actorId?: string;
  actorType?: 'user' | 'system' | 'agent' | 'connector';
  module?: string;
  route?: string;
  jobId?: string;
  target?: string;
  details?: Record<string, unknown>;
}
```

## Redaction rules

Keys containing these words are redacted recursively:

- `apiKey`
- `token`
- `secret`
- `password`
- `credential`
- `authorization`
- `cookie`
- `session`
- `privateKey`

String patterns for bearer tokens, OpenAI-style `sk-...`, and Gemini-style `AIza...` keys are also redacted.

## Required audit points

Add `auditEvent()` when implementing or editing:

- Login, logout, failed login, first-run auth setup.
- AI key add/update/remove/test.
- Connector write actions.
- Automation/job start, success, failure, cancel, retry.
- Spreadsheet/document import success/failure/blocked.
- Data export, backup, restore, migration.

## Diagnostic export policy

Before a diagnostic export is created:

1. Redact sensitive keys and token-like strings.
2. Exclude raw workbook/document/customer data.
3. Include app version, platform, workflow status, recent error summaries, and correlation IDs.
4. Let the user review the diagnostic file before sharing.
