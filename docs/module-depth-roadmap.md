# Module depth roadmap

## Nguyên tắc mới

Từ giai đoạn này, không nâng module kiểu thêm vài card cho đẹp nữa. Mỗi module phải bám sát nghiệp vụ thật của kế toán công trình: chi phí, hồ sơ, tạm ứng, hoàn ứng, kho, dầu, thuế, báo cáo sếp, kiểm soát nội bộ và AI hỗ trợ.

Đã thêm knowledge hub nền tảng:

- `src/data/deepConstructionAccountingKnowledge.ts`

File này là kho kiến thức chung để các module khác dùng lại: cost type, checklist chứng từ, KPI kiểm soát, schema prompt AI, template báo cáo sếp và yêu cầu chiều sâu theo từng module.

## Nhóm kiến thức bắt buộc cho mọi module

1. **Nghiệp vụ thật**: module giải quyết việc gì trong công ty xây dựng.
2. **Dữ liệu cần nhập**: trường nào bắt buộc, trường nào không được để trống.
3. **Chứng từ kèm theo**: hồ sơ tối thiểu, thiếu gì thì cảnh báo gì.
4. **Rủi ro**: rủi ro thuế, rủi ro nội bộ, rủi ro thất thoát, rủi ro dữ liệu.
5. **KPI**: chỉ số đo được, công thức, ngưỡng đỏ/vàng/xanh.
6. **Workflow**: ai nhập, ai kiểm tra, ai duyệt, ai xem báo cáo.
7. **AI hỗ trợ**: AI được gợi ý gì, không được quyết định gì.
8. **Mẫu copy được**: báo cáo sếp, tin nhắn, prompt, checklist, follow-up.

## Ưu tiên làm sâu tiếp theo

1. `AccountingVietnam` — thêm bút toán mẫu, tài khoản tham khảo, case chi phí xây dựng, kiểm tra VAT/hóa đơn ở mức khung tham khảo.
2. `InternalAuditWorkspace` — thêm risk-control matrix, chương trình kiểm toán nội bộ, mẫu phát hiện sai phạm, follow-up tracker.
3. `CustomDataWorkbench` — thêm mapping Excel cũ, rule làm sạch dữ liệu, import validator, reconciliation sandbox.
4. `CommandCenter` — nối thêm deep knowledge: cost type, checklist hồ sơ, KPI, báo cáo sếp.
5. `WebAccountingRoadmap` — thêm database blueprint chi tiết hơn: projects, vendors, expenses, advances, settlements, invoices, inventory, fuel_logs, approvals, audit_logs.
6. `AdvancedAIEngine` — thêm prompt schema bắt AI trả JSON, redaction, confidence threshold, human approval.
7. `DataScienceEngineering` — thêm fact/dimension model và feature engineering cho kế toán công trình.
8. `Marketing/Sales modules` — giữ nhưng không ưu tiên hơn nghiệp vụ kế toán lõi.

## Ghi chú pháp lý

Các nội dung thuế/kế toán trong app chỉ nên là khung kiểm soát và checklist tham khảo. Khi áp dụng thật phải kiểm tra văn bản hiện hành, hợp đồng, hóa đơn, chứng từ gốc và người có chuyên môn duyệt cuối.
