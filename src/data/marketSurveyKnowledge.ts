export const ICP_SEGMENTS = [
  { name: 'Studio Game & Solo Game Dev', pain: 'Thiếu công cụ sinh bản đồ 3D và Boss AI tự động, tốn nhiều tháng code thủ công.', buyingTrigger: 'Cần ra mắt game nhanh, muốn tiết kiệm chi phí asset và backend.', message: 'Sinh thế giới 3D, Boss AI FSM và xuất game HTML5 chơi ngay trong 1 phút.' },
  { name: 'Nhà Sáng Tạo Video AI & Marketer', pain: 'Chi phí sản xuất video cao, kịch bản rời rạc, render mất nhiều thời gian.', buyingTrigger: 'Cần sản xuất hàng loạt video ngắn 4K cho TikTok/YouTube.', message: 'Trình biên kịch 1-Click: kịch bản 5 phân cảnh, giọng đọc tiếng Việt, nhạc nền và FFmpeg render.' },
  { name: 'Founder Công Ty Phần Mềm / SaaS', pain: 'Chi phí token API cloud đắt đỏ, phụ thuộc hoàn toàn vào OpenAI/Anthropic.', buyingTrigger: 'Hóa đơn cloud tăng cao hoặc cần chạy offline bảo mật $0.', message: 'Tích hợp On-Device Local Offline LLM WebGPU $0 chi phí vĩnh viễn.' },
  { name: 'Giám Đốc Kỹ Thuật (CTO / Tech Lead)', pain: 'Khó kiểm soát chất lượng code, kiến trúc phân tán và thiếu công cụ đàm thoại thời gian thực.', buyingTrigger: 'Cần chuẩn hóa quy trình DevOps, self-healing và đàm thoại Duplex.', message: 'Hệ điều hành phần mềm tự trị toàn diện với Glacia Robot Level 5.' }
];

export const SURVEY_QUESTIONS = [
  { question: 'Hiện studio đang phát triển game/phần mềm và sản xuất video bằng công cụ gì?', purpose: 'Khảo sát đối thủ cạnh tranh và stack công nghệ hiện tại.' },
  { question: 'Mỗi tháng studio mất bao lâu cho các khâu lặp lại như lên ý tưởng, dựng cảnh 3D, viết kịch bản?', purpose: 'Tính toán chỉ số ROI và xây dựng thông điệp bán hàng.' },
  { question: 'Khâu nào đang gây nghẽn tiến độ ra mắt sản phẩm nhất?', purpose: 'Ưu tiên phát triển các module tạo giá trị cao: 3D Lab, Video Studio, Duplex Voice.' },
  { question: 'Chi phí API và hạ tầng cloud trung bình mỗi tháng của studio là bao nhiêu?', purpose: 'Chứng minh lợi thế tiết kiệm chi phí của động cơ Offline LLM $0.' },
  { question: 'Founder / CTO quan tâm nhất đến chỉ số vận hành nào?', purpose: 'Thiết kế màn hình CEO Cockpit và báo cáo tự trị ban sáng.' },
  { question: 'Mức phí bản quyền nào là hợp lý nếu studio tiết kiệm được 40 giờ làm việc mỗi tháng?', purpose: 'Định giá và kiểm tra willingness-to-pay.' },
  { question: 'Yếu tố nào quan trọng nhất khi quyết định áp dụng một công nghệ AI mới?', purpose: 'Đánh giá rào cản: độ ổn định, chi phí, khả năng chạy offline hay tốc độ render.' }
];

export const COMPETITOR_MAP = [
  { type: 'Công cụ AI rời rạc (ChatGPT / Midjourney / Suno)', strength: 'Chất lượng đơn lẻ tốt.', weakness: 'Phân mảnh, không liên kết thành chuỗi sản xuất game/video hoàn chỉnh, chi phí hàng tháng cao.', opportunity: 'Tích hợp All-in-One: Game 3D + Video 4K + WebAudio Synth trong một nền tảng duy nhất.' },
  { type: 'Game Engine truyền thống (Unity / Unreal)', strength: 'Mạnh mẽ cho game AAA đồ họa khủng.', weakness: 'Nặng nề, tốn nhiều tháng học và dựng cảnh, không phù hợp cho game web/mobile nhẹ nhàng.', opportunity: 'Three.js WebGL/WebGPU siêu nhẹ, xuất file HTML5 1-Click chơi ngay trên trình duyệt.' },
  { type: 'Nền tảng Cloud AI APIs (OpenAI / Replicate)', strength: 'Model lớn, đa dạng.', weakness: 'Đắt đỏ, độ trễ mạng cao, ngừng hoạt động khi mất internet.', opportunity: 'WebLLM / ONNX On-Device Local Offline $0 chi phí vĩnh viễn.' },
  { type: 'Quy trình sản xuất thủ công', strength: 'Kiểm soát chi tiết.', weakness: 'Tốc độ chậm, chi phí nhân sự lớn, khó scale nội dung hàng loạt.', opportunity: 'Tự động hóa 8 chặng khép kín với Swarm AI và Robot Glacia.' }
];

export const MARKET_SCORECARD = [
  { factor: 'Độ đau thị trường', score: 9, note: 'Tốc độ phát triển sản phẩm, chi phí GPU/API và sản xuất video là nhu cầu cấp thiết.' },
  { factor: 'Khả năng sinh lời', score: 8, note: 'Doanh thu từ game indie, video marketing và phần mềm SaaS số lượng lớn.' },
  { factor: 'Tần suất sử dụng', score: 9, note: 'Studio sử dụng hàng ngày để code game, tạo video và đàm thoại vận hành.' },
  { factor: 'Khác biệt công nghệ', score: 9, note: 'Dẫn đầu với Local Offline LLM, 3D Character Studio và Full-Duplex Realtime Voice.' },
  { factor: 'Tính linh hoạt', score: 8, note: 'Chạy mượt mà trên Windows Desktop, web và xuất bản phẩm độc lập không cần server.' }
];

export const INTERVIEW_SCRIPT = [
  'Mở đầu: Em chào anh/chị, em đang khảo sát các điểm nghẽn lớn nhất trong quy trình làm game 3D và sản xuất video của các Studio độc lập.',
  'Hỏi quy trình hiện tại: Từ ý tưởng ban đầu đến khi xuất bản 1 video hoặc tựa game, studio mất bao nhiêu ngày?',
  'Hỏi chi phí: Chi phí bản quyền tool, API AI và server hiện tại đang chiếm bao nhiêu % ngân sách?',
  'Hỏi giá trị: Nếu có 1 công cụ giúp sinh game 3D và video 4K 1-click với $0 chi phí cloud thì studio có muốn thử nghiệm không?',
  'Kết thúc: Mời trải nghiệm trực tiếp bản demo tương tác 60FPS trên LedgerFlow Studio.'
];

