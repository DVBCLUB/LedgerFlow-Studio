# AI Workforce Runtime BRIEF4 Operator Runbook

## 1) Scope
This runbook covers daily operations for BRIEF4 runtime controls:
- Mission queue drift monitoring and repair
- Browser fallback diagnostics and cooldown handling
- Gateway health snapshot verification

## 2) Pre-check
Run these from project root:

```bash
npm run lint
npm run check:runtime
```

Expected result:
- CI safety gate passes
- Runtime smoke contracts pass

## 3) Drift Monitoring and Repair
### Check drift report
- Endpoint: GET /api/ai-workforce/mission-execution-queue/drift
- Purpose: compare linked mission queue state with AgentRun runtime source.

Interpretation:
- issueCount = 0: healthy
- criticalIssues > 0: immediate operator action required

### Repair drift
- Endpoint: POST /api/ai-workforce/mission-execution-queue/drift/repair
- Purpose: auto-repair known drift patterns and persist corrected links/snapshots.

Operator workflow:
1. Trigger drift check.
2. If critical issues exist, run repair endpoint once.
3. Re-run drift check.
4. If still critical, pause mission execution and escalate with logs/snapshot IDs.

## 4) Browser Fallback Operations
### Policy
Browser mode is fallback-only by default.
Operator must confirm API fallback exhaustion before starting browser run.

### Diagnostics
- Endpoint: GET /api/company-os/browser-sandbox/diagnostics
- Signals:
  - failures
  - reason
  - cooldownActive
  - disabledUntil

### Operator response
1. If cooldownActive is true: do not force retry.
2. Wait until disabledUntil, then rerun with controlled scope.
3. If repeated captcha/login challenge failures occur, switch to API route or rotate task timing/profile.

## 5) Gateway Health Snapshot
- Endpoint: GET /api/gateway/health
- Expected payload:
  - providers: live health snapshot
  - stats: live gateway stats snapshot

Operator response:
1. If preferred provider fails repeatedly, verify vault keys and provider reachability.
2. Confirm fallback path still routes through allowed providers/models.
3. Record incident in runtime log with provider/model and timestamp.

## 6) Incident Triggers
Escalate immediately when:
- Drift repair does not clear critical issues.
- Browser cooldown repeatedly re-triggers for the same host.
- Gateway snapshot shows sustained provider unavailability across fallback candidates.

## 7) Post-Incident Verification
Run:

```bash
npm run check:runtime
```

Then verify:
- Runtime dashboard loads
- Drift issue count trends down or zero
- Browser diagnostics no longer in active cooldown for affected host
