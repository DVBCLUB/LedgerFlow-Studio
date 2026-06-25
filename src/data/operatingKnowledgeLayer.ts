export type KnowledgeRiskLevel = 'Low' | 'Medium' | 'High';

export type OperatingCaseDomain =
  | 'commerce'
  | 'manufacturing'
  | 'service'
  | 'construction'
  | 'saas'
  | 'agency'
  | 'digital-product';

export interface OperatingCaseSeed {
  id: string;
  title: string;
  domain: OperatingCaseDomain;
  scenario: string;
  inputs: string[];
  documents: string[];
  accountingFocus: string[];
  redFlags: string[];
  expectedOutput: string[];
}

export interface KnowledgePackSeed {
  id: string;
  title: string;
  whenToUse: string;
  commonMistakes: string[];
  checklist: string[];
  disclaimer: string;
}

export interface AIWorkOrderSeed {
  id: string;
  role: string;
  useCase: string;
  input: string[];
  output: string[];
  acceptanceCriteria: string[];
  founderMustApprove: string[];
  forbidden: string[];
}

export interface DecisionTemplateSeed {
  id: string;
  decisionType: 'GO' | 'HOLD' | 'KILL' | 'REVISIT';
  prompt: string;
  evidenceRequired: string[];
  nextStep: string;
}

export const OPERATING_CASE_BANK: OperatingCaseSeed[] = [
  {
    id: 'commerce-inventory-margin-001',
    title: 'Thương mại: biên lợi nhuận, tồn kho và công nợ',
    domain: 'commerce',
    scenario: 'Doanh thu tăng nhưng dòng tiền yếu, tồn kho lệch và công nợ khách hàng quá hạn.',
    inputs: ['doanh thu theo đơn', 'giá vốn nhập hàng', 'tồn đầu/cuối kỳ', 'công nợ khách hàng', 'chi phí vận hành'],
    documents: ['hóa đơn mua hàng', 'hóa đơn bán hàng', 'phiếu nhập/xuất kho', 'biên bản đối chiếu công nợ'],
    accountingFocus: ['giá vốn', 'tồn kho', 'phải thu', 'biên lợi nhuận gộp'],
    redFlags: ['gross margin âm', 'tồn kho thực tế thấp hơn sổ', 'công nợ quá hạn không có đối chiếu'],
    expectedOutput: ['gross margin', 'inventory variance', 'AR aging warning', 'go/hold control recommendation'],
  },
  {
    id: 'manufacturing-bom-variance-001',
    title: 'Sản xuất: lệch BOM, định mức và giá thành',
    domain: 'manufacturing',
    scenario: 'Phế phẩm tăng, tiêu hao nguyên vật liệu cao hơn định mức và giá thành biến động.',
    inputs: ['BOM', 'định mức nguyên vật liệu', 'tiêu hao thực tế', 'sản lượng đạt', 'phế phẩm', 'chi phí sản xuất chung'],
    documents: ['phiếu xuất nguyên vật liệu', 'bảng định mức', 'báo cáo sản lượng', 'biên bản phế phẩm'],
    accountingFocus: ['work in progress', 'cost variance', 'yield rate', 'giá thành sản phẩm'],
    redFlags: ['variance tăng liên tục', 'phế phẩm không có nguyên nhân', 'định mức chưa cập nhật sau thay đổi quy trình'],
    expectedOutput: ['variance report', 'yield rate', 'root-cause hypothesis', 'control action'],
  },
  {
    id: 'service-revenue-recognition-001',
    title: 'Dịch vụ: nghiệm thu, doanh thu và dòng tiền',
    domain: 'service',
    scenario: 'Dự án đã làm 70%, khách chưa nghiệm thu, team muốn ghi nhận doanh thu để báo cáo đẹp hơn.',
    inputs: ['giá trị hợp đồng', 'tỷ lệ hoàn thành', 'biên bản nghiệm thu', 'chi phí nhân sự', 'điều khoản thanh toán'],
    documents: ['hợp đồng', 'timesheet', 'biên bản nghiệm thu', 'invoice', 'email xác nhận phạm vi'],
    accountingFocus: ['revenue recognition', 'project margin', 'deferred revenue', 'receivables'],
    redFlags: ['ghi nhận trước nghiệm thu', 'scope creep không phụ lục', 'chi phí nhân sự không phân bổ theo dự án'],
    expectedOutput: ['recognition decision draft', 'margin estimate', 'missing evidence list', 'risk note'],
  },
  {
    id: 'saas-unit-economics-001',
    title: 'SaaS: unit economics trước khi build lớn',
    domain: 'saas',
    scenario: 'Founder muốn build thêm tính năng AI nhưng chưa rõ khách hàng trả tiền và chi phí API theo lượt.',
    inputs: ['giá gói', 'trial users', 'conversion rate', 'AI cost/request', 'support time', 'churn giả định'],
    documents: ['pricing draft', 'landing page survey', 'usage log', 'AI quota report'],
    accountingFocus: ['gross margin', 'CAC proxy', 'LTV proxy', 'monthly burn'],
    redFlags: ['AI cost cao hơn doanh thu/user', 'chưa có willingness-to-pay', 'build tính năng trước khi có use case lặp lại'],
    expectedOutput: ['unit economics snapshot', 'pricing risk', 'keep/kill rule', 'MVP scope'],
  },
];

