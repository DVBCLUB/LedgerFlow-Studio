---
name: Hardening task
description: Track security, CI, release, observability, or data-safety hardening
title: "Hardening: "
labels: ["hardening", "triage"]
---

## Goal


## Priority

- [ ] P0: build/security/data/release blocker
- [ ] P1: important platform hardening
- [ ] P2: improvement or follow-up

## Scope

- 

## Guardrails

- [ ] No hardcoded secrets.
- [ ] No paid dependency unless explicitly approved.
- [ ] No local user data, logs, generated artifacts, or `.env` files committed.
- [ ] Offline-first Windows desktop behavior preserved.
- [ ] Rollback/migration notes included when data paths or auth behavior change.

## Acceptance criteria

- [ ] 

## Validation evidence

```text
- npm run lint:
- npm test:
- npm run build:
- Windows desktop package:
```

## Related issues or PRs

- 
