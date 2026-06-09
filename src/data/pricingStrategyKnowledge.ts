export const PRICING_PACKAGES = [
  { name: 'Nội bộ Offline', price: 0, audience: 'Công ty tự dùng, chưa cần cloud', value: 'Nhập chi phí, tạm ứng, kho, dầu, báo cáo sếp trên máy nội bộ.', risk: 'Không phù hợp nếu nhiều người nhập cùng lúc ở nhiều công trường.' },
  { name: 'Team công trình', price: 199000, audience: 'Một công ty nhỏ hoặc một công trình', value: 'Phân quyền thủ kho, HCNS, kế toán; dashboard ngân sách và hoàn ứng.', risk: 'Cần quy trình chứng từ rõ trước khi triển khai.' },
  { name: 'Công ty xây dựng', price: 599000, audience: 'Nhiều công trình, nhiều người nhập', value: 'Tổng hợp đa công trình, cảnh báo VAT, tạm ứng, quỹ dầu, hồ sơ thiếu.', risk: 'Cần backup, quyền duyệt và audit log.' },
  { name: 'Triển khai riêng', price: 5000000, audience: 'Doanh nghiệp cần tùy chỉnh', value: 'Thiết kế form, báo cáo, mẫu chứng từ, migrate dữ liệu cũ, đào tạo người dùng.', risk: 'Dễ lỗ nếu không giới hạn phạm vi và số vòng sửa.' }
];

export const PRICING_METRICS = [
  { name: 'ROI cho sếp', formula: '(Tiền tiết kiệm do giảm sai sót + thời gian tiết kiệm) / chi phí phần mềm', note: 'Dùng để thuyết phục mua hoặc duyệt ngân sách triển khai.' },
  { name: 'Cost per file', formula: 'monthlyCost / paymentFilesProcessed', note: 'Đo chi phí xử lý mỗi bộ hồ sơ thanh toán.' },
  { name: 'Payback period', formula: 'setupCost / monthlySavings', note: 'Bao lâu hoàn vốn sau khi triển khai.' },
  { name: 'Support burden', formula: 'supportHours * hourlyCost', note: 'Chi phí ẩn khi phải sửa lỗi, hướng dẫn người dùng, xử lý dữ liệu sai.' },
  { name: 'Gross margin', formula: '(revenue - hosting - support - AI cost) / revenue', note: 'Đảm bảo không bán gói quá rẻ làm càng nhiều càng lỗ.' }
];

export const VALUE_DRIVERS = [
  'Giảm thời gian tổng hợp báo cáo sếp từ nhiều giờ xuống vài phút.',
  'Giảm rủi ro tạm ứng treo và chi phí không đủ chứng từ.',
  'Giảm thất thoát vật tư, dầu và sai lệch nhập/xuất/tồn.',
  'Giảm rủi ro VAT do thiếu hóa đơn hoặc sai số học.',
  'Tạo dữ liệu sạch để sau này dùng AI/BI hiệu quả hơn.'
];

export const SCOPE_CONTROL_RULES = [
  { rule: 'Tách phí phần mềm và phí triển khai', reason: 'Phần mềm là sản phẩm lặp lại, triển khai là công sức riêng từng công ty.' },
  { rule: 'Giới hạn số vòng sửa', reason: 'Không giới hạn sẽ bị kéo vào sửa vô tận mà không thu thêm tiền.' },
  { rule: 'Tính phí theo số công trình/người dùng', reason: 'Nhiều công trình làm tăng dữ liệu, support và rủi ro.' },
  { rule: 'Tính thêm phí migrate dữ liệu cũ', reason: 'Dữ liệu Excel cũ thường bẩn và tốn thời gian làm sạch.' },
  { rule: 'Không hứa AI làm thay kế toán', reason: 'AI chỉ hỗ trợ kiểm tra, phân loại, tóm tắt; người thật vẫn duyệt cuối.' }
];

export const ROI_CASES = [
  { title: 'Tiết kiệm thời gian kế toán', before: 'Mất 12 giờ/tháng tổng hợp báo cáo công trình', after: 'Còn 3 giờ/tháng nhờ dashboard', saving: '9 giờ/tháng' },
  { title: 'Giảm hồ sơ thiếu', before: '20 bộ hồ sơ/tháng thiếu chứng từ', after: 'Cảnh báo ngay khi nhập', saving: 'Giảm thời gian đi đòi chứng từ' },
  { title: 'Kiểm soát tạm ứng', before: 'Tạm ứng treo khó theo dõi', after: 'Có aging và người chịu trách nhiệm', saving: 'Giảm rủi ro dòng tiền' },
  { title: 'Quỹ dầu và vật tư', before: 'Đối chiếu thủ công cuối tháng', after: 'Cảnh báo lệch ngay trong ngày', saving: 'Giảm thất thoát và tranh cãi nội bộ' }
];
