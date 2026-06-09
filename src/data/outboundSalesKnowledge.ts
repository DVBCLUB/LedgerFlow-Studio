export const OUTBOUND_ICP = [
  { target: 'Kế toán trưởng công ty xây dựng nhỏ', pain: 'Báo cáo sếp chậm, hồ sơ thiếu, tạm ứng treo.', hook: 'Em có demo 15 phút giúp thấy ngay công trình nào vượt chi và hồ sơ nào thiếu.' },
  { target: 'Chủ doanh nghiệp xây dựng', pain: 'Không nhìn được tiền đang kẹt ở công trình nào.', hook: 'Dashboard 5 chỉ số: ngân sách, tạm ứng, công nợ, hồ sơ thiếu, quỹ dầu.' },
  { target: 'Kế toán dịch vụ có khách xây dựng', pain: 'Khách gửi chứng từ rời rạc, Excel/Zalo lộn xộn.', hook: 'Dùng như lớp quản trị hồ sơ trước khi hạch toán.' },
  { target: 'Thủ kho/chỉ huy trưởng', pain: 'Phiếu nhập xuất, cấp dầu và chứng từ công trường dễ lệch.', hook: 'Form nhập nhanh, giảm gõ lại, có checklist phiếu.' }
];

export const SALES_SEQUENCE = [
  { day: 'Ngày 1', touch: 'Tin nhắn mở đầu', goal: 'Nêu đúng nỗi đau, xin 10-15 phút demo, không gửi quảng cáo dài.' },
  { day: 'Ngày 3', touch: 'Follow-up giá trị', goal: 'Gửi mẫu báo cáo sếp hoặc checklist hồ sơ thiếu.' },
  { day: 'Ngày 7', touch: 'Case nhỏ', goal: 'Kể ví dụ giảm tạm ứng treo, giảm thời gian tổng hợp.' },
  { day: 'Ngày 14', touch: 'Break-up nhẹ', goal: 'Để ngỏ, hỏi có nên liên hệ lại khi quyết toán hoặc cuối tháng.' }
];

export const COLD_MESSAGES = [
  { title: 'Kế toán trưởng', text: 'Chào anh/chị, em đang làm công cụ giúp kế toán xây dựng theo dõi chi phí công trình, tạm ứng, hóa đơn và hồ sơ thiếu trên một dashboard. Nếu hiện tại anh/chị vẫn phải gom Excel/Zalo để báo cáo sếp, em xin demo 15 phút một mẫu rất thực tế.' },
  { title: 'Chủ doanh nghiệp', text: 'Chào anh/chị, em có bản demo giúp chủ doanh nghiệp xây dựng nhìn nhanh 5 thứ: công trình nào vượt ngân sách, tạm ứng còn treo, công nợ phải trả, hồ sơ thiếu và quỹ dầu bất thường. Anh/chị có muốn xem thử bản mẫu 15 phút không?' },
  { title: 'Kế toán dịch vụ', text: 'Chào anh/chị, nếu anh/chị có khách xây dựng đang gửi chứng từ rời rạc qua Zalo/Excel, em có tool gom hồ sơ, cảnh báo thiếu chứng từ và xuất báo cáo công trình. Em muốn gửi demo để anh/chị xem có dùng cho khách được không.' }
];

export const OBJECTIONS = [
  { objection: 'Công ty tôi đang dùng Excel ổn rồi', response: 'Dạ Excel vẫn giữ được. Tool này chỉ gom dữ liệu, cảnh báo hồ sơ thiếu/tạm ứng treo và xuất báo cáo sếp nhanh hơn, không bắt thay toàn bộ quy trình.' },
  { objection: 'Sợ lộ dữ liệu', response: 'Bản đầu có thể chạy offline/local, không cần đưa sao kê/hóa đơn lên cloud. Dữ liệu nhạy cảm có thể ẩn trước khi dùng AI.' },
  { objection: 'Phần mềm kế toán đang có rồi', response: 'Dạ phần mềm kế toán xử lý sổ sách. Bên em tập trung lớp quản trị công trình trước hạch toán: tạm ứng, hồ sơ thiếu, kho/dầu, dashboard sếp.' },
  { objection: 'Không có thời gian học', response: 'Bản demo chỉ dùng 3 luồng: nhập chi phí, hoàn ứng, xem báo cáo sếp. Nếu mất hơn 15 phút để hiểu thì em xem như sản phẩm chưa đạt.' },
  { objection: 'Giá bao nhiêu?', response: 'Tùy phạm vi. Có bản nội bộ/offline để test trước, gói tháng cho team nhỏ và phí triển khai riêng nếu cần tùy chỉnh dữ liệu cũ.' }
];

export const PIPELINE_STAGES = [
  { stage: 'Lead mới', criteria: 'Có đúng ngành xây dựng/kế toán và có nỗi đau hồ sơ/chi phí.', next: 'Gửi tin nhắn mở đầu.' },
  { stage: 'Đã phản hồi', criteria: 'Khách trả lời có quan tâm hoặc nêu vấn đề hiện tại.', next: 'Hỏi 3 câu chẩn đoán.' },
  { stage: 'Đã demo', criteria: 'Khách xem dashboard hoặc dùng dữ liệu mẫu.', next: 'Xin file mẫu đã ẩn thông tin.' },
  { stage: 'Đề xuất giá', criteria: 'Đã biết số người dùng, số công trình, phạm vi triển khai.', next: 'Gửi báo giá tách phần mềm/triển khai.' },
  { stage: 'Thắng/Thua', criteria: 'Khách thanh toán hoặc từ chối rõ lý do.', next: 'Ghi lý do để cải tiến ICP/message.' }
];

export const DISCOVERY_QUESTIONS = [
  'Hiện anh/chị tổng hợp chi phí công trình bằng Excel, phần mềm kế toán hay Zalo?',
  'Mỗi tháng mất bao lâu để làm báo cáo cho sếp?',
  'Khoản nào hay bị thiếu chứng từ nhất: VAT, nghiệm thu, phiếu kho, tạm ứng, dầu?',
  'Ai là người nhập dữ liệu đầu tiên ở công trường/văn phòng?',
  'Nếu demo chỉ giải quyết một việc, anh/chị muốn thấy việc gì trước?'
];
