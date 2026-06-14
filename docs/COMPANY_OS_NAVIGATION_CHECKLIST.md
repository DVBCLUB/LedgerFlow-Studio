# Company OS Navigation Checklist

This checklist protects the Company OS navigation map after the Claude brief refactor.

## Source of truth

Main registry:

```text
src/config/companyOSNavigation.ts
```

The registry should contain exactly 12 lanes.

## Required lanes

- Command Center
- Product Studio
- Marketing & Growth
- Sales & CRM
- Finance & Accounting
- Projects & Delivery
- AI Workforce / AgentOps
- Documents & Approval
- Analytics & Sandbox
- Integration Hub
- System Settings
- Industry Templates

## Manual check before changing navigation

1. Keep all 12 lanes unless the Founder explicitly approves removal.
2. Do not move construction-specific items back into the core Company OS lanes.
3. Keep construction/accounting-by-project under Industry Templates.
4. Keep AI execution, approval, audit, prompts and memory under AI Workforce / AgentOps.
5. Keep release notes, QA, document review and approval records under Documents & Approval.
6. Keep sandbox simulations and KPI experiments under Analytics & Sandbox.
7. Keep connector setup and health under Integration Hub.

## Related files

```text
src/config/companyOSNavigation.ts
src/components/agent-ops/agentOpsNavigation.ts
src/components/agent-ops/tabs/NavigationMapTab.tsx
docs/NAVIGATION_IA_MIGRATION_PLAN.md
```

## Acceptance criteria

- Navigation Map renders from `companyOSLanes`.
- AgentOpsHub renders from `agentOpsTabGroups`.
- Industry-specific workflows remain templates, not core app assumptions.
- New tabs must be mapped to a Company OS lane before release.
