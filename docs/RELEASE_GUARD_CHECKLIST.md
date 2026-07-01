# LedgerFlow - Release Guard Checklist

Muc tieu: khong deploy ban moi neu lam hong mo phong, Founder Labs, du lieu localStorage hoac kha nang build.

## 1. Lenh kiem tra bat buoc

Chay truoc khi merge/deploy:

```bash
npm run check:env
npm run check:simulations
npm run check:founder-labs
npm run lint
npm run build
npm run check:runtime
```

`npm run build` da goi `prebuild`, nen se tu chay cac guard nen tang gom env, simulations, founder labs, desktop va offline readiness.

Gate toi thieu truoc release:

- Khong bo qua `npm run check:runtime`.
- Neu thay doi desktop wrapper hoac icon, chay them `npm run check:desktop`.

## 2. Simulation Guard

Khong duoc release neu:

- thiếu `src/data/simulationRegistry.ts`;
- module trong registry không có component tương ứng;
- component mô phỏng không export;
- `App.tsx` không lazy-load module quan trọng;
- route/tab trong registry không có trong app.

Script liên quan:

```bash
npm run check:simulations
```

## 3. Founder Labs Guard

Khong duoc release neu:

- `FounderLabsDock` không được render từ `main.tsx`;
- thiếu component lab;
- lab không có default export;
- lab không được lazy-load trong `FounderLabsDock`;
- thiếu tab id hoặc label trong Dock;
- localStorage key quan trọng không nằm trong Backup / Restore;
- UI người dùng quay lại kiểu label có tiền tố `CT1 Guard`, `CT1 Strategic Labs`, `CT1 Model health`.

Script liên quan:

```bash
npm run check:founder-labs
```

## 4. Founder Labs hien dang duoc bao ve

- Experiment Dashboard
- AI Staff Board
- Content Repurpose
- Synthetic Survey
- A/B Simulation
- MoR Readiness
- Case Bank
- Audit Game
- Monthly Review
- One-Page Report
- Weekly Actions
- Daily Standup
- Finance Lab
- Tool Budget
- Tool Cancel Plan
- Lead Board
- Persona Interview
- Decision Log
- Strategic Labs
- Backup / Restore

## 5. Backup keys phai giu

- `ledgerflow-persona-interviews-v1`
- `ledgerflow-distribution-leads-v1`
- `ledgerflow-experiment-decisions-v1`
- `ledgerflow-tool-budget-ledger-v1`
- `ledgerflow-weekly-action-planner-v1`
- `ledgerflow-daily-founder-standup-v1`
- `ledgerflow-ai-staff-assignment-v1`
- `ledgerflow-content-repurpose-board-v1`
- `ledgerflow-synthetic-survey-builder-v1`
- `ledgerflow-ab-simulation-lab-v1`
- `ledgerflow-mor-readiness-checklist-v1`
- `ledgerflow-payment-path-v1`

Neu doi key, phai viet migration hoac giu backward compatibility.

## 6. GitHub Actions

Workflow nhe:

```txt
.github/workflows/release-guard.yml
```

Workflow desktop nang van giu:

```txt
.github/workflows/build-desktop.yml
```

Release Guard chay tren PR/push vao `main` khi co thay doi o `src`, `scripts`, package hoac workflow.

## 7. Quy tac truoc khi them module moi

1. Tạo component riêng, không nhồi thêm vào `AccountingVietnam.tsx` nếu không bắt buộc.
2. Gắn component vào `FounderLabsDock` hoặc registry rõ ràng.
3. Nếu có localStorage key, thêm vào `LabsBackupRestore`.
4. Nếu là mô phỏng/learning lab quan trọng, thêm vào `scripts/check-founder-labs.mjs` hoặc `simulationRegistry.ts`.
5. Chạy Release Guard trước khi deploy.

## 8. Khong duoc pha dinh vi san pham

LedgerFlow-Studio la learning + R&D + simulation + founder operating system. Khong duoc sua thanh ERP thay MISA/Bravo, khong duoc an mo hinh mo phong, khong duoc lam cac lab bi mat duong truy cap.
