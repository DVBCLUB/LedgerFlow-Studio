# Claude Code Brief - Deepen LedgerFlow Hub Modules

## Goal

Upgrade LedgerFlow Hub from a framework/shell of many modules into a deeper knowledge product. Each module already has a UI frame, but many modules need deeper domain knowledge, examples, decision trees, simulations, checklists, templates, accounting/business logic, and learning content.

Do not rebuild the app from scratch. Improve the existing codebase incrementally.

## Repository

Repo: DVBCLUB/LedgerFlow-Studio

## Must read first

Before editing, read these files:

1. `package.json`
2. `src/App.tsx`
3. `src/data/simulationRegistry.ts`
4. `SIMULATION_MODEL_MAP.md`
5. `HYBRID_APP_STANDARD.md`
6. `CI_FAILURE_GUIDE.md`
7. `desktop/main.cjs`
8. `vite.config.ts`
9. `server.ts`
10. Existing component files in `src/components/`

## Current architecture rules

- React + Vite app.
- Desktop build uses Electron.
- PWA/offline readiness exists.
- Important build scripts already exist:
  - `npm run check:env`
  - `npm run check:simulations`
  - `npm run check:desktop`
  - `npm run check:offline`
  - `npm run build`
  - `npm run desktop:dist`
  - `npm run check:hybrid`
  - `npm run check:hybrid:release`
- Do not break existing CI checks.
- Do not remove any existing module from `src/data/simulationRegistry.ts`.
- If a module is renamed, update `App.tsx`, component path, registry and docs together.
- Keep offline mode working. Do not add CDN dependencies.
- Do not put API keys or secrets in source.

## Main request

Add deep knowledge content to each module.

Each module should have more than a nice layout. It should contain useful, expert-level material:

- Concepts
- Frameworks
- Real examples
- Business/accounting workflows
- Case studies
- Decision trees
- Checklists
- Tables
- Simulation inputs/outputs
- KPI formulas
- Risk warnings
- Practical templates
- Suggested actions
- Beginner explanation + expert view

## Recommended implementation approach

Prefer adding shared data/content files instead of hardcoding huge content inside every component.

Recommended structure:

```text
src/data/moduleKnowledgeBase.ts
src/data/moduleCaseStudies.ts
src/data/modulePlaybooks.ts
src/data/moduleTemplates.ts
src/components/shared/KnowledgePanel.tsx
src/components/shared/CaseStudyPanel.tsx
src/components/shared/DecisionTreePanel.tsx
src/components/shared/ChecklistPanel.tsx
src/components/shared/FormulaCard.tsx
```

Then each module can import shared components and its relevant content.

If the existing UI components are too large, improve them gradually. Do not rewrite all components in one pass unless necessary.

## Content depth standard for every module

For every module in `src/data/simulationRegistry.ts`, add or connect at least:

1. Module overview
   - What this module teaches/solves
   - Who uses it
   - Input data required
   - Output/report produced

2. Deep knowledge sections
   - 5-10 advanced concepts
   - Beginner explanation
   - Expert explanation
   - Common mistakes
   - Practical use cases

3. Simulation model
   - Inputs
   - Assumptions
   - Calculation logic
   - Output interpretation
   - Edge cases
   - Risk alerts

4. Accounting/business relevance
   - If relevant to accounting, construction, cost control, audit, tax, budget, cashflow or management reporting, explain it deeply.
   - Prefer Vietnam construction/accounting context where useful.

5. Checklist/templates
   - User should be able to copy practical checklists.
   - Include document checklist, workflow checklist, review checklist.

6. Example dataset or scenario
   - Add at least one realistic example per module.
   - Use construction/accounting/business examples where possible.

7. Offline-friendly fallback
   - Content must be visible offline.
   - AI/API features may enhance content, but base knowledge must not depend on live API.

## Priority modules to deepen first

Start with these because they are most important to the user:

