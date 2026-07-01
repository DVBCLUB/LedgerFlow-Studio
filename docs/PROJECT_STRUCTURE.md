# LedgerFlow Studio Project Structure

LedgerFlow Studio is organized as a desktop-first React + Express + Electron application. Electron is the only user-facing app target; React and Express remain as the shared renderer/API runtime loaded by the desktop shell.

For AI coding agents (Gemini, ChatGPT, Claude Code, Copilot), read `CODEMAP.md` first for exact file placement and direct GitHub coding workflow.

## Top-level folders

```text
.
├── .github/                 # GitHub Actions workflows and repository automation
├── assets/                  # Static design/source assets
├── build/                   # Desktop build resources, especially generated icon.ico
├── desktop/                 # Electron desktop shell
├── docs/                    # Architecture and operating documentation
├── public/                  # Static HTML/pages/assets served by Express/Vite
├── runtime/                 # Local runtime-generated JSON/log/vault files (gitignored, keeps root clean)
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
| Local developer runtime | `npm run dev` → `server.ts` |
| Production server | `npm run build` then `npm start` → `dist/server.cjs` |
| Desktop | `desktop/main.cjs` loads the production app |
| Windows direct app build | `tools/windows/BUILD_WINDOWS_INSTALLER.bat` / `npm run desktop:dist` |
| Windows user download | GitHub Actions artifact `LedgerFlow-Hub-Windows-Download` |

The local server is not a separate product edition. It exists so the Windows app can run one internal API/UI runtime and so developers can test changes.

## Local API authentication

- `/api/health` and the login/session endpoints are public; all other `/api` routes require authentication.
- Browser and desktop clients authenticate with an `HttpOnly`, `SameSite=Strict` session cookie.
- Desktop and development may use the visible `admin123` fallback for initial setup. Hosted production must configure `LOCAL_AUTH_DEV_PASSWORD`.
- Trusted automation clients that cannot keep a browser cookie may send `Authorization: Bearer <LEDGERFLOW_API_TOKEN>` when that server-side token is configured.
- Desktop runtime binds its embedded Express server to `127.0.0.1`. Hosted deployments can set `HOST` explicitly.
- Local database saves are serialized, written through a temporary file, and retain `db_storage.json.bak` after replacing existing data.

## Frontend organization

```text
src/
├── app/                     # Company OS shell, navigation registry, workspace renderer
├── components/              # Shared/global launcher bridges, UI elements, layouts (e.g. FounderLabsDock)
│   └── agent-ops/           # AgentOpsHub shell, hooks, helpers, and tabs
├── context/                 # Cross-app React providers such as local auth
├── modules/                 # Domain-driven company OS modules
│   ├── command-center/      # CommandCenter dashboard and top-level entry workspaces
│   ├── product-studio/      # Game libraries, ML workbench, learning roadmaps, strategy games
│   ├── marketing-growth/    # SEO tools, synthetic surveys, landing copy labs, email sequences
│   ├── sales-crm/           # Pricing labs, NPS, affiliate hubs, outbound sales leads
│   ├── ai-hr/               # AI assistants, AI settings wizards, key security panels
│   ├── analytics-sandbox/   # Python sandbox, case banks, automation blueprint planners
│   └── finance-accounting/  # Revenue metrics, Vietnam VAS accounting, budgets, founder standups
├── types/                   # Shared frontend TypeScript type sources
│   └── agentOps.ts          # Single source for AgentOps records/status/risk types
├── utils/                   # Frontend API clients and shared helpers
└── main.tsx                 # React mount point; loads app/ErpApp.tsx
```

Important frontend patterns:

- `src/app/ErpApp.tsx` owns the shell; `WorkspaceRenderer.tsx` owns lazy workspace loading.
- Add navigation metadata in `src/app/companyNavigation.ts` instead of duplicating sidebar definitions.
- Product Studio, Marketing & Growth, and Sales & CRM are separate first-level sidebar workspaces; keep the old `operations` route as legacy compatibility only.
- Large feature overlays use `*Launcher.tsx` when they must be mounted outside the workspace renderer.
- API calls should be wrapped in `src/utils/*Api.ts` instead of being scattered across components.
- New connector panels should be composed into `IntegrationHub.tsx` or mounted as a launcher if they are large.
- Agent / AI Ops / Approval UI belongs under `src/components/agent-ops/`; shared AgentOps records belong in `src/types/agentOps.ts`.

## AgentOpsHub organization

```text
src/components/agent-ops/
├── AgentOpsHub.tsx          # Agent / AI Ops / Approval hub shell with tab navigation
├── AgentOpsHubLauncher.tsx  # Hash-route launcher for old AgentOps routes
├── OpsToolsLauncher.tsx     # Auxiliary ops panels that are outside AgentOps consolidation scope
├── storage.ts               # localStorage merge/read helpers and tab refresh hook
├── useApprovalGateSync.ts   # Approval bridge logic formerly split across approval bridge components
├── useConnectorPolicySync.ts# Connector policy bridge logic formerly split from connector registry
├── useFastReviewRouting.ts  # Fast Review routing bridge logic as a hook
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

Legacy bridge/component behavior should stay as hooks or utilities in `src/components/agent-ops/`, not as new floating overlay components. Before adding a new AgentOps file, check whether it belongs in a tab, a hook, or `src/types/agentOps.ts`.

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

`tools/windows/BUILD_WINDOWS_INSTALLER.bat` is for developers who want to build the Windows app folder locally. It produces `release/win-unpacked/LedgerFlow Hub.exe`; LedgerFlow no longer ships a separate setup installer or portable root artifact.

## Scripts organization

Scripts in `scripts/` are intentionally kept as `.mjs` Node scripts for cross-platform compatibility.

| Script group | Examples |
|---|---|
| Doctors/checks | `doctor.mjs`, `ai-doctor.mjs`, `check-*.mjs` |
| Desktop resources | `prepare-desktop-icons.mjs` |
| Release helpers | `write-build-manifest.mjs`, `finalize-release.mjs` |
| Maintenance | `clean.mjs` |

Avoid adding shell-only logic to `package.json`; prefer Node scripts so Windows/GitHub Actions/local machines behave consistently.

`scripts/check-codemap-discipline.mjs` is a lightweight guard for AI-assisted GitHub edits. It warns/errors when changes violate CODEMAP placement heuristics (for example heavy `server.ts` edits without `server/services/` changes).

## User download package

The source-code zip from GitHub is not the Windows app. A user-ready Windows package is created by the `Build Windows Desktop` workflow and uploaded as:

```text
LedgerFlow-Hub-Windows-Download
```

That artifact contains:

```text
win-unpacked/LedgerFlow Hub.exe
START_HERE.txt
```

A user should download that artifact, unzip it, and run `LedgerFlow Hub.exe` inside `win-unpacked`.

## Local ignored files

These files are intentionally local-only:

```text
.env
.env.litellm
runtime/.ledgerflow_secret
runtime/ai_keys.vault.json
runtime/ai_usage.log.json
runtime/.ai_vault_session.json
agent_role_prompts.json
runtime/ai_prompt_registry.json
runtime/integration_registry.json
runtime/integration_events.log.json
runtime/ledgerflow_audit.log.json
company_os_control_plane.json
web_ai_profiles.json
db_storage.json
release/
dist/
node_modules/
.chrome_profiles/
.local-cleanup/
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
