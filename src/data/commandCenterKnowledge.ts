export const COMMAND_CENTER_KPIS = [
  { name: 'Ngân sách còn lại', value: '7.8%', formula: '(Budget - Actual) / Budget', status: 'Cảnh báo', detail: 'Khi còn dưới 10%, khóa phát sinh ngoài kế hoạch và yêu cầu giải trình theo hạng mục.' },
  { name: 'Tỷ lệ hoàn ứng', value: '72%', formula: 'Settled / Advances', status: 'Theo dõi', detail: 'Tỷ lệ thấp nghĩa là tiền tạm ứng đang treo, dễ làm sai báo cáo dòng tiền.' },
  { name: 'Hồ sơ đủ điều kiện thanh toán', value: '81%', formula: 'Complete files / Total files', status: 'Ổn', detail: 'Bộ hồ sơ đủ gồm đề nghị thanh toán, hợp đồng/đơn hàng, nghiệm thu, hóa đơn, phiếu nhập/xuất nếu có.' },
  { name: 'Rủi ro quỹ dầu', value: 'Cao', formula: 'Fuel issued vs machine log', status: 'Chặn duyệt', detail: 'Cấp dầu phải khớp phiếu cấp dầu, nhật trình xe/máy và định mức.' }
];

export const COMMAND_CENTER_ALERTS = [
  { level: 'Khẩn cấp', title: 'Chi phí vượt dự toán', owner: 'Kế toán dự án', action: 'Dừng duyệt khoản ngoài ngân sách, yêu cầu chỉ huy trưởng giải trình.' },
  { level: 'Cao', title: 'Tạm ứng treo quá hạn', owner: 'Người nhận tạm ứng', action: 'Nhắc hoàn ứng, khóa tạm ứng mới nếu chưa bổ sung chứng từ.' },
  { level: 'Cao', title: 'Thiếu hóa đơn VAT', owner: 'Kế toán thuế', action: 'Tách khỏi bảng kê khấu trừ cho tới khi xác minh hóa đơn.' },
  { level: 'Trung bình', title: 'NCC chưa đủ hồ sơ', owner: 'Mua hàng', action: 'Bổ sung báo giá, hợp đồng, tài khoản ngân hàng và thông tin MST.' }
];

export const COMMAND_CENTER_WORKFLOWS = [
  { step: '1. Nhận phát sinh', detail: 'Từ thủ kho, HCNS, đội công trình, nhà cung cấp hoặc sao kê ngân hàng.' },
  { step: '2. Chuẩn hóa dữ liệu', detail: 'Gắn mã công trình, loại chi phí, mã NCC, tài khoản kế toán, người chịu trách nhiệm.' },
  { step: '3. Kiểm tra chứng từ', detail: 'Đối chiếu đề nghị thanh toán, hợp đồng, nghiệm thu, hóa đơn, phiếu kho, bảng chấm công.' },
  { step: '4. Đối chiếu tiền', detail: 'So sánh tạm ứng, hoàn ứng, công nợ, thanh toán ngân hàng và số còn phải trả.' },
  { step: '5. Báo cáo sếp', detail: 'Chỉ hiện KPI cần quyết định: vượt ngân sách, thiếu hồ sơ, dòng tiền, tạm ứng treo, rủi ro thuế.' }
];

export const COMMAND_CENTER_REPORT_TEMPLATES = [
  { title: 'Báo cáo sáng cho sếp', body: 'Hôm nay cần duyệt: khoản vượt ngân sách, tạm ứng quá hạn, hồ sơ thiếu VAT, quỹ dầu bất thường.' },
  { title: 'Checklist trước thanh toán', body: 'Có đề nghị thanh toán, hợp đồng/đơn hàng, nghiệm thu, hóa đơn, phiếu kho hoặc xác nhận khối lượng.' },
  { title: 'Mẫu cảnh báo rủi ro', body: 'Khoản chi chưa đủ điều kiện thanh toán vì thiếu chứng từ hoặc lệch đối chiếu. Đề nghị bổ sung trước khi chi tiền.' }
];
