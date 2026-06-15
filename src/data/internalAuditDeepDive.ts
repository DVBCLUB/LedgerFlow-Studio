export type AuditRiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AuditProgramTemplate = {
  id: string;
  cycle: string;
  objective: string;
  scope: string[];
  procedures: string[];
  evidence: string[];
  redFlags: string[];
  severity: AuditRiskSeverity;
};

export type DuplicatePaymentRule = {
  id: string;
  name: string;
  matchingFields: string[];
  warningPattern: string;
  testLogic: string;
  reviewerAction: string;
};

export type BenfordCheckGuide = {
  digit: string;
  expectedPattern: string;
  useCase: string;
  limitation: string;
};

export const INTERNAL_AUDIT_17_CYCLES: AuditProgramTemplate[] = [
  {
    id: 'cash-bank',
    cycle: 'Tiền mặt và ngân hàng',
    objective: 'Đảm bảo thu chi có phê duyệt, chứng từ đủ, số dư khớp sổ và không có giao dịch bất thường.',
    scope: ['Phiếu thu/chi', 'Ủy nhiệm chi', 'Sao kê ngân hàng', 'Sổ quỹ', 'Biên bản kiểm kê quỹ'],
    procedures: ['Đối chiếu sổ quỹ với kiểm kê thực tế', 'Đối chiếu sao kê ngân hàng với sổ kế toán', 'Lọc giao dịch tròn số/lặp lại', 'Kiểm tra chi tiền cho cá nhân không có hồ sơ kèm theo'],
    evidence: ['Biên bản kiểm kê', 'Sao kê ngân hàng', 'Phiếu thu/chi đã ký', 'File đối chiếu lệch'],
    redFlags: ['Chi tiền nhiều lần dưới ngưỡng phê duyệt', 'Một người vừa đề nghị vừa duyệt vừa nhận tiền', 'Khoản chi không gắn mã bộ phận/công trình'],
    severity: 'critical'
  },
  {
    id: 'purchasing-ap',
    cycle: 'Mua hàng và phải trả',
    objective: 'Kiểm soát mua đúng nhu cầu, đúng giá, đúng NCC và không thanh toán trùng.',
    scope: ['Đề nghị mua hàng', 'Báo giá', 'Hợp đồng/PO', 'Phiếu nhập kho', 'Hóa đơn', 'Đề nghị thanh toán'],
    procedures: ['So khớp 3 bên PO - nhập kho - hóa đơn', 'Tìm số hóa đơn trùng', 'Tìm cùng số tiền cùng NCC trong 7 ngày', 'Kiểm tra thay đổi tài khoản ngân hàng NCC'],
    evidence: ['Bảng matching 3-way', 'Danh sách ngoại lệ', 'Log phê duyệt', 'Biên bản xác nhận NCC'],
    redFlags: ['Hóa đơn về trước hàng', 'NCC mới phát sinh nhiều giao dịch lớn', 'Thanh toán thiếu phiếu nhập hoặc nghiệm thu'],
    severity: 'critical'
  },
  {
    id: 'inventory',
    cycle: 'Hàng tồn kho',
    objective: 'Đảm bảo tồn kho có thật, nhập xuất đúng kỳ, định giá đúng và không âm kho bất thường.',
    scope: ['Phiếu nhập', 'Phiếu xuất', 'Thẻ kho', 'Biên bản kiểm kê', 'Bảng tính giá xuất kho'],
    procedures: ['So sánh tồn sổ với tồn kiểm kê', 'Lọc mã hàng âm kho', 'Kiểm tra nhập sau xuất trước', 'Đánh giá hàng chậm luân chuyển'],
    evidence: ['Biên bản kiểm kê', 'Danh sách lệch kho', 'Ảnh kiểm kê nếu có', 'Bảng tính giá vốn'],
    redFlags: ['Âm kho kéo dài', 'Điều chỉnh kho không có lý do', 'Một mã hàng nhiều đơn vị tính không quy đổi'],
    severity: 'high'
  },
  {
    id: 'sales-ar',
    cycle: 'Bán hàng và phải thu',
    objective: 'Đảm bảo doanh thu ghi nhận đúng kỳ, có bằng chứng giao hàng/nghiệm thu và công nợ thu hồi được.',
    scope: ['Hợp đồng/đơn hàng', 'Phiếu xuất/giao hàng', 'Biên bản nghiệm thu', 'Hóa đơn', 'Đối chiếu công nợ'],
    procedures: ['So khớp đơn hàng - giao hàng - hóa đơn', 'Kiểm tra doanh thu cuối kỳ', 'Phân tích tuổi nợ', 'Tìm khách hàng vượt hạn mức'],
    evidence: ['Biên bản giao nhận', 'Nghiệm thu', 'Bảng aging công nợ', 'Xác nhận công nợ'],
    redFlags: ['Xuất hóa đơn khi chưa giao hàng/nghiệm thu', 'Công nợ quá hạn nhưng vẫn bán tiếp', 'Doanh thu tăng đột biến cuối kỳ'],
    severity: 'high'
  },
  {
    id: 'fixed-assets',
    cycle: 'Tài sản cố định và CCDC',
    objective: 'Đảm bảo tài sản tồn tại, được ghi nhận đúng nguyên giá, khấu hao đúng và thanh lý có phê duyệt.',
    scope: ['Hồ sơ mua tài sản', 'Biên bản bàn giao', 'Mã tài sản', 'Bảng khấu hao', 'Biên bản kiểm kê'],
    procedures: ['Kiểm kê chọn mẫu tài sản', 'Đối chiếu mã tài sản với người sử dụng', 'Tính lại khấu hao', 'Kiểm tra tài sản đã hư hỏng nhưng còn ghi sổ'],
    evidence: ['Ảnh tài sản', 'Biên bản bàn giao', 'Bảng khấu hao', 'Biên bản thanh lý'],
    redFlags: ['Tài sản không gắn người chịu trách nhiệm', 'Mua CCDC nhưng ghi TSCĐ hoặc ngược lại', 'Thanh lý không có phê duyệt'],
    severity: 'medium'
  },
  {
    id: 'payroll-hr',
    cycle: 'Lương và nhân sự',
    objective: 'Đảm bảo chi phí lương đúng người, đúng công, đúng chính sách và không có nhân sự ảo.',
    scope: ['Hợp đồng lao động', 'Chấm công', 'Bảng lương', 'Phê duyệt lương', 'Tài khoản nhận lương'],
    procedures: ['So khớp nhân sự active với bảng lương', 'Lọc nhiều nhân viên dùng cùng tài khoản ngân hàng', 'Kiểm tra OT/phụ cấp bất thường', 'Đối chiếu ngày nghỉ việc với lương trả'],
    evidence: ['Danh sách nhân sự', 'Bảng chấm công', 'Bảng lương đã duyệt', 'File ngoại lệ'],
    redFlags: ['Nhân sự nghỉ vẫn nhận lương', 'Một tài khoản nhận nhiều lương', 'OT tăng bất thường không có phê duyệt'],
    severity: 'high'
  },
  {
    id: 'construction-project-cost',
    cycle: 'Chi phí công trình/dự án',
    objective: 'Đảm bảo chi phí gắn đúng công trình, đúng dự toán, có nghiệm thu/chứng từ và kiểm soát tạm ứng.',
    scope: ['Dự toán', 'Mã công trình', 'Phiếu nhập/xuất vật tư', 'Hồ sơ thầu phụ', 'Tạm ứng/hoàn ứng'],
    procedures: ['So sánh chi phí thực tế với dự toán', 'Lọc chi phí không có mã công trình', 'Kiểm tra tạm ứng quá hạn', 'Đối chiếu nghiệm thu với thanh toán'],
    evidence: ['Bảng cost-to-budget', 'Danh sách tạm ứng treo', 'Hồ sơ nghiệm thu', 'Đề nghị thanh toán'],
    redFlags: ['Chi vượt dự toán chưa phê duyệt', 'Ứng mới khi ứng cũ chưa hoàn', 'Chi phí thiếu nghiệm thu nhưng đã thanh toán'],
    severity: 'critical'
  }
];

