# LedgerFlow Studio — AI Developer & Module Map

This developer map documents the structured, domain-driven modular architecture of LedgerFlow Studio. It guides AI agents, copilots, and human developers on how to extend and modify the system cleanly.

---

## 1. Directory Layout

The application separates global/common infrastructure (launchers, layouts, hooks, and tabs) from domain-specific business workspaces.

### Global & Shared Layer (`src/components/` & `src/utils/`)
- **`src/components/`**: Holds shared UI components, design tokens, layout shell frames, and global hash-route overlay launchers (e.g. `FounderLabsDock.tsx`, `IntegrationHubLauncher.tsx`).
- **`src/components/agent-ops/`**: Holds the consolidated `AgentOpsHub` workspace shell, its sub-tabs (`WorkboardTab.tsx`, `GateTab.tsx`, etc.), and shared orchestration hooks (`useApprovalGateSync.ts`).
- **`src/utils/`**: Frontend API clients, synchronization adapters, and calculations helpers (e.g. `aiSettingsApi.ts`, `companyMemory.ts`, `revenueMetrics.ts`).

### Domain-Driven Modules (`src/modules/`)
Business-level workspaces and custom features are divided into 8 distinct company operating domains:

| Domain Module | Path | Responsibilities & Included Workspaces |
|---|---|---|
| **Command Center** | `src/modules/command-center/` | Command dashboards (`CommandCenter.tsx`), main home layout, daily founder briefs, system readiness checklists. |
| **Product Studio** | `src/modules/product-studio/` | Software products, learning paths, interactive modules, ML/game labs (`GameLibrary.tsx`, `LearningPathBuilder.tsx`, decision games). |
| **Marketing & Growth** | `src/modules/marketing-growth/` | Positioning, campaigns, content repurposing, Zalo marketing hubs, Google keyword strategies, surveys, landing copy labs. |
| **Sales & CRM** | `src/modules/sales-crm/` | Outbound leads boards (`DistributionLeadBoard.tsx`), battles cards, customer LTV dashboards, NPS managers, PLG funnel optimization. |
| **AI Nhân sự (AI HR)** | `src/modules/ai-hr/` | AI agent staff configurations, AI playground/gateways, system setup wizards (`AISettingsManager.tsx`, `AIVaultSecurityPanel.tsx`). |
| **Analytics & Sandbox** | `src/modules/analytics-sandbox/` | Simulators, case banks, SQL/Python execution sandboxes (`PythonSandbox.tsx`, `CustomDataWorkbench.tsx`, case libraries). |
| **Finance & Accounting** | `src/modules/finance-accounting/` | General ledger simulation, Vietnam accounting VAS systems (`AccountingVietnam.tsx`), financial reports, founder review boards. |
| **DevOps & Integration** | `src/modules/dev-ops/` | PR queues, rollback control rooms, build monitors, local tools panel, integration registry UI (`IntegrationHub.tsx`, connector cards). |

---

## 2. Naming & Structural Conventions

To keep the codebase uniform and readable, always adhere to the following file naming conventions:

- **Backend Connectors**: `server/services/<domain>Connector.ts` (e.g. `githubConnector.ts`, `localToolConnector.ts`).
- **Backend Core Services**: `server/services/<domain><Purpose>.ts` (e.g. `aiKeyVault.ts`, `pipelineOrchestrator.ts`).
- **Frontend API Clients**: `src/utils/<domain>Api.ts` (e.g. `aiSettingsApi.ts`, `integrationHubApi.ts`).
- **React Domain Components**: Place directly under their corresponding domain folder: `src/modules/<domain>/<ComponentName>.tsx`.
- **Overlay Launchers**: Place in the shared folder if they mount globally: `src/components/<Feature>Launcher.tsx`.
- **System Docs**: Place in the documentation directory: `docs/<TOPIC>.md`.

---

## 3. Guiding Rules for AI Agents

When modifying or adding components, you must satisfy these architectural constraints:

1. **Small Reviewable Changes**: Do not rebuild components from scratch or replace entire files with unrelated templates. Make incremental, reviewable commits.
2. **Product Generality**: LedgerFlow is an Operating System for solo founders and product companies. Do not hard-code construction-specific words (like `công trình`, `kho dầu`) into global labels. Keep construction terms contained entirely inside the `finance-accounting` Vietnam module or construction templates.
3. **No Direct Provider AI Calls in UI**: Never call external LLM APIs (OpenAI, Gemini, Groq, OpenRouter) directly from React. All frontend components must call local Express API endpoints, which then route safely through the server-side **AI Gateway** / **AI Router**.
4. **DevOps & Prebuild Guards**: Any change must pass the repository sanity checks. After editing components:
   - Run `npm run lint` (`tsc --noEmit`) to verify compilation and import paths.
   - Run `npm run check:desktop-release` to run environmental, offline-readiness, and integrity checks.
   - Run `npm run build` to verify the Vite production build.
5. **No Secret Commits**: Never commit API keys, system vault files (`.env`, `runtime/ai_keys.vault.json`, `runtime/.ledgerflow_secret`), or integration logs.
