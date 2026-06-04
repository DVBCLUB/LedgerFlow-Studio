export interface EngineeredPrompt {
  id: string;
  name: string;
  role: string;
  model: string;
  vietnameseTitle: string;
  promptText: string;
  authoritativeRule: string;
}

export const ENGINEERED_PROMPTS: EngineeredPrompt[] = [
  {
    id: 'p_payroll',
    name: 'Tính toán Lương & Thuế lũy tiến',
    role: 'Kế toán trưởng & Kỹ sư Thuế Việt Nam',
    model: 'Claude Sonnet 4.6 hoặc DeepSeek R1',
    vietnameseTitle: 'Class Python tính lương và Thuế TNCN lũy tiến 7 bậc đúng Luật',
    promptText: `Viết class PayrollCalculator bằng Python cho phần mềm kế toán VN (áp dụng cho tài khóa hiện hành).

**Dữ liệu đầu vào mỗi nhân sự:**
- gross_salary: Lương gộp trước các khoản trích bảo hiểm.
- allowances: Tổng các khoản phụ cấp tính thuế.
- non_taxable_allowances: Tiền ăn ca (≤ 730k/tháng), điện thoại (≤ 300k/tháng) không tính thuế TNCN.
- dependents: Số người phụ thuộc đăng ký giảm trừ gia cảnh.
- bhxh_salary: Lương đóng bảo hiểm xã hội (giới hạn trần tối đa 20 lần lương cơ sở).

**Nhiệm vụ & Quy tắc tính toán bám sát quy định pháp lý:**
1. BHXH Nhân viên trích đóng: 10.5% (gồm BHXH 8%, BHYT 1.5%, BHTN 1%).
2. BHXH Doanh nghiệp đóng tính vào chi phí: 23.5% (gồm BHXH 17.5%, BHYT 3%, BHTN 1%, Kinh phí công đoàn 2%).
3. Giảm trừ nghĩa vụ gia cảnh bản thân: 11.000.000đ/tháng.
4. Giảm trừ cho mỗi người phụ thuộc đăng ký hợp lệ: 4.400.000đ/người/tháng.
5. Thu nhập tính thuế = Lương gộp + Phụ cấp tính thuế - Tổng BHXH nhân viên - Giảm trừ bản thân - Giảm trừ người phụ thuộc. (Nếu kết quả âm, quy về bằng 0).
6. Tính thuế TNCN lũy tiến 7 bậc chuẩn xác:
   - Bậc 1: Đến 5tr đồng: Thuế suất 5%
   - Bậc 2: Trên 5tr đến 10tr: 10%
   - Bậc 3: Trên 10tr đến 18tr: 15%
   - Bậc 4: Trên 18tr đến 32tr: 20%
   - Bậc 5: Trên 32tr đến 52tr: 25%
   - Bậc 6: Trên 52tr đến 80tr: 30%
   - Bậc 7: Trên 80tr: 35%
7. Lương thực lĩnh (Net Salary) = Lương gộp + Tổng phụ cấp - Trích đóng bảo hiểm xã hội nhân viên - Thuế TNCN tương ứng.

**Yêu cầu kỹ thuật nâng cao:**
- Sử dụng kiểu dữ liệu INTEGER (tính theo đồng VNĐ) và hàm round() sau cùng, không làm tròn giữa dòng tránh lệch xu lẻ.
- Thêm method verify_calculation() để tự kiểm soát: Net + Trích bảo hiểm nhân viên + Thuế TNCN == Lương gộp + Phụ cấp.
- Viết bằng Python có kèm hướng dẫn ghi log kiểm toán (audit log) sự kiện tính toán này. Trả về class sạch sẽ có comment tiếng Việt chi tiết nhất.`,
    authoritativeRule: 'Khoản 1 Điều 41 Luật Kế toán 88/2015/QH13: Chứng từ tính lương thuộc nhóm lưu trữ 10 năm.'
  },
  {
    id: 'p_ocr',
    name: 'Đọc & Đối soát Hóa đơn VAT tự động',
    role: 'Chuyên gia Xử lý Ảnh & Trích xuất Bản ghi Thuế',
    model: 'Gemini 2.5 Flash hoặc GPT-4o',
    vietnameseTitle: 'Promt OCR trích xuất chính xác cấu trúc hóa đơn VAT Việt Nam trả về JSON sạch',
    promptText: `Phân tích ảnh chụp/scan hóa đơn giá trị gia tăng (VAT) của doanh nghiệp Việt Nam này.
Nhiệm vụ của bạn là trích xuất chính xác tuyệt đối các thực thể dữ liệu tài khóa và xuất ra định dạng JSON sạch không có markdown kèm theo.

**Các trường dữ liệu bắt buộc trích xuất:**
{
  "so_hoa_don": "Số hóa đơn ghi nhận tại góc phải",
  "ngay_hoa_don": "YYYY-MM-DD định dạng ngày tháng",
  "ten_don_vi_ban": "Tên nhà cung cấp đầy đủ",
  "mst_nha_ban": "Mã số thuế bên bán (10 hoặc 13 chữ số, không lấy ký tự gạch ngang)",
  "dia_chi_nha_ban": "Địa chỉ đăng ký kinh doanh bên bán",
  "ten_don_vi_mua": "Tên công ty chúng ta",
  "mst_nha_mua": "Mã số thuế bên mua",
  "mat_hang": [
    {"stt": 1, "dien_giai": "Tên chi tiết danh mục hàng", "so_luong": 0.0, "don_vi_tinh": "dvt", "don_gia": 0, "thanh_tien": 0}
  ],
  "tong_chưa_thue": "Tổng tiền hàng hóa dịch vụ trước thuế",
  "thue_suat_vat": "Thuế suất áp dụng (chỉ chấp nhận số nguyên 0, 5, 8, 10)",
  "tien_thue_vat": "Tiền thuế GTGT tương ứng tính toán trên hóa đơn",
  "tong_thanh_toan": "Tổng tiền thanh toán sau thuế viết bằng số",
  "do_tin_cay": "Chỉ số tin cậy trích xuất trên thang [0.0 - 1.0]",
  "canh_bao_bạt_thuong": "Ghi chú nếu có dấu hiệu mờ bẩn, cạo sửa, hoặc phép tính SL*ĐG không khớp thành tiền"
}

**Ràng buộc logic kế toán nghiêm ngặt:**
- Hãy thực hiện kiểm tra kiểm thử số học: SL * ĐG có bằng thành tiền không? Tổng thành tiền cộng tiền thuế có đúng bằng tổng thanh toán viết bằng số không?
- Nếu phát hiện sai số hoặc ảnh quá mờ không thể khẳng định con số, đặt giá trị trường đó là null và đưa văn bản giải trình vào cảnh_báo.
- Trả về JSON thuần túy, tuyệt đối không viết thêm bất kỳ câu giải thích nào bên ngoài hoặc bọc khối lăng xê (\`\`\`).`,
    authoritativeRule: 'Thông tư 32/2025/TT-BTC: Hóa đơn điện tử khởi tạo từ máy tính tiền phải khớp cơ cấu nội dung và mã của cơ quan Thuế.'
  },
  {
    id: 'p_forecast',
    name: 'Dự báo Dòng tiền 13 tuần',
    role: 'CFO-on-Demand & Chuyên viên Phân tích Dữ liệu Tài chính',
    model: 'DeepSeek V3 hoặc Claude Sonnet 4.6',
    vietnameseTitle: 'Dự đoán dòng tiền (Cashflow Forecasting) kết hợp mô hình thống kê ARIMA/Prophet',
    promptText: `Viết script Python sử dụng thư viện pandas và Prophet (hoặc statsmodels ARIMA làm dự phòng) để thực hiện dự báo dòng tiền 13 tuần tới cho doanh nghiệp dịch vụ.

**Bảng dữ liệu đầu vào:**
Bảng expenses (ngày chi, tổng tiền sau thuế, loại tài khoản chi) và bảng revenue (ngày thu, tổng tiền thực tế nhận, đối tượng thanh toán).

**Yêu cầu xử lý của script:**
1. Thực hiện gom nhóm (resample) dữ liệu thu chi theo tuần (Weekly frequency).
2. Tính toán NET Cashflow thực tế của mỗi tuần trong lịch sử = Tổng Thu - Tổng Chi.
3. Huấn luyện mô hình Prophet (hoặc ARIMA) để dự đoán chuỗi thời gian (time-series forecasting) cho 13 tuần kế tiếp.
4. Trích xuất khoảng tin cậy 90% (lower bound và upper bound) để cảnh báo thời điểm rủi ro cạn kiệt dòng tiền ròng.
5. Xuất báo cáo biểu thị kết quả bằng bảng Markdown có định dạng số tiền VNĐ dễ nhìn (VD: 1,500,000,000 đ) kèm theo vẽ đồ thị biến thiên trực quan.

Giải thích nghiệp vụ: Cho biết cơ sở của các giả định xu hướng mùa vụ (seasonality) và các ngày nghỉ lễ lớn của Việt Nam (Tết Nguyên Đán, 30/4) có ảnh hưởng thế nào đến độ lệch dòng tiền.`,
    authoritativeRule: 'Chuẩn mực kế toán VAS 24: Báo cáo lưu chuyển tiền tệ chi tiết thu chi là cơ sở đánh giá năng lực trả nợ ngắn hạn.'
  },
  {
    id: 'p_anomaly',
    name: 'Phát hiện Gian lận & Thất thoát',
    role: 'Kiểm toán viên điều tra (Forensic Auditor)',
    model: 'DeepSeek R1 hoặc GPT-4o',
    vietnameseTitle: 'Mô hình Isolation Forest phát hiện giao dịch rủi ro khống trong sổ kế toán',
    promptText: `Thiết kế một pipeline bằng Python sử dụng thư viện scikit-learn để phát hiện các bút toán chi phí bất thường trong sảnh sổ cái kế toán SQLite.

**Cỡ dữ liệu và đặc trưng đầu vào:**
Bảng expenses gồm các đặc trưng: ngày chi thiết kế (expense_date), mã đối tượng nhà cung cấp (vendor_id), số tiền (total_amount), giờ hành chính nhập liệu, và người thao tác (user_id).

**Chiến lược phát hiện bất thường:**
1. Biến đổi dữ liệu (Feature engineering): Trích xuất thêm đặc trưng "ngay_trong_tuan" (Thứ 7, Chủ nhật), "is_round_amount" (Số tiền chia hết cho 1 triệu hoặc 10 triệu đồng), "activity_time" (Ngoài giờ hành chính 18:00 - 06:00).
2. Chuẩn hóa dữ liệu bằng StandardScaler và áp dụng thuật toán Isolation Forest với tỷ lệ nhiễm độc (contamination) dự trù 1% (0.01).
3. Đóng gói kết quả: Lấy ra danh sách các dòng chứng từ bị gán nhãn bất thường (Anomaly label == -1).
4. Phân tích nguyên nhân: Với mỗi dòng bất thường, in kèm chỉ số điểm bất thường (anomaly score) và diễn giải nguyên nhân nghi vấn (Ví dụ: chi tiền mặt 50,000,000đ vào lúc 2 giờ sáng ngày Chủ nhật do tài khoản kế toán viên tập sự hạch toán).

Trả về mã Python hoàn chỉnh, viết theo phong cách chuyên nghiệp sạch sẽ, bọc sườn exception xử lý an toàn.`,
    authoritativeRule: 'Điều 12 Luật Kế toán 88/2015: Hành vi sửa sổ, ghi khống chứng từ cấu thành sai phạm hình sự nghiêm trọng.'
  }
];
