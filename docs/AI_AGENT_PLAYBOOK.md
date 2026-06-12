# AI Agent Coding Playbook

This playbook is for any AI agent or human maintainer working on LedgerFlow Studio.

## What this product is

LedgerFlow Studio is not only an accounting app. It is becoming a small-company operating hub:

- Accounting and project-cost workflows
- AI Gateway with local key vault and multi-provider fallback
- Integration Hub for GitHub, local tools, Google Workspace, legacy ERP, automation tools
- Dev Handoff and CI Doctor for AI-assisted software development
- Windows desktop packaging

## First 5 minutes in the repo

1. Read `AGENTS.md`.
2. Read `docs/PROJECT_STRUCTURE.md`.
3. Check `package.json` scripts.
4. Identify the target module.
5. Make the smallest safe change.

Do not start by rewriting `App.tsx`, replacing the scaffold, or moving many files.

## Common tasks and where to work

### Add or change an AI provider

Work mostly in:

```text
server/services/aiRouter.ts
server/services/aiKeyVault.ts
src/utils/aiSettingsApi.ts
src/components/AISettingsManager.tsx
```

Rules:

- Keep provider keys backend-side.
- Return masked keys to frontend.
- Preserve fallback and quota handling.
- Update `docs/AI_GATEWAY.md`.

### Add a new platform connector

Create or edit:

```text
server/services/<platform>Connector.ts
src/utils/integrationHubApi.ts
src/components/<Platform>ConnectorPanel.tsx
src/components/IntegrationHub.tsx
docs/INTEGRATION_HUB.md
```

Rules:

- Start read-only/status-first.
- Add write actions only with explicit user confirmation.
- Log events through Integration Hub event APIs if useful.
- Do not store third-party tokens in frontend state or localStorage.

### Add a new overlay tool

Create:

```text
src/components/<ToolName>.tsx
src/components/<ToolName>Launcher.tsx
```

Mount the launcher in:

```text
src/main.tsx
```

Rules:

- Use lazy loading for large overlays.
- Support hash routes like `#/tool_name`.
- Do not modify `App.tsx` unless absolutely necessary.

### Fix GitHub Actions / CI failures

Use:

```text
docs/CI_DOCTOR.md
src/components/GitHubCIDoctorPanel.tsx
.github/workflows/
scripts/check-*.mjs
```

Rules:

- Fix the real failing check, not by disabling CI.
- Keep Windows build and web CI separate.
- If desktop icon errors occur, check `scripts/prepare-desktop-icons.mjs`, `package.json` build config, and `.github/workflows/build-windows.yml`.

### Change desktop packaging

Work in:

```text
package.json
desktop/main.cjs
BUILD_WINDOWS_INSTALLER.bat
scripts/prepare-desktop-icons.mjs
.github/workflows/build-windows.yml
```

Rules:

- Windows icon must be `build/icon.ico`.
- Run `npm run prepare:icons` before packaging.
- Do not rely on manually copied local icon files.

## Safe command list

Prefer these commands:

```bash
npm install
npm run lint
npm run build
npm run ai:doctor
npm run check:desktop
npm run desktop:dist
```

Avoid destructive commands unless explicitly requested and backed up.

## UI conventions

- Use concise Vietnamese labels for user-facing text when the feature is for the current owner workflow.
- Keep technical docs in English or bilingual when useful for AI agents.
- Prefer panels/cards with clear status, action buttons, and logs.
- Long-running tools should show status text and clear errors.

## Backend conventions

- Keep route handlers thin when logic grows.
- Use services in `server/services/`.
- Validate request bodies with `zod` when accepting user input.
- Return JSON with clear `success`, `error`, and diagnostic fields.
- Never return secret values; return masked values.

## Connector security rules

Allowed by default:

- Read status
- Test connection
- Open safe URLs
- Generate prompts/checklists
- Export local markdown files in the browser

Requires explicit user action:

- Create GitHub issue
- Open local tools
- Import/export encrypted backups
- Update/delete keys

Disallowed unless a specific feature is designed and reviewed:

- Arbitrary terminal execution
- Auto-committing code
- Auto-pushing to main
- Reading `.env` into frontend
- Uploading local secrets to third-party services

## Documentation update rule

If you add a new user-visible module, update at least one of:

```text
AGENTS.md
docs/PROJECT_STRUCTURE.md
docs/INTEGRATION_HUB.md
docs/AI_GATEWAY.md
docs/CI_DOCTOR.md
```

## Commit style

Use small, direct commit messages:

```text
Add GitHub connector panel
Expose AI vault lock endpoints
Fix desktop icon packaging config
Document Integration Hub registry API
```

## Final response checklist for AI agents

When reporting work back to the user:

- Mention exact files changed.
- Mention commits pushed.
- Say what was not tested if you could not run local build.
- Ask for screenshots/logs only when needed.
