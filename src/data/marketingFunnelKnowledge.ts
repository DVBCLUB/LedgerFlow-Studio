export const FUNNEL_STAGES = [
  { stage: 'Traffic', goal: 'Kéo đúng người vào xem: kế toán trưởng, kế toán dự án, chủ doanh nghiệp xây dựng.', metric: 'Website visits / group views / message opens', leak: 'Nội dung quá chung, không nói đúng nỗi đau công trình.' },
  { stage: 'Lead', goal: 'Lấy phản hồi hoặc thông tin liên hệ.', metric: 'Reply rate / form submits / Zalo messages', leak: 'CTA mơ hồ, khách chưa thấy lợi ích demo.' },
  { stage: 'Demo', goal: 'Cho khách thấy dashboard bằng dữ liệu mẫu hoặc file đã ẩn.', metric: 'Demo booked / demo attended', leak: 'Demo quá dài hoặc không đúng nỗi đau khách.' },
  { stage: 'Proposal', goal: 'Gửi giá tách phần mềm, triển khai, migrate, support.', metric: 'Proposal sent / accepted', leak: 'Báo giá không chứng minh ROI hoặc phạm vi không rõ.' },
  { stage: 'Paid', goal: 'Khách thanh toán và onboarding thành công.', metric: 'Paid customers / activation', leak: 'Onboarding yếu, người dùng không nhập dữ liệu thật.' }
];

export const CHANNELS = [
  { channel: 'Zalo/Facebook group kế toán', bestFor: 'Tìm nỗi đau thật, khảo sát, kéo demo nhỏ.', content: 'Checklist hồ sơ thiếu, mẫu báo cáo sếp, case tạm ứng treo.' },
  { channel: 'Referral từ kế toán dịch vụ', bestFor: 'Lead có niềm tin cao.', content: 'Demo 15 phút + hoa hồng rõ ràng.' },
  { channel: 'Cold outreach', bestFor: 'Tìm công ty xây dựng nhỏ theo danh sách.', content: 'Tin nhắn ngắn nói đúng nỗi đau, xin demo.' },
  { channel: 'SEO/blog', bestFor: 'Nuôi dưỡng dài hạn.', content: 'Bài hướng dẫn tạm ứng, VAT, hồ sơ thanh toán, kho/dầu.' },
  { channel: 'YouTube/TikTok ngắn', bestFor: 'Giải thích bằng màn hình thực tế.', content: 'Before/after Excel rối → dashboard sếp.' }
];

export const CTA_LIBRARY = [
  { title: 'Demo 15 phút', text: 'Xem thử dashboard công trình trong 15 phút', why: 'Ít rào cản, không ép mua ngay.' },
  { title: 'Checklist miễn phí', text: 'Tải checklist hồ sơ thanh toán công trình', why: 'Hợp cho lead lạnh và kế toán đang tìm mẫu.' },
  { title: 'File mẫu đã ẩn', text: 'Gửi một file mẫu đã ẩn thông tin để dựng demo đúng quy trình', why: 'Chuyển lead từ tò mò sang nhu cầu thật.' },
  { title: 'Báo cáo sếp 5 dòng', text: 'Nhận mẫu báo cáo sếp: ngân sách, tạm ứng, công nợ, hồ sơ thiếu, quỹ dầu', why: 'Đánh thẳng vào giá trị ra quyết định.' }
];

export const CONTENT_ANGLES = [
  { angle: 'Tạm ứng treo', hook: 'Cuối tháng vẫn không biết ai còn treo tạm ứng?', offer: 'Dashboard aging tạm ứng và nhắc hoàn ứng.' },
  { angle: 'Hồ sơ thiếu', hook: 'Thanh toán rồi mới phát hiện thiếu nghiệm thu/hóa đơn?', offer: 'Checklist hồ sơ trước khi duyệt chi.' },
  { angle: 'Quỹ dầu', hook: 'Cấp dầu nhiều nhưng không khớp nhật trình xe/máy?', offer: 'Cảnh báo dầu vượt định mức.' },
  { angle: 'Báo cáo sếp', hook: 'Mất nửa ngày gom Excel để báo cáo công trình?', offer: 'Báo cáo 5 KPI trong vài phút.' },
  { angle: 'Kho vật tư', hook: 'Nhập xuất tồn lệch nhưng không biết lệch từ phiếu nào?', offer: 'Luồng nhập/xuất/tồn có cảnh báo âm kho.' }
];

export const FUNNEL_FIXES = [
  { problem: 'Traffic có nhưng ít lead', fix: 'Đổi hook từ “phần mềm kế toán” sang nỗi đau cụ thể: tạm ứng treo/hồ sơ thiếu.' },
  { problem: 'Lead trả lời nhưng không demo', fix: 'Đưa demo xuống 15 phút và nói rõ không cần thay phần mềm hiện tại.' },
  { problem: 'Demo xong không mua', fix: 'Tính ROI bằng giờ tiết kiệm/tháng và rủi ro giảm được.' },
  { problem: 'Khách mua nhưng không dùng', fix: 'Onboarding 7 ngày: tạo công trình, nhập 5 khoản chi, xuất báo cáo sếp.' },
  { problem: 'Chi phí marketing cao', fix: 'Ưu tiên referral và nội dung case thật trước quảng cáo trả phí.' }
];
