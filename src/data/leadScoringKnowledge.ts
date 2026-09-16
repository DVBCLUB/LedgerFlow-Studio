export const LEAD_FIT_CRITERIA = [
  { factor: 'Đúng ngành', weight: 25, detail: 'Studio Game, Phần mềm SaaS, Kênh sản xuất Video AI, Agency Digital.' },
  { factor: 'Nỗi đau rõ', weight: 30, detail: 'Chi phí GPU/Cloud cao, quản lý kho asset/kịch bản rời rạc, thiếu tự động hóa.' },
  { factor: 'Quyền quyết định', weight: 20, detail: 'Founder, Lead Game Developer, Creative Director, Trưởng nhóm AI.' },
  { factor: 'Khả năng trả tiền', weight: 15, detail: 'Có nhiều dự án game/video hoặc đang tốn nhiều giờ biên kịch và lập trình.' },
  { factor: 'Timing', weight: 10, detail: 'Đang chuẩn bị ra mắt tựa game mới, sản xuất chuỗi video 4K hoặc mở rộng studio.' }
];

export const BEHAVIOR_SIGNALS = [
  { signal: 'Xin demo bằng dữ liệu thật đã ẩn', points: 30, action: 'Hot lead: hẹn demo ngay và hỏi file mẫu.' },
  { signal: 'Hỏi giá/phí bản quyền sản phẩm', points: 25, action: 'Chuẩn bị báo giá gói phần mềm và tài nguyên studio.' },
  { signal: 'Nhắc đến quản lý kho asset/video AI', points: 20, action: 'Demo đúng module Creative Studio HUD.' },
  { signal: 'Đang làm thủ công bằng nhiều tool rời rạc', points: 15, action: 'Demo tự động hóa 1-Click và xuất code.' },
  { signal: 'Chỉ hỏi cho biết', points: 5, action: 'Nuôi dưỡng bằng case/checklist, chưa push sale.' }
];

export const LEAD_EXAMPLES = [
  { name: 'Lead Developer Studio Game', company: 'Indie Game Studio 10 nhân sự', fit: 92, pain: 'Tốn nhiều thời gian thiết kế bản đồ 3D và Boss AI', next: 'Demo xưởng game Procedural 3D và xuất HTML5.' },
  { name: 'Creative Director Video Agency', company: 'Media Production House', fit: 88, pain: 'Chi phí thuê diễn viên và biên kịch video cao', next: 'Demo Avatar 3D và Trình biên kịch 1-Click.' },
  { name: 'Solo SaaS Founder', company: 'Khởi nghiệp công nghệ', fit: 85, pain: 'Cần AI tự động hóa vận hành và đàm thoại realtime', next: 'Demo Glacia Duplex Voice và Offline LLM $0.' },
  { name: 'Sinh viên lập trình', company: 'Cá nhân học tập', fit: 40, pain: 'Muốn học thử Three.js và làm game', next: 'Đưa vào nhóm cộng đồng mã nguồn mở.' }
];

export const NEXT_ACTION_RULES = [
  { score: '80-100', label: 'Hot', action: 'Gọi hoặc hẹn demo trong ngày. Trực tiếp chạy demo Creative Studio.' },
  { score: '60-79', label: 'Warm', action: 'Gửi video demo tính năng và hỏi 3 câu chẩn đoán nhu cầu.' },
  { score: '40-59', label: 'Nurture', action: 'Gửi template game/video mẫu, mời tham gia cộng đồng.' },
  { score: '0-39', label: 'Low fit', action: 'Không tốn nhiều thời gian; tự động gửi bản tin công nghệ.' }
];

export const QUALIFICATION_QUESTIONS = [
  'Anh/chị đang quản lý kho dự án phần mềm/game bằng công cụ gì?',
  'Khâu nào đang tốn nhiều nguồn lực nhất: lập trình gameplay, tạo hình 3D, biên kịch video hay chi phí cloud?',
  'Ai là người duyệt quyết định triển khai công nghệ mới trong studio?',
  'Mỗi tháng studio mất bao nhiêu giờ cho các tác vụ thủ công lặp lại?',
  'Anh/chị có muốn thử nghiệm tính năng sinh kịch bản phim 4K và game 3D 1-click không?'
];

export const DISQUALIFY_RULES = [
  'Không có nhu cầu phát triển sản phẩm công nghệ hoặc sáng tạo nội dung.',
  'Không có quyền quyết định và không kết nối được người phụ trách kỹ thuật.',
  'Không có dự án thực tế hoặc không có kế hoạch phát hành sản phẩm.',
  'Muốn toàn bộ hệ sinh thái mà không có định hướng kinh doanh rõ ràng.',
  'Yêu cầu tùy biến quá dị biệt ngoài phạm vi của Studio.'
];