export const DUPLICATE_PAYMENT_RULES: DuplicatePaymentRule[] = [
  {
    id: 'same-invoice-supplier',
    name: 'Trùng số hóa đơn cùng nhà cung cấp',
    matchingFields: ['supplierTaxCode', 'invoiceNumber', 'invoiceDate'],
    warningPattern: 'Cùng mã số thuế NCC + cùng số hóa đơn + cùng ngày hóa đơn xuất hiện nhiều hơn 1 lần.',
    testLogic: 'Group by supplierTaxCode, invoiceNumber, invoiceDate; flag count > 1.',
    reviewerAction: 'Đối chiếu trạng thái thanh toán, kiểm tra có phải nhập trùng chứng từ hay điều chỉnh hợp lệ.'
  },
  {
    id: 'same-amount-near-date',
    name: 'Cùng số tiền gần ngày',
    matchingFields: ['supplierName', 'amount', 'paymentDate +/- 7 days'],
    warningPattern: 'Một NCC nhận cùng số tiền trong khoảng thời gian ngắn.',
    testLogic: 'Sort by supplierName, amount, paymentDate; flag same amount within 7 days.',
    reviewerAction: 'Kiểm tra hợp đồng/đợt thanh toán, xác minh có nghiệm thu riêng hay thanh toán trùng.'
  },
  {
    id: 'split-under-approval-threshold',
    name: 'Tách nhỏ dưới ngưỡng phê duyệt',
    matchingFields: ['requester', 'supplierName', 'amountBelowThreshold', 'sameWeek'],
    warningPattern: 'Nhiều khoản chi nhỏ cùng người đề nghị/cùng NCC dưới ngưỡng duyệt.',
    testLogic: 'Aggregate by requester + supplierName + week; flag total above threshold while each line below threshold.',
    reviewerAction: 'Kiểm tra chính sách phê duyệt, yêu cầu giải trình lý do tách khoản.'
  }
];

