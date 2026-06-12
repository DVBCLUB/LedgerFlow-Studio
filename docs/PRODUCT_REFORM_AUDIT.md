# LedgerFlow Studio - Product Reform Audit

## Current problem

LedgerFlow Studio is drifting into several mixed identities at the same time:

1. A Vietnamese accounting learning/demo app.
2. A construction accounting workbook.
3. A solo-founder AI lab.
4. A data science / simulation sandbox.
5. A desktop integration hub.
6. A software-product studio.
7. A game/product experiment lab.

All of these are valuable, but the current UI makes them look like unrelated fragments. The product should be repositioned as a compact **Software Company Operating System**, where products, marketing, sales, finance, projects, documents, AI staff, simulations, and integrations are departments inside one company.

## User correction that must be respected

The product is **not a construction-company ERP**.

The company context is a software/product company. It may build:

- Accounting software for the construction industry.
- Accounting software for service businesses.
- Accounting software for trading businesses.
- Accounting software for manufacturing businesses.
- Internal company OS tools.
- AI/data products.
- Games and interactive learning products.

Construction/project accounting is only one product template / industry pack. It must not dominate labels, dashboards, navigation, or global product language.

Correct framing:

- LedgerFlow = software company operating system.
- Accounting software = one major product line.
- Construction accounting = one optional template inside the accounting product line.
- Service/trading/manufacturing accounting = sibling templates, not afterthoughts.
- Games = valid product line, not side content.
- Marketing and sales = mandatory company functions, not optional.
- AI, sandbox, charts, models, simulation, and data lab = core differentiators, not side toys.

## What is currently wrong

### 1. Navigation is too linear and course-like

The current main app uses stage labels such as `Bước 1`, `Bước 2`, `Giai đoạn 3`, etc. This makes the app feel like a course or pitch deck, not a business system.

Target navigation should use software-company workspaces:

- Command Center
- Product Studio
- Marketing & Growth
- Sales & CRM
- Finance & Accounting
- Projects & Delivery
- AI Nhân sự
- Documents & Approval
- Analytics, Models & Sandbox
- Integration Hub
- System Settings

### 2. Construction language is over-weighted

Any repeated global wording around `công trình`, `kế toán công trình`, `kho dầu`, or construction-specific workflows should be moved under an optional industry template.

Target wording:

- Use `Dự án` for generic projects.
- Use `Sản phẩm` for software/game products.
- Use `Công trình` only inside `Mẫu ngành xây dựng`.
- Use `Chi phí dự án` rather than `chi phí công trình` at global level.
- Use `Accounting product templates` for construction/service/trading/manufacturing.

### 3. The old `Mua hàng - Kho - Dầu` top-level module is wrong

A software company does not need warehouse/fuel as a universal top-level workspace.

Correct treatment:

- Warehouse/fuel only belongs inside certain industry templates.
- Construction accounting template may include materials/fuel.
- Trading template may include inventory.
- Manufacturing template may include materials/BOM/batches.
- Global Company OS should not show `Kho dầu` as a core department.

### 4. HR/Admin should be merged into AI Nhân sự

The separate `HCNS - Hành chính` workspace should be merged into `AI Nhân sự`.

Target:

- AI Nhân sự manages both human roles and AI staff.
- Internal admin documents, handoff, role permissions, AI task assignment, AI marketer, AI developer, AI accountant, and AI support belong here.

### 5. Marketing is missing

A software company cannot sell products without marketing.

Marketing & Growth must become a top-level workspace:

- Positioning.
- Customer segments.
- Content calendar.
- Campaigns.
- Demo scripts.
- Landing page copy.
- Lead magnets.
- Survey scripts.
- AI Marketer.
- Channel plan: Facebook, Zalo, TikTok, LinkedIn, YouTube, GitHub, community.

### 6. Sales / CRM is missing

Marketing produces demand; Sales/CRM tracks conversion.

Sales & CRM should include:

- Leads.
- Customers.
- Demo pipeline.
- Proposal tracking.
- Follow-up reminders.
- Pain points.
- Deal stage.
- Lost reason.

### 7. Product Studio is missing as a core workspace

LedgerFlow is not only one app. It is a studio for software, accounting templates, AI tools, and games.

Product Studio should include:

