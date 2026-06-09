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