1. `AccountingVietnam`
2. `InternalAuditWorkspace`
3. `CustomDataWorkbench`
4. `DataScienceEngineering`
5. `WebAccountingRoadmap`
6. `CommandCenter`
7. `MarketSurveySimulator`
8. `PricingStrategyLab`
9. `CustomerLTVDashboard`
10. `AdvancedAIEngine`

Then continue with all remaining modules from registry.

## Module-specific depth suggestions

### AccountingVietnam

Add deep content around:

- Vietnamese accounting workflow
- Construction project accounting
- Cost classification
- Advance/settlement workflow
- VAT invoice control
- Personal income tax withholding for outsourced labor
- Material inventory documents
- Fuel fund tracking
- Payment authorization documents
- Required documents by expense type
- Management report to boss
- Risk matrix for tax/accounting documents

### InternalAuditWorkspace

Add:

- Audit planning
- Internal control matrix
- Risk-control mapping
- Sampling logic
- Red flags
- Construction cost audit checklist
- Payment file review checklist
- Invoice/document compliance checklist

### CustomDataWorkbench

Add:

- Data model for project accounting
- Tables: projects, vendors, expenses, advances, settlements, invoices, inventory, fuel, employees
- Data validation rules
- Reconciliation logic
- Import/export logic
- Example JSON/CSV fields

### DataScienceEngineering

Add:

- Data science roadmap for accounting/audit/construction
- ETL/ELT explanation
- Data warehouse model
- Feature engineering examples
- Anomaly detection in expenses
- Dashboard metrics
- Forecasting budgets/cashflow

### WebAccountingRoadmap

Add:

- Product roadmap for web accounting app
- MVP -> V1 -> V2 stages
- Modules and data relationships
- Role-based access design
- Low-cost deployment strategy
- Test plan

### CommandCenter

Add:

- Boss dashboard structure
- KPIs: budget vs actual, advance ratio, settlement ratio, unpaid invoices, missing documents, cash burn, project cost overrun
- Alert logic
- Executive summary templates

### MarketSurveySimulator

Add:

- Market research process
- Persona, ICP, TAM/SAM/SOM
- Survey questions
- Competitor comparison
- Go-to-market simulation

### PricingStrategyLab

Add:

- Cost-plus pricing
- Value-based pricing
- Gross margin
- Contribution margin
- Break-even
- Price sensitivity
- Discount impact

### CustomerLTVDashboard

Add:

- LTV formula
- CAC
- Retention
- Churn
- Payback period
- Cohort logic

### AdvancedAIEngine

Add:

- AI agent architecture
- Prompt patterns
- RAG concept
- Tool use
- Evaluation checklist
- Safety and data privacy
- Accounting AI use cases

## UX expectations

Keep UI practical and easy to read:

- Use tabs or accordions for deep content.
- Avoid one giant wall of text.
- Use cards, tables, and checklists.
- Each module should have: Learn / Simulate / Checklist / Case Study / Template / Risks.
- Keep performance reasonable.
- Avoid adding giant dependencies.

## Testing requirements

After edits, run:

```bash
npm install
npm run check:hybrid
npm run build
npm run desktop:dist
npm run check:hybrid:release
```

At minimum, before final answer, run:

```bash
npm run check:simulations
npm run check:offline
npm run lint
npm run build
```

## Deliverable

Return a summary with:

1. Files changed
2. Modules deepened
3. New shared components/data files
4. How to run locally
5. Known limitations
6. Any modules still shallow
7. Screenshots if possible

## Important warning

Do not remove the hybrid build safety system. These files are intentional and should remain:

- `scripts/check-env-config.mjs`
- `scripts/check-simulation-modules.mjs`
- `scripts/check-desktop-package.mjs`
- `scripts/check-offline-readiness.mjs`
- `scripts/check-build-output.mjs`
- `scripts/check-runtime-api.mjs`
- `scripts/check-release-artifacts.mjs`
- `scripts/check-hybrid-release.mjs`
- `scripts/write-build-manifest.mjs`
- `scripts/write-release-notes.mjs`
- `scripts/doctor.mjs`

If one of these fails, fix the cause. Do not delete the check.
