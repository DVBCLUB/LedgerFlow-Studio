import { BusinessIdea } from '../types';

export const BUSINESS_IDEAS: BusinessIdea[] = [
  {
    id: 'monthly_dashboard',
    title: 'Dashboard tài chính quản trị hằng tháng',
    category: 'Phân tích dữ liệu',
    targetClient: 'Công ty dịch vụ, agency, IT outsourcing, thương mại nhỏ 10–100 nhân sự',
    priceModel: 'Phí thiết lập + Retainer hàng tháng',
    initialCost: 15000000, // setup fee average
    monthlyFee: 5000000, // retainer average
    minViableFeatures: [
      'Kết nối tự động MISA/Excel/Sao kê ngân hàng',
      'Dashboard P&L, Dòng tiền (cashflow), Công nợ quá hạn (AR/AP Aging)',
      'Dự toán dòng tiền 8 tuần tới',
      'Đóng gói Report slide tự động cho buổi họp tháng của ban điều hành'
    ]
  },
  {
    id: 'payment_reconciliation',
    title: 'Đối soát tự động Bank–POS–QR–Sàn TMĐT',
    category: 'Xử lý dữ liệu',
    targetClient: 'Cửa hàng bán lẻ, chuỗi F&B, nhà bán hàng đa kênh, sàn thương mại điện tử',
    priceModel: 'Setup 8-25tr + Phí hàng tháng 2-6tr',
    initialCost: 16000000,
    monthlyFee: 3500000,
    minViableFeatures: [
      'Tự động đối chiếu sao kê ngân hàng với báo cáo POS, QR Code và payout sàn TMĐT',
      'Cảnh báo sai lệch (Variance alerts) và thất thoát tiền mặt tức thì',
      'Theo dõi doanh thu bán hàng hàng ngày thực tế',
      'Phát hiện hóa đơn điện tử chưa được khởi tạo cho đơn hàng hoàn tất'
    ]
  },
  {
    id: 'fiscal_hkd_compliance',
    title: 'Gói đối soát & chuyển đổi HĐĐT khởi tạo từ máy tính tiền cho Hộ Kinh Doanh',
    category: 'Tuân thủ thuế',
    targetClient: 'Hộ kinh doanh bán lẻ, ăn uống, nhà hàng, khách sạn lớn (>1 tỷ đồng/năm)',
    priceModel: 'Thiết lập 6-15tr + Phí hỗ trợ 1.5-4tr/tháng',
    initialCost: 10000000,
    monthlyFee: 2500000,
    minViableFeatures: [
      'Checklist và quy trình triển khai hóa đơn khởi tạo từ máy tính tiền theo đúng Thông tư mới',
      'Mẫu định mức tồn kho và chi phí tinh giản phục vụ tự tính, tự khai, tự nộp từ 2026',
      'Zalo Bot nhắc nhở hạn nộp tờ khai và đóng thuế',
      'Dashboard báo cáo doanh thu chịu thuế tự động'
    ]
  },
  {
    id: 'agency_profitability',
    title: 'Profitability analytics cho Software House & Agency',
    category: 'Phân tích dữ liệu',
    targetClient: 'Doanh nghiệp IT services, agency, thiết kế theo dự án quy mô 20–200 nhân sự',
    priceModel: 'Setup 12-30tr + Retainer 4-10tr/tháng',
    initialCost: 20000000,
    monthlyFee: 6500000,
    minViableFeatures: [
      'Tự động liên kết Timesheet của kỹ sư với hóa đơn và chi phí lương dự án',
      'Báo cáo biên lợi nhuận gộp từng dự án (Project gross margin)',
      'Biểu đồ hiệu suất phân bổ nhân lực (Utilization rate)',
      'Theo dõi lượng công việc dở dang (WIP) và tốc độ thu hồi công nợ dự án'
    ]
  },
  {
    id: 'commerce_close_automation',
    title: 'Automation chốt sổ tháng (Finance Close) cho DN Thương mại',
    category: 'Tự động hóa',
    targetClient: 'Nhà phân phối, công ty thương mại, đơn vị xuất nhập khẩu quy mô vừa và nhỏ',
    priceModel: 'Thiết lập 10-25tr + Phí hàng tháng 3-7tr',
    initialCost: 18000000,
    monthlyFee: 4500000,
    minViableFeatures: [
      'Hộp thư thông minh (Inbox) tự động phân loại hóa đơn đầu vào bằng AI (OCR)',
      'Tự động gán mã tài khoản theo quy tắc nghiệp vụ định trước (Bank rules)',
      'Checklist số hóa chốt sổ tháng minh bạch, tự động gửi báo cáo VAT',
      'Báo cáo đối chiếu nhanh công nợ 131 và 331 cuối kỳ'
    ]
  },
  {
    id: 'embedded_analytics',
    title: 'White-Label Embedded Analytics cho nhà phân phối phần mềm',
    category: 'Phát triển phần mềm',
    targetClient: 'Đơn vị bán lẻ/triển khai POS, ERP, CRM, mini-bộ phần mềm kế toán',
    priceModel: '30-60tr/dự án + Phí bảo trì 2-5tr/tháng',
    initialCost: 45000000,
    monthlyFee: 3500000,
    minViableFeatures: [
      'Hệ thống multi-tenant phân quyền báo cáo an toàn cho từng khách hàng',
      'Bộ sưu tập 5-7 giao diện báo cáo chuyên sâu tích hợp sẫm (Iframe/Embedded)',
      'Hệ thống xuất File báo cáo PDF tự động mang thương hiệu riêng của đối tác',
      'API theo dõi vết và thông báo số lượng log'
    ]
  },
  {
    id: 'controller_on_demand',
    title: 'Controller-on-Demand (Kiểm soát viên tài chính úy thác)',
    category: 'Tư vấn quản trị',
    targetClient: 'Startup, doanh nghiệp đang tăng trưởng nóng chưa cần CFO full-time',
    priceModel: 'Retainer 8-20tr/tháng',
    initialCost: 0,
    monthlyFee: 12000000,
    minViableFeatures: [
      'Dự toán dòng tiền chặt chẽ 13 tuần liên tiếp',
      'Phân tích chênh lệch Ngân sách so với Thực tế (Budget vs Actual variance)',
      'Tính toán chỉ số Runway và tốc độ đốt tiền thực tế (Cash burn rate)',
      'Cung cấp bộ slide tổng hợp sức khỏe tài chính cho buổi họp cổ đông'
    ]
  },
  {
    id: 'document_intake_bot',
    title: 'Bot tự động thu thập chứng từ và chi phí qua Zalo/Email',
    category: 'Tự động hóa',
    targetClient: 'Doanh nghiệp 5-50 nhân viên có đội đi thị trường hoặc chi tiêu phân tán',
    priceModel: 'Setup 5-12tr + Phí duy trì 1-3tr/tháng',
    initialCost: 8000000,
    monthlyFee: 2000000,
    minViableFeatures: [
      'Nhân viên gửi ảnh hóa đơn qua Zalo OA hoặc email chuyên dụng',
      'AI tự động đọc OCR trích xuất thông tin (số tiền, ngày, MST đối tác, mặt hàng)',
      'Tự động đồng bộ lên Google Drive / Google Sheets hoặc SQLite',
      'Báo cáo tiến trình phê duyệt chi phí (Draft -> Approved -> Settled)'
    ]
  },
  {
    id: 'anomaly_audit_pack',
    title: 'Báo cáo kiểm soát nội bộ và phân tích thất thất bán lẻ',
    category: 'Kiểm toán số',
    targetClient: 'Chuỗi cửa hàng, F&B, quán cafe từ 2 đến 20 điểm bán dầm',
    priceModel: 'Setup 15-40tr + Giám sát 2-4tr/tháng',
    initialCost: 25000000,
    monthlyFee: 3000000,
    minViableFeatures: [
      'Phát hiện ngoại lệ (void đơn hàng, hủy món, chiết khấu sai quy trình)',
      'Đối soát tự động Chênh lệch kho hàng so với Doanh số bán thực tế',
      'Phân tích hành vi nhân viên thu ngân theo ca',
      'Cảnh báo tự động các outlet có tỷ lệ thất thoát lớn hơn sai số cho phép'
    ]
  },
  {
    id: 'tax_micro_saas',
    title: 'Micro-SaaS nhắc lịch thuế và chấm điểm an toàn dữ liệu',
    category: 'Nhà phát triển SaaS',
    targetClient: 'Hộ kinh doanh và doanh nghiệp siêu nhỏ tại Việt Nam',
    priceModel: 'Gói thuê bao 299k - 999k/tháng',
    initialCost: 1500000,
    monthlyFee: 499000,
    minViableFeatures: [
      'Lịch đóng thuế và nộp tờ khai cá nhân hóa theo từng địa bàn chi cục thuế',
      'Tính năng upload file báo cáo XML để kiểm tra kiểm định chất lượng',
      'Hạch toán tự động dự phòng số thuế phải đóng trong kỳ',
      'Cảnh báo hóa đơn thuộc doanh nghiệp rủi ro cao về thuế'
    ]
  }
];
