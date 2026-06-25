# Release Gate

Use this checklist before merging changes that affect LedgerFlow Studio release quality.

## Required gates

```bash
npm run lint
npm test
npm run build
```

For desktop-impacting changes, also validate the Windows packaging path documented in `README.md` and `tools/windows/`.

## Gate status

| Gate | Required for | Evidence |
| --- | --- | --- |
| Lint/type-check | Every PR | Command output or CI link |
| Tests | Runtime, data, auth, connectors, imports | Command output or CI link |
| Build | Every PR | Command output or CI link |
| Windows desktop package | Desktop/runtime/packaging changes | Installer or package result |
| Manual smoke test | Routes, modules, startup, emergency controls | Checklist notes |

## Release blockers

Do not release while any of these are unresolved:

- TypeScript/lint failures without a tracked exception.
- Auth flow that ships with default credentials.
- Hardcoded API keys, tokens, passwords, or private URLs.
- Spreadsheet/document import path without file/type/size limits.
- Persistence migration without backup and rollback notes.
- Desktop startup failure or missing assistant daemon dependency.
- Connector write action without approval and audit trail.

## Evidence template

```text
Release gate evidence:
- Branch/commit:
- npm run lint:
- npm test:
- npm run build:
- Windows desktop package:
- Manual smoke test:
- Known exceptions:
- Rollback plan:
```

## Manual smoke test focus

- Main app opens from Windows desktop build.
- AI Gateway opens and does not expose stored keys.
- API health matrix reaches expected local services.
- Primary hub tabs render empty data safely.
- AI/Robot emergency-stop controls remain visible.
- Route failures show panel-level errors, not app-wide crashes.
