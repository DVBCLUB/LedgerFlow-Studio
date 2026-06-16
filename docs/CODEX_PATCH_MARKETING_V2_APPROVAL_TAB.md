# Codex Patch — Add Approval Checklist tab to MarketingGrowthV2Workspace

Apply this small patch only. Do not edit App.tsx.

## Target file

`src/components/MarketingGrowthV2Workspace.tsx`

## Changes

1. Add import:

```tsx
import MarketingV2ApprovalChecklistPanel from './MarketingV2ApprovalChecklistPanel';
```

2. Extend `MarketingGrowthV2Tab` union:

```tsx
| 'approval'
```

3. Add tab item near Saved Artifacts / Rollout:

```tsx
{
  id: 'approval',
  label: 'Approval Checklist',
  note: 'Founder review gate before publishing marketing content.',
  icon: ClipboardCheck,
},
```

4. If the tab grid has a fixed xl column count, increase it by 1.

5. Add render block:

```tsx
{activeTab === 'approval' && <MarketingV2ApprovalChecklistPanel />}
```

## Checks

Run:

```bash
npm run lint
npm run build
```

## Guardrails

- Do not rewrite `App.tsx`.
- Do not change routes.
- Do not remove existing Marketing V2 tabs.
- Keep offline-first behavior.