export const VAS_KNOWLEDGE_PACKS: KnowledgePackSeed[] = [
  {
    id: 'vas-revenue-recognition',
    title: 'Ghi nhận doanh thu',
    whenToUse: 'Khi mô phỏng hợp đồng, nghiệm thu, invoice hoặc doanh thu chưa chắc đủ điều kiện ghi nhận.',
    commonMistakes: ['ghi nhận khi chưa có nghiệm thu/bằng chứng', 'nhầm doanh thu nhận trước với doanh thu thực hiện', 'không tách giảm trừ doanh thu'],
    checklist: ['Có hợp đồng/đơn hàng không?', 'Đã cung cấp hàng hóa/dịch vụ chưa?', 'Có nghiệm thu hoặc bằng chứng giao hàng không?', 'Có khoản phải hoàn/giảm trừ không?'],
    disclaimer: 'Dùng cho học tập và mô phỏng; cần đối chiếu quy định hiện hành trước khi áp dụng thực tế.',
  },
  {
    id: 'vas-inventory-cogs',
    title: 'Hàng tồn kho và giá vốn',
    whenToUse: 'Khi mô phỏng thương mại/sản xuất có nhập-xuất kho, lệch tồn hoặc biên lợi nhuận bất thường.',
    commonMistakes: ['không đối chiếu kho thực tế', 'giá vốn không khớp phương pháp tính', 'không xử lý hàng hư hỏng/chậm luân chuyển'],
    checklist: ['Có phiếu nhập/xuất không?', 'Tồn thực tế khớp sổ không?', 'Có hàng chậm luân chuyển không?', 'Giá vốn có nhất quán không?'],
    disclaimer: 'Đây là khung kiểm tra nghiệp vụ; không thay thế chính sách kế toán được phê duyệt của doanh nghiệp.',
  },
  {
    id: 'vas-advances-reimbursements',
    title: 'Tạm ứng và hoàn ứng',
    whenToUse: 'Khi mô phỏng chi phí dự án, công trình hoặc nhân sự xin ứng tiền trước.',
    commonMistakes: ['ứng mới khi khoản cũ chưa hoàn', 'không giới hạn tuổi nợ tạm ứng', 'thiếu chứng từ hoàn ứng'],
    checklist: ['Khoản cũ đã hoàn chưa?', 'Có chứng từ hợp lệ không?', 'Có phê duyệt vượt hạn mức không?', 'Có rule chặn ứng mới không?'],
    disclaimer: 'Cần kiểm tra quy chế tài chính nội bộ và yêu cầu chứng từ thực tế trước khi ghi nhận.',
  },
];

