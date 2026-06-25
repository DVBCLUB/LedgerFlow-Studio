# P0 Execution Plan

This plan orders the next implementation work after the governance baseline lands.

## Step 1: CI/type-check recovery

Owner issue: #14 and #26

Tasks:

1. Reproduce the current CI failure locally.
2. Fix duplicate declarations/exports first because they can hide downstream type errors.
3. Fix stale barrel exports or remove obsolete exports from the build surface.
4. Fix server event union and compatibility type mismatches.
5. Fix UI prop type mismatches in AI HR and DevOps modules.
6. Re-run lint, tests, and build.

Exit criteria:

- `npm run lint` passes or all remaining failures have scoped tracking issues.
- `npm test` and `npm run build` run after type-check.

## Step 2: Auth hardening

Owner issue: #4 follow-up

Tasks:

1. Inventory auth defaults in source, docs, fixtures, and screenshots.
2. Remove default credentials.
3. Require first-run setup before protected local actions.
4. Redact auth data in logs and diagnostics.
5. Add regression tests for first-run and wrong-password flows.

Exit criteria:

- No source/docs path exposes default login credentials.
- App cannot enter protected flows with bundled defaults.

## Step 3: Spreadsheet import hardening

Owner issue: #27

Tasks:

1. Inventory all `xlsx` usage.
2. Route imports through one parser adapter.
3. Enforce max file size, sheet count, row count, and timeout limits.
4. Fail closed with clear user-facing errors.
5. Add malformed/oversized workbook tests.

Exit criteria:

- Spreadsheet import has documented limits and tests.
- Dependency risk is removed or explicitly mitigated.

## Step 4: Release gate

Owner issue: #26

Tasks:

1. Keep CI output visible by stage.
2. Align Node versions across CI and docs.
3. Attach release gate evidence to PRs.
4. Require desktop smoke notes for desktop-impacting PRs.

Exit criteria:

- Maintainers can decide release readiness from documented evidence.
