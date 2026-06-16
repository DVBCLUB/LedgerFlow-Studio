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

export type SmeAuditChecklist = {
  id: string;
  area: string;
  controlObjective: string;
  checklist: string[];
  evidence: string[];
  exceptionExamples: string[];
  reviewerPrompt: string;
};

export type SmeAuditProgramTemplate = {
  id: string;
  name: string;
  bestFor: string;
  planningQuestions: string[];
  procedures: string[];
  sampleStrategy: string[];
  expectedOutput: string[];
};

export type ControlExceptionPattern = {
  id: string;
  pattern: string;
  controlWeakness: string;
  dataSignals: string[];
  evidenceToRequest: string[];
  reviewerAction: string;
  severity: AuditRiskSeverity;
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

export const SME_OPERATIONAL_AUDIT_CHECKLISTS: SmeAuditChecklist[] = [
  {
    id: 'sme-cash-bank',
    area: 'SME cash and bank',
    controlObjective: 'Thu chi co phe duyet, dung nguoi nhan, dung muc dich va doi chieu duoc voi sao ke ngan hang.',
    checklist: ['doi chieu so quy voi sao ke', 'kiem tra giao dich tron so/lap lai', 'kiem tra chi tien cho ca nhan', 'kiem tra nguoi de nghi khac nguoi duyet', 'kiem tra chung tu kem theo tung khoan chi'],
    evidence: ['sao ke ngan hang', 'phieu thu/chi', 'uy nhiem chi', 'bang doi chieu quy', 'log phe duyet'],
    exceptionExamples: ['chi nhieu lan duoi nguong phe duyet', 'nguoi nhan tien khong co trong ho so NCC/nhan su', 'giao dich ghi chu chung chung nhu chi khac'],
    reviewerPrompt: 'Day la diem can kiem tra tien mat/ngan hang; reviewer xac minh chung tu goc truoc khi ket luan.'
  },
  {
    id: 'sme-procure-to-pay',
    area: 'SME procure-to-pay',
    controlObjective: 'Mua hang co nhu cau that, co gia/PO/hop dong, co nhap kho/nghiem thu va khong thanh toan trung.',
    checklist: ['3-way match PO/hop dong - nhap kho/nghiem thu - hoa don', 'kiem tra NCC moi', 'kiem tra thay doi tai khoan ngan hang NCC', 'loc trung hoa don', 'doi chieu cong no truoc thanh toan'],
    evidence: ['de nghi mua hang', 'bao gia', 'PO/hop dong', 'phieu nhap/nghiem thu', 'hoa don', 'de nghi thanh toan'],
    exceptionExamples: ['thanh toan truoc khi co nghiem thu', 'hoa don ve truoc hang khong co giai trinh', 'NCC moi nhan nhieu giao dich lon'],
    reviewerPrompt: 'Neu co exception, reviewer can xac minh nhu cau mua, nguoi phe duyet va tinh day du cua bo ho so.'
  },
  {
    id: 'sme-revenue-ar',
    area: 'SME revenue and receivables',
    controlObjective: 'Doanh thu ghi dung ky, co bang chung giao hang/nghiem thu va cong no duoc theo doi thu hoi.',
    checklist: ['doi chieu don hang/hop dong voi giao hang/nghiem thu', 'kiem tra doanh thu cuoi ky', 'phan tich tuoi no', 'kiem tra khach vuot han muc', 'doi chieu hoa don va thu tien'],
    evidence: ['hop dong/don hang', 'phieu giao hang', 'bien ban nghiem thu', 'hoa don dau ra', 'aging cong no', 'xac nhan cong no'],
    exceptionExamples: ['xuat hoa don khi chua giao hang', 'cong no qua han van ban tiep', 'doanh thu tang bat thuong cuoi ky'],
    reviewerPrompt: 'Reviewer xac nhan dieu kien ghi nhan doanh thu va kha nang thu hoi truoc khi chap nhan ket qua.'
  },
  {
    id: 'sme-payroll',
    area: 'SME payroll and HR',
    controlObjective: 'Luong tra dung nguoi, dung cong, dung chinh sach va khong co nhan su ao.',
    checklist: ['so khop danh sach nhan su active voi bang luong', 'kiem tra tai khoan nhan luong trung', 'kiem tra OT/phu cap bat thuong', 'doi chieu ngay nghi viec voi bang luong', 'kiem tra phe duyet bang luong'],
    evidence: ['hop dong lao dong', 'bang cham cong', 'bang luong da duyet', 'danh sach tai khoan ngan hang', 'quyet dinh nghi viec neu co'],
    exceptionExamples: ['nhan su nghi van nhan luong', 'mot tai khoan nhan nhieu luong', 'phu cap/OT tang manh khong co phe duyet'],
    reviewerPrompt: 'Day la ngoai le kiem soat nhan su, khong ket luan gian lan neu chua doi chieu HR va ngan hang.'
  }
];

export const SME_AUDIT_PROGRAM_TEMPLATES: SmeAuditProgramTemplate[] = [
  {
    id: 'quick-smoke-test',
    name: 'SME quick control smoke test',
    bestFor: 'Doanh nghiep nho can quet nhanh rui ro trong 1-2 ngay truoc khi mo audit day du.',
    planningQuestions: ['chu ky nao co gia tri lon nhat?', 'ai la nguoi de nghi/duyet/thanh toan?', 'du lieu nao co san offline?', 'nguong phe duyet dang ap dung la gi?'],
    procedures: ['chon top giao dich gia tri lon', 'loc giao dich trung/lap lai', 'kiem tra bo ho so toi thieu', 'ghi exception log kem owner va deadline'],
    sampleStrategy: ['top 20 theo gia tri', 'toan bo giao dich duoi nguong phe duyet nhung lap lai', 'NCC/khach hang moi', 'giao dich cuoi ky'],
    expectedOutput: ['risk heatmap', 'exception list', 'owner follow-up tracker', 'GO/HOLD de mo audit sau']
  },
  {
    id: 'monthly-close-review',
    name: 'Monthly close control review',
    bestFor: 'Rao soat truoc khi khoa ky va gui bao cao quan tri/founder.',
    planningQuestions: ['ky nay co thay doi policy khong?', 'co tai khoan tam treo nao qua han?', 'co dieu chinh sau duyet khong?', 'bao cao nao se gui founder?'],
    procedures: ['doi chieu tien/ngan hang', 'review tam ung va cong no', 'kiem tra VAT/hoa don bat thuong', 'kiem tra audit log sua du lieu', 'xac nhan exception da co owner'],
    sampleStrategy: ['giao dich cuoi ky', 'but toan dieu chinh', 'hoa don thue suat bat thuong', 'khoan treo qua han', 'chi phi khong gan bo phan/du an'],
    expectedOutput: ['monthly close checklist', 'open exception summary', 'reviewer sign-off note', 'next month control action']
  },
  {
    id: 'fraud-red-flag-scan',
    name: 'Fraud red flag scan at control level',
    bestFor: 'Khi founder/reviewer muon sang loc mau bat thuong nhung chua ket luan gian lan.',
    planningQuestions: ['quy trinh nao co phan quyen yeu?', 'co nguoi vua tao vua duyet khong?', 'nguong phe duyet co bi tach nho khong?', 'co NCC/nhan su lien quan noi bo khong?'],
    procedures: ['test segregation of duties', 'loc split payments', 'loc duplicate payment', 'kiem tra thay doi master data NCC', 'doi chieu bang chung ngoai he thong'],
    sampleStrategy: ['toan bo giao dich gan nguong', 'NCC moi/doi tai khoan', 'nguoi de nghi co tan suat cao', 'giao dich lam tron so', 'giao dich sua sau duyet'],
    expectedOutput: ['red flag register', 'control weakness note', 'evidence request list', 'reviewer decision queue']
  }
];

export const CONTROL_EXCEPTION_PATTERNS: ControlExceptionPattern[] = [
  {
    id: 'sod-conflict',
    pattern: 'Mot nguoi tao yeu cau, duyet va ghi nhan/thanh toan cung mot giao dich.',
    controlWeakness: 'Segregation of duties yeu hoac khong co secondary review.',
    dataSignals: ['same requester and approver', 'same user edited after approval', 'approval time qua gan creation time'],
    evidenceToRequest: ['approval log', 'user role matrix', 'delegation note neu co', 'chung tu goc'],
    reviewerAction: 'Danh dau exception, yeu cau nguoi doc lap review lai va cap nhat phan quyen neu can.',
    severity: 'critical'
  },
  {
    id: 'split-threshold',
    pattern: 'Nhieu khoan chi nho cung NCC/requester trong cung tuan, tong vuot nguong phe duyet cao hon.',
    controlWeakness: 'Approval threshold co the bi ne tranh bang cach tach giao dich.',
    dataSignals: ['amount below threshold', 'same supplier', 'same requester', 'same week', 'similar description'],
    evidenceToRequest: ['purchase request group', 'budget approval', 'contract/PO', 'explanation from requester'],
    reviewerAction: 'Gom nhom giao dich, so voi nguong phe duyet va yeu cau phe duyet bo sung neu can.',
    severity: 'high'
  },
  {
    id: 'master-data-change',
    pattern: 'Thong tin NCC/nhan vien thay doi gan thoi diem thanh toan.',
    controlWeakness: 'Master data change control yeu, rui ro thanh toan sai tai khoan.',
    dataSignals: ['bank account changed before payment', 'new supplier with high value', 'missing vendor verification'],
    evidenceToRequest: ['vendor confirmation', 'bank account change approval', 'call-back evidence', 'payment voucher'],
    reviewerAction: 'Tam giu thanh toan neu chua xac minh; yeu cau call-back/doc lap xac nhan.',
    severity: 'critical'
  },
  {
    id: 'missing-evidence',
    pattern: 'Giao dich da thanh toan/ghi nhan nhung thieu bang chung nghiem thu, giao hang hoac hoa don.',
    controlWeakness: 'Document completeness control khong chan duoc giao dich chua du ho so.',
    dataSignals: ['paid status with missing invoice', 'missing receiving note', 'missing acceptance document', 'manual override'],
    evidenceToRequest: ['invoice XML/PDF', 'receiving note', 'acceptance minutes', 'override approval'],
    reviewerAction: 'Dua vao follow-up tracker, gan owner va deadline; khong ket luan hop le cho toi khi ho so du.',
    severity: 'high'
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
