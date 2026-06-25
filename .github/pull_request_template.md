## Summary

- 

## Why

- 

## User impact

- 

## Validation

```text
- npm run lint: <pass/fail/not run + reason>
- npm test: <pass/fail/not run + reason>
- npm run build: <pass/fail/not run + reason>
- Windows desktop package: <pass/fail/not run + reason>
```

## Risk and rollback

- Risk level: P0 / P1 / P2 / low
- Rollback plan:

## Security and data checklist

- [ ] No hardcoded API keys, passwords, tokens, or private URLs.
- [ ] No local user data, logs, generated artifacts, or `.env` secrets committed.
- [ ] Secrets and sensitive fields are redacted from logs/diagnostics.
- [ ] Persistence, migration, auth, connector, or import changes include rollback notes.
- [ ] Spreadsheet/document import changes enforce size/type/timeout limits.

## Scope guardrails

- [ ] Existing routes/module IDs are preserved or migration is documented.
- [ ] No paid dependency added without a tracked decision.
- [ ] Changes are additive or clearly reversible.
- [ ] P0 CI/security issues are not bypassed.

## Related issues

Closes #
