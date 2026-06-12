# LedgerFlow Hub - Target Software Company OS Architecture

## Product north star

LedgerFlow Hub is a compact operating system for a small software/product company. It should feel like a company control room for building, selling, operating, and improving products, not a loose collection of demos and not a construction-company ERP.

The company behind LedgerFlow may build multiple product lines:

- Accounting software products for many industries.
- Accounting templates for construction, services, trading, and manufacturing.
- AI/data products.
- Internal automation tools.
- Games and interactive learning products.
- Research/sandbox experiments that can become future products.

Construction accounting is only one industry template inside the accounting product line. It must not dominate global product language.

## Correct product framing

LedgerFlow Hub = software company operating system.

It manages:

- Products.
- Customers and leads.
- Marketing campaigns.
- Sales pipeline.
- Finance and accounting.
- Projects and delivery.
- AI staff / AI agents.
- Data, models, simulation, and sandbox experiments.
- Integrations with GitHub, AI gateways, local tools, Google Workspace, and other platforms.

It does **not** mean every company using the app must have warehouse, fuel, or construction operations.

## Top-level workspaces

### 1. Command Center

Purpose: one-page CEO / founder / boss view.

Contains:

- Today priorities.
- Revenue / cash overview.
- Product progress.
- Sales and marketing signals.
- Customer / support alerts.
- Delivery risk.
- AI recommendations.
- Quick links to active workspaces.

### 2. Product Studio

Purpose: manage software products, game products, and product experiments.

Contains:

- Product portfolio.
- Feature backlog.
- Version roadmap.
- Release checklist.
- User feedback.
- Game design lab.
- Accounting software product line.
- AI/data product experiments.

Product lines should include:

- Accounting for construction industry.
- Accounting for service businesses.
- Accounting for trading businesses.
- Accounting for manufacturing businesses.
- Internal company OS modules.
- Games and interactive learning products.

### 3. Marketing & Growth

Purpose: make sure the company can actually sell and grow, not only build software.

Contains:

- Market positioning.
- Target customer segments.
- Content calendar.
- Campaign ideas.
- Landing page copy.
- Demo scripts.
- Lead magnet / free template ideas.
- Channel plan: Facebook, Zalo, TikTok, LinkedIn, YouTube, GitHub, community.
- AI marketer tasks.
- Survey and customer discovery.

### 4. Sales & CRM

Purpose: track customers, leads, demos, proposals, and conversion.

Contains:

- Lead list.
- Customer list.
- Demo pipeline.
- Proposal tracking.
- Follow-up reminders.
- Pain point notes.
- Deal stage.
- Lost reason.
- Renewal / support opportunities.

### 5. Finance & Accounting

Purpose: internal finance control and accounting product thinking.

Contains:

- Cash / bank transactions.
- Revenue and expense tracking.
- Payables.
- Receivables.
- Advances and settlements.
- Tax/document checklist.
- Cost allocation.
- Pricing and profitability model.
- Vietnamese accounting assistant.
- Accounting sandbox for product features.

### 6. Projects & Delivery

Purpose: manage active work regardless of industry.

Contains:

- Client implementation projects.
- Internal product development projects.
- Game development projects.
- AI/data experiments.
- Budget vs actual.
- Timeline / milestones.
- Documents by project.
- Delivery dashboard.
- Industry templates:
  - Construction accounting package.
  - Service business package.
  - Trading business package.
  - Manufacturing package.

Use `Dự án` globally. Use `Công trình` only inside the construction accounting template.

### 7. AI Nhân sự

Purpose: merge HR/Admin and AI Workforce into one AI-staff management workspace.

This replaces the old split between `HCNS - Hành chính` and `AI Workforce`.

Contains:

- Human role map.
- AI staff map.
- AI Chief of Staff.
- AI Accountant.
- AI Auditor.
- AI Data Analyst.
- AI Developer.
- AI Marketer.
- AI Customer Support.
- Prompt packs.
- Output quality checklist.
- Task assignment board.
- Internal admin tasks.
- Authorization / handoff documents.
- Role permissions.

### 8. Documents & Approval

Purpose: evidence vault and workflow.

Contains:

