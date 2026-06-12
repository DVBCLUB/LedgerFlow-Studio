# LedgerFlow Studio — AI Agent Guide

This repository is being evolved into a lightweight **company operating system**: accounting workflows, project portfolio, AI Gateway, Integration Hub, DevOps handoff, desktop packaging, simulation labs, and local business automation.

Use this file as the first stop for ChatGPT, Claude, Gemini, Copilot, Cursor, or any future AI coding agent.

## Core rule

Do not rebuild the project from scratch. Make small, reviewable changes on top of the current codebase.

## Product direction rule

LedgerFlow is **not only construction accounting**.

Construction/project accounting is only one industry template inside the larger company OS.

Before changing product modules, read:

- `docs/PRODUCT_REFORM_AUDIT.md`
- `docs/COMPANY_OS_TARGET_ARCHITECTURE.md`
- `docs/COMPANY_OS_REFORM_BACKLOG.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/AI_AGENT_PLAYBOOK.md`

Do not hard-code global app language around `công trình`. Use `dự án` or `hồ sơ` generically. Use `công trình` only inside construction-specific templates.

## Project map

| Area | Location | Purpose |
|---|---|---|
| React app | `src/` | Main UI, dashboards, overlays, company OS workspaces |
| Express backend | `server.ts` | API routes, Vite middleware, production server |
| Backend services | `server/services/` | AI Gateway, vault, integration registry, connectors |
| Desktop shell | `desktop/` | Electron entrypoint and desktop wrapper |
| Build/check scripts | `scripts/` | CI guards, icon generation, doctors, release checks |
| Public static pages | `public/` | Standalone HTML tools and static assets |
| Docs | `docs/` | Architecture, usage, connector design, product reform, handoff docs |
| CI workflows | `.github/workflows/` | Web/type-check and Windows desktop build |
| Build resources | `build/` | Desktop icons/resources generated before packaging |
| Tooling | `tools/` | Helper tools, including Windows build helpers |

## Important runtime files that must never be committed

These are local machine files and are intentionally ignored:

- `.env`
- `.env.litellm`
- `.ledgerflow_secret`
- `ai_keys.vault.json`
- `ai_usage.log.json`
- `.ai_vault_session.json`
- `integration_registry.json`
- `integration_events.log.json`

Never expose API keys or secrets in source, docs, logs, screenshots, or generated examples.

## Main modules

### Company OS reform

Files/docs:

- `docs/PRODUCT_REFORM_AUDIT.md`
- `docs/COMPANY_OS_TARGET_ARCHITECTURE.md`
- `docs/COMPANY_OS_REFORM_BACKLOG.md`
- `src/components/CompanyOS.tsx`
- Future target: `src/app/` and `src/modules/`

Rules:

- Home screen should behave like a company command center.
- Navigation should be organized by departments/workspaces, not course stages.
- Simulation, charts, model labs, and sandbox tools are core modules.
- Technical panels belong in System Settings / Dev Tools, not the first user screen.

### AI Gateway

Files:

- `server/services/aiClient.ts`
- `server/services/aiRouter.ts`
- `server/services/aiKeyVault.ts`
- `server/services/aiVaultAutoLock.ts`
- `server/services/aiDoctor.ts`
- `src/components/AISettingsManager.tsx`
- `src/components/AIVaultSecurityPanel.tsx`
- `src/components/AISetupWizard*.tsx`
- `src/utils/aiSettingsApi.ts`

Rules:

- Do not call Gemini/Groq/OpenRouter/Claude directly from the frontend.
- Frontend calls the local backend API.
- Backend routes through AI Gateway / AI Router.
- Preserve fallback, key masking, logs, vault lock, and auto-lock behavior.

### Integration Hub

Files:

- `server/services/integrationRegistry.ts`
- `server/services/githubConnector.ts`
- `server/services/localToolConnector.ts`
- `src/components/IntegrationHub.tsx`
- `src/components/GitHubConnectorPanel.tsx`
- `src/components/LocalToolsPanel.tsx`
- `src/utils/integrationHubApi.ts`

Rules:

- LedgerFlow is a hub, not a clone of external platforms.
- Prefer connector cards, status checks, handoff prompts, and controlled actions.
- Do not run dangerous shell commands automatically.

### DevOps / Handoff / CI Doctor

Files:

- `src/components/DevHandoffCenter.tsx`
- `src/components/DevHandoffLauncher.tsx`
- `src/components/GitHubCIDoctorPanel.tsx`
- `src/components/GitHubCIDoctorLauncher.tsx`
- `docs/CI_DOCTOR.md`

Rules:

- Dev Handoff creates prompts, markdown task files, and GitHub issue drafts.
- CI Doctor reads public GitHub Actions data and uses AI Gateway to analyze failures.
- It should not modify code automatically.

### Desktop packaging

Files:

- `desktop/main.cjs`
- `package.json` build config
- `scripts/prepare-desktop-icons.mjs`
- `scripts/check-desktop-package.mjs`
- `tools/windows/BUILD_WINDOWS_INSTALLER.bat`
- `.github/workflows/build-windows.yml`

Rules:

- Always run `npm run prepare:icons` before desktop packaging.
- Windows icon path must remain `build/icon.ico`.
- Keep `build.win.icon`, `build.nsis.installerIcon`, and `build.nsis.uninstallerIcon` aligned.
- User-facing Windows app downloads should come from GitHub Actions artifact `LedgerFlow-Hub-Windows-Download`, not source code zip.

## Recommended commands

```bash
npm install
npm run lint
npm run build
npm run ai:doctor
npm run desktop:dist
```

For local development:

```bash
npm run dev
```

Open:

- App: `http://127.0.0.1:3000`
- AI Gateway: `http://127.0.0.1:3000/#/ai_settings`
- Integration Hub: `http://127.0.0.1:3000/#/integration_hub`
- Dev Handoff: `http://127.0.0.1:3000/#/dev_handoff`
- CI Doctor: `http://127.0.0.1:3000/#/ci_doctor`

## Change discipline

When adding or editing features:

1. Identify the module first.
2. Edit the smallest set of files.
3. Keep backend secrets server-side only.
4. Do not rename or move files unless imports and docs are updated.
5. Update docs when adding new connector behavior.
6. Run `npm run lint` and `npm run build`.
7. If desktop code changed, run or update `npm run check:desktop` / `npm run desktop:dist`.

## Naming conventions

- Backend connector services: `server/services/<domain>Connector.ts`
- Backend system services: `server/services/<domain><Purpose>.ts`
- Frontend API clients: `src/utils/<domain>Api.ts`
- React feature panels: `src/components/<Feature>Panel.tsx`
- Overlay launchers: `src/components/<Feature>Launcher.tsx`
- Architecture docs: `docs/<TOPIC>.md`

## Do not do

- Do not commit secrets.
- Do not replace the whole app with a new scaffold.
- Do not add direct provider API calls in UI components.
- Do not create unrestricted terminal execution.
- Do not remove legacy fallbacks unless the replacement is tested.
- Do not hide errors; surface them through diagnostics/log panels.
- Do not make construction accounting the global product identity.
- Do not bury simulation/model/sandbox/chart features behind unrelated labels.
