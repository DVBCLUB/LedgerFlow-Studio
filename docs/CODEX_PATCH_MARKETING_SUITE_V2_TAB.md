# Codex Patch — Add Marketing V2 tab inside MarketingSuite

Purpose: expose the already-built Marketing Growth V2 workspace through the existing `marketing_suite` route, without editing `App.tsx`.

## Existing files

- `src/components/MarketingGrowthV2Workspace.tsx`
- `src/components/MarketingCommandCenter.tsx`
- `src/components/LandingPageCopyLab.tsx`
- `src/components/EmailSequenceBuilder.tsx`
- `src/components/PLGConversionHub.tsx`
- `src/data/marketingV2RolloutStatus.ts`

## Patch target

`src/components/MarketingSuite.tsx`

## Required minimal changes

1. Add import near the existing imports:

```tsx
import MarketingGrowthV2Workspace from './MarketingGrowthV2Workspace';
```

2. Extend the `activeSubTab` state union:

```tsx
const [activeSubTab, setActiveSubTab] = useState<
  'campaigns' | 'builder' | 'segments' | 'ab_roi' | 'gdpr' | 'v2_workspace'
>('campaigns');
```

3. Add one subnav item after GDPR:

```tsx
{ id: 'v2_workspace', label: 'V2 Growth OS', icon: Sparkles },
```

4. Add render block before the closing wrapper div:

```tsx
{activeSubTab === 'v2_workspace' && (
  <div className="mt-6 animate-fade-in">
    <MarketingGrowthV2Workspace />
  </div>
)}
```

## Guardrails

- Do not rewrite `MarketingSuite.tsx`.
- Do not edit `App.tsx` in this task.
- Do not remove any existing tab.
- Do not add dependencies.
- Keep all old campaigns/builder/segments/ab_roi/gdpr tabs working.

## Checks

Run:

```bash
npm run lint
npm run build
```

If this passes, the user can open the existing `marketing_suite` route and use Marketing V2 from the new `V2 Growth OS` tab.
