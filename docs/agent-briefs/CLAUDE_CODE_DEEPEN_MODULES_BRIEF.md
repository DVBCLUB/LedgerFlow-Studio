# Claude Code Brief - Deepen LedgerFlow Hub Modules

## Goal

Upgrade LedgerFlow Hub from a framework/shell of many modules into a deeper knowledge product. Each module already has a UI frame, but many modules need deeper domain knowledge, examples, decision trees, simulations, checklists, templates, accounting/business logic, and learning content.

Do not rebuild the app from scratch. Improve the existing codebase incrementally.

## Repository

Repo: `DVBCLUB/LedgerFlow-Studio`

## Must read first

Before editing, read these files:

1. `package.json`
2. `src/App.tsx`
3. `src/data/simulationRegistry.ts`
4. `docs/SIMULATION_MODEL_MAP.md`
5. `docs/HYBRID_APP_STANDARD.md`
6. `docs/CI_FAILURE_GUIDE.md`
7. `docs/COMPANY_OS_GUARDRAILS.md`
8. `desktop/main.cjs`
9. `vite.config.ts`
10. `server.ts`
11. Existing component files in `src/components/`

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
- If a module is renamed, update App/Dock, component path, registry and docs together.
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
   - Practical checklist
   - Sample table/template
   - Output QA questions

## Guardrail

Do not simplify by deleting modules. Do not move core runtime directories just to make the ZIP look clean. Use docs/tools folders for organization, but preserve app structure and all UI modules.
