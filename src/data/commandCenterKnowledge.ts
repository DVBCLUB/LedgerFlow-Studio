export const COMMAND_CENTER_KPIS = [
  { name: 'Ngân sách còn lại', value: '7.8%', formula: '(Budget - Actual) / Budget', status: 'Cảnh báo', detail: 'Khi còn dưới 10%, khóa phát sinh ngoài kế hoạch và yêu cầu giải trình theo hạng mục.' },
  { name: 'Tỷ lệ hoàn ứng', value: '72%', formula: 'Settled / Advances', status: 'Theo dõi', detail: 'Tỷ lệ thấp nghĩa là tiền tạm ứng đang treo, dễ làm sai báo cáo dòng tiền.' },
  { name: 'Hồ sơ đủ điều kiện thanh toán', value: '81%', formula: 'Complete files / Total files', status: 'Ổn', detail: 'Bộ hồ sơ đủ gồm đề nghị thanh toán, hợp đồng/đơn hàng, nghiệm thu, hóa đơn, phiếu nhập/xuất nếu có.' },
  { name: 'Ngoại lệ vận hành', value: 'Cao', formula: 'Exceptions / reviewed items', status: 'Chặn duyệt', detail: 'Khoản lệch ngân sách, thiếu hồ sơ hoặc vượt hạn mức cần người phụ trách kiểm tra trước khi duyệt.' }
];

export const COMMAND_CENTER_ALERTS = [
  { level: 'Khẩn cấp', title: 'Chi phí vượt dự toán', owner: 'Kế toán dự án', action: 'Dừng duyệt khoản ngoài ngân sách, yêu cầu chỉ huy trưởng giải trình.' },
  { level: 'Cao', title: 'Tạm ứng treo quá hạn', owner: 'Người nhận tạm ứng', action: 'Nhắc hoàn ứng, khóa tạm ứng mới nếu chưa bổ sung chứng từ.' },
  { level: 'Cao', title: 'Thiếu hóa đơn VAT', owner: 'Kế toán thuế', action: 'Tách khỏi bảng kê khấu trừ cho tới khi xác minh hóa đơn.' },
  { level: 'Trung bình', title: 'NCC chưa đủ hồ sơ', owner: 'Mua hàng', action: 'Bổ sung báo giá, hợp đồng, tài khoản ngân hàng và thông tin MST.' }
];

export const COMMAND_CENTER_WORKFLOWS = [
  { step: '1. Nhận phát sinh', detail: 'Từ dự án, sản phẩm, nhà cung cấp, khách hàng, nhân sự nội bộ hoặc sao kê ngân hàng.' },
  { step: '2. Chuẩn hóa dữ liệu', detail: 'Gắn mã dự án/sản phẩm, loại chi phí, mã NCC/khách hàng, tài khoản kế toán và người chịu trách nhiệm.' },
  { step: '3. Kiểm tra chứng từ', detail: 'Đối chiếu đề nghị thanh toán, hợp đồng, nghiệm thu, hóa đơn, phiếu kho, bảng chấm công.' },
  { step: '4. Đối chiếu tiền', detail: 'So sánh tạm ứng, hoàn ứng, công nợ, thanh toán ngân hàng và số còn phải trả.' },
  { step: '5. Báo cáo sếp', detail: 'Chỉ hiện KPI cần quyết định: vượt ngân sách, thiếu hồ sơ, dòng tiền, tạm ứng treo, rủi ro thuế.' }
];

export const COMMAND_CENTER_REPORT_TEMPLATES = [
  { title: 'Báo cáo sáng cho sếp', body: 'Hôm nay cần duyệt: khoản vượt ngân sách, tạm ứng quá hạn, hồ sơ thiếu VAT, ngoại lệ vận hành cần người phụ trách kiểm tra.' },
  { title: 'Checklist trước thanh toán', body: 'Có đề nghị thanh toán, hợp đồng/đơn hàng, nghiệm thu, hóa đơn, phiếu kho hoặc xác nhận khối lượng.' },
  { title: 'Mẫu cảnh báo rủi ro', body: 'Khoản chi chưa đủ điều kiện thanh toán vì thiếu chứng từ hoặc lệch đối chiếu. Đề nghị bổ sung trước khi chi tiền.' }
];

export const COMMAND_CENTER_TODAY_PRIORITIES = [
  {
    lane: 'Command',
    title: 'Chốt 3 quyết định cần founder duyệt',
    owner: 'Founder / CEO',
    due: 'Sáng nay',
    decision: 'GO/HOLD cho các thay đổi P0 V2 trước khi mở thêm tính năng.',
    successMetric: 'Không có task P0 bị trôi quá ngày.'
  },
  {
    lane: 'Build',
    title: 'Kiểm tra module deep-dive đã nối',
    owner: 'Lead Engineer',
    due: 'Trong ngày',
    decision: 'Giữ scope nhỏ, chạy lint trước khi qua task tiếp theo.',
    successMetric: 'Accounting, Audit, Custom Data, Command Center đều có panel V2.'
  },
  {
    lane: 'Sell',
    title: 'Đổi thông điệp khỏi construction-only',
    owner: 'Growth / Sales',
    due: 'Tuần này',
    decision: 'Dùng Company OS + accounting templates đa ngành làm thông điệp chính.',
    successMetric: 'Lead hiểu LedgerFlow không phải ERP xây dựng đơn lẻ.'
  }
];

export const COMMAND_CENTER_DECISION_QUEUE = [
  {
    decision: 'Có cho phép mở P1 RAG/Knowledge Base chưa?',
    why: 'P0 wiring và framing cần ổn trước khi thêm backend nặng.',
    defaultAction: 'HOLD đến khi P0 pass build/offline checks.',
    risk: 'Mở quá sớm làm tăng scope và quota.'
  },
  {
    decision: 'Daily Brief dùng static/localStorage hay Supabase?',
    why: 'Roadmap yêu cầu offline-first trước.',
    defaultAction: 'Static/localStorage trước, Supabase sau.',
    risk: 'Kết nối backend sớm làm khó debug desktop/offline.'
  },
  {
    decision: 'Có đổi route/module id trong navigation không?',
    why: 'Registry và HashRouter phải ổn định.',
    defaultAction: 'Không đổi id/route, chỉ đổi label hiển thị.',
    risk: 'Đổi route có thể phá deep link và simulation checks.'
  }
];

export const COMMAND_CENTER_OPERATING_RHYTHM = [
  'Sáng: đọc Daily Brief, chọn 1-3 quyết định quan trọng.',
  'Trưa: kiểm tra risk board, block việc thiếu hồ sơ hoặc vượt scope.',
  'Chiều: chạy check phù hợp, ghi next action cho lượt tiếp theo.',
  'Cuối ngày: copy brief, lưu decision log, không mở P1 khi P0 chưa sạch.'
];
