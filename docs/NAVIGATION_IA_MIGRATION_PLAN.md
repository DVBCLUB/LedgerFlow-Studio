# Company OS Navigation / IA Migration Plan

This plan turns the current AgentOps-heavy hub into a cleaner Company OS navigation model without deleting working modules.

## Guardrails

- Do not remove existing tabs until CI is green and the replacement route is verified.
- Keep construction/accounting-specific workflows as Industry Templates, not global app defaults.
- Keep approval-first, audit-first, sandbox-first rules visible in every lane that can trigger external work.
- Every migration step must be reversible by restoring the previous AgentOpsHub tab list.

## Target top-level lanes

1. Command Center
2. Product Studio
3. Marketing & Growth
4. Sales & CRM
5. Finance & Accounting
6. Projects & Delivery
7. AI Workforce / AgentOps
8. Documents & Approval
9. Analytics & Sandbox
10. Integration Hub
11. System Settings
12. Industry Templates

## Current-to-target mapping

| Current module | Target lane | Notes |
| --- | --- | --- |
| Brief Tracker | Command Center | Keep as roadmap/status panel. |
| Daily Standup | Command Center | Founder morning summary. |
| Founder OS | Command Center | Dashboard/work orders/risk summary. |
| Workboard | AI Workforce / AgentOps | Shared execution board. |
| Task Queue | AI Workforce / AgentOps | AI employee task intake. |
| Product Factory | Product Studio | Idea to work order to release audit. |
| GitHub PR Control | Product Studio + Integration Hub | Phase 1 connector UI. |
| Growth Studio | Marketing & Growth | Campaign/content experiments. |
| Sales CRM | Sales & CRM | Founder-led sales pipeline. |
| Documents | Documents & Approval | Decision records, SOPs, contracts, release notes. |
| Release Notes | Documents & Approval | Release governance. |
| QA Matrix | Documents & Approval | Release readiness evidence. |
| Analytics Sandbox | Analytics & Sandbox | Hypothesis and KPI simulations. |
| Learning Games | Analytics & Sandbox | Training simulators. |
| Knowledge Base | Documents & Approval + AI Workforce | Source-controlled memory before AI use. |
| RAG Search | AI Workforce / AgentOps | Context retrieval with citations. |
| Company Memory | Command Center + AI Workforce | Snapshot summary. |
| Memory Versions | System Settings + AI Workforce | Versioned memory governance. |
| Secrets Vault | System Settings + Integration Hub | Secret metadata only; never values. |
| Connectors | Integration Hub | Registry health and handoff. |
| Runtime / Skills / AI Staff | AI Workforce / AgentOps | Agent capabilities. |
| Industry Templates | Industry Templates | Construction/accounting templates live here. |
| Navigation Map | System Settings | IA migration tracker. |

## Phase 1: keep current hub, group lanes

Already implemented: AgentOpsHub groups tabs into Command, Build & Growth, Governance, Knowledge, Runtime.

Next hardening tasks:

- Add a short lane description under each group.
- Highlight lane risk level when a group contains Approval/GitHub/Secrets actions.
- Keep active tab state stable when switching groups.

## Phase 2: create top-level Company OS shell

Create a shell component that routes to lanes rather than showing every tab at once.

Suggested component:

```text
src/components/company-os/CompanyOSShell.tsx
```

Suggested lane config:

```text
src/components/company-os/companyOsLanes.ts
```

The config should map:

```text
laneId -> label -> description -> modules -> riskPolicy
```

## Phase 3: move industry-specific wording

Search for global labels using:

```text
cong trinh
construction
xay dung
ke toan cong trinh
Trung Hai
```

Move these into Industry Templates unless the screen is explicitly Finance & Accounting or Projects & Delivery.

## Phase 4: acceptance checklist

- Top-level user can understand the app without opening AgentOpsHub.
- Construction is a template, not the whole app identity.
- Approval Gate remains easy to access from every lane.
- GitHub PR creation remains behind founder phrase and Approval Gate.
- RAG context still requires Approved sources.
- CI passes after each migration step.

## Rollback

If a lane migration breaks UI, keep the old AgentOpsHub mounted and hide the new shell behind a local-only flag until fixed.
