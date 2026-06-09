export const PARTNER_TYPES = [
  { type: 'Kế toán dịch vụ', fit: 'Có sẵn tệp khách SME và hộ kinh doanh.', offer: 'Hoa hồng theo khách trả phí hoặc phí giới thiệu một lần.', risk: 'Có thể giới thiệu sai tệp nếu không hiểu sản phẩm.' },
  { type: 'Tư vấn thuế/kiểm toán nội bộ', fit: 'Có uy tín và hiểu nỗi đau chứng từ, VAT, kiểm soát.', offer: 'Gói expert partner, hoa hồng cao hơn kèm webinar.', risk: 'Cần tài liệu chuyên môn rõ, không hứa thay tư vấn pháp lý.' },
  { type: 'Nhà cung cấp phần mềm/IT local', fit: 'Có khả năng triển khai tại công ty nhỏ.', offer: 'Phí triển khai riêng + hoa hồng duy trì.', risk: 'Cần quy định chất lượng triển khai và support.' },
  { type: 'Kế toán trưởng giới thiệu nội bộ', fit: 'Niềm tin cao trong cộng đồng nghề.', offer: 'Quà tri ân/referral bonus minh bạch.', risk: 'Không biến thành spam group kế toán.' }
];

export const COMMISSION_MODELS = [
  { model: 'Hoa hồng một lần', formula: 'setupFee * 10-20%', bestFor: 'Triển khai riêng, migrate dữ liệu, tư vấn ban đầu.' },
  { model: 'Hoa hồng định kỳ', formula: 'monthlyFee * 15-30% trong 6-12 tháng', bestFor: 'SaaS trả phí tháng, khách dùng lâu.' },
  { model: 'Hybrid', formula: 'one-time bonus + recurring commission', bestFor: 'Đối tác vừa giới thiệu vừa hỗ trợ onboarding.' },
  { model: 'Non-cash referral', formula: 'tháng dùng miễn phí / nâng gói / quà tri ân', bestFor: 'Khách hiện hữu giới thiệu khách mới.' }
];

export const FRAUD_CONTROLS = [
  { risk: 'Tự tạo lead giả', control: 'Chỉ tính hoa hồng khi khách thanh toán thật và qua thời gian hoàn tiền.' },
  { risk: 'Spam group kế toán', control: 'Cấm nội dung quảng cáo sai, yêu cầu dùng message đã duyệt.' },
  { risk: 'Tranh chấp nguồn lead', control: 'Cookie/referral code có thời hạn, log thời điểm click/signup/payment.' },
  { risk: 'Hứa sai tính năng', control: 'CTV chỉ dùng tài liệu chính thức, không hứa thay kế toán trưởng hoặc tư vấn thuế.' },
  { risk: 'Thanh toán hoa hồng sai', control: 'Đối soát doanh thu, hoàn tiền, thuế/khấu trừ và tài khoản nhận trước khi chi.' }
];

export const REFERRAL_MESSAGES = [
  { title: 'Cho kế toán dịch vụ', text: 'Em có tool giúp khách xây dựng nhỏ theo dõi chi phí công trình, tạm ứng, hồ sơ thiếu và báo cáo sếp. Anh/chị có khách nào đang làm Excel/Zalo thủ công thì em demo miễn phí.' },
  { title: 'Cho kế toán trưởng', text: 'Nếu anh/chị thấy phần mềm giúp giảm thời gian tổng hợp hoặc kiểm soát chứng từ tốt hơn, cho em xin giới thiệu tới một đồng nghiệp đang gặp bài toán tương tự.' },
  { title: 'Cho chủ doanh nghiệp', text: 'Phần mềm tập trung 5 chỉ số: ngân sách, tạm ứng, công nợ, hồ sơ thiếu, quỹ dầu. Nếu công ty anh/chị đang khó xem tiền công trình, em demo thử 15 phút.' }
];

export const PARTNER_ONBOARDING = [
  { step: '1. Chọn đúng tệp khách', detail: 'Ưu tiên công ty xây dựng nhỏ, kế toán dự án, kế toán trưởng, đơn vị đang dùng Excel/Zalo.' },
  { step: '2. Gửi demo ngắn', detail: 'Không gửi quảng cáo dài; chỉ demo nỗi đau: tạm ứng treo, hồ sơ thiếu, báo cáo sếp.' },
  { step: '3. Gắn referral code', detail: 'Mỗi đối tác có mã/link riêng để tránh tranh chấp nguồn khách.' },
  { step: '4. Chốt điều kiện hoa hồng', detail: 'Chỉ trả khi khách thanh toán thật và hết thời gian hoàn tiền.' },
  { step: '5. Đối soát hằng tháng', detail: 'Bảng sales, doanh thu, hoàn tiền, hoa hồng, trạng thái chi trả.' }
];

export const PAYOUT_CHECKLIST = [
  'Khách đã thanh toán thật và không hoàn tiền.',
  'Referral code/link khớp với log signup hoặc hợp đồng.',
  'Đối tác không vi phạm nội dung quảng cáo/hứa sai tính năng.',
  'Số tiền hoa hồng tính đúng theo gói và thời hạn áp dụng.',
  'Thông tin nhận tiền đã xác minh trước khi chi.'
];
