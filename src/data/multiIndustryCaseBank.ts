export type IndustryCase = {
  id: string;
  industry: 'Thương mại' | 'Sản xuất' | 'Dịch vụ' | 'Xây dựng / Dự án';
  title: string;
  scenario: string;
  documents: string[];
  redFlags: string[];
  accountingFocus: string[];
  auditQuestions: string[];
  learningOutcome: string;
  nextAction: string;
  riskLevel: 'Low' | 'Medium' | 'High';
};

export const MULTI_INDUSTRY_CASE_BANK: IndustryCase[] = [
  {
    id: 'trade-inventory-cutoff',
    industry: 'Thương mại',
    title: 'Bán hàng cuối kỳ nhưng hàng chưa giao đủ',
    scenario: 'Doanh nghiệp ghi nhận doanh thu ngày 31/12 theo hóa đơn, nhưng biên bản giao hàng cho thấy một phần hàng giao sang tháng sau.',
    documents: ['Hóa đơn VAT', 'Phiếu xuất kho', 'Biên bản giao nhận', 'Hợp đồng bán hàng', 'Đối chiếu công nợ'],
    redFlags: ['doanh thu ghi trước khi chuyển giao rủi ro', 'giá vốn xuất kho không khớp lượng giao', 'công nợ tăng đột biến cuối kỳ'],
    accountingFocus: ['cut-off doanh thu', 'giá vốn hàng bán', 'tồn kho cuối kỳ', 'công nợ phải thu'],
    auditQuestions: ['Hàng đã giao đủ trước ngày khóa sổ chưa?', 'Điều khoản chuyển giao rủi ro trong hợp đồng là gì?', 'Giá vốn có xuất theo lượng giao thực tế không?'],
    learningOutcome: 'Biết kiểm tra sai kỳ doanh thu và giá vốn trong doanh nghiệp thương mại.',
    nextAction: 'Đối chiếu hóa đơn, phiếu xuất, biên bản giao nhận và điều chỉnh phần doanh thu/giá vốn chưa đủ điều kiện.',
    riskLevel: 'High'
  },
  {
    id: 'trade-slow-moving-stock',
    industry: 'Thương mại',
    title: 'Tồn kho chậm luân chuyển nhưng chưa trích lập',
    scenario: 'Một nhóm hàng nhập từ nhiều tháng trước không bán được, giá thị trường giảm nhưng báo cáo vẫn ghi theo giá gốc.',
    documents: ['Thẻ kho', 'Báo cáo tuổi tồn kho', 'Bảng giá thị trường', 'Biên bản kiểm kê', 'Chính sách dự phòng'],
    redFlags: ['hàng tồn trên 180 ngày', 'giá bán thấp hơn giá vốn', 'không có kế hoạch xử lý hàng chậm bán'],
    accountingFocus: ['dự phòng giảm giá hàng tồn kho', 'giá trị thuần có thể thực hiện', 'kiểm kê tồn kho'],
    auditQuestions: ['Có bằng chứng giá thị trường giảm không?', 'Hàng còn bán được hay lỗi thời?', 'Công ty có chính sách dự phòng nhất quán không?'],
    learningOutcome: 'Hiểu khi nào cần xem xét dự phòng giảm giá hàng tồn kho.',
    nextAction: 'Lập danh sách hàng chậm luân chuyển, so sánh giá gốc với giá trị thuần có thể thực hiện và đề xuất dự phòng nếu cần.',
    riskLevel: 'Medium'
  },
  {
    id: 'manufacturing-bom-variance',
    industry: 'Sản xuất',
    title: 'Định mức nguyên vật liệu lệch thực tế',
    scenario: 'Sản xuất 1.000 sản phẩm nhưng nguyên vật liệu xuất dùng cao hơn định mức 18%, không có giải trình hao hụt.',
    documents: ['BOM/định mức', 'Phiếu xuất kho NVL', 'Lệnh sản xuất', 'Biên bản nghiệm thu sản lượng', 'Báo cáo hao hụt'],
    redFlags: ['hao hụt vượt định mức', 'không có phê duyệt điều chỉnh định mức', 'giá thành bị đội lên bất thường'],
    accountingFocus: ['tập hợp chi phí sản xuất', 'tính giá thành', 'phân tích chênh lệch định mức', 'kiểm soát kho NVL'],
    auditQuestions: ['Định mức còn phù hợp không?', 'Có thất thoát vật tư không?', 'Chi phí vượt định mức được xử lý vào giá thành hay chi phí kỳ?'],
    learningOutcome: 'Biết phân tích chênh lệch BOM và tác động đến giá thành sản xuất.',
    nextAction: 'So sánh xuất kho thực tế với BOM, yêu cầu giải trình hao hụt và cập nhật định mức nếu có căn cứ.',
    riskLevel: 'High'
  },
  {
    id: 'manufacturing-wip-cutoff',
    industry: 'Sản xuất',
    title: 'Sản phẩm dở dang cuối kỳ đánh giá thiếu căn cứ',
    scenario: 'Kế toán phân bổ chi phí sản xuất dở dang theo tỷ lệ 50% cho toàn bộ đơn hàng, không dựa trên mức độ hoàn thành thực tế.',
    documents: ['Bảng tính giá thành', 'Báo cáo sản xuất dở dang', 'Biên bản kiểm kê WIP', 'Lệnh sản xuất', 'Bảng phân bổ chi phí chung'],
    redFlags: ['tỷ lệ hoàn thành ước tính cứng', 'thiếu biên bản kiểm kê WIP', 'chi phí chung phân bổ bất thường'],
    accountingFocus: ['WIP cuối kỳ', 'phân bổ chi phí chung', 'giá thành sản phẩm hoàn thành', 'cut-off sản xuất'],
    auditQuestions: ['Tỷ lệ hoàn thành lấy từ đâu?', 'Có kiểm kê sản phẩm dở dang không?', 'Chi phí chung phân bổ theo tiêu thức nào?'],
    learningOutcome: 'Biết kiểm tra WIP và rủi ro sai lệch giá thành cuối kỳ.',
    nextAction: 'Yêu cầu bộ phận sản xuất xác nhận mức độ hoàn thành và kiểm tra tiêu thức phân bổ chi phí chung.',
    riskLevel: 'Medium'
  },
  {
    id: 'service-revenue-period',
    industry: 'Dịch vụ',
    title: 'Thu tiền trước nhưng ghi nhận hết doanh thu',
    scenario: 'Khách hàng trả trước gói dịch vụ 12 tháng, kế toán ghi nhận toàn bộ vào doanh thu tháng nhận tiền.',
    documents: ['Hợp đồng dịch vụ', 'Sao kê ngân hàng', 'Hóa đơn', 'Bảng theo dõi thời gian cung cấp dịch vụ', 'Biên bản nghiệm thu định kỳ'],
    redFlags: ['doanh thu tăng mạnh theo tiền thu', 'dịch vụ chưa cung cấp đủ', 'không có bảng phân bổ doanh thu theo kỳ'],
    accountingFocus: ['doanh thu chưa thực hiện', 'phân bổ doanh thu theo thời gian', 'cut-off dịch vụ', 'công nợ/khách hàng trả trước'],
    auditQuestions: ['Nghĩa vụ thực hiện đã hoàn thành đến đâu?', 'Hợp đồng là trả trước cho bao nhiêu kỳ?', 'Có bảng phân bổ doanh thu chưa?'],
    learningOutcome: 'Biết phân biệt tiền thu trước và doanh thu được ghi nhận trong dịch vụ.',
    nextAction: 'Tách phần doanh thu đã thực hiện và phần chưa thực hiện, lập lịch phân bổ theo kỳ.',
    riskLevel: 'High'
  },
  {
    id: 'service-subcontractor-cost',
    industry: 'Dịch vụ',
    title: 'Chi phí thuê ngoài thiếu nghiệm thu',
    scenario: 'Công ty thuê freelancer thực hiện dịch vụ cho khách, đã thanh toán nhưng hồ sơ thiếu nghiệm thu và mô tả đầu ra.',
    documents: ['Hợp đồng thuê ngoài', 'Biên bản nghiệm thu', 'Đề nghị thanh toán', 'Chứng từ chuyển khoản', 'File bàn giao kết quả'],
    redFlags: ['chi phí không chứng minh được dịch vụ đã nhận', 'người nhận tiền không rõ vai trò', 'thiếu output bàn giao'],
    accountingFocus: ['chi phí dịch vụ mua ngoài', 'hồ sơ thanh toán', 'khấu trừ thuế nếu là cá nhân', 'đối chiếu đầu ra với doanh thu'],
    auditQuestions: ['Dịch vụ thuê ngoài đã hoàn thành chưa?', 'Chi phí có liên quan doanh thu không?', 'Nếu là cá nhân thì xử lý thuế thế nào?'],
    learningOutcome: 'Biết kiểm soát chi phí thuê ngoài trong doanh nghiệp dịch vụ.',
    nextAction: 'Bổ sung nghiệm thu, mô tả output, căn cứ thanh toán và kiểm tra nghĩa vụ thuế liên quan.',
    riskLevel: 'Medium'
  },
  {
    id: 'construction-advance-settlement',
    industry: 'Xây dựng / Dự án',
    title: 'Tạm ứng công trình treo lâu chưa hoàn ứng',
    scenario: 'Đội thi công nhận tạm ứng nhiều đợt để mua vật tư và chi phí công trường, nhưng chứng từ hoàn ứng chưa đủ.',
    documents: ['Đề nghị tạm ứng', 'Phiếu chi/ủy nhiệm chi', 'Bảng hoàn ứng', 'Hóa đơn vật tư', 'Biên bản giao nhận vật tư', 'Dự toán công trình'],
    redFlags: ['tạm ứng quá hạn', 'chi phí không gắn mã công trình', 'hóa đơn thiếu hoặc sai thông tin', 'vượt ngân sách hạng mục'],
    accountingFocus: ['tạm ứng/hoàn ứng', 'chi phí theo công trình', 'ngân sách dự án', 'kiểm soát chứng từ'],
    auditQuestions: ['Khoản tạm ứng đã dùng cho công trình nào?', 'Chứng từ hoàn ứng có đủ và hợp lệ không?', 'Chi phí có vượt dự toán không?'],
    learningOutcome: 'Biết kiểm soát vòng đời tạm ứng và hoàn ứng trong dự án xây dựng.',
    nextAction: 'Lập aging tạm ứng, yêu cầu hoàn chứng từ theo công trình/hạng mục và khóa tạm ứng mới nếu quá hạn.',
    riskLevel: 'High'
  },
  {
    id: 'construction-progress-revenue',
    industry: 'Xây dựng / Dự án',
    title: 'Doanh thu theo tiến độ thiếu biên bản nghiệm thu',
    scenario: 'Kế toán ghi nhận doanh thu theo tỷ lệ 70% dự toán, nhưng hồ sơ nghiệm thu chỉ xác nhận 55% khối lượng.',
    documents: ['Hợp đồng xây dựng', 'Biên bản nghiệm thu khối lượng', 'Hồ sơ thanh toán A-B', 'Dự toán', 'Hóa đơn', 'Bảng theo dõi tiến độ'],
    redFlags: ['doanh thu vượt nghiệm thu', 'khối lượng chưa được chủ đầu tư xác nhận', 'chi phí dở dang không khớp tiến độ'],
    accountingFocus: ['doanh thu hợp đồng xây dựng', 'chi phí dở dang', 'cut-off doanh thu', 'đối chiếu nghiệm thu'],
    auditQuestions: ['Khối lượng nào đã được nghiệm thu?', 'Điều khoản thanh toán và ghi nhận doanh thu là gì?', 'Chi phí tương ứng với phần nghiệm thu đã tập hợp đủ chưa?'],
    learningOutcome: 'Biết kiểm tra doanh thu tiến độ và rủi ro ghi nhận vượt nghiệm thu.',
    nextAction: 'Đối chiếu hợp đồng, nghiệm thu, hóa đơn và chi phí tương ứng; điều chỉnh phần vượt nếu chưa đủ điều kiện.',
    riskLevel: 'High'
  }
];

export const CASE_BANK_INDUSTRIES = ['Thương mại', 'Sản xuất', 'Dịch vụ', 'Xây dựng / Dự án'] as const;
