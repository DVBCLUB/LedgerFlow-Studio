export const ICP_SEGMENTS = [
  { name: 'Kế toán dự án xây dựng', pain: 'Theo dõi chi phí nhiều công trình, chứng từ rời rạc, tạm ứng treo.', buyingTrigger: 'Sếp yêu cầu báo cáo nhanh hoặc bị thiếu hồ sơ khi quyết toán.', message: 'Giảm thời gian tổng hợp và thấy ngay hồ sơ nào thiếu.' },
  { name: 'Chủ doanh nghiệp xây dựng nhỏ', pain: 'Không biết công trình nào đang lỗ, tiền ứng đang nằm ở đâu.', buyingTrigger: 'Vượt ngân sách, thất thoát vật tư/dầu, báo cáo chậm.', message: 'Dashboard 5 chỉ số để biết tiền đang chảy đi đâu.' },
  { name: 'Thủ kho công trường', pain: 'Ghi phiếu tay, nhập lại nhiều lần, sợ lệch kho/dầu.', buyingTrigger: 'Bị kế toán/sếp hỏi số liệu nhập xuất tồn.', message: 'Nhập nhanh, dễ dùng, ít gõ, có mẫu phiếu rõ.' },
  { name: 'Kế toán trưởng', pain: 'Rủi ro VAT, chứng từ thiếu, phân quyền yếu, log không rõ.', buyingTrigger: 'Kiểm tra nội bộ hoặc chuẩn bị quyết toán.', message: 'Kiểm soát trước khi duyệt, không mất quyền quyết định.' }
];

export const SURVEY_QUESTIONS = [
  { question: 'Hiện anh/chị đang tổng hợp chi phí công trình bằng gì?', purpose: 'Biết đối thủ thật: Excel, SmartPro, MISA, Zalo, giấy.' },
  { question: 'Mỗi tháng mất bao lâu để làm báo cáo cho sếp?', purpose: 'Tính ROI và thông điệp bán hàng.' },
  { question: 'Khoản nào hay thiếu chứng từ nhất?', purpose: 'Chọn module ưu tiên: VAT, tạm ứng, kho, dầu, nhân công.' },
  { question: 'Ai là người nhập dữ liệu đầu tiên?', purpose: 'Thiết kế phân quyền và giao diện nhập nhanh.' },
  { question: 'Sếp cần xem chỉ số nào nhất?', purpose: 'Thiết kế dashboard thay vì làm quá nhiều bảng.' },
  { question: 'Mức phí nào chấp nhận được nếu tiết kiệm 10 giờ/tháng?', purpose: 'Kiểm tra willingness-to-pay.' },
  { question: 'Điều gì khiến anh/chị không dám dùng phần mềm mới?', purpose: 'Tìm rào cản mua: dữ liệu, bảo mật, khó dùng, sợ mất file.' }
];

export const COMPETITOR_MAP = [
  { type: 'Excel/Zalo', strength: 'Rẻ, quen tay, linh hoạt.', weakness: 'Dữ liệu rời rạc, khó phân quyền, khó tổng hợp đa công trình.', opportunity: 'Nhập nhanh + báo cáo tự động + cảnh báo hồ sơ thiếu.' },
  { type: 'Phần mềm kế toán truyền thống', strength: 'Có sổ sách kế toán, quen với doanh nghiệp.', weakness: 'Không sâu theo công trình, kho/dầu/tạm ứng công trường thường khó dùng.', opportunity: 'Làm lớp quản trị công trình trước khi hạch toán.' },
  { type: 'AppSheet/Google Sheet', strength: 'Dễ tạo app nhập liệu.', weakness: 'Khó kiểm soát workflow sâu, dashboard phức tạp và phân quyền kế toán.', opportunity: 'Tạo bản hybrid có rule nghiệp vụ rõ hơn.' },
  { type: 'ERP lớn', strength: 'Đủ phân hệ và quy trình.', weakness: 'Đắt, triển khai lâu, quá nặng với công ty nhỏ.', opportunity: 'Gói gọn cho kế toán dự án xây dựng vừa và nhỏ.' }
];

export const MARKET_SCORECARD = [
  { factor: 'Độ đau', score: 9, note: 'Chi phí công trình, tạm ứng, chứng từ thiếu là nỗi đau thật.' },
  { factor: 'Khả năng trả tiền', score: 6, note: 'Công ty nhỏ nhạy giá, nên cần chứng minh ROI rõ.' },
  { factor: 'Tần suất dùng', score: 8, note: 'Kế toán/thủ kho dùng hằng ngày hoặc hằng tuần.' },
  { factor: 'Khác biệt sản phẩm', score: 7, note: 'Khác biệt nếu tập trung vào công trình, kho, dầu, hoàn ứng và báo cáo sếp.' },
  { factor: 'Độ khó triển khai', score: 8, note: 'Dữ liệu cũ bẩn, quy trình mỗi công ty khác nhau, cần scope control.' }
];

export const INTERVIEW_SCRIPT = [
  'Mở đầu: Em không bán phần mềm ngay, em đang kiểm tra quy trình kế toán công trình có điểm nào mất thời gian nhất.',
  'Hỏi luồng hiện tại: từ phát sinh ở công trường tới khi lên báo cáo sếp đi qua những ai?',
  'Hỏi lỗi gần nhất: tháng trước bị thiếu chứng từ, lệch kho/dầu hoặc treo tạm ứng ở đâu?',
  'Hỏi giá trị: nếu giảm được 10 giờ tổng hợp mỗi tháng thì có đáng trả phí không?',
  'Kết thúc: xin một file mẫu đã ẩn thông tin để dựng demo đúng quy trình thật.'
];
