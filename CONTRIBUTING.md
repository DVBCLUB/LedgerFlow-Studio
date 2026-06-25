# Contributing to LedgerFlow Studio

LedgerFlow Studio is a desktop-first application. Keep changes small, reversible, and safe for offline Windows desktop use.

## Development setup

```bash
npm install
npm run dev
```

For Windows desktop packaging, use the scripts under `tools/windows/` as documented in `README.md`.

## Before opening a pull request

Run the strongest checks that currently pass for your branch:

```bash
npm run lint
npm run build
```

When the strict CI gate is being repaired, follow `docs/CI_TRIAGE.md` and attach the relevant output to the PR.

## Branch naming

Use short, descriptive branches:

- `fix/<area>-<problem>`
- `feat/<area>-<capability>`
- `chore/<area>-<task>`
- `docs/<area>-<topic>`

Examples:

- `fix/auth-first-run-setup`
- `chore/ci-triage-baseline`
- `docs/security-policy`

## Pull request expectations

Every PR should include:

- What changed.
- Why it changed.
- User impact.
- Validation evidence.
- Rollback notes when persistence, auth, desktop packaging, or migrations are touched.

## Guardrails

- Do not rewrite `src/App.tsx` unless the PR is explicitly scoped for routing architecture.
- Keep HashRouter routes and existing module IDs stable unless a migration is documented.
- Do not add paid dependencies without a tracked decision.
- Do not hardcode API keys, passwords, tokens, or private URLs.
- Do not commit generated desktop artifacts, local runtime logs, user data, or `.env` secrets.
- Keep large static content in `src/data/*`; UI panels should stay small.
- Prefer additive changes that are easy to revert.

## Security-sensitive changes

Request extra review for changes involving:

- Local auth/session handling.
- AI Gateway or API key storage.
- Connectors and external write actions.
- Spreadsheet/document imports.
- Electron preload/IPC/runtime startup.
- Persistence, backup, migration, export, or diagnostics.

## Issue workflow

Use P0/P1/P2 priorities:

- **P0**: blocks build, security, data safety, release integrity, or core desktop use.
- **P1**: important platform hardening or product capability.
- **P2**: expansion, polish, experiments, or growth features.

Do not start broad feature expansion while P0 CI/type-check or security issues are unresolved.
