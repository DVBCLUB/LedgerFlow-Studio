export const FUNNEL_STAGES = [
  { stage: 'Traffic', goal: 'Kéo đúng người xem: Indie game developers, AI video creators, SaaS founders.', metric: 'Website visits / YouTube views / GitHub stars', leak: 'Nội dung quá chung chung, không phô diễn được đồ họa và tốc độ sinh AI.' },
  { stage: 'Lead', goal: 'Lấy thông tin liên hệ hoặc đăng ký dùng thử 1-Click.', metric: 'Reply rate / form submits / Telegram join rate', leak: 'CTA mơ hồ, khách chưa thấy trải nghiệm game/video ngay trên web.' },
  { stage: 'Demo', goal: 'Cho khách chơi thử Game 3D 60FPS hoặc xem Video 4K sinh trong 10 giây.', metric: 'Interactive Sandbox played / Video generated', leak: 'Demo quá dài hoặc không cho tương tác trực tiếp.' },
  { stage: 'Proposal', goal: 'Gửi bảng giá gói Studio, License Engine hoặc Custom AI Agent.', metric: 'Proposal sent / accepted', leak: 'Báo giá không làm nổi bật lợi thế $0 chi phí cloud.' },
  { stage: 'Paid', goal: 'Khách thanh toán bản quyền và kích hoạt studio thành công.', metric: 'Paid customers / activation', leak: 'Onboarding chậm, người dùng chưa xuất được file standalone.' }
];

export const CHANNELS = [
  { channel: 'Cộng đồng Game Dev & AI Creator', bestFor: 'Tìm kiếm nhu cầu thực tế, chia sẻ bản demo 3D tương tác.', content: 'Video gameplay 60FPS, showcase Avatar 3D, prompt sinh phim ngắn 4K.' },
  { channel: 'Giới thiệu từ nhà phát triển (Referral)', bestFor: 'Khách hàng có độ tin cậy và gắn kết cao.', content: 'Demo 5 phút trực tiếp + chia sẻ mã nguồn mẫu.' },
  { channel: 'Social Media (TikTok / YouTube Shorts / X)', bestFor: 'Lan tỏa viral với các video kỹ xảo AI đỉnh cao.', content: 'Clip ngắn so sánh: code thủ công 7 ngày vs Glacia sinh trong 10 giây.' },
  { channel: 'SEO & Technical Blog', bestFor: 'Thu hút traffic tự nhiên dài hạn cho từ khóa công nghệ.', content: 'Bài viết về Three.js, WebGL/WebGPU, WebAudio Synth và Local Offline LLM.' },
  { channel: 'Kênh Discord / Telegram Studio', bestFor: 'Tương tác trực tiếp và cập nhật phiên bản mới hàng ngày.', content: 'Bản tin sáng 6:00 AM, teaser tính năng và hỗ trợ kỹ thuật.' }
];

export const CTA_LIBRARY = [
  { title: 'Chơi Game 3D Ngay', text: 'Trải nghiệm ngay bản game 3D 60FPS trực tiếp trên trình duyệt', why: 'Không cần cài đặt, thấy ngay sức mạnh engine.' },
  { title: 'Biên Kịch Phim 1-Click', text: 'Nhập 1 câu ý tưởng để nhận ngay kịch bản 5 phân cảnh 4K', why: 'Gây ấn tượng tức thì với nhà sáng tạo nội dung.' },
  { title: 'Tải Game HTML5 Độc Lập', text: 'Tải ngay 1 file .HTML chạy offline hoàn chỉnh không cần server', why: 'Chứng minh giải pháp $0 chi phí hosting.' },
  { title: 'Đàm Thoại Trực Tiếp', text: 'Gọi điện và nói chuyện 2 chiều trực tiếp với Robot Glacia', why: 'Trải nghiệm trí tuệ nhân tạo thế hệ mới với độ trễ <150ms.' }
];

export const CONTENT_ANGLES = [
  { angle: 'Tốc độ phát triển', hook: 'Mất cả tháng để làm 1 bản demo game 3D?', offer: 'Glacia sinh thế giới Procedural 3D và Boss AI chỉ trong vài giây.' },
  { angle: 'Chi phí sản xuất phim', hook: 'Chi phí thuê diễn viên và dựng phim quá đắt đỏ?', offer: 'Tạo mẫu Avatar 3D và kịch bản phân cảnh 4K tự động.' },
  { angle: 'Chạy Offline $0', hook: 'Lo ngại chi phí API OpenAI/Claude tăng phi mã?', offer: 'Động cơ WebLLM / ONNX chạy trực tiếp trên GPU máy tính với $0 chi phí.' },
  { angle: 'Đóng gói 1-Click', hook: 'Gặp khó khăn khi xuất bản game đa nền tảng?', offer: 'Xuất file HTML5 Standalone chơi được trên cả PC và Mobile.' },
  { angle: 'Kho Tài Nguyên Số', hook: 'Quản lý kho game assets, kho kịch bản và video rời rạc?', offer: 'Kho tài nguyên số tập trung, tự động nén và đồng bộ vào dự án.' }
];

export const FUNNEL_FIXES = [
  { problem: 'Traffic có nhưng ít lead', fix: 'Đổi hook từ giới thiệu tính năng sang video trải nghiệm thực tế chơi game/làm phim.' },
  { problem: 'Lead xem nhưng chưa tương tác', fix: 'Mở ngay khung chơi game 60FPS trực tiếp không bắt đăng nhập.' },
  { problem: 'Demo xong chưa quyết định', fix: 'Chứng minh ROI bằng số giờ lập trình tiết kiệm được và chi phí $0 vĩnh viễn.' },
  { problem: 'Khách đăng ký nhưng chưa dùng sâu', fix: 'Onboarding 3 bước: chọn Archetype 3D, sinh kịch bản phim, xuất file HTML5.' },
  { problem: 'Chi phí marketing cao', fix: 'Tận dụng kênh lan tỏa hữu cơ qua video demo viral trên TikTok/Shorts.' }
];

