# OpenClaw+ Doctor Workflow

LedgerFlow AI Workforce is designed to be OpenClaw-like, but stricter: local agent runtime, mobile command surface, patch review sessions, plugin boundary checks, audit events, and founder approval/rejection gates.

## Recommended local command

```bash
git pull origin main
npm run ai:openclaw-plus:full
```

This runs local AI Workforce patchers, contract checks, rejection governance checks, OpenClaw+ parity checks, readiness report, lint, and build.

## Faster check while developing

```bash
npm run ai:openclaw-plus
```

This skips lint/build but still runs the AI Workforce patcher and the OpenClaw+ checks.

## Check only, without patching

```bash
npm run ai:openclaw-plus:check
```

Use this after you already ran `node scripts/patch-ai-workforce-local.mjs` and want to verify the current working tree.

## GitHub Actions

The `OpenClaw Plus` workflow runs on pull requests, pushes to `main`, and manual dispatch when AI Workforce, plugin, script, docs, package, or workflow files change.

It runs:

```bash
npm ci
node scripts/check-openclaw-plus-package-scripts.mjs
npm run ai:openclaw-plus:check
node scripts/report-openclaw-plus-readiness.mjs
```

The CI job intentionally uses check-only mode so it does not mutate the GitHub Actions working tree. Run the full local doctor before merging larger AI Workforce changes.

## Direct node commands

```bash
node scripts/openclaw-plus-doctor.mjs
node scripts/openclaw-plus-doctor.mjs --full
node scripts/openclaw-plus-doctor.mjs --skip-patch
```

These are equivalent to the npm aliases above.

## Key safety guarantees

- Agent steps can be approved or rejected and are audit logged.
- Telegram supports create, status, advance, approval list, approve, reject, stop, and artifact commands.
- Patch review sessions are review-first and guarded by explicit apply/rollback phrases.
- Draft patch artifacts are review-only manifests and do not write repository files.
- Plugins are evaluated by policy and should pass through the invocation boundary before runtime execution.
- The readiness report shows which OpenClaw+ groups are complete or still missing local patching.

## Expected command sequence if doctor fails

```bash
node scripts/patch-ai-workforce-local.mjs
node scripts/check-ai-workforce-local.mjs
node scripts/check-agent-runtime-rejection.mjs
node scripts/check-openclaw-plus-parity.mjs
node scripts/report-openclaw-plus-readiness.mjs
npm run lint
npm run build
```

If a warning says a daemon or plugin file is not patched yet, rerun the patch command first. Some large files are patched locally instead of being rewritten directly in GitHub to keep the review surface smaller and safer.
