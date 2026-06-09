export const AUDIT_AREAS = [
  { area: 'Mua hàng - thanh toán', objective: 'Chi đúng, đủ hồ sơ, không trùng hóa đơn, không vượt ngân sách.', keyRisks: ['thanh toán trùng', 'thiếu phiếu nhập', 'NCC không hợp lệ', 'duyệt chi vượt quyền'], controls: ['3-way match: PO/hợp đồng - phiếu nhập/nghiệm thu - hóa đơn', 'phân quyền duyệt theo hạn mức', 'đối chiếu công nợ NCC'] },
  { area: 'Tạm ứng - hoàn ứng', objective: 'Tiền ứng dùng đúng mục đích, hoàn ứng đúng hạn, không treo lâu.', keyRisks: ['tạm ứng quá hạn', 'chi sai mục đích', 'chứng từ hoàn ứng thiếu', 'một người nhận nhiều khoản treo'], controls: ['aging tạm ứng', 'hạn hoàn ứng', 'đối chiếu chứng từ theo mã công trình', 'khóa tạm ứng mới nếu khoản cũ quá hạn'] },
  { area: 'Kho vật tư', objective: 'Nhập xuất tồn đúng thực tế, không âm kho, không thất thoát.', keyRisks: ['tồn âm', 'phiếu nhập thiếu chữ ký', 'xuất không đúng công trình', 'vật tư không khớp định mức'], controls: ['kiểm kê định kỳ', 'đối chiếu phiếu giấy với hệ thống', 'cảnh báo tồn âm', 'phân tích xuất vượt định mức'] },
  { area: 'Quỹ dầu', objective: 'Dầu cấp đúng xe/máy, đúng định mức, đủ nhật trình.', keyRisks: ['cấp vượt định mức', 'không có xe/máy nhận', 'không có nhật trình', 'hóa đơn dầu không khớp lượng cấp'], controls: ['đối chiếu phiếu cấp dầu - nhật trình - định mức', 'cảnh báo chênh lệch', 'kiểm tra tồn quỹ dầu'] },
  { area: 'Hóa đơn VAT', objective: 'Hóa đơn hợp lệ, đúng thông tin, đúng số học, phục vụ hoạt động công ty.', keyRisks: ['sai MST', 'lệch tiền thuế', 'hóa đơn không phục vụ công trình', 'thiếu thanh toán không tiền mặt khi cần'], controls: ['kiểm tra MST/số hóa đơn', 'VAT math check', 'đối chiếu hợp đồng/chứng từ', 'lưu file XML/PDF'] },
  { area: 'Báo cáo sếp', objective: 'Báo cáo đúng, kịp thời, có cảnh báo và trách nhiệm xử lý.', keyRisks: ['số liệu Excel rời rạc', 'không có log sửa', 'che giấu khoản vượt ngân sách', 'không rõ người chịu trách nhiệm'], controls: ['dashboard chuẩn', 'audit log', 'khóa kỳ', 'red/yellow/green alert'] }
];

export const RISK_CONTROL_MATRIX = [
  { risk: 'Thanh toán trùng hóa đơn', process: 'Mua hàng - thanh toán', control: 'Chặn trùng MST + số hóa đơn + ngày hóa đơn + tổng tiền', test: 'Lấy mẫu hóa đơn tháng, dò trùng và kiểm tra chứng từ thanh toán', evidence: 'Danh sách hóa đơn, phiếu chi/UNC, biên bản đối chiếu NCC' },
  { risk: 'Tạm ứng treo quá hạn', process: 'Tạm ứng - hoàn ứng', control: 'Aging report và cảnh báo khoản quá hạn', test: 'Lọc khoản ứng > hạn, kiểm tra phê duyệt gia hạn hoặc chứng từ hoàn ứng', evidence: 'Sổ tạm ứng, đề nghị tạm ứng, bảng kê hoàn ứng' },
  { risk: 'Vật tư xuất sai công trình', process: 'Kho vật tư', control: 'Mọi phiếu xuất phải có mã công trình và người nhận', test: 'Chọn mẫu phiếu xuất, đối chiếu mã công trình với đề nghị xuất', evidence: 'Phiếu xuất kho, đề nghị cấp vật tư, chữ ký người nhận' },
  { risk: 'Dầu cấp vượt định mức', process: 'Quỹ dầu', control: 'Đối chiếu lít dầu với nhật trình/ca máy/định mức', test: 'Chọn xe/máy có mức tiêu hao cao, tính chênh lệch và yêu cầu giải trình', evidence: 'Phiếu cấp dầu, nhật trình xe/máy, bảng định mức' },
  { risk: 'Hóa đơn VAT sai số học', process: 'Thuế - hóa đơn', control: 'Tự kiểm tra trước thuế + thuế = tổng tiền', test: 'Quét hóa đơn có chênh lệch hoặc thuế suất bất thường', evidence: 'File XML/PDF hóa đơn, bảng kiểm tra số học' },
  { risk: 'Sửa dữ liệu sau khi duyệt', process: 'Kiểm soát hệ thống', control: 'Audit log bắt buộc ghi người sửa, thời điểm, trước/sau, lý do', test: 'Kiểm tra log các giao dịch giá trị lớn đã sửa', evidence: 'Audit log, lịch sử chứng từ, phiếu phê duyệt sửa' }
];

