export const ACCOUNTING_WEB_MODULES = [
  { name: 'Hồ sơ công trình', goal: 'Quản lý mã công trình, ngân sách, giai đoạn, chỉ huy trưởng, hạn mức duyệt chi.', tables: 'projects, project_budgets, project_users' },
  { name: 'Chi phí', goal: 'Ghi nhận vật tư, nhân công, máy thi công, nhiên liệu, HCNS và chi phí khác.', tables: 'expenses, expense_lines, cost_types' },
  { name: 'Tạm ứng - hoàn ứng', goal: 'Theo dõi tiền đã ứng, chứng từ hoàn ứng, số còn treo, tuổi nợ tạm ứng.', tables: 'advances, settlements, settlement_files' },
  { name: 'Hóa đơn & chứng từ', goal: 'Kiểm soát VAT, hợp đồng, nghiệm thu, phiếu nhập/xuất kho, đề nghị thanh toán.', tables: 'invoices, documents, approval_files' },
  { name: 'Kho vật tư & dầu', goal: 'Theo dõi nhập, xuất, tồn, cấp dầu, định mức xe/máy, lệch kho.', tables: 'inventory_items, stock_moves, fuel_logs' },
  { name: 'Báo cáo sếp', goal: 'Dashboard ngân sách, dòng tiền, công nợ, hồ sơ thiếu, quỹ dầu, rủi ro thuế.', tables: 'report_snapshots, alerts, kpis' }
];

export const BUILD_PHASES = [
  { phase: '1. MVP nhập liệu', output: 'Form nhập chi phí, tạm ứng, hóa đơn, kho, dầu. Lưu offline/local trước.', risk: 'Nếu ô nhập thiếu mã công trình thì báo cáo sẽ sai ngay từ đầu.' },
  { phase: '2. Chuẩn hóa database', output: 'Tách bảng danh mục và bảng phát sinh; tránh nhập lặp NCC, vật tư, công trình.', risk: 'Không tách master data sẽ sinh trùng dữ liệu và lệch công nợ.' },
  { phase: '3. Workflow duyệt', output: 'Trạng thái: nháp, chờ duyệt, thiếu hồ sơ, đã duyệt, đã thanh toán.', risk: 'Không có trạng thái thì không biết khoản nào được chi.' },
  { phase: '4. Kiểm soát & cảnh báo', output: 'Rule tự báo: vượt ngân sách, thiếu hóa đơn, tạm ứng quá hạn, lệch kho/dầu.', risk: 'Không có rule thì phần mềm chỉ là bảng nhập liệu.' },
  { phase: '5. Báo cáo & AI', output: 'Dashboard sếp, prompt phân tích, tìm bất thường, dự báo vượt chi phí.', risk: 'AI không hiệu quả nếu dữ liệu chưa sạch.' },
  { phase: '6. Deploy tiết kiệm', output: 'Web/PWA/Desktop hybrid, Firebase/GitHub Actions khi cần, không phụ thuộc API đắt tiền.', risk: 'Triển khai sớm khi chưa có kiểm tra sẽ dễ lỗi build.' }
];

export const ROLE_MATRIX = [
  { role: 'Thủ kho', can: 'Nhập kho, xuất kho, cấp dầu, đính kèm phiếu', cannot: 'Duyệt thanh toán hoặc sửa ngân sách.' },
  { role: 'HCNS', can: 'Nhập chi phí hành chính, nhân sự, bảng lương, đề nghị thanh toán', cannot: 'Sửa dữ liệu kho hoặc quỹ dầu.' },
  { role: 'Kế toán dự án', can: 'Kiểm tra hồ sơ, hạch toán, đối chiếu tạm ứng, lập báo cáo', cannot: 'Tự phê duyệt khoản vượt hạn mức.' },
  { role: 'Kế toán trưởng', can: 'Duyệt nghiệp vụ, khóa kỳ, kiểm tra rủi ro thuế', cannot: 'Xóa log kiểm toán.' },
  { role: 'Sếp', can: 'Xem dashboard, duyệt/không duyệt, xem cảnh báo', cannot: 'Sửa số liệu gốc.' }
];

export const TEST_CHECKLIST = [
  'Nhập một bộ chi phí có đủ hóa đơn, nghiệm thu, phiếu nhập kho và kiểm tra lên báo cáo.',
  'Nhập tạm ứng rồi hoàn ứng một phần, kiểm tra số còn treo.',
  'Nhập hóa đơn sai thuế suất để xem cảnh báo VAT.',
  'Nhập xuất kho âm để xem cảnh báo lệch tồn.',
  'Nhập cấp dầu vượt định mức để xem cảnh báo quỹ dầu.',
  'Build web, desktop, offline và kiểm tra không mất dữ liệu local.'
];

export const LOW_COST_STACK = [
  { layer: 'Frontend', choice: 'React + Vite + PWA', reason: 'Rẻ, nhanh, chạy web và đóng gói desktop được.' },
  { layer: 'Local data', choice: 'LocalStorage/IndexedDB giai đoạn đầu', reason: 'Không tốn server, phù hợp MVP nội bộ.' },
  { layer: 'Desktop', choice: 'Electron', reason: 'Người kế toán mở như phần mềm Windows.' },
  { layer: 'Cloud', choice: 'Firebase/Supabase khi thật sự cần', reason: 'Chỉ bật cloud sau khi workflow ổn.' },
  { layer: 'AI', choice: 'Prompt offline + optional API key', reason: 'Không phụ thuộc API nếu chưa có ngân sách.' }
];
