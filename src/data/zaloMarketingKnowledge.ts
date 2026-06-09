export const ZALO_SEGMENTS = [
  { segment: 'Kế toán trưởng', use: 'Nhắc demo, gửi checklist, gửi báo cáo mẫu.', caution: 'Không spam khuyến mãi; cần nội dung có giá trị nghiệp vụ.' },
  { segment: 'Thủ kho/chỉ huy trưởng', use: 'Nhắc nhập phiếu, cấp dầu, bổ sung chứng từ công trường.', caution: 'Tin nhắn phải ngắn, dễ hiểu, dùng được trên điện thoại.' },
  { segment: 'Chủ doanh nghiệp', use: 'Gửi báo cáo 5 KPI và lời mời xem dashboard.', caution: 'Không gửi quá nhiều chi tiết kế toán; tập trung quyết định.' },
  { segment: 'Khách dùng thử', use: 'Onboarding 7 ngày, nhắc tạo công trình, nhập chi phí, xuất báo cáo.', caution: 'Phải có CTA nhỏ, không đẩy mua quá sớm.' }
];

export const ZALO_MESSAGE_TEMPLATES = [
  { title: 'Nhắc demo', text: 'Chào anh/chị, em gửi lại lịch demo LedgerFlow 15 phút: xem nhanh ngân sách, tạm ứng treo, hồ sơ thiếu và quỹ dầu. Anh/chị xác nhận giúp em khung giờ tiện nhé.' },
  { title: 'Nhắc bổ sung chứng từ', text: 'Hồ sơ {{ma_ho_so}} đang thiếu {{chung_tu_thieu}}. Anh/chị bổ sung trước {{ngay_han}} để kế toán duyệt thanh toán đúng hạn nhé.' },
  { title: 'Báo cáo sếp 5 KPI', text: 'Báo cáo nhanh hôm nay: ngân sách còn {{ngan_sach_con_lai}}, tạm ứng treo {{tam_ung_treo}}, hồ sơ thiếu {{ho_so_thieu}}, công nợ {{cong_no}}, cảnh báo dầu {{canh_bao_dau}}.' },
  { title: 'Onboarding ngày 1', text: 'Chào anh/chị, bước đầu tiên là tạo 1 công trình và nhập 5 khoản chi mẫu. Xong bước này hệ thống sẽ tự lên dashboard công trình.' }
];

export const ZALO_CAMPAIGN_PLAYBOOK = [
  { day: 'Ngày 1', action: 'Gửi hướng dẫn tạo công trình đầu tiên', metric: 'Project created' },
  { day: 'Ngày 3', action: 'Nhắc nhập chi phí và tạm ứng mẫu', metric: 'First expense + first advance' },
  { day: 'Ngày 5', action: 'Gửi mẫu báo cáo sếp 5 KPI', metric: 'Boss report viewed' },
  { day: 'Ngày 7', action: 'Hỏi điểm vướng và đề nghị demo 15 phút', metric: 'Demo booked / feedback received' },
  { day: 'Ngày 14', action: 'Gửi case ROI hoặc checklist hồ sơ thiếu', metric: 'Activation / paid intent' }
];

export const ZALO_COMPLIANCE_RULES = [
  'Chỉ gửi tin có mục đích rõ: nhắc lịch, nhắc hồ sơ, onboarding, hỗ trợ hoặc báo cáo đã đăng ký.',
  'Không hứa thay kế toán trưởng, không kết luận pháp lý qua tin nhắn ngắn.',
  'Không gửi thông tin nhạy cảm đầy đủ như tài khoản ngân hàng, MST, số hóa đơn nếu không cần.',
  'Luôn có cách để khách yêu cầu ngừng nhận tin.',
  'Broadcast phải phân nhóm đúng, tránh gửi đại trà gây phản cảm.'
];

export const ZALO_ROI_ITEMS = [
  { item: 'Giảm no-show demo', effect: 'Nhắc lịch Zalo trước demo giúp tăng tỷ lệ tham dự.' },
  { item: 'Tăng activation', effect: 'Onboarding theo ngày giúp khách tạo công trình và nhập dữ liệu thật.' },
  { item: 'Giảm hồ sơ thiếu', effect: 'Nhắc bổ sung chứng từ đúng người, đúng hạn.' },
  { item: 'Tăng referral', effect: 'Khách hài lòng dễ forward tin nhắn demo cho đồng nghiệp.' }
];