export const BENFORD_BASIC_GUIDE: BenfordCheckGuide[] = [
  {
    digit: '1',
    expectedPattern: 'Thường xuất hiện nhiều nhất trong dữ liệu tự nhiên có dải giá trị rộng.',
    useCase: 'Dùng để sàng lọc chi phí, hóa đơn, doanh thu có nhiều giá trị tự nhiên.',
    limitation: 'Không phù hợp cho dữ liệu bị giới hạn giá, mã số, số điện thoại hoặc dữ liệu đã làm tròn mạnh.'
  },
  {
    digit: '9',
    expectedPattern: 'Thường xuất hiện ít hơn chữ số đầu là 1 hoặc 2.',
    useCase: 'Nếu số bắt đầu bằng 9 quá nhiều, có thể do chia nhỏ sát ngưỡng hoặc làm tròn chủ ý.',
    limitation: 'Chỉ là tín hiệu red flag, không kết luận gian lận nếu chưa kiểm chứng chứng từ.'
  }
];

export const INTERNAL_AUDIT_ACCEPTANCE_CRITERIA = [
  'Mỗi chu trình audit phải có objective, scope, procedures, evidence và red flags rõ ràng.',
  'Không dùng AI để kết luận gian lận; AI chỉ hỗ trợ sàng lọc ngoại lệ và lập checklist.',
  'Duplicate payment detection phải có reviewerAction để kế toán/kiểm toán viên xác minh thủ công.',
  'Benford basic chỉ là kỹ thuật phân tích dữ liệu định hướng, không thay thế bằng chứng kiểm toán.',
  'Module phải dùng được offline vì dữ liệu checklist nằm trong TypeScript static data.'
];
