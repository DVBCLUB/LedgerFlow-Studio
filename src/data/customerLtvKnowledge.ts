export const CUSTOMER_SEGMENTS = [
  { name: 'Kế toán công ty xây dựng nhỏ', pain: 'Tổng hợp chi phí công trình, tạm ứng và chứng từ thủ công.', value: 'Tiết kiệm thời gian báo cáo sếp và giảm hồ sơ thiếu.', retention: 'Cao nếu dashboard đúng nhu cầu hằng tuần.' },
  { name: 'Thủ kho công trình', pain: 'Nhập kho, xuất kho, cấp dầu và phiếu giấy rời rạc.', value: 'Dễ nhập liệu, ít gõ, giảm tranh cãi lệch kho/dầu.', retention: 'Phụ thuộc giao diện đơn giản và chạy tốt trên công trường.' },
  { name: 'Kế toán trưởng', pain: 'Sợ sai VAT, tạm ứng treo, chi phí không đủ hồ sơ.', value: 'Có cảnh báo và log kiểm toán trước khi duyệt.', retention: 'Cao nếu giảm rủi ro và không làm mất quyền kiểm soát.' },
  { name: 'Chủ doanh nghiệp', pain: 'Không biết công trình nào vượt chi phí, tiền đang kẹt ở đâu.', value: 'Dashboard quyết định: ngân sách, dòng tiền, công nợ, rủi ro.', retention: 'Cao nếu báo cáo dễ hiểu và có số liệu đáng tin.' }
];

export const LTV_FORMULAS = [
  { name: 'LTV cơ bản', formula: 'ARPU * GrossMargin / MonthlyChurn', use: 'Ước tính giá trị vòng đời khách hàng.' },
  { name: 'LTV/CAC', formula: 'LTV / CAC', use: '>= 3 thường được xem là khỏe; thấp hơn cần giảm CAC hoặc tăng giữ chân.' },
  { name: 'Payback period', formula: 'CAC / monthlyGrossProfitPerCustomer', use: 'Số tháng thu hồi chi phí bán hàng/triển khai.' },
  { name: 'Churn risk score', formula: 'loginDrop + ticketOverdue + unpaidInvoice + lowNps', use: 'Ưu tiên khách cần chăm sóc trước khi rời bỏ.' },
  { name: 'Expansion revenue', formula: 'upsellRate * existingMRR', use: 'Doanh thu tăng thêm từ khách hiện hữu.' }
];

export const CHURN_SIGNALS = [
  { signal: 'Không đăng nhập 14 ngày', meaning: 'Người dùng không còn đưa phần mềm vào quy trình.', action: 'Gửi checklist hướng dẫn và gọi hỏi vướng mắc.' },
  { signal: 'Không xuất báo cáo sếp', meaning: 'Chưa thấy giá trị rõ ràng.', action: 'Gợi ý mẫu dashboard ngân sách, tạm ứng, hồ sơ thiếu.' },
  { signal: 'Nhiều lỗi nhập liệu', meaning: 'Form quá khó hoặc quy trình chưa phù hợp.', action: 'Rút gọn trường nhập và tạo template mẫu.' },
  { signal: 'Hóa đơn/chứng từ không được upload', meaning: 'Người dùng vẫn làm ngoài Excel/Zalo.', action: 'Tạo luồng kéo thả file và nhắc hồ sơ thiếu.' },
  { signal: 'Không thanh toán đúng hạn', meaning: 'Khách chưa thấy ROI hoặc đang giảm nhu cầu.', action: 'Gửi báo cáo giá trị tiết kiệm và đề xuất gói thấp hơn.' }
];

export const RETENTION_PLAYBOOK = [
  { stage: 'Ngày 1', task: 'Import dữ liệu mẫu và tạo công trình đầu tiên.', metric: 'First project created' },
  { stage: 'Ngày 3', task: 'Nhập 5 khoản chi và 1 tạm ứng.', metric: 'First accounting workflow completed' },
  { stage: 'Ngày 7', task: 'Xuất báo cáo sếp lần đầu.', metric: 'First boss report exported' },
  { stage: 'Ngày 14', task: 'Bật cảnh báo thiếu chứng từ, VAT, hoàn ứng.', metric: 'Risk alerts enabled' },
  { stage: 'Ngày 30', task: 'So sánh thời gian trước/sau khi dùng phần mềm.', metric: 'ROI proof collected' }
];

export const HEALTH_SCORE_WEIGHTS = [
  { factor: 'Engagement', weight: 35, example: 'Số lần đăng nhập, số báo cáo xuất, số hồ sơ xử lý.' },
  { factor: 'Data completeness', weight: 25, example: 'Tỷ lệ hồ sơ có đủ chứng từ và mã công trình.' },
  { factor: 'Support friction', weight: 15, example: 'Ticket lỗi, thời gian phản hồi, số lần hướng dẫn lại.' },
  { factor: 'Business outcome', weight: 25, example: 'Tiết kiệm giờ làm, giảm tạm ứng treo, giảm hồ sơ thiếu.' }
];

export const WINBACK_MESSAGES = [
  { title: 'Khách ít đăng nhập', message: 'Tuần này hệ thống thấy anh/chị chưa xuất báo cáo công trình. Tôi gửi lại mẫu báo cáo sếp 5 dòng để dùng ngay nhé.' },
  { title: 'Khách kẹt nhập liệu', message: 'Nếu phần nhập chi phí đang nhiều trường quá, tôi có thể bật mẫu nhập nhanh chỉ gồm công trình, loại chi, số tiền, chứng từ.' },
  { title: 'Khách sắp hủy', message: 'Trước khi dừng, mình thử chuyển sang gói thấp hơn hoặc chỉ dùng dashboard tạm ứng/hồ sơ thiếu trong 30 ngày được không?' }
];
