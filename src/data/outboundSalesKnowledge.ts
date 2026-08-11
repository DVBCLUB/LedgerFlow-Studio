export const OUTBOUND_ICP = [
  { target: 'Founder / Giám đốc Studio Game & SaaS', pain: 'Báo cáo sếp chậm, hồ sơ thiếu, dòng tiền phân tán.', hook: 'Em có demo 15 phút giúp thấy ngay dự án sản phẩm nào vượt chi và doanh thu Affiliate/Ads.' },
  { target: 'Chủ Studio Sản phẩm Số & Content Creation', pain: 'Không nhìn được tiền đang kẹt ở dự án nào.', hook: 'Dashboard 5 chỉ số: ngân sách sản phẩm, dòng tiền Affiliate, Ads AdSense, In-app Sales, AI credits.' },
  { target: 'Trưởng nhóm Marketing & Growth', pain: 'Khách và đối tác gửi chứng từ rời rạc, Zalo/Excel lộn xộn.', hook: 'Dùng như lớp quản trị hồ sơ dự án trước khi duyệt phát hành.' },
  { target: 'Quản lý Sản phẩm / Product Owner', pain: 'Tiến độ build Game PC/Mobile và chứng từ chi phí API dễ lệch.', hook: 'Form nhập nhanh, giảm gõ lại, có checklist phiếu.' }
];

export const SALES_SEQUENCE = [
  { day: 'Ngày 1', touch: 'Tin nhắn mở đầu', goal: 'Nêu đúng nỗi đau, xin 10-15 phút demo, không gửi quảng cáo dài.' },
  { day: 'Ngày 3', touch: 'Follow-up giá trị', goal: 'Gửi mẫu báo cáo sếp hoặc checklist hồ sơ dự án.' },
  { day: 'Ngày 7', touch: 'Case nhỏ', goal: 'Kể ví dụ tối ưu dòng tiền Affiliate, giảm thời gian tổng hợp.' },
  { day: 'Ngày 14', touch: 'Break-up nhẹ', goal: 'Để ngỏ, hỏi có nên liên hệ lại khi phát hành phiên bản mới hoặc cuối tháng.' }
];

export const COLD_MESSAGES = [
  { title: 'Quản lý Sản phẩm', text: 'Chào anh/chị, em đang làm công cụ giúp Studio công nghệ theo dõi chi phí dự án sản phẩm, dòng tiền Affiliate, hóa đơn và hồ sơ phát hành trên một dashboard. Nếu hiện tại anh/chị vẫn phải gom Excel/Zalo để báo cáo, em xin demo 15 phút mẫu thực tế.' },
  { title: 'Chủ Studio', text: 'Chào anh/chị, em có bản demo giúp chủ Studio nhìn nhanh 5 thứ: sản phẩm nào vượt ngân sách, dòng tiền Affiliate, Ads AdSense, công nợ và chi phí API AI. Anh/chị có muốn xem thử bản mẫu 15 phút không?' },
  { title: 'Quản lý Growth', text: 'Chào anh/chị, nếu anh/chị có team Marketing đang gửi dữ liệu chiến dịch rời rạc qua Zalo/Excel, em có tool gom hồ sơ, cảnh báo thiếu chứng từ và xuất báo cáo hiệu quả. Em muốn gửi demo để anh/chị xem thử.' }
];

export const OBJECTIONS = [
  { objection: 'Công ty tôi đang dùng Excel ổn rồi', response: 'Dạ Excel vẫn giữ được. Tool này chỉ gom dữ liệu, cảnh báo hồ sơ thiếu/dòng tiền treo và xuất báo cáo sếp nhanh hơn, không bắt thay toàn bộ quy trình.' },
  { objection: 'Sợ lộ dữ liệu', response: 'Bản đầu có thể chạy offline/local, không cần đưa sao kê/hóa đơn lên cloud. Dữ liệu nhạy cảm có thể ẩn trước khi dùng AI.' },
  { objection: 'Phần mềm quản lý đang có rồi', response: 'Dạ phần mềm kế toán xử lý sổ sách. Bên em tập trung lớp quản trị sản phẩm trước hạch toán: dòng tiền Affiliate, Ads, Game build, chi phí API, dashboard sếp.' },
  { objection: 'Không có thời gian học', response: 'Bản demo chỉ dùng 3 luồng: nhập chi phí, duyệt phát hành, xem báo cáo sếp. Nếu mất hơn 15 phút để hiểu thì em xem như sản phẩm chưa đạt.' },
  { objection: 'Giá bao nhiêu?', response: 'Tùy phạm vi. Có bản nội bộ/offline để test trước, gói tháng cho team nhỏ và phí triển khai riêng nếu cần tùy chỉnh dữ liệu cũ.' }
];

