export const PRICING_PACKAGES = [
  { name: 'Nội Bộ Offline ($0)', price: 0, audience: 'Founder/Developer độc lập chạy offline máy cá nhân', value: 'Chạy Local Offline LLM WebGPU, xưởng game Three.js, kịch bản 1-click không cần internet.', risk: 'Phụ thuộc vào cấu hình GPU/RAM máy tính của người dùng.' },
  { name: 'Studio Indie Pro', price: 299000, audience: 'Nhóm phát triển game nhỏ hoặc Creator làm phim ngắn', value: 'Mở khóa đầy đủ 5 Archetypes 3D Avatar, xuất HTML5 Game Standalone, render video 4K không giới hạn.', risk: 'Cần hướng dẫn tích hợp tài nguyên âm thanh WebAudio Synth.' },
  { name: 'Enterprise Studio Suite', price: 990000, audience: 'Studio chuyên nghiệp, Agency sáng tạo nội dung đa kênh', value: 'Toàn quyền đàm thoại Duplex Voice siêu tốc <150ms, Swarm AI tự trị, tích hợp Telegram Bot 2 chiều.', risk: 'Cần phân quyền API keys và thiết lập backup dữ liệu dự án.' },
  { name: 'Custom AI Engine Deployment', price: 9000000, audience: 'Doanh nghiệp muốn tích hợp Agent độc quyền', value: 'Tùy biến model AI chuyên biệt, huấn luyện voice riêng, thiết kế avatar 3D thương hiệu, bàn giao source code.', risk: 'Cần xác định rõ scope kỹ thuật và SLA hỗ trợ.' }
];

export const PRICING_METRICS = [
  { name: 'ROI Sáng Tạo', formula: '(Chi phí outsource tiết kiệm + thời gian dev rút ngắn) / chi phí bản quyền', note: 'Dùng để thuyết phục Founder duyệt ngân sách công nghệ.' },
  { name: 'Cost per Asset / Video', formula: 'monthlyCost / totalVideosAndGamesGenerated', note: 'Đo lường chi phí cực thấp khi sinh hàng trăm asset số với $0 cloud API.' },
  { name: 'Payback period', formula: 'setupCost / monthlyProductivityGains', note: 'Thời gian thu hồi vốn sau khi ứng dụng Studio tự trị.' },
  { name: 'Support burden', formula: 'supportHours * hourlyCost', note: 'Chi phí hỗ trợ người dùng được tối ưu nhờ hệ thống tự sửa lỗi (Self-Healing).' },
  { name: 'Gross margin', formula: '(revenue - hosting - support - AI cost) / revenue', note: 'Biên lợi nhuận gộp vượt trội nhờ cơ chế On-Device Local Offline.' }
];

export const VALUE_DRIVERS = [
  'Rút ngắn thời gian làm game 3D và kịch bản video từ nhiều tuần xuống vài giây.',
  'Tiết kiệm 100% chi phí API cloud nhờ động cơ WebLLM / ONNX WebGPU chạy $0 vĩnh viễn.',
  'Tự động hóa chuỗi sản xuất nội dung viral 4K với WebAudio Synth và lệnh FFmpeg.',
  'Tương tác đàm thoại giọng nói 2 chiều siêu mượt với độ trễ <150ms và ngắt lời tức thì.',
  'Xuất bản phẩm độc lập dạng 1 file HTML5 hoặc video hoàn chỉnh chạy không cần server.'
];

export const SCOPE_CONTROL_RULES = [
  { rule: 'Tách biệt bản quyền Engine và dịch vụ Custom', reason: 'Engine là sản phẩm đóng gói chuẩn, tùy biến theo yêu cầu là dịch vụ kỹ sư.' },
  { rule: 'Giới hạn số vòng điều chỉnh Avatar thương hiệu', reason: 'Tránh kéo dài tiến độ thiết kế 3D mà không tối ưu được thời gian.' },
  { rule: 'Tính phí theo số lượng Studio/Dự án hoạt động', reason: 'Scale theo quy mô sản phẩm và lưu lượng người chơi.' },
  { rule: 'Tận dụng mã nguồn mở và Web standards', reason: 'Đảm bảo ứng dụng chạy độc lập, nhẹ nhàng và bền vững.' },
  { rule: 'Minh bạch năng lực AI', reason: 'AI hỗ trợ tự động hóa và tăng tốc cực đại, Founder giữ quyền phê duyệt sáng tạo cuối cùng.' }
];

export const ROI_CASES = [
  { title: 'Tốc độ phát triển Game 3D', before: 'Mất 4 tuần dựng bản đồ và viết AI quái vật', after: 'Sinh Procedural 3D và Boss FSM trong 1 phút', saving: 'Tiết kiệm 95% thời gian dev ban đầu' },
  { title: 'Sản xuất kịch bản Video 4K', before: 'Thuê biên kịch mất vài triệu/video', after: 'Sinh 5 phân cảnh 4K 1-click chi phí $0', saving: 'Giảm 100% chi phí nội dung thô' },
  { title: 'Chi phí Token & Cloud', before: 'Tốn $100-$300/tháng cho các API bên ngoài', after: 'Chạy Offline On-Device LLM miễn phí', saving: 'Tiết kiệm hàng chục triệu đồng/năm' },
  { title: 'Đàm thoại vận hành AI', before: 'Gõ prompt văn bản tốn thời gian', after: 'Nói chuyện trực tiếp qua mic độ trễ <150ms', saving: 'Tăng tốc độ ra quyết định và chỉ đạo robot' }
];

