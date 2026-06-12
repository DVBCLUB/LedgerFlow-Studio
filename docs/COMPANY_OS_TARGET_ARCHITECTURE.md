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
- Knowledge library.
- Customers and leads.
- Marketing campaigns.
- Sales pipeline.
- Finance and accounting.
- Projects and delivery.
- AI staff / AI agents.
- Data, models, simulation, and sandbox experiments.
- Integrations with GitHub, AI gateways, VS Code/Cursor, local tools, Google Workspace, and other platforms.

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

### 2. Knowledge Library

Purpose: company memory and context source for all AI/AI agent work.

This is not a static document folder. It is the place where knowledge is entered, classified, searched, exported, and later fed into AI agents.

Contains:

- Manual knowledge input.
- Product notes.
- Accounting/domain knowledge.
- Prompt packs.
- Customer notes.
- Design decisions.
- Coding rules.
- GitHub/CI lessons learned.
- Marketing and sales insights.
- Game design notes.
- Import/export knowledge packs.
- Future vector database / RAG source.

### 3. AI Nhân sự / AI Operations Center

Purpose: central dispatch center for AI, AI agents, software tools, and system data flow.

This is **not** normal HR/HCNS. It is where all AI-related operations are coordinated.

Contains:

- AI staff map.
- AI Chief of Staff.
- AI developer / code agent.
- AI designer / product agent.
- AI marketer.
- AI accountant.
- AI auditor.
- AI data analyst.
- Q&A router.
- Code generation workflow.
- GitHub issue / commit / push coordination.
- VS Code / Cursor / Copilot handoff.
- Design workflow.
- Data intake from files, logs, GitHub, docs, prompts, and user notes.
- Data output to answers, code, PR plans, reports, tasks, designs, and knowledge library.
- Output quality checklist.
- Agent permission rules.

### 4. Product Studio

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

### 5. Marketing & Growth

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

### 6. Sales & CRM

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

### 7. Finance & Accounting

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

### 8. Projects & Delivery

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

### 9. Documents & Approval

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

### 10. Analytics, Models & Sandbox

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

### 11. Integration Hub

Purpose: connect existing platforms instead of rebuilding everything.

Contains:

- AI Gateway.
- GitHub connector.
- Local tools connector.
- VS Code / Cursor handoff.
- Google Workspace connector.
- Supabase cloud sync.
- Webhook/n8n/Make/Zapier.
- MISA/SmartPro import/export bridge for accounting-product workflows.
- Future AI agent connectors.

### 12. System Settings

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
2. Thư viện tri thức
3. AI Nhân sự
4. Product Studio
5. Marketing & Growth
6. Sales & CRM
7. Tài chính - Kế toán
8. Dự án & Delivery
9. Hồ sơ - Phê duyệt
10. Analytics - Models - Sandbox
11. Tích hợp
12. Cài đặt hệ thống

Removed from top-level navigation:

- `Mua hàng - Kho - Dầu` because it is not a universal workspace for a software company.
- `HCNS - Hành chính` as a separate workspace because AI Nhân sự is the AI Operations Center.

Industry-specific inventory/fuel/warehouse flows can still exist inside optional templates, for example:

- Construction accounting template.
- Trading inventory template.
- Manufacturing materials template.

They must not define the main company OS.

## AI Nhân sự data-flow rule

AI Nhân sự should be designed around this flow:

```txt
User / File / GitHub / VS Code / Logs / Docs / Prompt
        ↓
Knowledge Library + Context Pack
        ↓
AI Gateway / Agent Router
        ↓
AI role: Q&A / Code / Design / Marketing / Data / Audit
        ↓
Output: answer / code / PR plan / design / report / task
        ↓
GitHub / VS Code / Product Studio / Library / Integration Hub
```

Important: AI Nhân sự may coordinate code generation and GitHub push workflows, but dangerous shell execution must remain controlled through safe connectors, CI, and founder review.

## Module registry concept

Future refactor should introduce a registry like:

```ts
export const companyModules = [
  {
    id: 'knowledge-library',
    label: 'Thư viện tri thức',
    roleAccess: ['owner', 'ai-ops', 'product', 'developer'],
    component: 'KnowledgeLibraryWorkspace',
    tags: ['knowledge', 'context', 'rag', 'prompt', 'library']
  },
  {
    id: 'ai-nhan-su',
    label: 'AI Nhân sự',
    roleAccess: ['owner', 'ai-ops', 'developer'],
    component: 'AIOpsCenterWorkspace',
    tags: ['ai-agent', 'github', 'vscode', 'code', 'design', 'data-flow']
  },
  {
    id: 'product-studio',
    label: 'Product Studio',
    roleAccess: ['owner', 'product', 'developer'],
    component: 'ProductStudioWorkspace',
    tags: ['software', 'game', 'roadmap', 'release']
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
    knowledge-library/
    ai-nhan-su/
    product-studio/
    marketing-growth/
    sales-crm/
    finance-accounting/
    projects-delivery/
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
- Knowledge-first AI context system.
- AI agent operations center.
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
- KnowledgeItem
- KnowledgeSource
- ContextPack
- Department
- UserRole
- AgentRole
- AgentTask
- AgentOutput
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
2. Add Knowledge Library with manual input/search/export.
3. Redefine AI Nhân sự as AI Operations Center.
4. Add navigation registry.
5. Replace construction-heavy global labels with product/software-company language.
6. Add top-level Marketing & Growth.
7. Add top-level Product Studio for software and games.
8. Remove warehouse/fuel from top-level navigation.
9. Surface Analytics, Models & Sandbox.
10. Move technical sync panels out of default home.
11. Keep old modules available under `Legacy Labs` until migrated.
