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
├── tools/                   # Local helper utilities and platform-specific tools
├── server.ts                # Express API server + Vite middleware
└── package.json             # Scripts, dependencies, Electron Builder config
```

Root should stay lean. Keep only files that must be at the project root for Node, Vite, TypeScript, GitHub, or developer onboarding.

## Runtime entrypoints

| Runtime | Entry |
|---|---|
| Local web/dev | `npm run dev` → `server.ts` |
| Production server | `npm run build` then `npm start` → `dist/server.cjs` |
| Desktop | `desktop/main.cjs` loads the production app |
| Windows installer local build | `tools/windows/BUILD_WINDOWS_INSTALLER.bat` / `npm run desktop:dist` |
| Windows user download | GitHub Actions artifact `LedgerFlow-Hub-Windows-Download` |

## Frontend organization

```text
src/
├── components/              # Main React feature components and launchers
│   └── agent-ops/           # AgentOpsHub shell, launcher, and tabs
├── types/                   # Shared frontend TypeScript type sources
│   └── agentOps.ts          # Single source for AgentOps records/status/risk types
├── utils/                   # Frontend API clients and shared helpers
├── App.tsx                  # Main application shell
└── main.tsx                 # React mount point + overlay launchers
```

Important frontend patterns:

- Large feature overlays use `*Launcher.tsx` so they can be mounted without rewriting `App.tsx`.
- API calls should be wrapped in `src/utils/*Api.ts` instead of being scattered across components.
- New connector panels should be composed into `IntegrationHub.tsx` or mounted as a launcher if they are large.
- Agent / AI Ops / Approval UI belongs under `src/components/agent-ops/`; shared AgentOps records belong in `src/types/agentOps.ts`.

## AgentOpsHub organization

```text
src/components/agent-ops/
├── AgentOpsHub.tsx          # Agent / AI Ops / Approval hub shell with tab navigation
├── AgentOpsHubLauncher.tsx  # Hash-route launcher for old AgentOps routes
├── OpsToolsLauncher.tsx     # Auxiliary ops panels that are outside AgentOps consolidation scope
└── tabs/
    ├── WorkboardTab.tsx
    ├── RunTab.tsx
    ├── SkillsTab.tsx
    ├── PeopleTab.tsx
    ├── GateTab.tsx
    ├── ConnectorsTab.tsx
    └── ReviewModeTab.tsx
```

`src/types/agentOps.ts` is the single source of truth for shared AgentOps entities such as `WorkCard`, `SessionStep`, `AgentSkill`, `ApprovalRequest`, `ConnectorDefinition`, and `PatchItem`. Do not redefine duplicate status/risk/session types inside future AgentOps UI components.

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
├── AGENTOPS_HUB_CONSOLIDATION.md # AgentOpsHub consolidation note
├── AI_GATEWAY.md                 # AI key manager, vault, fallback, diagnostics
├── CI_DOCTOR.md                  # GitHub Actions failure analyzer workflow
├── INTEGRATION_HUB.md            # Connector architecture and registry
├── PROJECT_STRUCTURE.md          # This map
└── ...                           # Future module docs
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

## Tools organization

```text
tools/
└── windows/
    ├── BUILD_WINDOWS_INSTALLER.bat
    └── README.md
```

`tools/windows/BUILD_WINDOWS_INSTALLER.bat` is for developers who want to build the installer locally. It should not be the primary user download path. End users should download the Windows artifact from GitHub Actions.

## Scripts organization

Scripts in `scripts/` are intentionally kept as `.mjs` Node scripts for cross-platform compatibility.

| Script group | Examples |
|---|---|
| Doctors/checks | `doctor.mjs`, `ai-doctor.mjs`, `check-*.mjs` |
| Desktop resources | `prepare-desktop-icons.mjs` |
| Release helpers | `write-build-manifest.mjs`, `write-release-notes.mjs` |
| Maintenance | `clean.mjs` |

Avoid adding shell-only logic to `package.json`; prefer Node scripts so Windows/GitHub Actions/local machines behave consistently.

## User download package

The source-code zip from GitHub is not the app installer. A user-ready Windows package is created by the `Build Windows Desktop` workflow and uploaded as:

```text
LedgerFlow-Hub-Windows-Download
```

That artifact contains:

```text
*.exe
START_HERE.txt
```

A user should download that artifact, unzip it, and run the `.exe`.

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