- Product portfolio.
- Feature backlog.
- Release roadmap.
- Game design lab.
- Accounting product templates.
- User feedback.
- Version checklist.
- Build/release workflow.

### 8. Simulation/model/sandbox content exists but is buried

Existing modules include market survey simulator, WASM SQLite, Python sandbox, game/ML workbench, advanced AI, and custom data workbench. However, the product does not surface them as a coherent `Analytics, Models & Sandbox` workspace.

Target: create a clear top-level cluster:

- Data Sandbox.
- SQL Sandbox.
- Python Sandbox.
- Simulation Models.
- Scenario Planning.
- Forecasting / ML.
- Charts & Dashboards.
- What-if model builder.
- Game/education lab.

### 9. App shell is too noisy

The header and home content contain too much technical detail. A normal company user should first see what to do today, not Supabase, WASM, RLS, and build/runtime language.

Target: hide technical panels behind admin/dev mode:

- Supabase config -> System Settings / Cloud Sync.
- AI key vault -> AI Gateway settings.
- GitHub/CI -> DevOps tools.
- SQL/WASM terminal -> Analytics, Models & Sandbox.

### 10. Modules are functionally good but not organized by business workflow

Existing feature components should be kept but re-grouped. Do not delete useful modules. Re-home them under the new operating model.

## Reform principle

Do not rebuild from scratch. Convert the current app into a software company OS shell first, then refactor module by module.

## Target product identity

**LedgerFlow Hub**

A compact software company operating system for a small product company that combines:

- Product management for software and games.
- Marketing and growth workflow.
- Sales/CRM pipeline.
- Accounting and finance control.
- Project and delivery tracking.
- Document and approval workflow.
- AI staff coordination.
- Data sandbox, simulation, charting, and model experiments.
- Integration hub for GitHub, Google Workspace, AI Gateway, Supabase, local tools, and future AI agents.
- Accounting product templates for construction, service, trading, and manufacturing businesses.

## Immediate P0 reform tasks

1. Make `Company OS` the default home screen.
2. Change navigation from `Bước/Giai đoạn` to software-company workspaces.
3. Add top-level `Product Studio`.
4. Add top-level `Marketing & Growth`.
5. Add top-level `Sales & CRM`.
6. Merge `HCNS - Hành chính` into `AI Nhân sự`.
7. Remove `Mua hàng - Kho - Dầu` from global top-level navigation.
8. Move construction-specific labels under `Product Studio > Accounting Product Templates > Construction` or `Projects & Delivery > Industry Templates > Construction`.
9. Create a visible `Analytics, Models & Sandbox` entry point.
10. Move Supabase/WASM technical controls out of the main landing area.
11. Keep AI Gateway, Integration Hub, Dev Handoff, and CI Doctor as admin/dev tools.
12. Add product copy that explains LedgerFlow is a software company hub, not only a construction accounting file.

## P1 reform tasks

1. Split `App.tsx` into app shell, navigation, home, and workspace renderer.
2. Create a module registry file so AI agents can add modules without editing huge UI blocks.
3. Split large business modules into smaller folders.
4. Add role-based views:
   - Founder / CEO
   - Product Manager
   - Developer / AI Developer
   - Marketing
   - Sales
   - Accounting
   - AI Nhân sự / Admin
   - Customer Support
   - Viewer / Boss
5. Add clear mock/sample data packs.
6. Add industry template packs:
   - Construction accounting.
   - Service accounting.
   - Trading accounting.
   - Manufacturing accounting.

## P2 reform tasks

1. Add real dashboard widgets and chart registry.
2. Add model registry for simulations.
3. Add workflow engine for approval and documents.
4. Add plugin/connector registry for future AI agents.
5. Add test data import/export templates.
6. Add marketing funnel and CRM analytics.
7. Add product analytics and release metrics.

## Non-negotiable rules for future AI agents

- Do not hard-code the whole product as construction accounting.
- Do not make warehouse/fuel a global top-level module.
- Do not keep `HCNS - Hành chính` separate from `AI Nhân sự`.
- Do not omit Marketing & Growth.
- Do not omit Sales & CRM.
- Do not omit Product Studio for software and games.
- Do not remove simulation, data science, sandbox, charting, or model modules.
- Do not turn the product into a generic ERP clone.
- Keep LedgerFlow as a software company hub with AI-first workflow support.
- Any construction-specific change must live under an industry template, not global navigation.
