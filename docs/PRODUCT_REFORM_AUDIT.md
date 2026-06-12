# LedgerFlow Studio - Product Reform Audit

## Current problem

LedgerFlow Studio is drifting into several mixed identities at the same time:

1. A Vietnamese accounting learning/demo app.
2. A construction accounting workbook.
3. A solo-founder AI lab.
4. A data science / simulation sandbox.
5. A desktop integration hub.

All of these are valuable, but the current UI makes them look like unrelated fragments. The product should be repositioned as a compact **Company Operating System** for SMEs, where accounting, projects, finance, people, documents, AI agents, simulations, and integrations are departments inside one company.

## User correction that must be respected

The product is **not only construction accounting**.

Construction/project accounting is only one project template / industry pack. It must not dominate labels, dashboards, navigation, or global product language.

Correct framing:

- LedgerFlow = company operating system.
- Project accounting = one module under Project Portfolio / Industry Templates.
- Construction = one optional template inside project accounting.
- AI, sandbox, charts, models, simulation, and data lab are core differentiators, not side toys.

## What is currently wrong

### 1. Navigation is too linear and course-like

The current main app uses stage labels such as `Bước 1`, `Bước 2`, `Giai đoạn 3`, etc. This makes the app feel like a course or pitch deck, not a business system.

Target: navigation should use company departments and workspaces:

- Command Center
- Finance & Accounting
- Project Portfolio
- Procurement & Inventory
- HR & Payroll
- Sales / CRM
- Documents & Approval
- Analytics / ML
- Simulation Sandbox
- AI Workforce
- Integration Hub
- System Settings

### 2. Construction language is over-weighted

Any repeated global wording around `công trình`, `kế toán công trình`, or construction-specific workflows should be moved under an optional industry template.

Target wording:

- Use `Dự án` for generic projects.
- Use `Công trình` only inside `Mẫu ngành xây dựng`.
- Use `Chi phí dự án` rather than `chi phí công trình` at global level.

### 3. Simulation/model/sandbox content exists but is buried

Existing modules include market survey simulator, WASM SQLite, Python sandbox, game/ML workbench, advanced AI, and custom data workbench. However, the product does not surface them as a coherent `Simulation & Analytics Lab`.

Target: create a clear top-level cluster:

- Data Sandbox
- SQL Sandbox
- Python Sandbox
- Simulation Models
- Scenario Planning
- Forecasting / ML
- Charts & Dashboards
- What-if model builder

### 4. App shell is too noisy

The header and home content contain too much technical detail. A normal company user should first see what to do today, not Supabase, WASM, RLS, and build/runtime language.

Target: hide technical panels behind admin/dev mode:

- Supabase config -> System Settings / Cloud Sync
- AI key vault -> AI Gateway settings
- GitHub/CI -> DevOps tools
- SQL/WASM terminal -> Simulation Sandbox

### 5. Modules are functionally good but not organized by business workflow

Existing feature components should be kept but re-grouped. Do not delete useful modules. Re-home them under the new operating model.

## Reform principle

Do not rebuild from scratch. Convert the current app into a company OS shell first, then refactor module by module.

## Target product identity

**LedgerFlow Hub**

A compact company operating system for Vietnamese SMEs that combines:

- Accounting and finance control.
- Project and cost tracking.
- Document and approval workflow.
- Internal audit and risk control.
- AI assistant and AI staff coordination.
- Data sandbox, simulation, charting, and model experiments.
- Integration hub for GitHub, Google Workspace, MISA/SmartPro, Supabase, local tools, and future AI agents.

## Immediate P0 reform tasks

1. Make `Company OS` the default home screen.
2. Change navigation from `Bước/Giai đoạn` to business departments.
3. Move construction-specific labels under `Project Portfolio > Industry Templates > Construction`.
4. Create a visible `Simulation & Analytics Lab` entry point.
5. Move Supabase/WASM technical controls out of the main landing area.
6. Keep AI Gateway, Integration Hub, Dev Handoff, and CI Doctor as admin/dev tools.
7. Add product copy that explains LedgerFlow is a company hub, not only a construction accounting file.

## P1 reform tasks

1. Split `App.tsx` into app shell, navigation, home, and workspace renderer.
2. Create a module registry file so AI agents can add modules without editing huge UI blocks.
3. Split large business modules into smaller folders.
4. Add role-based views:
   - Owner / CEO
   - Accounting
   - Warehouse / Procurement
   - HR / Admin
   - Project Manager
   - Boss / Viewer
   - Developer / Admin
5. Add clear mock/sample data packs.

## P2 reform tasks

1. Add real dashboard widgets and chart registry.
2. Add model registry for simulations.
3. Add workflow engine for approval and documents.
4. Add plugin/connector registry for future AI agents.
5. Add test data import/export templates.

## Non-negotiable rules for future AI agents

- Do not hard-code the whole product as construction accounting.
- Do not remove simulation, data science, sandbox, charting, or model modules.
- Do not turn the product into a generic ERP clone.
- Keep LedgerFlow as a company hub with AI-first workflow support.
- Any construction-specific change must live under an industry template, not global navigation.
