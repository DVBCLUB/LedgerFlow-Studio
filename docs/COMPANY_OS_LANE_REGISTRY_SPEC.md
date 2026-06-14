# Company OS Lane Registry Spec

This note defines the next IA refactor target after `agentOpsNavigation.ts`.

## Goal

Create a single source of truth for the high-level Company OS lanes before restructuring the full app navigation.

## Lanes

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

## Proposed file

```txt
src/config/companyOSNavigation.ts
```

## Proposed shape

```ts
type CompanyOSLaneStatus = 'Core' | 'Next' | 'Template' | 'Later';

type CompanyOSLane = {
  id: string;
  label: string;
  status: CompanyOSLaneStatus;
  owner: string;
  purpose: string;
  modules: string[];
  routeHint: string;
};
```

## Migration rules

- Keep `AgentOpsHub` grouped by `agentOpsNavigation.ts`.
- Add a higher-level lane registry for the full app.
- Do not remove existing routes until the registry is visible and tested.
- Keep construction workflows under `Industry Templates`, not as the default Company OS core.
- Keep changes small until CI is stable.

## First implementation step

Add the config file only. Do not mount it into runtime UI until after CI is green.

## Acceptance checklist

- The lane registry has all 12 lanes.
- The registry exports lane id/status types.
- The registry maps current AgentOps modules into future lanes.
- Contract check verifies that required lane labels exist.
