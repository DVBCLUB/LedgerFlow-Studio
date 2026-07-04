# Code Module Wiring Audit

Date: 2026-07-04

Purpose: track which code is already wired into LedgerFlow Hub, which code runs in the background, which code is a hidden specialist panel, and which code needs founder review before deletion or consolidation.

## Current UI workspaces

| Workspace | Route | Main files | Status |
|---|---|---|---|
| Command Center | `#/ceo_command` | `src/app/ErpApp.tsx`, `src/app/WorkspaceRenderer.tsx` | Visible first-screen workspace. |
| Knowledge Library | `#/knowledge_library` | `src/modules/knowledge-library/KnowledgeBaseTab.tsx` | Newly surfaced. Holds founder notes, approved RAG context, and RAG simulator. |
| Product Studio | `#/product_studio` | `src/modules/product-studio/WebAccountingRoadmap.tsx`, `ProductIdeationLab.tsx`, `GameAndMLWorkbench.tsx` | Visible. Software products, accounting templates, games/ML. |
| Marketing & Growth | `#/marketing_growth` | `src/modules/marketing-growth/CampaignsLab.tsx`, `ContentLab.tsx`, `DigitalStudioLab.tsx` | Visible. Campaign, content, video/digital studio modules are grouped. |
| Sales & CRM | `#/sales_crm` | `src/modules/sales-crm/CustomerConversionLab.tsx`, `PricingAndLTVLab.tsx`, `ReferralAndNPSLab.tsx` | Visible after subtab wiring fix. |
| Finance & Accounting | `#/finance_accounting` | `src/modules/finance-accounting/LedgerAccountingWorkspace.tsx`, `FinancialReportsVN.tsx`, `RevenueDashboard.tsx` | Visible. Accounting/product finance functions. |
| AI Workforce | `#/ai_factory` | `src/modules/ai-hr/AIOperationsCenter.tsx`, `AutomationRulesPanel.tsx`, `AIWorkforceTaskBoard.tsx`, `ModelDispatchMatrix.tsx` | Visible. AI staff, automation, tasks, model routing. |
| Analytics & Sandbox | `#/analytics` | `src/modules/analytics-sandbox/Analytics3DLab.tsx`, `BusinessSimulationEngine.tsx`, `PythonSandbox.tsx`, `src/components/shared/FounderLabsDock.tsx` | Visible. Simulation, sandbox modules, and Founder Labs. |
| System Settings | `#/system_settings` | `src/modules/system-settings/SystemSettingsPanel.tsx`, `src/modules/dev-ops/IntegrationHub.tsx` | Visible. Technical config, integrations, release/devops. |
| Industry Templates | `#/operations` | Legacy/template route | Visible as template lane only, not global warehouse/fuel identity. |

## Background / server-side code

These serve the product but should not all appear directly on the main UI:

- AI Gateway and AI routing: `server/services/aiClient.ts`, `aiRouter.ts`, `aiKeyVault.ts`, `aiVaultAutoLock.ts`, `aiDoctor.ts`.
- AI Workforce runtime: `server/services/aiWorkforce*.ts`, `agentRuntime*.ts`, `agentTool*.ts`.
- Software factory / DevOps backend: `server/services/softwareFactory*.ts`, `githubConnector.ts`, `githubCiDoctor.ts`, `gitAssistant.ts`.
- Integration connectors: `server/services/*Connector.ts`, `integrationRegistry.ts`, `localToolConnector.ts`.
- Safety and automation: `automationSafetyEnvelope.ts`, `automationRuleEngine.ts`, `robotCapabilityRegistry.ts`, `pluginSecurityPolicy.ts`.
- Local persistence/auth: `localAuth.ts`, `localDatabase.ts`, `runtimePaths.ts`, `secureJsonStore.ts`.

Rule: keep these as background services, status panels, or controlled tools. Do not expose unrestricted terminal execution or secrets in UI.

## Integrated specialist UI

The useful sleeping panels have been wired as deep panels under existing workspaces:

- AI Workforce now includes assistant, governance, skill registry, mission runtime, automation, robot lab, memory/RAG, task board, and Software Factory operating catalogs.
- Analytics & Sandbox now includes observability, market models, browser automation planner, prompt/data lab, decision memory, Founder Labs, 3D lab, simulation, and Python sandbox.
- System Settings now includes hybrid connectors, DevOps/CI, release factory, approved PR review, Git assistant daemon, rollback, artifact inspection, and security/audit panels.
- Finance & Accounting now includes founder control, internal audit, and tax simulator panels.
- Product Studio now includes game builder and vaporware smoke testing.
- Command Center now renders CEO overview, autonomous agent control, North Star builder, onboarding, and founder energy rhythm panels.

## UX stabilization pass

To keep the hybrid Company OS fast and readable, heavy deep panels were split into narrower subtabs instead of loading large stacks at once:

- AI Workforce: `agent_builder`, `tool_catalog`, `mission_templates`, `mission_release`, and `mission_audit` were separated from the broad governance/mission screens.
- Analytics & Sandbox: `gemini_lab`, `data_engineering`, and `deploy_lab` were separated from the base prompt lab.
- System Settings: `patch_review`, `git_ops`, and `recovery_ops` were separated from the Software Factory release surface.

Old aliases still route to the new subtabs, so existing hash links and launcher cards keep working.

## Consolidation decisions already made

- Sales & CRM subtab IDs were aligned so existing Sales modules render instead of falling back to static cards.
- Old subtab aliases were corrected to point to existing current subtabs.
- Knowledge Library was promoted into the main navigation and route map.
- `tools/find_orphans.js` was repaired so future audits can run inside this ESM project.
- `AnalyticsWorkspace.tsx` and legacy `command-center/CompanyOS.tsx` were removed after their useful routes were replaced by current workspace panels.
- `AIStaffTaskAssignmentPanel` was not created because no source file existed; `staff_assignment` aliases now open the existing AI Workforce task board.
- The remaining orphan detector result is `src/components/ui/Input.tsx`, which is a reusable UI atom, not a product module.

## Do not delete yet

Do not delete files from the remaining orphan list until one of these is true:

- The file duplicates another currently rendered module and has no unique UI or service behavior.
- The file is construction/fuel/warehouse-specific and cannot be scoped to an industry template.
- The file is a broken experiment with no product benefit for founder, AI staff, company OS, accounting templates, marketing, sales, analytics, integrations, or packaging.

## Needs founder review

Please approve before deletion or deeper consolidation:

- Should `OperationsPanels.tsx` remain as an industry-template gateway, or be fully replaced by `Product Studio > Accounting templates`?
- Should old AI assistant launchers remain as hash-route compatibility, or be merged into `AI Workforce` only?
- Should DevOps panels stay visible under `System Settings`, or be hidden behind an admin/dev mode toggle later?
