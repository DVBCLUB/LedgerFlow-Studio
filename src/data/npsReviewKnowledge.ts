export const NPS_SEGMENTS = [
  { group: 'Promoters 9-10', meaning: 'Khách rất hài lòng, có thể giới thiệu.', action: 'Xin testimonial, case study, referral và hỏi tính năng họ thích nhất.' },
  { group: 'Passives 7-8', meaning: 'Dùng được nhưng chưa yêu mạnh.', action: 'Hỏi điểm còn vướng, cải thiện onboarding và chỉ ra ROI cụ thể.' },
  { group: 'Detractors 0-6', meaning: 'Có nguy cơ rời bỏ hoặc nói xấu.', action: 'Gọi xử lý ngay, ghi bug/feature request, hẹn ngày phản hồi.' }
];

export const FEEDBACK_CATEGORIES = [
  { name: 'Nhập liệu khó', signal: 'Người dùng than nhiều trường, không hiểu mã công trình/NCC.', fix: 'Tạo form nhập nhanh, mặc định giá trị, hướng dẫn bằng ví dụ.' },
  { name: 'Báo cáo chưa đúng ý sếp', signal: 'Xuất báo cáo nhưng vẫn phải sửa Excel.', fix: 'Hỏi 5 chỉ số sếp cần, tạo mẫu báo cáo cố định.' },
  { name: 'Thiếu chứng từ', signal: 'Không biết hồ sơ nào thiếu hóa đơn/nghiệm thu/phiếu kho.', fix: 'Thêm checklist hồ sơ và cảnh báo khi nhập.' },
  { name: 'Chạy chậm hoặc lỗi build', signal: 'Mở app chậm, thao tác lag, lỗi khi deploy.', fix: 'Ưu tiên performance, giảm module nặng, kiểm tra build.' },
  { name: 'Lo bảo mật dữ liệu', signal: 'Không muốn đưa sao kê/hóa đơn lên cloud.', fix: 'Giải thích offline mode, ẩn dữ liệu, phân quyền và backup.' }
];

export const REVIEW_RESPONSE_TEMPLATES = [
  { title: 'Phản hồi review tốt', text: 'Cảm ơn anh/chị đã phản hồi. Em sẽ giữ module báo cáo/tạm ứng/hồ sơ thiếu ổn định hơn và tiếp tục tối ưu theo quy trình kế toán công trình thực tế.' },
  { title: 'Phản hồi review trung bình', text: 'Cảm ơn anh/chị đã góp ý. Em muốn hỏi thêm phần nào đang làm mất thời gian nhất: nhập liệu, báo cáo sếp, chứng từ, hay tốc độ app để ưu tiên sửa đúng chỗ.' },
  { title: 'Phản hồi review xấu', text: 'Em xin lỗi vì trải nghiệm chưa tốt. Em sẽ ghi nhận lỗi này thành ticket ưu tiên, phản hồi lại hướng xử lý và thời gian sửa cụ thể để anh/chị kiểm tra lại.' },
  { title: 'Xin testimonial', text: 'Nếu phần mềm đã giúp anh/chị giảm thời gian tổng hợp hoặc kiểm soát hồ sơ tốt hơn, cho em xin 2-3 dòng nhận xét ngắn để làm case study được không ạ?' }
];

export const PRODUCT_IMPROVEMENT_LOOP = [
  { step: '1. Thu feedback', detail: 'NPS, review, chat Zalo, cuộc gọi hỗ trợ, lỗi người dùng gặp khi nhập liệu.' },
  { step: '2. Phân loại', detail: 'Bug, UX khó dùng, thiếu nghiệp vụ, hiệu năng, bảo mật, yêu cầu báo cáo.' },
  { step: '3. Chấm mức ảnh hưởng', detail: 'Ảnh hưởng bao nhiêu người, có làm khách rời bỏ không, có liên quan tiền/chứng từ không.' },
  { step: '4. Đưa vào backlog', detail: 'Mỗi phản hồi phải thành task rõ: sửa gì, file/module nào, test ra sao.' },
  { step: '5. Báo lại khách', detail: 'Cho khách biết đã sửa gì, xin họ kiểm tra lại, biến detractor thành promoter.' }
];

export const NPS_QUESTIONS = [
  'Anh/chị chấm phần mềm này bao nhiêu điểm từ 0 đến 10 nếu giới thiệu cho kế toán khác?',
  'Lý do chính của điểm số đó là gì?',
  'Tác vụ nào phần mềm giúp anh/chị tiết kiệm thời gian nhất?',
  'Tác vụ nào vẫn còn khó chịu hoặc dễ sai?',
  'Nếu chỉ được sửa một thứ trong tuần này, anh/chị muốn sửa gì?',
  'Anh/chị có sẵn sàng gửi một file mẫu đã ẩn thông tin để em tối ưu đúng quy trình không?'
];
