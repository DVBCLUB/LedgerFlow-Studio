# LedgerFlow Studio - Company OS Guardrails

Company OS la module trong Founder Labs, khong phai thay the cho app chinh LedgerFlow.

Company OS is a Founder Labs module, not a replacement for the main LedgerFlow app.

## Module nay dung de lam gi

Company OS chuyen hoa bang danh gia Claude thanh dashboard van hanh noi bo cho workflow solo-founder:

- Company OS scorecard
- AI Workforce roles va prompts
- P0 roadmap
- Revenue / MRR simulator
- Weekly operations rhythm
- GTM Vietnam plan

## Vi tri module

- Component: `src/components/CompanyOS.tsx`
- Entry point: `src/components/FounderLabsDock.tsx`
- Lab id: `company_os`
- Visible label: `Company OS`

Module duoc mo qua nut noi **Labs**. Bat buoc giu lazy-load thong qua `FounderLabsDock`.

## Khong duoc pha vo cau truc cu

Khi cai tien module nay, bat buoc giu cac quy tac sau:

1. Khong doi ten hoac xoa lab ids hien co neu chua them migration.
2. Khong thay route app chinh bang `CompanyOS`.
3. Khong bien `CompanyOS` thanh `App()` hoac root component doc lap.
4. Khong xoa module Founder Labs hien co de nhuong cho Company OS.
5. Khong doi localStorage keys hien co neu backup/restore va migration chua cap nhat.
6. Giu Company OS la module bo sung ben trong Founder Labs.
7. Dam bao `npm run check:founder-labs` pass truoc khi release.

## Kiem tra tinh toan ven

`CompanyOS` da duoc dua vao `scripts/check-founder-labs.mjs`. Script xac minh:

- `src/components/CompanyOS.tsx` ton tai.
- Component co default export.
- `FounderLabsDock` lazy-load dung component.
- Dock co tab object `company_os`.
- `renderLab()` render ro rang `<CompanyOS />` cho `company_os`.

## Huong cai tien an toan

Cac cai tien nen uu tien:

- Tach static data arrays lon tu `CompanyOS.tsx` sang `src/data/companyOS.ts`.
- Them ho tro export/print cho roadmap va weekly plan.
- Chi them localStorage persistence tuy chon cho cac truong nguoi dung chinh sua.
- Them tests hoac script checks truoc khi mo rong persistence.

Tranh rewrite lon. Thay doi nho theo module an toan hon cho repository nay.
