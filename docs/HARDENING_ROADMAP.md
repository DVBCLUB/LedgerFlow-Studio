# LedgerFlow Studio Hardening Roadmap

This roadmap converts the broad product assessment into an execution sequence that protects release quality before larger feature expansion.

## Principles

- CI green before feature expansion.
- Security-first for auth, AI keys, connectors, imports, and desktop runtime.
- Offline-first Windows desktop remains the default user experience.
- Changes should be additive, reviewable, and easy to roll back.
- Runtime logs, local user data, generated artifacts, and secrets must stay out of git.

## P0: Stabilize and protect

1. Clear TypeScript/lint failures tracked in #14.
2. Use `docs/CI_TRIAGE.md` as the release gate checklist.
3. Remove any default local-auth credentials and require first-run credential setup.
4. Harden spreadsheet import paths and mitigate or replace risky `xlsx` usage.
5. Keep Windows desktop packaging and web-render build assumptions aligned.
6. Add repository governance baseline: security policy, contribution guide, issue templates, PR template, and Dependabot.

## P1: Platform foundations

1. Add repository interfaces for local persistence before a SQLite migration.
2. Standardize structured logs, audit events, redaction, and diagnostics export.
3. Harden Integration Hub health states, event timeline, and permission matrix.
4. Build GitHub connector phases with approval-first write actions.
5. Keep Knowledge/RAG local/offline-first before introducing a hosted vector database.

## P2: Product expansion

1. Expand Growth Studio campaign learnings.
2. Expand Sales CRM pipeline evidence.
3. Improve Documents & Approval workflows.
4. Add Analytics Sandbox depth.
5. Build Secrets Vault as a governed capability, not just a settings screen.

## Review checklist for each phase

- Is there a tracked issue with scope and acceptance criteria?
- Does the PR include validation evidence?
- Does the change preserve offline-first desktop behavior?
- Does the change avoid hardcoded secrets and paid dependencies?
- Does the change include rollback notes when user data, auth, or desktop packaging are touched?

## Related tracking

- #4: company OS hardening roadmap.
- #14: current TypeScript CI failures.
- #25: governance and security baseline.
- #26: CI/type-check triage and release gate.
- #27: spreadsheet import dependency hardening.
- #28: local persistence repository layer and SQLite migration plan.
- #29: observability and audit trail baseline.