export const PIPELINE_STAGES = [
  { stage: 'Lead mới', criteria: 'Có đúng ngành phần mềm/Game/Media và có nỗi đau hồ sơ/chi phí.', next: 'Gửi tin nhắn mở đầu.' },
  { stage: 'Đã phản hồi', criteria: 'Khách trả lời có quan tâm hoặc nêu vấn đề hiện tại.', next: 'Hỏi 3 câu chẩn đoán.' },
  { stage: 'Đã demo', criteria: 'Khách xem dashboard hoặc dùng dữ liệu mẫu.', next: 'Xin file mẫu đã ẩn thông tin.' },
  { stage: 'Đề xuất giá', criteria: 'Đã biết số người dùng, số dự án, phạm vi triển khai.', next: 'Gửi báo giá tách phần mềm/triển khai.' },
  { stage: 'Thắng/Thua', criteria: 'Khách thanh toán hoặc từ chối rõ lý do.', next: 'Ghi lý do để cải tiến ICP/message.' }
];

export const DISCOVERY_QUESTIONS = [
  'Hiện anh/chị tổng hợp chi phí dự án sản phẩm bằng Excel, phần mềm hay Zalo?',
  'Mỗi tháng mất bao lâu để làm báo cáo cho sếp?',
  'Khoản nào hay bị thiếu chứng từ nhất: VAT, nghiệm thu, chi phí API AI, quảng cáo Ads, Affiliate?',
  'Anh/chị muốn cải thiện báo cáo dòng tiền dự án hay kiểm soát chứng từ trước?'
];

export const AI_MESSAGE_VARIABLES = [
  { key: 'persona', label: 'Đối tượng (Persona)', placeholder: 'Giám đốc Studio Game...' },
  { key: 'pain', label: 'Nỗi đau (Pain Point)', placeholder: 'Dòng tiền Affiliate không theo dõi được...' },
  { key: 'currentTool', label: 'Công cụ hiện tại', placeholder: 'Excel & Zalo...' },
  { key: 'proofAsset', label: 'Bằng chứng / Báo cáo mẫu', placeholder: 'Dashboard 5 KPI 15 phút...' },
  { key: 'cta', label: 'Kêu gọi hành động (CTA)', placeholder: 'Xin 10 phút demo...' },
];

export const AI_OUTBOUND_MESSAGE_PROMPT = `Hãy viết tin nhắn Outbound bán hàng B2B hấp dẫn, súc tích cho Solo Founder Studio Công nghệ & Game:
- Đối tượng: {{persona}}
- Nỗi đau chính: {{pain}}
- Công cụ đang dùng: {{currentTool}}
- Bằng chứng / Báo cáo mẫu: {{proofAsset}}
- Lời mời (CTA): {{cta}}`;

export const BATTLE_CARDS = [
  {
    competitor: 'Excel / Zalo thủ công',
    weakness: 'Không có cảnh báo tự động, dễ thất thoát chứng từ, mất thời gian làm báo cáo.',
    ourAdvantage: 'Hệ thống tự động gom dòng tiền Affiliate, Ads, Game Sales và quản lý hồ sơ 1-Click.',
    talkTrack: 'Excel rất tốt nhưng LedgerFlow giúp tự động hóa 80% khâu tổng hợp báo cáo cho Giám đốc.',
  },
  {
    competitor: 'Phần mềm Kế toán truyền thống',
    weakness: 'Nặng nề, không quản lý được dòng tiền số (Affiliate, Ads, Game In-app).',
    ourAdvantage: 'Thiết kế riêng cho Solo Founder & Studio Công nghệ/Game/Media với Đội ngũ AI Staff tự vận hành.',
    talkTrack: 'Phần mềm kế toán phục vụ khai thuế, LedgerFlow phục vụ điều hành và ra quyết định kinh doanh số.',
  },
];