- Contract files.
- VAT invoices.
- Payment requests.
- Quotation folders.
- Approval status.
- Missing document alerts.
- Document handoff to accounting.
- Product/release approval documents.

### 9. Analytics, Models & Sandbox

Purpose: keep the original Google AI Studio spirit: charts, models, experiments, and interactive simulation.

Contains:

- Executive dashboards.
- P&L overview.
- Cashflow chart.
- Product KPI dashboard.
- Marketing funnel chart.
- Sales pipeline chart.
- SQL sandbox.
- Python sandbox.
- What-if financial models.
- Market survey simulator.
- Forecasting and ML workbench.
- Game/education lab.
- Synthetic data lab.
- Model registry.

### 10. Integration Hub

Purpose: connect existing platforms instead of rebuilding everything.

Contains:

- AI Gateway.
- GitHub connector.
- Local tools connector.
- Google Workspace connector.
- Supabase cloud sync.
- Webhook/n8n/Make/Zapier.
- MISA/SmartPro import/export bridge for accounting-product workflows.
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
- Build/release settings.

## New navigation model

Replace the old `Bước/Giai đoạn` navigation with:

1. Công ty hôm nay
2. Product Studio
3. Marketing & Growth
4. Sales & CRM
5. Tài chính - Kế toán
6. Dự án & Delivery
7. AI Nhân sự
8. Hồ sơ - Phê duyệt
9. Analytics - Models - Sandbox
10. Tích hợp
11. Cài đặt hệ thống

Removed from top-level navigation:

- `Mua hàng - Kho - Dầu` because it is not a universal workspace for a software company.
- `HCNS - Hành chính` as a separate workspace because it is merged into `AI Nhân sự`.

Industry-specific inventory/fuel/warehouse flows can still exist inside optional templates, for example:

- Construction accounting template.
- Trading inventory template.
- Manufacturing materials template.

They must not define the main company OS.

## Module registry concept

Future refactor should introduce a registry like:

```ts
export const companyModules = [
  {
    id: 'product-studio',
    label: 'Product Studio',
    roleAccess: ['owner', 'product', 'developer'],
    component: 'ProductStudioWorkspace',
    tags: ['software', 'game', 'roadmap', 'release']
  },
  {
    id: 'marketing-growth',
    label: 'Marketing & Growth',
    roleAccess: ['owner', 'marketing', 'sales'],
    component: 'MarketingGrowthWorkspace',
    tags: ['content', 'campaign', 'lead', 'positioning']
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
    product-studio/
    marketing-growth/
    sales-crm/
    finance-accounting/
    projects-delivery/
    ai-nhan-su/
    documents-approval/
    analytics-models-sandbox/
    integration-hub/
    system-settings/
  components/
    shared/
  data/
    industry-templates/
      construction-accounting/
      service-accounting/
      trading-accounting/
      manufacturing-accounting/
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

- Software company command room.
- Product company dashboard.
- Clean role-based workspaces.
- Marketing and sales visible, not hidden.
- Charts, models, games, and sandbox surfaced as first-class modules.
- Construction shown only as one industry template.
- Technical panels hidden under Settings / Dev tools.

## Data model direction

Core entities:

- Company
- Product
- ProductLine
- GameProject
- Feature
- Release
- Department
- UserRole
- Customer
- Lead
- Campaign
- Deal
- Project
- CostItem
- Document
- CashTransaction
- AdvanceRequest
- ApprovalRequest
- Report
- SimulationModel
- AIJob
- IntegrationConnection
- IndustryTemplate

Optional industry entities should be template-scoped:

- ConstructionProject
- ServiceContract
- TradingInventoryItem
- ManufacturingBatch
- WarehouseItem
- FuelLedger

## First implementation milestone

Milestone `Software Company OS Reform P0`:

1. Add Company OS home as default landing page.
2. Add navigation registry.
3. Replace construction-heavy global labels with product/software-company language.
4. Add top-level Marketing & Growth.
5. Add top-level Product Studio for software and games.
6. Merge HR/Admin into AI Nhân sự.
7. Remove warehouse/fuel from top-level navigation.
8. Surface Analytics, Models & Sandbox.
9. Move technical sync panels out of default home.
10. Keep old modules available under `Legacy Labs` until migrated.
