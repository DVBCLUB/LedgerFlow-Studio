# Security Policy

LedgerFlow Studio is a desktop-first company OS. Security changes should preserve the local-first model, avoid hardcoded secrets, and make risky operations explicit and auditable.

## Supported versions

Until the project starts publishing tagged releases, security fixes target the `main` branch only.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Older untagged snapshots | No |

## Reporting a vulnerability

Please do not open public issues for exploitable security vulnerabilities.

Report privately to the repository owner/maintainer first. Include:

- Affected area or file path.
- Reproduction steps.
- Impact and expected attacker capability.
- Whether secrets, local data, imports, AI keys, connector tokens, or desktop runtime files are involved.
- Any safe proof-of-concept details that do not expose real credentials or user data.

## Security guardrails

- No default production credentials in source code, docs, fixtures, or screenshots.
- No hardcoded API keys, tokens, passwords, or private endpoints.
- First-run auth setup must require the user to choose credentials.
- Secrets must be redacted from logs, audit events, crash reports, and diagnostics exports.
- Connector write actions must be approval-first and audit-first.
- Spreadsheet and document imports must enforce file size, row/sheet, type, and timeout limits.
- Dependency upgrades must be reviewed for supply-chain risk before release.
- Desktop logs and local user data must never be committed.

## High-risk areas

Treat changes to these areas as security-sensitive:

- Local authentication and session handling.
- AI Gateway/API key storage.
- Connector credentials and write actions.
- Spreadsheet/document import parsing.
- Electron desktop startup, preload, IPC, and local API routes.
- Persistence, migration, backup, export, and diagnostic collection.

## Disclosure and remediation flow

1. Confirm the report and scope.
2. Reproduce without exposing real user data.
3. Patch on a private or clearly labeled hardening branch.
4. Add regression coverage where feasible.
5. Document user-facing mitigation or migration steps.
6. Release with rollback notes when desktop data paths or auth behavior change.
