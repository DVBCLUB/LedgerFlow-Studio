# AccountingVietnam Refactor Safety Report

> Mục tiêu: tách dần `src/components/AccountingVietnam.tsx` mà không phá mô hình mô phỏng, Founder Labs, dữ liệu localStorage, hoặc UI hiện tại.

## 1. Nguyên tắc bắt buộc

- Không rewrite toàn bộ `AccountingVietnam.tsx` trong một lần.
- Không đổi ý nghĩa sản phẩm thành ERP thay MISA/Bravo.
- Không ẩn hoặc xóa các mô hình, simulator, score lab, decision log, Founder Labs.
- Không đổi storage key nếu chưa có migration.
- Không đổi công thức nhạy cảm nếu chưa cập nhật test/guard.
- Không thêm prefix `CT1` vào UI người dùng như `CT1 Guard`, `CT1 Strategic Labs`, `CT1 Model health`.

## 2. Công thức đã được bảo vệ

Các công thức nền đã được tách sang:

```txt
src/utils/accountingVietnamCalculations.ts
```

Các hàm/key cần giữ ổn định:

```txt
money()
calculateBudgetRisk()
calculateFounderSimulation()
calculateProductIdeaScore()
FOUNDER_DECISION_LOG_STORAGE_KEY
```

Storage key quan trọng:

```txt
ledgerflow-founder-decision-log-v1
```

## 3. Lệnh kiểm tra bắt buộc trước khi refactor

Chạy trước khi sửa:

```bash
npm run check:env
npm run check:simulations
npm run check:founder-labs
npm run check:accounting-calculations
npm run lint
npm run build
```

Nếu một lệnh fail, không refactor tiếp.

## 4. Migration công thức

Đã có script hỗ trợ:

```bash
npm run migrate:accounting-calculations
```

Sau khi chạy migration, bắt buộc chạy:

```bash
npm run check:accounting-calculations
npm run build
```

Nếu build fail, rollback file `src/components/AccountingVietnam.tsx` về commit trước đó.

## 5. Thứ tự tách module an toàn

Tách theo thứ tự nhỏ, mỗi bước một commit riêng:

1. `AccountingVietnam.types.ts`  
   Chỉ chứa type `AccountingTab`, `Scenario`, `ProductIdea`, `DecisionLogEntry` nếu cần.

2. `AccountingVietnam.constants.ts`  
   Chỉ chứa `TAB_LABELS`, `SCENARIOS`, `PRODUCT_IDEAS`, danh sách tab.

3. `AccountingVietnamHeader.tsx`  
   Tách phần header/title, không đụng simulator.

4. `AccountingVietnamDashboard.tsx`  
   Tách dashboard tĩnh trước, không đụng công thức.

5. `AccountingVietnamSimulatorPanel.tsx`  
   Chỉ tách sau khi `calculateBudgetRisk()` đã được gọi từ helper.

6. `AccountingVietnamFounderSimulator.tsx`  
   Chỉ tách sau khi `calculateFounderSimulation()` đã được gọi từ helper.

7. `AccountingVietnamDecisionLog.tsx`  
   Chỉ tách khi đã dùng `FOUNDER_DECISION_LOG_STORAGE_KEY` từ helper.

8. Các tab ít rủi ro: docs, costs, coverage, backlog.

9. Các tab có dữ liệu lớn: casebank, companyos, agents, datasets, roadmap, tools, experiments.

## 6. Tiêu chí hoàn tất mỗi bước

Mỗi bước refactor chỉ được coi là xong nếu:

- `npm run build` pass.
- `npm run check:simulations` pass.
- `npm run check:founder-labs` pass.
- `npm run check:accounting-calculations` pass.
- Không mất tab trong UI.
- Không mất nút `Guard` và `Labs`.
- Không thay đổi dữ liệu localStorage cũ.

## 7. Rollback nhanh

Nếu refactor phá UI hoặc build fail:

```bash
git status
git diff
```

Rollback file đang sửa:

```bash
git checkout -- src/components/AccountingVietnam.tsx
```

Nếu đã commit lỗi:

```bash
git revert <commit_sha>
```

Không sửa chồng lên lỗi bằng cách rewrite tiếp khi chưa biết nguyên nhân.

## 8. Checklist review cho AI/coder

Trước khi merge bất kỳ refactor nào, người review cần trả lời:

- Có thay công thức nào không?
- Có đổi storage key không?
- Có xóa tab nào không?
- Có đụng `main.tsx`, `App.tsx`, hoặc route chính không?
- Có ẩn simulator/model/Founder Labs không?
- Có thêm prefix CT1 vào UI không?
- Có chạy đủ lệnh guard không?

## 9. Chiến lược tiếp theo

Bước tiếp theo nên làm:

```txt
Tạo AccountingVietnam.constants.ts và copy TAB_LABELS + metadata tab sang đó.
```

Lý do: đây là phần ít rủi ro hơn tách JSX, giúp giảm độ dài file chính mà chưa đụng logic mô phỏng.