export const AI_WORK_ORDER_LIBRARY: AIWorkOrderSeed[] = [
  {
    id: 'wo-founder-weekly-priorities',
    role: 'AI Chief of Staff',
    useCase: 'Tổng hợp 3 ưu tiên tuần và việc cần dừng',
    input: ['backlog hiện tại', 'decision log', 'rủi ro lớn nhất', 'thời gian founder có trong tuần'],
    output: ['top 3 ưu tiên', 'việc phải dừng', 'rủi ro cần xử lý', 'bước tiếp theo'],
    acceptanceCriteria: ['có lý do chọn', 'có trade-off', 'không chọn quá 3 ưu tiên', 'có founder approval'],
    founderMustApprove: ['GO/HOLD/KILL', 'thay đổi roadmap', 'chi tiền tool mới'],
    forbidden: ['tự xóa backlog', 'tự quyết release', 'tự hứa với khách hàng'],
  },
  {
    id: 'wo-product-prd-small-scope',
    role: 'AI Product Manager',
    useCase: 'Biến ý tưởng thành PRD nhỏ có thể build trong một vòng',
    input: ['one-line idea', 'target user', 'pain point', 'sample data', 'scope không làm'],
    output: ['persona', 'user story', 'MVP screen', 'data model draft', 'acceptance criteria'],
    acceptanceCriteria: ['MVP nhỏ', 'không mở rộng vô hạn', 'có edge case', 'có test case'],
    founderMustApprove: ['scope MVP', 'pricing promise', 'claim kế toán/pháp lý'],
    forbidden: ['định vị như ERP', 'thêm backend phức tạp khi localStorage đủ', 'bỏ qua disclaimer'],
  },
  {
    id: 'wo-auditor-risk-review',
    role: 'AI Auditor',
    useCase: 'Rà soát rủi ro trước release nội dung kế toán/kiểm toán',
    input: ['case content', 'simulation rules', 'UI labels', 'release note'],
    output: ['risk list', 'severity', 'wording cần sửa', 'release/hold recommendation'],
    acceptanceCriteria: ['nêu rõ rủi ro hiểu nhầm', 'có kiểm soát đề xuất', 'có disclaimer', 'không phán chắc khi thiếu nguồn'],
    founderMustApprove: ['release decision', 'boundary wording', 'risk acceptance'],
    forbidden: ['đưa tư vấn pháp lý chính thức', 'bịa văn bản hiện hành', 'xóa cảnh báo để UI đẹp hơn'],
  },
];

export const DECISION_LOG_TEMPLATES: DecisionTemplateSeed[] = [
  {
    id: 'decision-go',
    decisionType: 'GO',
    prompt: 'Chỉ GO khi pain rõ, người dùng rõ, MVP nhỏ, có cách kiểm chứng và rủi ro nằm trong kiểm soát.',
    evidenceRequired: ['pain score', 'buyer clarity', 'MVP scope', 'distribution path', 'technical/legal risk'],
    nextStep: 'Tạo work order cho AI PM hoặc AI Developer với acceptance criteria rõ.',
  },
  {
    id: 'decision-hold',
    decisionType: 'HOLD',
    prompt: 'HOLD khi ý tưởng có tiềm năng nhưng thiếu bằng chứng hoặc scope đang quá rộng.',
    evidenceRequired: ['giả thuyết chưa kiểm', 'dữ liệu cần bổ sung', 'điều kiện để mở lại'],
    nextStep: 'Tạo survey, prototype nhỏ hoặc case mô phỏng trước khi code.',
  },
  {
    id: 'decision-kill',
    decisionType: 'KILL',
    prompt: 'KILL khi không có use case hằng ngày, không có kênh bán, hoặc rủi ro kỹ thuật/chi phí vượt sức solo founder.',
    evidenceRequired: ['lý do dừng', 'chi phí tránh được', 'phần có thể tái sử dụng', 'ngày review lại nếu có bằng chứng mới'],
    nextStep: 'Ghi kill memo và không để backlog phình thêm.',
  },
  {
    id: 'decision-revisit',
    decisionType: 'REVISIT',
    prompt: 'REVISIT khi cần quay lại ý tưởng sau khi có dữ liệu mới, khách hàng mới hoặc thay đổi chi phí công nghệ.',
    evidenceRequired: ['trigger mở lại', 'ngày review', 'bằng chứng cần có'],
    nextStep: 'Đưa vào weekly review hoặc decision log.',
  },
];

export const LEDGERFLOW_BOUNDARY_STATEMENTS = [
  'LedgerFlow là company OS, learning/R&D và simulation lab; không định vị như ERP kế toán chính thức.',
  'Nội dung AI liên quan kế toán, thuế hoặc pháp lý là hỗ trợ học tập/mô phỏng cho tới khi được chuyên gia hoặc văn bản hiện hành xác nhận.',
  'AI không được tự quyết GO/HOLD/KILL, release, chi tiền hoặc cam kết với khách hàng thay founder.',
  'Mỗi module cần có input, xử lý, output và quyết định tiếp theo; module chỉ là card tĩnh nên chuyển vào Knowledge hoặc Labs.',
  'Ưu tiên free-first/local-first; thêm backend, subscription hoặc workflow phức tạp chỉ khi có use case lặp lại.',
] as const;
