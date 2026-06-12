# LedgerFlow Hub - Target Company OS Architecture

## Product north star

LedgerFlow Hub is a compact operating system for a small company. It should feel like a company control room, not a loose collection of demos.

The app must support multiple business contexts:

- Construction projects.
- Trading.
- Services.
- Manufacturing.
- Internal administration.
- Accounting and audit workflows.
- AI-assisted management.

Construction is an industry pack, not the whole product.

## Top-level workspaces

### 1. Command Center

Purpose: one-page CEO / boss view.

Contains:

- Today priorities.
- Cash position.
- Receivables / payables summary.
- Pending approvals.
- Project health.
- Risk alerts.
- AI recommendations.

### 2. Finance & Accounting

Purpose: accounting control and financial operations.

Contains:

- General ledger sandbox.
- Cash/bank transactions.
- Payables.
- Receivables.
- Advances and settlements.
- Cost allocation.
- Tax/document checklist.
- Vietnamese accounting assistant.

### 3. Project Portfolio

Purpose: manage projects generically.

Contains:

- Project list.
- Budget vs actual.
- Cost packages.
- Advance / reimbursement by project.
- Documents by project.
- Project dashboard.
- Industry templates:
  - Construction.
  - Trading campaign.
  - Service contract.
  - Manufacturing batch.

### 4. Procurement & Inventory

Purpose: control purchasing, warehouse, materials, and fuel.

Contains:

- Purchase requests.
- Suppliers.
- Quotations.
- Purchase orders.
- Goods receipt notes.
- Warehouse ledger.
- Fuel fund.
- Handwritten voucher intake helper.

### 5. HR & Admin

Purpose: internal administration and people operations.

Contains:

- Admin expenses.
- Staff advances.
- Payroll checklist.
- Outsourced labor settlement.
- Authorization letters.
- Office assets.

### 6. Documents & Approval

Purpose: evidence vault and workflow.

Contains:

- Contract files.
- VAT invoices.
- Payment requests.
- Quotation folders.
- Approval status.
- Missing document alerts.
- Document handoff to accounting.

### 7. Analytics & Reporting

Purpose: management reports and charts.

Contains:

- P&L overview.
- Cashflow chart.
- Budget burn chart.
- Project variance chart.
- Aging reports.
- Department cost dashboard.
- Export for boss report.

### 8. Simulation & Sandbox Lab

Purpose: keep the original Google AI Studio spirit: models, charts, experiments, and interactive simulation.

Contains:

- SQL sandbox.
- Python sandbox.
- What-if financial models.
- Market survey simulator.
- Cost scenario simulator.
- Forecasting and ML workbench.
- Game/education lab.
- Synthetic data lab.

### 9. AI Workforce

Purpose: manage AI as company staff.

Contains:

- AI Chief of Staff.
- AI Accountant.
- AI Auditor.
- AI Data Analyst.
- AI Developer handoff.
- Prompt packs.
- Output quality checklist.
- Task assignment board.

### 10. Integration Hub

Purpose: connect existing platforms instead of rebuilding everything.

Contains:

- AI Gateway.
- GitHub connector.
- Local tools connector.
- Google Workspace connector.
- MISA/SmartPro import/export bridge.
- Supabase cloud sync.
- Webhook/n8n/Make/Zapier.
- Future AI agent connectors.

### 11. System Settings

Purpose: keep technical configuration away from normal users.

Contains:

- Local login.
- Role permissions.
- AI keys and vault.
- Cloud sync settings.
- Desktop diagnostics.
- Startup logs.
- Developer tools.

## New navigation model

Replace the old `Bước/Giai đoạn` navigation with:

1. Công ty hôm nay
2. Tài chính - Kế toán
3. Dự án
4. Mua hàng - Kho - Dầu
5. HCNS - Hành chính
6. Hồ sơ - Phê duyệt
7. Báo cáo - Biểu đồ
8. Mô phỏng - Sandbox
9. AI Nhân sự
10. Tích hợp
11. Cài đặt hệ thống

## Module registry concept

Future refactor should introduce a registry like:

```ts
export const companyModules = [
  {
    id: 'finance',
    label: 'Tài chính - Kế toán',
    roleAccess: ['owner', 'accounting'],
    component: 'FinanceAccountingWorkspace',
    tags: ['ledger', 'cash', 'advance', 'tax']
  }
]
```

Then `App.tsx` should render modules from the registry instead of hard-coded stage buttons.

## Suggested folder structure after refactor

```txt
src/
  app/
    AppShell.tsx
    WorkspaceRouter.tsx
    navigation.ts
  modules/
    command-center/
    finance-accounting/
    project-portfolio/
    procurement-inventory/
    hr-admin/
    documents-approval/
    analytics-reporting/
    simulation-sandbox/
    ai-workforce/
    integration-hub/
    system-settings/
  components/
    shared/
  data/
  utils/
```

## Migration rule

Do not move all files at once. Migrate one module at a time:

1. Create new folder.
2. Move one component.
3. Update imports.
4. Run build.
5. Commit.
6. Continue.

## UI direction

The UI should feel like:

- Company command room.
- Clean dashboard.
- Role-based workspaces.
- Less technical wording on home screen.
- Technical panels hidden under Settings / Dev tools.
- Charts and models surfaced as first-class modules.

## Data model direction

Core entities:

- Company
- Department
- UserRole
- Project
- CostItem
- Document
- Supplier
- Customer
- InventoryItem
- CashTransaction
- AdvanceRequest
- ApprovalRequest
- Report
- SimulationModel
- AIJob
- IntegrationConnection

## First implementation milestone

Milestone `Company OS Reform P0`:

1. Add Company OS home as default landing page.
2. Add navigation registry.
3. Re-label construction to industry template.
4. Surface Simulation & Sandbox Lab.
5. Move technical sync panels out of default home.
6. Add role-focused dashboard cards.
7. Keep old modules available under `Legacy Labs` until migrated.
