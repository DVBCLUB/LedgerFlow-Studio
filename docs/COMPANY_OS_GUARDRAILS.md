# LedgerFlow Studio — Company OS Guardrails

Company OS is a Founder Labs module, not a replacement for the main LedgerFlow app.

## What this module is

Company OS converts the Claude evaluation board into an internal operating dashboard for the solo-founder workflow:

- Company OS scorecard
- AI Workforce roles and prompts
- P0 roadmap
- Revenue / MRR simulator
- Weekly operations rhythm
- GTM Vietnam plan

## Where it lives

- Component: `src/components/CompanyOS.tsx`
- Entry point: `src/components/FounderLabsDock.tsx`
- Lab id: `company_os`
- Visible label: `Company OS`

The module is opened through the floating **Labs** button. It must remain lazy-loaded through `FounderLabsDock`.

## Do not break the old structure

When improving this module, keep these rules:

1. Do not rename or remove existing lab ids unless a migration is also added.
2. Do not replace the main app route with `CompanyOS`.
3. Do not convert `CompanyOS` into `App()` or a standalone root component.
4. Do not remove existing Founder Labs modules to make room for Company OS.
5. Do not change existing localStorage keys unless backup/restore and migration are updated.
6. Keep Company OS as an additive module under Founder Labs.
7. Keep `npm run check:founder-labs` passing before release.

## Integrity checks

`CompanyOS` is included in `scripts/check-founder-labs.mjs`. The check confirms:

- `src/components/CompanyOS.tsx` exists.
- The component has a default export.
- `FounderLabsDock` lazy-loads it.
- The dock contains the `company_os` tab object.
- `renderLab()` explicitly renders `<CompanyOS />` for `company_os`.

## Safe improvement path

Preferred next improvements:

- Move large static data arrays from `CompanyOS.tsx` into `src/data/companyOS.ts`.
- Add export/print support for the roadmap and weekly plan.
- Add optional localStorage persistence only for user-edited fields.
- Add tests or script checks before adding persistence.

Avoid large rewrites. Small module-level changes are safer for this repository.
