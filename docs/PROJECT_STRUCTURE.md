# LedgerFlow Studio Project Structure

LedgerFlow Studio is organized as a hybrid React + Express + Electron application. The product direction is to become a company operating hub: accounting workflows, AI Gateway, Integration Hub, development handoff, and local automation.

## Top-level folders

```text
.
├── .github/                 # GitHub Actions workflows and repository automation
├── assets/                  # Static design/source assets
├── build/                   # Desktop build resources, especially generated icon.ico
├── desktop/                 # Electron desktop shell
├── docs/                    # Architecture and operating documentation
├── public/                  # Static HTML/pages/assets served by Express/Vite
├── scripts/                 # Build checks, doctors, release utilities
├── server/                  # Backend services used by server.ts
├── src/                     # React frontend application
├── tools/                   # Local helper utilities and future tool adapters
├── server.ts                # Express API server + Vite middleware
├── package.json             # Scripts, dependencies, Electron Builder config
└── BUILD_WINDOWS_INSTALLER.bat
```

## Runtime entrypoints

| Runtime | Entry |
|---|---|
| Local web/dev | `npm run dev` → `server.ts` |
| Production server | `npm run build` then `npm start` → `dist/server.cjs` |
| Desktop | `desktop/main.cjs` loads the production app |
| Windows installer | `BUILD_WINDOWS_INSTALLER.bat` / `npm run desktop:dist` |

## Frontend organization

```text
src/
├── components/              # Main React feature components and launchers
├── utils/                   # Frontend API clients and shared helpers
├── App.tsx                  # Main application shell
└── main.tsx                 # React mount point + overlay launchers
```

Important frontend patterns:

- Large feature overlays use `*Launcher.tsx` so they can be mounted without rewriting `App.tsx`.
- API calls should be wrapped in `src/utils/*Api.ts` instead of being scattered across components.
- New connector panels should be composed into `IntegrationHub.tsx` or mounted as a launcher if they are large.

## Backend organization

```text
server/
└── services/
    ├── ai*.ts               # AI Gateway, vault, router, doctor, logs
    ├── githubConnector.ts   # GitHub repo/issues/Actions connector
    ├── integrationRegistry.ts
    └── localToolConnector.ts
```

Important backend patterns:

- `server.ts` exposes API routes and wires services together.
- Business logic belongs in `server/services/`, not directly inside route handlers when it grows.
- Connectors should be safe by default: status/read/test first, write actions only when explicitly requested.

## Documentation organization

```text
docs/
├── AI_GATEWAY.md            # AI key manager, vault, fallback, diagnostics
├── CI_DOCTOR.md             # GitHub Actions failure analyzer workflow
├── INTEGRATION_HUB.md       # Connector architecture and registry
├── PROJECT_STRUCTURE.md     # This map
└── ...                      # Future module docs
```

Suggested future docs:

```text
docs/modules/accounting.md
docs/modules/document-vault.md
docs/modules/google-workspace.md
docs/modules/import-export.md
docs/runbooks/windows-desktop-build.md
docs/runbooks/runtime-testing.md
```

## Scripts organization

Scripts in `scripts/` are intentionally kept as `.mjs` Node scripts for cross-platform compatibility.

| Script group | Examples |
|---|---|
| Doctors/checks | `doctor.mjs`, `ai-doctor.mjs`, `check-*.mjs` |
| Desktop resources | `prepare-desktop-icons.mjs` |
| Release helpers | `write-build-manifest.mjs`, `write-release-notes.mjs` |
| Maintenance | `clean.mjs` |

Avoid adding shell-only logic to `package.json`; prefer Node scripts so Windows/GitHub Actions/local machines behave consistently.

## Local ignored files

These files are intentionally local-only:

```text
.env
.env.litellm
.ledgerflow_secret
ai_keys.vault.json
ai_usage.log.json
.ai_vault_session.json
integration_registry.json
integration_events.log.json
release/
dist/
node_modules/
```

## Recommended module boundaries

When adding a new platform connector, use this structure:

```text
server/services/<platform>Connector.ts
src/utils/<platform>Api.ts
src/components/<Platform>ConnectorPanel.tsx
docs/<PLATFORM>_CONNECTOR.md
```

When adding a new control overlay:

```text
src/components/<Feature>.tsx
src/components/<Feature>Launcher.tsx
src/main.tsx                  # mount launcher only
```

When adding a new business module:

```text
src/components/<BusinessModule>.tsx
src/utils/<businessModule>Api.ts
server/services/<businessModule>Service.ts
docs/modules/<business-module>.md
```

## Stabilization checklist

Before large new features:

```bash
npm run lint
npm run build
npm run ai:doctor
npm run check:desktop
```

For Windows package changes:

```bash
npm run prepare:icons
npm run desktop:dist
```
