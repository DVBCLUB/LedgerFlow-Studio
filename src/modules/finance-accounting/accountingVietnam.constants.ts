export type AccountingTab =
  | 'dashboard'
  | 'cases'
  | 'costs'
  | 'docs'
  | 'score'
  | 'simulator'
  | 'decisions'
  | 'workorders'
  | 'portfolio'
  | 'sop'
  | 'risks'
  | 'promptlab'
  | 'survey'
  | 'coverage'
  | 'casebank'
  | 'blueprint'
  | 'companyos'
  | 'departments'
  | 'agents'
  | 'datasets'
  | 'roadmap'
  | 'tools'
  | 'experiments'
  | 'backlog';

export type DecisionLogItem = {
  decision: string;
  reason: string;
  evidence: string;
  nextAction: string;
};

export const SIM_CASES = [
  {
    title: 'Nghiệp vụ 01: Thương mại - hàng về lệch hóa đơn',
    lesson: 'Chuyên viên kế toán đối chiếu chứng từ: bắt buộc kiểm tra đơn mua hàng, phiếu nhập kho, biên bản giao nhận và công nợ nhà cung cấp.',
    hint: 'Điểm soát xét: so sánh số lượng trên hóa đơn GTGT, số lượng thực nhận tại kho, giá vốn và công nợ nhà cung cấp.'
  },
  {
    title: 'Nghiệp vụ 02: Sản xuất - định mức nguyên vật liệu lệch thực tế',
    lesson: 'Soát xét chi phí sản xuất: kiểm tra định mức BOM, lệnh sản xuất, phiếu xuất kho NVL, dở dang WIP và phế phẩm.',
    hint: 'Điểm soát xét: phân biệt chênh lệch do kỹ thuật, hao hụt định mức, định mức cũ hoặc quản lý kho.'
  },
  {
    title: 'Nghiệp vụ 03: Dịch vụ - nghiệm thu và thời điểm ghi nhận doanh thu',
    lesson: 'Soát xét doanh thu dịch vụ: kiểm tra hợp đồng, bảng kê khối lượng, biên bản nghiệm thu và thời điểm ghi nhận doanh thu chuẩn VAS.',
    hint: 'Điểm soát xét: doanh thu dịch vụ bắt buộc có bằng chứng đã cung cấp và quyền thu tiền hợp pháp.'
  },
  {
    title: 'Nghiệp vụ 04: Dự án - quản lý công nợ và hoàn ứng tạm ứng',
    lesson: 'Soát xét công nợ tạm ứng: kiểm tra tuổi nợ tạm ứng, người nhận, mục đích chi, chứng từ hoàn ứng và mã chi phí dự án.',
    hint: 'Điểm soát xét: kiểm soát dòng tiền, chứng từ hợp lệ và hạn mức tạm ứng đúng quy định.'
  }
] as const;

export const TAB_LABELS: Array<[AccountingTab, string]> = [
  ['dashboard', 'Founder Dashboard'],
  ['simulator', 'Simulator'],
  ['workorders', 'AI Work Orders'],
  ['portfolio', 'Idea Portfolio'],
  ['sop', 'SOP Library'],
  ['risks', 'Risk & Release'],
  ['decisions', 'Decision Log'],
  ['promptlab', 'Prompt giao việc'],
  ['survey', 'Khảo sát'],
  ['cases', 'Nghiệp vụ soát xét'],
  ['costs', 'Phân loại chi phí'],
  ['docs', 'Soát xét chứng từ'],
  ['score', 'Thước đo hiệu suất'],
  ['coverage', 'Rà soát module'],
  ['casebank', 'Nghiệp vụ nâng cao'],
  ['blueprint', 'Blueprint triển khai'],
  ['companyos', 'Company OS'],
  ['departments', 'Sơ đồ công ty'],
  ['agents', 'Đội ngũ Agent AI'],
  ['datasets', 'Bảng dữ liệu hạch toán'],
  ['experiments', 'Thí nghiệm R&D'],
  ['roadmap', 'Lộ trình phát triển'],
  ['tools', 'Công cụ tối ưu chi phí'],
  ['backlog', 'Backlog cải tiến']
];

export type IndustryTemplate = {
  id: 'trading' | 'manufacturing' | 'services' | 'construction';
  name: string;
  budgetLabel: string;
  actualLabel: string;
  advanceLabel: string;
  settledLabel: string;
  budgetUsedLabel: string;
  advanceLeftLabel: string;
  defaultBudget: number;
  defaultActual: number;
  defaultAdvance: number;
  defaultSettled: number;
};

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'trading',
    name: 'Thương mại',
    budgetLabel: 'Hạn mức mua hàng mẫu',
    actualLabel: 'Chi phí mua hàng thực tế',
    advanceLabel: 'Tạm ứng đặt cọc nhà cung cấp (NCC)',
    settledLabel: 'Đã nhận hàng & đối chiếu hóa đơn',
    budgetUsedLabel: 'Mức dùng hạn mức mua hàng',
    advanceLeftLabel: 'Treo đặt cọc NCC',
    defaultBudget: 500000000,
    defaultActual: 350000000,
    defaultAdvance: 80000000,
    defaultSettled: 50000000
  },
  {
    id: 'manufacturing',
    name: 'Sản xuất',
    budgetLabel: 'Định mức chi phí sản xuất',
    actualLabel: 'Chi phí NVL & nhân công thực tế',
    advanceLabel: 'Tạm ứng mua nguyên vật liệu',
    settledLabel: 'Đã nghiệm thu nhập kho thành phẩm',
    budgetUsedLabel: 'Mức tiêu hao định mức SX',
    advanceLeftLabel: 'Treo tạm ứng vật tư',
    defaultBudget: 2000000000,
    defaultActual: 1400000000,
    defaultAdvance: 300000000,
    defaultSettled: 200000000
  },
  {
    id: 'services',
    name: 'Dịch vụ',
    budgetLabel: 'Ngân sách dự án dịch vụ',
    actualLabel: 'Chi phí trực tiếp triển khai',
    advanceLabel: 'Tạm ứng chi phí đi lại/triển khai',
    settledLabel: 'Đã hoàn ứng có chứng từ nghiệm thu',
    budgetUsedLabel: 'Mức dùng ngân sách dự án',
    advanceLeftLabel: 'Treo tạm ứng nhân sự',
    defaultBudget: 300000000,
    defaultActual: 180000000,
    defaultAdvance: 40000000,
    defaultSettled: 30000000
  },
  {
    id: 'construction',
    name: 'Xây dựng/Dự án',
    budgetLabel: 'Dự toán dự án mẫu',
    actualLabel: 'Chi phí dự án thực tế',
    advanceLabel: 'Tạm ứng chỉ huy trưởng/thầu phụ',
    settledLabel: 'Đã hoàn ứng/nghiệm thu khối lượng',
    budgetUsedLabel: 'Mức dùng dự toán dự án',
    advanceLeftLabel: 'Treo tạm ứng dự án',
    defaultBudget: 1200000000,
    defaultActual: 735000000,
    defaultAdvance: 180000000,
    defaultSettled: 95000000
  }
];
