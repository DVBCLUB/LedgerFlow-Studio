# BRIEF4 Deploy and Rollback Checklist

## Deploy Checklist
1. Pull latest main and verify target commit hash.
2. Run validation:

```bash
npm run lint
npm run check:runtime
```

3. Confirm these runtime endpoints are healthy:
- /api/gateway/health
- /api/ai-workforce/runtime
- /api/ai-workforce/mission-execution-queue/drift
- /api/company-os/browser-sandbox/diagnostics

4. Confirm frontend panels load:
- AI Workforce Runtime panel (drift actions visible)
- Web AI Sync panel (fallback confirmation + diagnostics visible)

5. Confirm no secrets were introduced in tracked files.
6. Deploy to target environment.
7. Run post-deploy smoke checks against deployed URLs.

## Go/No-Go Criteria
Go only if all are true:
- lint and runtime checks pass
- gateway health returns live providers/stats
- drift endpoint responds and does not show unresolved critical trend
- browser diagnostics endpoint responds

## Rollback Triggers
Rollback when any of these happens after deploy:
- runtime contracts fail consistently
- mission queue drift critical issues increase and repair cannot stabilize
- browser mode cooldown/failure loops block operational workflows
- gateway live snapshot unavailable or structurally invalid

## Rollback Procedure
1. Identify last known good commit.
2. Re-deploy last known good commit.
3. Re-run smoke checks:

```bash
npm run check:runtime
```

4. Validate core endpoints and UI panels again.
5. Publish incident note with:
- trigger condition
- affected endpoints
- rollback commit hash
- next remediation owner

## Release Evidence
Capture and store:
- check:runtime output
- gateway health sample payload
- drift report before/after repair (if any)
- browser diagnostics snapshot
