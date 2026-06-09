export const DATA_ENGINEERING_LAYERS = [
  { title: '1. Nguồn dữ liệu', detail: 'Sao kê ngân hàng, hóa đơn điện tử, phiếu nhập kho, phiếu xuất kho, bảng tạm ứng, bảng hoàn ứng, sổ quỹ dầu, bảng lương và dữ liệu công nợ.' },
  { title: '2. Làm sạch', detail: 'Chuẩn hóa ngày, tiền VNĐ, mã công trình, mã nhà cung cấp, thuế suất, tài khoản kế toán và trạng thái hồ sơ.' },
  { title: '3. Mô hình dữ liệu', detail: 'Tách master data và fact data: công trình, NCC, vật tư, nhân sự, chi phí, hóa đơn, thanh toán, tồn kho.' },
  { title: '4. Kiểm soát', detail: 'Chặn dữ liệu sai bằng rule: lệch VAT, tạm ứng quá hạn, kho âm, chứng từ thiếu, thanh toán không khớp sao kê.' },
  { title: '5. Phân tích & AI', detail: 'Dự báo vượt ngân sách, phát hiện bất thường, phân nhóm chi phí, cảnh báo dòng tiền và tạo báo cáo sếp.' }
];

export const DATA_SCIENCE_USE_CASES = [
  { name: 'Dự báo vượt ngân sách', input: 'Budget, actual cost, phase, change orders', output: 'Khả năng vượt ngân sách theo công trình', method: 'Regression / scenario simulation' },
  { name: 'Phát hiện hóa đơn rủi ro', input: 'Invoice amount, VAT, supplier, date, item text', output: 'Danh sách hóa đơn cần kiểm tra', method: 'Rule engine + anomaly score' },
  { name: 'Theo dõi tạm ứng treo', input: 'Advance, settlement, employee/site owner', output: 'Số dư treo và tuổi nợ tạm ứng', method: 'Aging buckets' },
  { name: 'Kiểm soát quỹ dầu', input: 'Fuel issue, vehicle log, machine diary, norm', output: 'Cảnh báo cấp dầu vượt định mức', method: 'Variance analysis' },
  { name: 'Chấm điểm NCC', input: 'Price, delay, missing docs, quality notes', output: 'Điểm tin cậy nhà cung cấp', method: 'Weighted scoring' }
];

export const DATA_QUALITY_RULES = [
  { rule: 'Không để trống mã công trình', reason: 'Chi phí không có công trình sẽ không lên được báo cáo dự án.' },
  { rule: 'Số tiền phải là số nguyên VNĐ', reason: 'Tránh lỗi khi SUMIFS, dashboard và đối chiếu ngân hàng.' },
  { rule: 'Thuế suất phải nằm trong danh mục cho phép', reason: 'Giảm rủi ro kê khai sai VAT.' },
  { rule: 'Mã NCC không được nhập tự do', reason: 'Tránh trùng nhà cung cấp, sai MST và sai công nợ.' },
  { rule: 'Mọi tạm ứng phải có hạn hoàn ứng', reason: 'Để sinh cảnh báo quá hạn và báo cáo dòng tiền.' },
  { rule: 'Nhập/xuất/tồn kho phải cân', reason: 'Phát hiện thiếu phiếu, xuất âm hoặc thất thoát vật tư.' }
];

export const FEATURE_ENGINEERING_RECIPES = [
  { feature: 'advance_age_days', formula: 'today - advanceDate', use: 'Cảnh báo tạm ứng treo quá hạn.' },
  { feature: 'budget_used_pct', formula: 'actualCost / plannedBudget', use: 'Dự báo vượt ngân sách.' },
  { feature: 'missing_doc_score', formula: 'missingRequiredDocs / requiredDocs', use: 'Xếp hạng hồ sơ thanh toán cần xử lý.' },
  { feature: 'vat_math_diff', formula: 'invoiceVAT - beforeTax * rate', use: 'Bắt lỗi hóa đơn hoặc nhập liệu sai.' },
  { feature: 'fuel_norm_variance', formula: 'issuedFuel - expectedFuelByMachineLog', use: 'Phát hiện rủi ro quỹ dầu.' }
];

export const LEARNING_CHECKLIST = [
  'Hiểu khác nhau giữa dữ liệu thô, dữ liệu sạch, dữ liệu báo cáo và dữ liệu mô hình AI.',
  'Biết thiết kế bảng fact/dimension cho chi phí công trình.',
  'Biết tạo rule kiểm tra dữ liệu trước khi đưa vào báo cáo sếp.',
  'Biết chọn KPI kế toán: ngân sách, hoàn ứng, công nợ, hóa đơn, kho, dầu.',
  'Biết tạo feature đơn giản để AI phát hiện bất thường.'
];
