export const LEAD_FIT_CRITERIA = [
  { factor: 'Đúng ngành', weight: 25, detail: 'Xây dựng, cơ điện, thầu phụ, kế toán dịch vụ có khách xây dựng.' },
  { factor: 'Nỗi đau rõ', weight: 30, detail: 'Có tạm ứng treo, báo cáo sếp chậm, hồ sơ thiếu, lệch kho/dầu.' },
  { factor: 'Quyền quyết định', weight: 20, detail: 'Kế toán trưởng, chủ doanh nghiệp, người được giao cải tiến quy trình.' },
  { factor: 'Khả năng trả tiền', weight: 15, detail: 'Có nhiều công trình/người dùng hoặc đang tốn nhiều giờ tổng hợp.' },
  { factor: 'Timing', weight: 10, detail: 'Đang cuối tháng, quyết toán, kiểm tra nội bộ, hoặc vừa gặp lỗi chứng từ.' }
];

export const BEHAVIOR_SIGNALS = [
  { signal: 'Xin demo bằng dữ liệu thật đã ẩn', points: 30, action: 'Hot lead: hẹn demo ngay và hỏi file mẫu.' },
  { signal: 'Hỏi giá/phí triển khai', points: 25, action: 'Chuẩn bị báo giá tách phần mềm và triển khai.' },
  { signal: 'Nhắc đến tạm ứng treo/hồ sơ thiếu', points: 20, action: 'Demo đúng module CommandCenter.' },
  { signal: 'Đang dùng Excel/Zalo thủ công', points: 15, action: 'Demo nhập nhanh và báo cáo sếp.' },
  { signal: 'Chỉ hỏi cho biết', points: 5, action: 'Nuôi dưỡng bằng case/checklist, chưa push sale.' }
];

export const LEAD_EXAMPLES = [
  { name: 'Kế toán trưởng công ty xây dựng', company: 'Nhà thầu dân dụng nhỏ', fit: 92, pain: 'Báo cáo sếp chậm, tạm ứng treo 300 triệu', next: 'Demo dashboard ngân sách và hoàn ứng.' },
  { name: 'Chủ doanh nghiệp cơ điện', company: 'MEP 30 nhân sự', fit: 85, pain: 'Không biết công trình nào lãi/lỗ', next: 'Gửi brief 5 KPI cho sếp.' },
  { name: 'Thủ kho công trường', company: 'Công trình HCM', fit: 68, pain: 'Phiếu dầu và vật tư dễ lệch', next: 'Demo form nhập nhanh và quỹ dầu.' },
  { name: 'Sinh viên kế toán', company: 'Cá nhân', fit: 35, pain: 'Muốn học thử', next: 'Đưa vào nhóm nuôi dưỡng, chưa bán gói công ty.' }
];

export const NEXT_ACTION_RULES = [
  { score: '80-100', label: 'Hot', action: 'Gọi hoặc hẹn demo trong ngày. Xin file mẫu đã ẩn thông tin.' },
  { score: '60-79', label: 'Warm', action: 'Gửi case đúng nỗi đau và hỏi 3 câu chẩn đoán.' },
  { score: '40-59', label: 'Nurture', action: 'Gửi checklist, template, mời xem demo nhóm.' },
  { score: '0-39', label: 'Low fit', action: 'Không tốn nhiều thời gian; theo dõi sau.' }
];

export const QUALIFICATION_QUESTIONS = [
  'Anh/chị đang theo dõi chi phí công trình bằng gì?',
  'Khoản nào đang đau nhất: tạm ứng, hóa đơn, kho, dầu, công nợ hay báo cáo sếp?',
  'Ai là người duyệt cuối nếu dùng thử phần mềm?',
  'Mỗi tháng mất bao nhiêu giờ để tổng hợp báo cáo?',
  'Anh/chị có thể gửi một file mẫu đã ẩn thông tin để demo đúng quy trình không?'
];

export const DISQUALIFY_RULES = [
  'Không có nỗi đau cụ thể, chỉ hỏi cho biết.',
  'Không có quyền quyết định và không giới thiệu được người quyết định.',
  'Không có dữ liệu công trình hoặc không dùng thường xuyên.',
  'Muốn phần mềm full ERP miễn phí ngay từ đầu.',
  'Yêu cầu tích hợp phức tạp nhưng không có ngân sách triển khai.'
];

export interface PersonaCanvasField {
  id: string;
  label: string;
  prompt: string;
  example: string;
}

export const PERSONA_CANVAS_TEMPLATE: PersonaCanvasField[] = [
  { id: 'role', label: 'Vai trò', prompt: 'Người này là ai trong doanh nghiệp?', example: 'Kế toán trưởng, founder, sales operator, kế toán dịch vụ.' },
  { id: 'job', label: 'Job-to-be-done', prompt: 'Họ thuê sản phẩm để hoàn thành việc gì?', example: 'Mỗi sáng biết công trình/chi phí/lead nào cần xử lý trước.' },
  { id: 'pain', label: 'Pain hiện tại', prompt: 'Điều gì đang làm họ mất thời gian, tiền hoặc uy tín?', example: 'Dữ liệu rời rạc, báo cáo chậm, không rõ ai đang giữ tạm ứng.' },
  { id: 'trigger', label: 'Trigger mua', prompt: 'Sự kiện nào khiến họ phải tìm giải pháp ngay?', example: 'Cuối tháng, quyết toán, sếp hỏi báo cáo, audit nội bộ, lead rớt nhiều.' },
  { id: 'current_solution', label: 'Cách làm hiện tại', prompt: 'Họ đang dùng gì trước LedgerFlow?', example: 'Excel, Zalo, MISA, AppSheet, email, file drive.' },
  { id: 'success_metric', label: 'Thành công đo bằng gì', prompt: 'Sau 14 ngày, họ biết tool có đáng dùng bằng chỉ số nào?', example: 'Giảm giờ tổng hợp, tăng demo booked, xuất được daily brief, đóng review loop.' },
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