export const AUDIT_PROGRAM = [
  { step: '1. Lập phạm vi', work: 'Chọn công trình, kỳ kiểm tra, loại chi phí trọng yếu, người phụ trách.', output: 'Audit scope memo' },
  { step: '2. Hiểu quy trình', work: 'Vẽ luồng từ phát sinh chi phí đến duyệt thanh toán và báo cáo sếp.', output: 'Process walkthrough' },
  { step: '3. Nhận diện rủi ro', work: 'Liệt kê rủi ro theo mua hàng, tạm ứng, kho, dầu, VAT, báo cáo.', output: 'Risk register' },
  { step: '4. Test kiểm soát', work: 'Chọn mẫu, kiểm tra chứng từ, đối chiếu hệ thống, hỏi người liên quan.', output: 'Working papers' },
  { step: '5. Kết luận phát hiện', work: 'Ghi finding theo điều kiện - tiêu chí - nguyên nhân - ảnh hưởng - kiến nghị.', output: 'Audit findings' },
  { step: '6. Theo dõi khắc phục', work: 'Giao owner, deadline, bằng chứng đã sửa, trạng thái mở/đóng.', output: 'Follow-up tracker' }
];

export const FINDING_TEMPLATES = [
  { title: 'Thiếu chứng từ thanh toán', condition: 'Một số khoản chi đã thanh toán nhưng chưa đủ hóa đơn/phiếu nhập/nghiệm thu.', criteria: 'Quy trình thanh toán yêu cầu đủ hồ sơ trước khi chi.', impact: 'Tăng rủi ro chi phí không hợp lệ và khó giải trình khi quyết toán.', recommendation: 'Chặn thanh toán khi checklist hồ sơ chưa đạt hoặc yêu cầu phê duyệt ngoại lệ.' },
  { title: 'Tạm ứng treo quá hạn', condition: 'Khoản tạm ứng quá hạn nhưng chưa có hoàn ứng hoặc giải trình.', criteria: 'Tạm ứng phải có hạn hoàn ứng và người chịu trách nhiệm.', impact: 'Tăng rủi ro thất thoát tiền và sai báo cáo dòng tiền.', recommendation: 'Thiết lập aging report, nhắc tự động, khóa tạm ứng mới nếu khoản cũ quá hạn.' },
  { title: 'Dầu cấp vượt định mức', condition: 'Lượng dầu cấp cho xe/máy vượt định mức nhưng chưa có giải trình.', criteria: 'Cấp dầu phải căn cứ nhật trình và định mức.', impact: 'Nguy cơ thất thoát nhiên liệu và đội chi phí công trình.', recommendation: 'Đối chiếu phiếu cấp dầu - nhật trình - định mức trước khi chốt chi phí.' }
];

export const FOLLOW_UP_TRACKER = [
  { finding: 'Tạm ứng treo quá hạn', owner: 'Kế toán dự án', deadline: '7 ngày', evidence: 'Bảng kê hoàn ứng hoặc phê duyệt gia hạn', status: 'Open' },
  { finding: 'Thiếu phiếu nhập kho', owner: 'Thủ kho', deadline: '3 ngày', evidence: 'Phiếu nhập có chữ ký và mã công trình', status: 'In Progress' },
  { finding: 'Lệch định mức dầu', owner: 'Chỉ huy trưởng', deadline: '5 ngày', evidence: 'Giải trình chênh lệch và nhật trình xe/máy', status: 'Open' }
];

export const SAMPLING_GUIDE = [
  'Ưu tiên chọn mẫu theo rủi ro: giá trị lớn, NCC mới, giao dịch cuối tháng, thiếu mã công trình, sửa sau duyệt.',
  'Không chỉ chọn mẫu ngẫu nhiên; phải có mẫu trọng yếu và mẫu bất thường.',
  'Mỗi mẫu kiểm tra phải lưu bằng chứng: chứng từ, người duyệt, ngày duyệt, kết luận.',
  'Nếu phát hiện sai sót lặp lại, mở rộng mẫu hoặc kiểm tra toàn bộ nhóm giao dịch tương tự.'
];
