# LedgerFlow Release Guard Checklist

Mục tiêu: không deploy bản mới nếu làm hỏng mô phỏng, Founder Labs, dữ liệu localStorage hoặc khả năng build.

## 1. Lệnh kiểm tra bắt buộc

Chạy trước khi merge/deploy:

```bash
npm run check:env
npm run check:simulations
npm run check:founder-labs
npm run lint
npm run build
npm run check:runtime
```

`npm run build` đã gọi `prebuild`, nên sẽ tự chạy các guard nền tảng gồm env, simulations, founder labs, desktop và offline readiness.

## 2. Simulation Guard

Không được release nếu:

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

Không được release nếu:

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

## 4. Founder Labs hiện đang được bảo vệ

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

## 5. Backup keys phải giữ

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

Nếu đổi key, phải viết migration hoặc giữ backward compatibility.

## 6. GitHub Actions

Workflow nhẹ:

```txt
.github/workflows/release-guard.yml
```

Workflow desktop nặng vẫn giữ:

```txt
.github/workflows/build-desktop.yml
```

Release Guard chạy trên PR/push vào `main` khi có thay đổi ở `src`, `scripts`, package hoặc workflow.

## 7. Quy tắc trước khi thêm module mới

1. Tạo component riêng, không nhồi thêm vào `AccountingVietnam.tsx` nếu không bắt buộc.
2. Gắn component vào `FounderLabsDock` hoặc registry rõ ràng.
3. Nếu có localStorage key, thêm vào `LabsBackupRestore`.
4. Nếu là mô phỏng/learning lab quan trọng, thêm vào `scripts/check-founder-labs.mjs` hoặc `simulationRegistry.ts`.
5. Chạy Release Guard trước khi deploy.

## 8. Không được phá định vị sản phẩm

LedgerFlow-Studio là learning + R&D + simulation + founder operating system. Không được sửa thành ERP thay MISA/Bravo, không được ẩn mô hình mô phỏng, không được làm các lab bị mất đường truy cập.
