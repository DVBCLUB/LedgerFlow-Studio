# Company OS Reform Backlog

## Reform goal

Turn LedgerFlow from a mixed demo/lab/accounting app into a coherent company operating system.

## P0 - Product direction correction

### P0.1 Rename product framing

Change global language from construction accounting to company operating system.

Acceptance criteria:

- Header explains LedgerFlow as company hub.
- Construction wording is not used globally.
- Construction appears only as one project/industry template.

### P0.2 Make Company OS the default home

Acceptance criteria:

- First screen after login is company dashboard.
- User sees finance, projects, approvals, reports, AI, sandbox, integrations.
- Supabase/WASM/technical config is not the first thing normal user sees.

### P0.3 Create department navigation

Acceptance criteria:

- Navigation uses departments, not `Bước` or `Giai đoạn`.
- Existing modules are still accessible.
- Old labs are grouped under `Simulation & Sandbox` or `Legacy Labs` until migrated.

### P0.4 Surface simulation, charts, model, sandbox

Acceptance criteria:

- There is a visible `Mô phỏng - Sandbox` workspace.
- It links to SQL sandbox, Python sandbox, ML, market survey simulator, model experiments, chart/report lab.
- User can immediately find the features from the original Google AI Studio frame.

## P1 - Shell refactor

### P1.1 Split App.tsx

Current `App.tsx` is too large and mixes:

- Auth-adjacent cloud sync.
- Header.
- Navigation.
- SQL sandbox.
- Supabase config.
- Workspace router.
- Search palette.

Target files:

```txt
src/app/AppShell.tsx
src/app/WorkspaceRouter.tsx
src/app/companyNavigation.ts
src/app/SearchPalette.tsx
src/app/TechnicalStatusBar.tsx
```

### P1.2 Add module registry

Create a registry to define workspaces, roles, tags, and routes.

Acceptance criteria:

- AI agents can add a module by editing a registry plus one component.
- App navigation no longer needs huge repeated button blocks.

### P1.3 Move technical panels

Move:

- Supabase config
- WASM SQL terminal
- Server sync detail
- RLS instructions

into:

- `System Settings`
- `Simulation & Sandbox`
- `Developer Tools`

## P2 - Business module unification

### P2.1 Finance & Accounting workspace

Combine and clean:

- `AccountingVietnam`
- `CustomDataWorkbench`
- prompt pack
- advance/settlement ideas
- bank reconciliation concepts

### P2.2 Project Portfolio workspace

Create generic project management:

- Project type selector.
- Budget vs actual.
- Cost package.
- Document checklist.
- Template: Construction.
- Template: Trading.
- Template: Service.
- Template: Manufacturing.

### P2.3 Procurement / Inventory / Fuel workspace

Create a clean operational module for:

- Suppliers.
- Purchase requests.
- Goods receipt.
- Warehouse ledger.
- Fuel fund.
- Handwritten voucher support.

### P2.4 HR & Admin workspace

Create module for:

- Admin expenses.
- Staff advances.
- Outsourced labor.
- Payroll checklist.
- Authorization letters.

## P3 - Advanced company OS

### P3.1 Approval workflow

Add workflow states:

- Draft
- Submitted
- Checked
- Approved
- Paid
- Settled
- Archived

### P3.2 Role-based UI

Roles:

- Owner / Boss
- Accounting
- Warehouse / Procurement
- HR Admin
- Project Manager
- Developer / Admin
- Viewer

### P3.3 Real chart and model layer

Introduce chart/model registry:

- Cashflow chart.
- Budget burn chart.
- Department cost trend.
- Project variance.
- Aging reports.
- What-if scenario.
- Forecasting model.

### P3.4 AI Workforce operations

Make AI agent modules work like staff:

- Assigned task.
- Input file/context.
- Output.
- Review checklist.
- Status.
- Risk level.
- Next action.

## Immediate code strategy

Do not mass-move files in one commit.

Recommended sequence:

1. Add new `CompanyOSHome` / use existing `CompanyOS` as default.
2. Add department nav registry.
3. Hide technical panels from landing page.
4. Group legacy modules under clean sections.
5. Split `App.tsx`.
6. Move modules one-by-one.

## Definition of done for reform P0

- User opens `.exe` and sees a clean company dashboard.
- User no longer sees random course-like modules first.
- User can find charts/models/sandbox from top-level navigation.
- User understands construction accounting is one project template only.
- AI agents can read `PRODUCT_REFORM_AUDIT.md`, `COMPANY_OS_TARGET_ARCHITECTURE.md`, and this backlog before making changes.
