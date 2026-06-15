# Accounting Vietnam Deep Dive Integration

## Files added

- `src/data/accountingVietnamDeepDive.ts`
- `src/components/AccountingVietnamDeepDivePanel.tsx`

## Goal

Add a new `VN Deep Dive` tab inside `src/components/AccountingVietnam.tsx` without rewriting the existing module.

## Patch steps

### 1. Add import

```ts
import AccountingVietnamDeepDivePanel from './AccountingVietnamDeepDivePanel';
```

### 2. Extend `AccountingTab`

```ts
  | 'deepdive'
```

### 3. Add tab label

```ts
  ['deepdive', 'VN Deep Dive'],
```

### 4. Render panel before the final boundary section

```tsx
      {tab === 'deepdive' && <AccountingVietnamDeepDivePanel />}
```

## Guardrails

- Do not rewrite `App.tsx`.
- Do not remove existing tabs.
- Keep the module offline-friendly.
- Keep content in `src/data` and rendering in `src/components`.

## Checks

Run:

```bash
npm run check:agentops-contracts
npm run lint
```
