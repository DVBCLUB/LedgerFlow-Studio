# AgentOps Company OS Extension Map

This document maps the AgentOps extensions added while evolving LedgerFlow Studio into a solo-founder Company OS. It is intentionally documentation-first so future AI/code agents can continue incrementally without rebuilding the repo or losing the approval-first guardrails.

## Product boundary

LedgerFlow Studio is a learning, R&D, simulation, and Company OS workspace for a solo founder. It is not positioned as a production ERP/accounting system and must not promise to replace MISA, Bravo, or official accounting/legal advice.

## AgentOps Hub tabs

| Tab | Purpose | Local-first storage | External action policy |
| --- | --- | --- | --- |
| Daily Standup | Morning report for founder: work, approvals, risk, feedback, cost, audit | `ledgerflow_daily_standup_v1`, audit keys | Copy/save only. No auto-send to Telegram/Zalo until connector approval exists. |
| Workboard | Single work queue for AI staff | `ledgerflow_aiops_cards_v1`, `ledgerflow_aiops_audit_v1` | MEDIUM/HIGH work must wait for Approval Gate before external action. |
| Product Factory | Idea → Work Order → Code Plan → Approval → CI/PR → Release Audit | `ledgerflow_product_factory_state_v1`, workboard/approval keys | GitHub branch/commit/PR must be approval-first and dry-run/sandbox-first. |
| Tool Cards | Standardizes risky tool actions as tool cards | `ledgerflow_tool_cards_v1`, approval/audit keys | Every tool card has sandbox rule, approval rule, blocked actions, audit event. |
| Prompt Pack | Versioned prompt library for AI staff | `ledgerflow_prompt_pack_v1` | Copy/export only. Prompts must include founder-review guardrails. |
| Company Memory | Markdown snapshot for future AI context | Reads founder/workboard/audit local keys | Copy snapshot only. Store in `docs/snapshots/` manually or via approved GitHub flow. |
| AI Cost | Lightweight AI cost/token estimate | `ledgerflow_ai_manual_usage_v1` | Local estimate only. Provider rates are editable placeholders. |
| Feedback | Customer feedback loop | `ledgerflow_customer_feedback_v1`, workboard/audit keys | Feedback can be converted to WorkCard; risky feedback goes to approval/workboard first. |
| Runtime / Skills / AI Staff / Approvals / Connectors / Review Mode | Existing AgentOps core | Existing AgentOps keys | Keep approval/audit behavior consistent. |

## Core guardrails

1. Founder is the final approver.
2. Low-risk actions can run in sandbox/dry-run and still require audit logging.
3. Medium/high-risk actions must enter Approval Gate before external execution.
4. No API key, secret, token, or private credential can be hardcoded or written to audit logs.
5. New modules must remain offline-ready and localStorage-first unless a backend already exists.
6. New accounting/audit features must be framed as simulation, case study, checklist, or calculator.
7. Construction-specific wording should stay inside an industry template, not global navigation.

## Manual test checklist

Run these before shipping any AgentOps change:

```bash
npm run lint
npm run build
```

Then verify in the UI:

1. Open AgentOps Hub.
2. Daily Standup renders and can copy/save a markdown report.
3. Workboard shows five statuses: Inbox, Planning, Waiting Approval, Ready, Done.
4. Product Factory can create a WorkCard and send an approval request.
5. Tool Cards can copy a runbook and send an approval request.
6. Prompt Pack can add a custom prompt and export JSON.
7. Company Memory can copy a markdown snapshot.
8. AI Cost can add a manual usage entry and export JSON.
9. Feedback can classify a comment and convert it to Workboard.
10. Approval Gate shows pending requests from Product Factory or Tool Cards.
11. Connector actions do not run destructive external actions without founder approval.
12. Browser console has no React/TypeScript runtime errors.

## Next incremental build order

1. Keep CI green before adding more UI.
2. Add type-safe shared schemas for localStorage keys currently duplicated across tabs.
3. Add a small `src/components/agent-ops/lib/` helper layer for `readLocal`, `writeLocal`, and audit append.
4. Add tests for Approval Gate rules and Tool Card risk classification.
5. Wire server-side unified audit log into more approved backend actions.
6. Only after that, deepen GitHub connector UX and Knowledge Library/RAG.

## Handoff note for future AI agents

Do not rebuild AgentOpsHub from scratch. Extend existing tabs in small commits. If CI fails, fix type-check/build first and pause feature additions. Prefer documentation, schemas, and test coverage over adding more large tabs.
