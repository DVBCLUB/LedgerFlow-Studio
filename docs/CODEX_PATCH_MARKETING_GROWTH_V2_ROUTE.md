# Codex patch: wire Marketing Growth V2 route

Use this only for the final App.tsx wiring. Do not rewrite App.tsx.

## Goal
Expose `src/components/MarketingGrowthV2Workspace.tsx` through the existing SPA router.

## Current files already done
- `src/components/MarketingGrowthV2Workspace.tsx`
- `src/components/LandingPageCopyLab.tsx`
- `src/components/EmailSequenceBuilder.tsx`
- `src/components/PLGConversionHub.tsx`
- `src/components/MarketingCommandCenter.tsx`
- `src/data/simulationRegistry.ts` already has `marketing_growth_v2`

## Patch App.tsx minimally

### 1. Lazy import
Add near other marketing lazy imports:

```tsx
const MarketingGrowthV2Workspace = React.lazy(() => import('./components/MarketingGrowthV2Workspace'));
```

### 2. TabType
Add this id to the `TabType` union:

```ts
| 'marketing_growth_v2'
```

### 3. Mobile select
Inside marketing optgroup, add one option before `marketing_suite` or after `seo_strategy`:

```tsx
<option value="marketing_growth_v2">Marketing Growth V2: Command Center + Copy + Email + PLG</option>
```

### 4. Sidebar button
In the marketing/launch sidebar group, add a button that calls:

```tsx
onClick={() => setActiveSegment('marketing_growth_v2')}
```

Label suggestion:

```tsx
<span>Marketing Growth V2</span>
<span className="bg-purple-500/15 text-purple-300 text-[8px] font-bold px-1 py-0.5 rounded leading-none uppercase">V2</span>
```

Use the same button style pattern as `marketing_suite` or `outbound_hub`.

### 5. Render block
Inside the Suspense render block, add:

```tsx
{activeSegment === 'marketing_growth_v2' && <MarketingGrowthV2Workspace />}
```

## Checks
Run:

```bash
npm run lint
npm run check:simulations
npm run build
```

## Guardrails
- Do not rewrite App.tsx.
- Do not change existing routes.
- Do not remove any old marketing module.
- Do not add dependencies.
- Keep HashRouter.