export interface PersonaCanvasField {
  id: string;
  label: string;
  prompt: string;
  example: string;
}

export const PERSONA_CANVAS_TEMPLATE: PersonaCanvasField[] = [
  { id: 'role', label: 'Vai trò', prompt: 'Người này là ai trong doanh nghiệp?', example: 'Founder, Lead Game Dev, Creative Director, AI Engineer.' },
  { id: 'job', label: 'Job-to-be-done', prompt: 'Họ thuê sản phẩm để hoàn thành việc gì?', example: 'Mỗi ngày tạo game 3D, sinh kịch bản video viral và tự động hóa vận hành.' },
  { id: 'pain', label: 'Pain hiện tại', prompt: 'Điều gì đang làm họ mất thời gian, tiền hoặc uy tín?', example: 'Dữ liệu rời rạc, chi phí nhân sự và API đắt đỏ, tiến độ dự án chậm.' },
  { id: 'trigger', label: 'Trigger mua', prompt: 'Sự kiện nào khiến họ phải tìm giải pháp ngay?', example: 'Chuẩn bị phát hành game mới, cần sản xuất hàng loạt video ngắn hoặc tối ưu ngân sách.' },
  { id: 'current_solution', label: 'Cách làm hiện tại', prompt: 'Họ đang dùng gì trước LedgerFlow?', example: 'Code thủ công, thuê ngoài đắt đỏ, ghép nối nhiều công cụ rời rạc.' },
  { id: 'success_metric', label: 'Thành công đo bằng gì', prompt: 'Sau 14 ngày, họ biết tool có đáng dùng bằng chỉ số nào?', example: 'Xuất được game 3D hoàn chỉnh, render video 4K chi phí $0, tăng tốc độ phát triển 5x.' },
  { id: 'objection', label: 'Objection chính', prompt: 'Lý do gì làm họ chưa mua?', example: 'Sợ lộ dữ liệu, đã có MISA/Excel, không có thời gian học, ngân sách thấp.' },
  { id: 'proof', label: 'Bằng chứng cần thấy', prompt: 'Họ cần thấy artifact nào để tin?', example: 'Dashboard mẫu, checklist, email sequence, báo cáo sếp, case ẩn danh.' },
];

export interface JTBDStatement {
  id: string;
  when: string;
  iWantTo: string;
  soICan: string;
  productCue: string;
}

export const JTBD_FRAMEWORK: JTBDStatement[] = [
  {
    id: 'jtbd-founder-brief',
    when: 'Khi mỗi sáng founder mở nhiều file, nhiều tab và nhiều tin nhắn',
    iWantTo: 'tôi muốn thấy 3 việc cần quyết định nhất theo lane',
    soICan: 'để không bị cuốn vào việc lặt vặt và biết cần giao việc gì tiếp',
    productCue: 'Command Center Daily Brief',
  },
  {
    id: 'jtbd-accounting-control',
    when: 'Khi sếp hỏi chi phí, tạm ứng hoặc hồ sơ thiếu cuối tháng',
    iWantTo: 'tôi muốn có dashboard và checklist đã gom sẵn',
    soICan: 'để trả lời nhanh mà không lục nhiều file Excel/Zalo',
    productCue: 'Accounting Vietnam + Custom Data Workbench',
  },
  {
    id: 'jtbd-growth-copy',
    when: 'Khi cần chạy landing page, email hoặc outbound nhưng chưa rõ thông điệp',
    iWantTo: 'tôi muốn tạo bản nháp copy theo persona và pain',
    soICan: 'để test nhanh mà vẫn có người duyệt trước khi publish',
    productCue: 'LandingPageCopyLab + EmailSequenceBuilder + OutboundSalesHub',
  },
  {
    id: 'jtbd-pilot-scope',
    when: 'Khi lead có quan tâm nhưng sợ triển khai quá lớn',
    iWantTo: 'tôi muốn đề xuất một pilot scope nhỏ',
    soICan: 'để giảm rủi ro và chứng minh ROI trước khi mở rộng',
    productCue: 'PLGConversionHub + MarketingCommandCenter',
  },
];

export const AI_QUALIFICATION_PROMPT = (leadContext: string) => `Bạn là chuyên gia qualification B2B SaaS Việt Nam.

Lead context:
${leadContext}

Hãy phân tích:
1. Persona và job-to-be-done chính
2. Fit score 0-100 và lý do
3. Objection có khả năng xuất hiện
4. Demo workflow nên dùng trước
5. Next action trong 24 giờ

Trả lời tiếng Việt, ngắn gọn, không ép bán nếu lead chưa fit.`;
