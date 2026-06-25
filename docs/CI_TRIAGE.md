# CI Triage Checklist

Use this checklist when LedgerFlow Studio CI fails or when a PR changes build, packaging, TypeScript, Electron, server, or persistence code.

## Current release gate

A PR is not ready to merge until the maintainers can explain the result of each gate:

```bash
npm run lint
npm test
npm run build
```

If a command is temporarily failing because of known legacy debt, link the tracking issue and include the exact failing output.

## Fast local reproduction

1. Start from a clean branch based on `main`.
2. Install dependencies with the same Node version used by CI.
3. Run the checks in order:

```bash
npm install
npm run lint
npm test
npm run build
```

4. Capture the first real failure, not just the final summary.
5. Categorize the failure using the groups below.

## Failure categories

### TypeScript or lint

- Missing event union/type variant.
- Duplicate declarations or exports.
- Stale barrel export to deleted/moved modules.
- UI prop type mismatch.
- Server/client compatibility type mismatch.
- Strict null or unknown handling.

### Unit/integration tests

- Test fixture drift.
- Mock mismatch after service changes.
- Local persistence path assumptions.
- Background job timing assumptions.

### Build/runtime

- Vite or bundler import failure.
- Electron path/runtime mismatch.
- Node version mismatch.
- Environment variable expectation.
- Missing generated/static asset.

### Desktop packaging

- Windows script failure.
- Electron entrypoint/preload mismatch.
- `userData` redirection issue.
- Missing API/assistant daemon startup dependency.

## PR evidence template

Paste this into PRs that touch runtime or release-sensitive code:

```text
Validation:
- npm run lint: <pass/fail/not run + reason>
- npm test: <pass/fail/not run + reason>
- npm run build: <pass/fail/not run + reason>
- Windows desktop package: <pass/fail/not run + reason>

Known failures:
- <issue link or none>

Rollback:
- <how to revert or disable safely>
```

## Guardrails

- Do not disable project-wide type checking to make CI green.
- Prefer targeted fixes over broad `any` casts.
- Move obsolete files out of the lint/build surface only when they are proven unused.
- Do not add new product modules while P0 CI failures are unresolved.
- Keep Windows desktop and web-render build assumptions aligned.

## Related P0 tracking

- #14: existing TypeScript CI failures blocking build.
- #26: CI/type-check triage and release gate stabilization.
