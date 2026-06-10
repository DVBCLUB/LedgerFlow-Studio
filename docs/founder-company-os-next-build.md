# Founder Company OS - Next Build Plan

Tài liệu này mô tả hướng cải tiến tiếp theo cho LedgerFlow-Studio theo định vị mới: **learning + R&D + simulation + company operating system cho solo founder**, không phải phần mềm kế toán ERP nhập liệu/xuất báo cáo.

## 1. Nguyên tắc sản phẩm

- Kế toán/kiểm toán phải là **đa ngành**: thương mại, sản xuất, dịch vụ, xây dựng/dự án.
- App không cạnh tranh trực tiếp với MISA AMIS, Bravo hay ERP.
- App là nơi học, mô phỏng, khảo sát, lập kế hoạch, giao việc AI agent và quyết định thương mại hóa.
- Mọi feature mới phải có input/output rõ, có thể dùng bằng localStorage trước khi cần backend.
- Founder là người duyệt cuối; AI/AI agent là nhân viên hỗ trợ, không tự quyết thay founder.

## 2. Dữ liệu đã thêm

File `src/data/founderCompanyEnhancements.ts` đã được mở rộng thêm các nhóm dữ liệu:

1. `FOUNDER_DAILY_KPI_DASHBOARD`
   - KPI học tập, R&D, AI workforce, cost control, commercialization.
   - Dùng để build tab điều hành ngày/tuần.

2. `AI_AGENT_WORK_ORDER_BOARD`
   - Board giao việc cho AI Product Manager, AI Auditor, AI Fullstack Dev, AI Marketer.
   - Mỗi work order có input, expected output và founder review.

3. `PRODUCT_IDEA_PORTFOLIO`
   - Danh mục ý tưởng: case bank, prompt pack, simulator tài chính, game học kiểm toán.
   - Dùng để chấm điểm và quyết định GO/HOLD/NO-GO.

4. `OPERATING_SOP_LIBRARY`
   - SOP nhận ý tưởng, giao việc AI, release tính năng, dừng ý tưởng.
   - Dùng để biến app thành công ty vận hành thật.

5. `FOUNDER_RISK_REGISTER`
   - Risk register về định vị ERP sai, AI bịa kiến thức, build quá rộng, chi phí tool tăng, dữ liệu mô phỏng mỏng.
   - Dùng để build tab kiểm toán nội bộ sản phẩm.

6. `RELEASE_READINESS_CHECKLIST`
   - Checklist trước khi release tính năng mới.
   - Dùng cho AI Auditor hoặc founder tự check.

## 3. Đề xuất UI tiếp theo

Nên thêm 5 tab mới trong `AccountingVietnam.tsx` hoặc tách component riêng nếu file quá dài:

### Tab 1: Founder Dashboard

Hiển thị `FOUNDER_DAILY_KPI_DASHBOARD` thành các card:

- group
- purpose
- KPI list
- warning

Có thể thêm điểm tổng quan thủ công:

```ts
const founderHealthScore = Math.round((learningScore + productScore + costScore + commercialScore) / 4);
```

### Tab 2: AI Work Orders

Hiển thị `AI_AGENT_WORK_ORDER_BOARD` thành board đơn giản:

- ID
- Status
- Owner Agent
- Task
- Input
- Expected Output
- Founder Review

MVP chưa cần drag/drop. Sau này lưu trạng thái vào localStorage.

### Tab 3: Idea Portfolio

Hiển thị `PRODUCT_IDEA_PORTFOLIO` thành ma trận ưu tiên:

- Idea
- Target User
- Pain
- MVP Cheapness
- Distribution
- Technical Risk
- First MVP
- Monetization

Công thức gợi ý:

```ts
score = pain * 3 + mvpCheapness * 2 + distribution * 1.5 - technicalRisk * 1.5;
```

Kết luận:

- score >= 40: GO
- score >= 30: HOLD
- score < 30: NO-GO

### Tab 4: SOP Library

Hiển thị `OPERATING_SOP_LIBRARY` thành quy trình vận hành:

- SOP name
- Trigger
- Steps
- Output

Có nút copy SOP để giao cho AI agent.

### Tab 5: Risk & Release Audit

Hiển thị `FOUNDER_RISK_REGISTER` và `RELEASE_READINESS_CHECKLIST`.

Mục tiêu: trước mỗi release, founder hoặc AI Auditor phải rà soát:

- có phá định vị không
- có gây hiểu nhầm pháp lý/kế toán không
- có dùng localStorage được chưa
- có decision log chưa
- có test tay chưa

## 4. Ưu tiên build

### P0

- Thêm tab Founder Dashboard.
- Thêm tab AI Work Orders.
- Hiển thị Idea Portfolio với điểm GO/HOLD/NO-GO.

### P1

- Cho Work Order lưu trạng thái bằng localStorage.
- Cho Idea Portfolio thêm ý tưởng mới từ form.
- Cho Risk Register có checkbox đã kiểm.

### P2

- Export báo cáo điều hành founder ra Markdown.
- Import/export JSON cho decision log, work order, idea portfolio.
- Tách component nếu `AccountingVietnam.tsx` quá dài.

## 5. Prompt giao AI Fullstack Dev

Dùng prompt này cho AI/coder khác nếu cần:

```text
Bạn đang sửa repo LedgerFlow-Studio. Đây không phải app ERP kế toán, mà là learning + R&D + simulation + company operating system cho solo founder.

Hãy cập nhật `AccountingVietnam.tsx` hoặc tách component phụ để hiển thị các dữ liệu mới từ `src/data/founderCompanyEnhancements.ts`:
- FOUNDER_DAILY_KPI_DASHBOARD
- AI_AGENT_WORK_ORDER_BOARD
- PRODUCT_IDEA_PORTFOLIO
- OPERATING_SOP_LIBRARY
- FOUNDER_RISK_REGISTER
- RELEASE_READINESS_CHECKLIST

Yêu cầu:
1. Không xóa tab cũ.
2. Không đổi router chính.
3. Không phá giao diện dark/cyan/card hiện tại.
4. Thêm tab mới: Founder Dashboard, AI Work Orders, Idea Portfolio, SOP Library, Risk Audit.
5. Nếu thêm state thì ưu tiên localStorage, chưa cần backend.
6. Mỗi tab phải có output hữu ích cho founder, không chỉ hiển thị chữ.
7. Sau khi sửa, mô tả file đã sửa và checklist test tay.
```

## 6. Checklist test tay sau khi build UI

- Mở tab `accounting_vn`.
- Kiểm tra các tab cũ vẫn hoạt động: Case mô phỏng, Score lab, Simulator, Decision Log.
- Kiểm tra tab mới render không trắng màn hình.
- Thử copy prompt/report nếu có.
- Thử nhập decision log cũ xem localStorage còn hoạt động.
- Kiểm tra console không có lỗi import/export.
- Chạy `npm run build` trước khi deploy.
