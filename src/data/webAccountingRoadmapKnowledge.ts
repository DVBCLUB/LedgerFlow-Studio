export const ACCOUNTING_WEB_MODULES = [
  { name: 'Quản lý Dự án & Hợp đồng', goal: 'Quản lý mã dự án/sản phẩm, ngân sách, giai đoạn triển khai, PM/Lead phụ trách, hạn mức duyệt chi.', tables: 'projects, project_budgets, project_users' },
  { name: 'Chi phí & Hạch toán', goal: 'Ghi nhận chi phí dự án, dịch vụ, vật tư/linh kiện, nhân công, HCNS và các khoản chi vận hành khác.', tables: 'expenses, expense_lines, cost_types' },
  { name: 'Tạm ứng & Hoàn ứng', goal: 'Theo dõi tiền đã ứng, chứng từ hoàn ứng, số còn treo, tuổi nợ tạm ứng theo phòng ban và nhân sự.', tables: 'advances, settlements, settlement_files' },
  { name: 'Hóa đơn & Chứng từ', goal: 'Kiểm soát VAT, hợp đồng, biên bản nghiệm thu, phiếu nhập/xuất kho, đề nghị thanh toán chuẩn VAS.', tables: 'invoices, documents, approval_files' },
  { name: 'Kho & Vật tư / Tồn kho', goal: 'Theo dõi nhập, xuất, tồn kho sản phẩm/vật tư, định mức tiêu hao, cảnh báo chênh lệch tồn kho.', tables: 'inventory_items, stock_moves, inventory_logs' },
  { name: 'Báo cáo Quản trị cho Founder', goal: 'Dashboard ngân sách, dòng tiền thực thu, công nợ quá hạn, hồ sơ thiếu điều kiện, rủi ro thuế & vượt hạn mức.', tables: 'report_snapshots, alerts, kpis' }
];

export const BUILD_PHASES = [
  { phase: '1. MVP nhập liệu', output: 'Form nhập chi phí, tạm ứng, hóa đơn, kho/vật tư. Lưu offline/local-first trước.', risk: 'Nếu nhập thiếu mã dự án/sản phẩm thì báo cáo sẽ sai ngay từ đầu.' },
  { phase: '2. Chuẩn hóa database', output: 'Tách bảng danh mục và bảng phát sinh; tránh nhập lặp NCC, sản phẩm, dự án.', risk: 'Không tách master data sẽ sinh trùng dữ liệu và lệch công nợ.' },
  { phase: '3. Workflow duyệt', output: 'Trạng thái: nháp, chờ duyệt, thiếu hồ sơ, đã duyệt, đã thanh toán.', risk: 'Không có trạng thái thì không biết khoản nào được chi.' },
  { phase: '4. Kiểm soát & cảnh báo', output: 'Rule tự báo: vượt ngân sách, thiếu hóa đơn, tạm ứng quá hạn, lệch tồn kho/vật tư.', risk: 'Không có rule thì phần mềm chỉ là bảng nhập liệu thụ động.' },
  { phase: '5. Báo cáo & AI', output: 'Dashboard sếp, prompt phân tích, tìm bất thường, dự báo vượt chi phí.', risk: 'AI không hiệu quả nếu dữ liệu chưa sạch.' },
  { phase: '6. Deploy tiết kiệm', output: 'Web/PWA/Desktop hybrid, Firebase/GitHub Actions khi cần, không phụ thuộc API đắt tiền.', risk: 'Triển khai sớm khi chưa có kiểm tra sẽ dễ lỗi build.' }
];

export const ROLE_MATRIX = [
  { role: 'Thủ kho / Quản lý vật tư', can: 'Nhập kho, xuất kho, kiểm tồn, đính kèm phiếu nhập xuất', cannot: 'Duyệt thanh toán hoặc sửa ngân sách dự án.' },
  { role: 'HCNS', can: 'Nhập chi phí hành chính, nhân sự, bảng lương, đề nghị thanh toán', cannot: 'Sửa dữ liệu kho hoặc danh mục dự án.' },
  { role: 'Kế toán dự án & sản phẩm', can: 'Kiểm tra hồ sơ, hạch toán, đối chiếu tạm ứng, lập báo cáo', cannot: 'Tự phê duyệt khoản vượt hạn mức.' },
  { role: 'Kế toán trưởng', can: 'Duyệt nghiệp vụ, khóa kỳ, kiểm tra rủi ro thuế', cannot: 'Xóa log kiểm toán hệ thống.' },
  { role: 'Founder / CEO', can: 'Xem dashboard, duyệt/không duyệt chi phí, xem cảnh báo tự động', cannot: 'Sửa số liệu hạch toán gốc.' }
];

export const TEST_CHECKLIST = [
  'Nhập một bộ chi phí có đủ hóa đơn, nghiệm thu, phiếu nhập kho và kiểm tra lên báo cáo quản trị.',
  'Nhập tạm ứng rồi hoàn ứng một phần, kiểm tra số nợ tạm ứng còn treo.',
  'Nhập hóa đơn sai thuế suất để kiểm tra hệ thống cảnh báo VAT tự động.',
  'Nhập xuất kho âm để xem cảnh báo lệch tồn kho.',
  'Nhập chi phí vượt định mức ngân sách để xem cảnh báo Founder Control.',
  'Build web, desktop, offline và kiểm tra không mất dữ liệu local.'
];

export const LOW_COST_STACK = [
  { layer: 'Frontend', choice: 'React + Vite + PWA', reason: 'Rẻ, nhanh, chạy web và đóng gói desktop được.' },
  { layer: 'Local data', choice: 'LocalStorage/IndexedDB giai đoạn đầu', reason: 'Không tốn server, phù hợp MVP nội bộ.' },
  { layer: 'Desktop', choice: 'Electron', reason: 'Người kế toán mở như phần mềm Windows.' },
  { layer: 'Cloud', choice: 'Firebase/Supabase khi thật sự cần', reason: 'Chỉ bật cloud sau khi workflow ổn.' },
  { layer: 'AI', choice: 'Prompt offline + optional API key', reason: 'Không phụ thuộc API nếu chưa có ngân sách.' }
];
