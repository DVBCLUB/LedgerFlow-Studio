# Module depth roadmap

## Chỉnh hướng đúng

LedgerFlow Studio là **simulation lab / learning studio**, không phải phần mềm kế toán vận hành thật.

Vì vậy, khi làm sâu module phải theo hướng:

- mô phỏng tình huống;
- dữ liệu mẫu;
- bài học nghiệp vụ;
- case study;
- calculator;
- quiz/checklist;
- prompt lab;
- báo cáo mẫu;
- giải thích đúng/sai.

Không được biến module thành chức năng vận hành thật như duyệt chi thật, hạch toán thật, lưu chứng từ thật, thay phần mềm kế toán thật.

## Kho kiến thức nền

Đã thêm:

- `src/data/deepConstructionAccountingKnowledge.ts`

File này chỉ là **knowledge hub cho mô phỏng**. Nó cung cấp tình huống, checklist, KPI, rủi ro và prompt schema để module dùng làm bài học/case giả lập.

## Quy tắc làm sâu module

Mỗi module cần có:

1. **Simulation scenario**: tình huống giả lập rõ ràng.
2. **Sample data**: dữ liệu mẫu để học và thử.
3. **Learning objective**: học được gì sau khi dùng module.
4. **Calculator / score**: tính thử chỉ số hoặc điểm rủi ro.
5. **Checklist tham khảo**: dùng để học, không thay quy trình pháp lý thật.
6. **Case đúng/sai**: vì sao đúng, vì sao sai.
7. **Copy template**: báo cáo mẫu, prompt mẫu, finding mẫu, email/tin nhắn mẫu.
8. **Disclaimer**: đây là mô phỏng; khi áp dụng thật cần người có chuyên môn kiểm tra.

## Ưu tiên chỉnh lại

1. `AccountingVietnam` — mô phỏng bút toán/case/chứng từ, không phải module kế toán vận hành.
2. `InternalAuditWorkspace` — mô phỏng kiểm toán nội bộ, chọn mẫu và finding, không phải hệ thống audit thật.
3. `CustomDataWorkbench` — mô phỏng dữ liệu Excel bẩn, mapping, clean, validate.
4. `CommandCenter` — mô phỏng dashboard điều hành và cảnh báo mẫu.
5. `AdvancedAIEngine` — mô phỏng AI review, redaction, prompt schema.
6. `DataScienceEngineering` — mô phỏng pipeline dữ liệu kế toán và anomaly detection.

## Chạy trên máy tính

Đã thêm file chạy Windows:

- `RUN_LOCAL.bat` — chạy app local.
- `BUILD_DESKTOP_WINDOWS.bat` — build bản desktop Windows.
- `DESKTOP_RELEASE_GUIDE.md` — hướng dẫn build, tải và chạy bản Windows.
