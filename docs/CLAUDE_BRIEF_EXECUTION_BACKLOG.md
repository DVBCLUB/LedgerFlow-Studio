# Claude Brief Execution Backlog

This document tracks the remaining Claude build brief work for LedgerFlow Studio / Company OS.

## Operating guardrails

- Company OS first, not ERP first.
- Sandbox-first, approval-first, audit-first.
- No hardcoded secrets.
- No frontend storage of real API keys.
- Keep CI green before adding more feature surface.
- Prefer local-only prototypes before backend or external writes.
- Any GitHub/Firebase/Google write action must go through Approval Gate first.

## Completed or mostly completed

### AgentOps foundation

- Founder Approval Gate.
- Workboard.
- AI Staff / People roles.
- Connector policy board.
- Tool Cards.
- Product Factory.
- Prompt Pack.
- AI Cost Tracker.
- Feedback Loop.
- Daily Standup.
- Company Memory.
- Knowledge Base.
- Memory Versions.
- Task Queue.
- Founder OS.
- Industry Templates.
- Navigation Map.
- Growth Studio.
- Sales CRM.
- Documents & Approval.
- Analytics Sandbox.
- Secrets Vault policy.
- Learning Games.
- QA Test Matrix.
- GitHub PR Control.
- Release Notes.
- Brief Tracker.

### Shared safety/maintenance

- Shared AgentOps localStorage helpers.
- Shared audit helper.
- Approval key normalization.
- WorkCard schema normalization.
- Legacy Workboard card hardening.
- Unified audit log backend skeleton.

## Remaining P0 work

### 1. CI stabilization

Goal: keep the main `LedgerFlow Studio CI` workflow green before more feature work.

Tasks:

- Read failing Actions logs when available.
- Fix TypeScript errors first.
- Fix runtime schema issues from legacy localStorage payloads.
- Keep new commits small and isolated.
- Avoid adding more large UI tabs until CI is green.

Acceptance:

- `npm run lint` passes.
- `npm run build` passes.
- Main GitHub Actions workflow is green.

### 2. AgentOpsHub tab sprawl cleanup

Goal: too many tabs now exist in one horizontal tab list. Convert to grouped sections.

Suggested groups:

- Command: Daily Standup, Founder OS, Brief Tracker.
- Execution: Workboard, Task Queue, Product Factory, Tool Cards.
- Knowledge: Company Memory, Knowledge Base, Memory Versions, Prompt Pack.
- Go-to-market: Growth Studio, Sales CRM.
- Controls: Approvals, Documents, Secrets Vault, QA Matrix, Release Notes.
- Platform: Connectors, GitHub PR, Runtime, Skills.
- Sandbox: Analytics Sandbox, Learning Games, Industry Templates, Navigation Map.

Acceptance:

- AgentOpsHub is easier to navigate.
- Existing tabs still work.
- No route/state regression.

### 3. GitHub connector end-to-end

Goal: move from PR plan to controlled real GitHub workflow.

Phases:

1. Approval request only.
2. Create branch after approval.
3. Commit file after approval.
4. Create draft PR after approval.
5. Read CI status.
6. Show PR review packet in app.
7. Require final founder approval before merge.

Acceptance:

- No GitHub write happens without Approval Gate status `Approved`.
- Every write action logs audit evidence.
- Rollback note exists before PR is created.

### 4. Integration registry UI hardening

Goal: ConnectorsTab should rely on backend registry when available and fallback safely when unavailable.

Tasks:

- Show registry status clearly.
- Show last event log.
- Test connector with loading/error states.
- Add connector capability cards.
- Make connector handoff copyable.

Acceptance:

- Backend up: shows live `/api/integrations` registry.
- Backend down: shows fallback policy board without crashing.

## Remaining P1 work

### 5. Navigation / IA cleanup outside AgentOpsHub

Goal: app-level navigation should reflect Company OS lanes.

Target lanes:

- Command Center.
- Product Studio.
- Marketing & Growth.
- Sales & CRM.
- Finance & Accounting.
- Projects & Delivery.
- AI Workforce / AgentOps.
- Documents & Approval.
- Analytics & Sandbox.
- Integration Hub.
- System Settings.
- Industry Templates.

Acceptance:

- Construction/accounting-specific wording becomes an industry template, not the global app identity.

### 6. Knowledge/RAG next step

Goal: move from note-based knowledge to searchable context packs.

Phases:

1. Local knowledge notes.
2. Approved-only context export.
3. Simple keyword search.
4. File upload metadata.
5. Local JSON index.
6. Optional vector index later.

Acceptance:

- AI context uses only Approved knowledge by default.
- Draft knowledge is not included unless explicitly selected.

### 7. Founder OS deepening

Goal: make Founder OS a real cockpit, not only overview.

Tasks:

- Add weekly review.
- Add blockers list.
- Add decision log.
- Add burn/risk board.
- Add next-best-action generator prompt.

Acceptance:

- Founder can open one tab and know what to approve, fix, ship, or ignore today.

### 8. Release governance

Goal: connect QA Matrix, GitHub PR Control, Workboard, and Release Notes.

Tasks:

- Show release readiness score.
- Block release if QA has Fail/Blocked.
- Require rollback plan.
- Require evidence.
- Require founder approval for high-risk release.

Acceptance:

- Release note can be generated from current repo/workboard state.

## Remaining P2 work

### 9. Learning games expansion

Potential simulations:

- Tax Filing Simulator.
- Bank Reconciliation Race.
- Fraud Triangle Detective.
- Startup Runway Survivor.
- Cash Flow Crisis Drill.
- Construction Cost Overrun Simulator.

### 10. Industry template packs

Potential packs:

- Construction accounting.
- Solo SaaS.
- Agency/services.
- Trading/distribution.
- Manufacturing light.

### 11. Sales and Growth analytics

Tasks:

- Add campaign metrics history.
- Add lead conversion summary.
- Add sales forecast.
- Connect feedback loop to growth learnings.

## Do-not-do-yet list

- Do not turn the app into a full ERP yet.
- Do not add paid API dependencies without explicit approval.
- Do not store real secrets in frontend/localStorage.
- Do not auto-merge PRs.
- Do not make external writes without Approval Gate.
- Do not add more large tabs before CI is green.

## Suggested next execution order

1. Fix CI/log issues until green.
2. Group AgentOpsHub tabs to reduce UI sprawl.
3. Harden ConnectorsTab live registry UI.
4. Implement GitHub PR end-to-end phase 1 and 2.
5. Deepen Release governance.
6. Improve Knowledge/RAG search.
7. Then continue growth/sales/industry/game expansion.
