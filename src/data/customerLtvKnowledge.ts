export const CUSTOMER_SEGMENTS = [
  { name: 'Studio Game & Solo Developer', pain: 'Quản lý kho game assets, chi phí server GPU và doanh thu in-app rời rạc.', value: 'Tự động tổng hợp chi phí dự án game, quản lý kho asset 3D và dòng tiền 24/7.', retention: 'Cao nếu dashboard game analytics và doanh thu chạy mượt mà.' },
  { name: 'Kênh Sáng Tạo Video & Media House', pain: 'Quản lý kho kịch bản, kho video, chi phí render và bản quyền phân tán.', value: 'Kho lưu trữ kịch bản tập trung, sản xuất video 4K tự động với chi phí $0.', retention: 'Phụ thuộc vào tốc độ biên kịch và render phim AI nhanh.' },
  { name: 'Doanh Nghiệp Phần Mềm SaaS', pain: 'Theo dõi chi phí hạ tầng cloud, chỉ số MRR/ARR và chi phí phát triển module.', value: 'Quản lý kho phần mềm, doanh thu đăng ký và phân bổ chi phí chuẩn xác.', retention: 'Cao nếu giảm thiểu rủi ro dòng tiền và tối ưu chi phí cloud.' },
  { name: 'Founder & Nhà Sáng Lập', pain: 'Không biết dự án phần mềm/game nào đang vượt ngân sách hoặc sinh lời tốt.', value: 'Dashboard điều hành CEO: dòng tiền, doanh thu số, kho dự án và lộ trình phát triển.', retention: 'Cao nếu báo cáo dễ hiểu và số liệu đáng tin cậy.' }
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
  { signal: 'Không xuất báo cáo sếp', meaning: 'Chưa thấy giá trị rõ ràng.', action: 'Gợi ý mẫu dashboard ngân sách, dự án số và kho sản phẩm.' },
  { signal: 'Nhiều lỗi nhập liệu', meaning: 'Form quá khó hoặc quy trình chưa phù hợp.', action: 'Rút gọn trường nhập và tạo template mẫu.' },
  { signal: 'Hóa đơn/chứng từ không được upload', meaning: 'Người dùng vẫn làm ngoài Excel/Zalo.', action: 'Tạo luồng kéo thả file và nhắc hồ sơ thiếu.' },
  { signal: 'Không thanh toán đúng hạn', meaning: 'Khách chưa thấy ROI hoặc đang giảm nhu cầu.', action: 'Gửi báo cáo giá trị tiết kiệm và đề xuất gói thấp hơn.' }
];

export const RETENTION_PLAYBOOK = [
  { stage: 'Ngày 1', task: 'Import dữ liệu mẫu và tạo dự án phần mềm/game đầu tiên.', metric: 'First project created' },
  { stage: 'Ngày 3', task: 'Nhập 5 khoản chi phí dự án và 1 đợt thanh toán.', metric: 'First accounting workflow completed' },
  { stage: 'Ngày 7', task: 'Xuất báo cáo điều hành sản phẩm lần đầu.', metric: 'First boss report exported' },
  { stage: 'Ngày 14', task: 'Bật cảnh báo thiếu chứng từ, dòng tiền và chi phí cloud.', metric: 'Risk alerts enabled' },
  { stage: 'Ngày 30', task: 'So sánh thời gian trước/sau khi dùng phần mềm.', metric: 'ROI proof collected' }
];

export const HEALTH_SCORE_WEIGHTS = [
  { factor: 'Engagement', weight: 35, example: 'Số lần đăng nhập, số báo cáo xuất, số kho dự án xử lý.' },
  { factor: 'Data completeness', weight: 25, example: 'Tỷ lệ hồ sơ có đủ chứng từ và mã dự án phần mềm/game.' },
  { factor: 'Support friction', weight: 15, example: 'Ticket lỗi, thời gian phản hồi, số lần hướng dẫn lại.' },
  { factor: 'Business outcome', weight: 25, example: 'Tiết kiệm giờ làm, tối ưu chi phí hạ tầng, tăng trưởng doanh thu số.' }
];

export const WINBACK_MESSAGES = [
  { title: 'Khách ít đăng nhập', message: 'Tuần này hệ thống thấy anh/chị chưa xuất báo cáo dự án. Tôi gửi lại mẫu báo cáo tổng quan 5 dòng để dùng ngay nhé.' },
  { title: 'Khách kẹt nhập liệu', message: 'Nếu phần nhập chi phí đang nhiều trường quá, tôi có thể bật mẫu nhập nhanh chỉ gồm dự án, loại chi, số tiền, chứng từ.' },
  { title: 'Khách sắp hủy', message: 'Trước khi dừng, mình thử chuyển sang gói thấp hơn hoặc chỉ dùng dashboard dòng tiền/kho dự án trong 30 ngày được không?' }
];

