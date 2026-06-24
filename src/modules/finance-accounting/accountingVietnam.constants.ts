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
    title: 'Case mô phỏng 01: Thương mại - hàng về lệch hóa đơn',
    lesson: 'Người học nhận ra hóa đơn chưa đủ; phải đối chiếu đơn hàng, nhập kho, giao nhận và công nợ.',
    hint: 'Gợi ý học tập: so sánh số lượng hóa đơn, số lượng kho nhận, giá vốn và công nợ NCC.'
  },
  {
    title: 'Case mô phỏng 02: Sản xuất - định mức lệch thực tế',
    lesson: 'Người học kiểm tra BOM, lệnh sản xuất, NVL xuất dùng, WIP, phế phẩm và giá thành.',
    hint: 'Gợi ý học tập: phân biệt lệch do kỹ thuật, hao hụt, định mức cũ hoặc kiểm soát kho yếu.'
  },
  {
    title: 'Case mô phỏng 03: Dịch vụ - nghiệm thu và doanh thu',
    lesson: 'Người học xem hợp đồng, timesheet, nghiệm thu và thời điểm ghi nhận doanh thu.',
    hint: 'Gợi ý học tập: dịch vụ cần bằng chứng đã cung cấp và quyền thu tiền, không chỉ nhìn hóa đơn.'
  },
  {
    title: 'Case mô phỏng 04: Xây dựng - tạm ứng quá hạn',
    lesson: 'Người học xem tuổi tạm ứng, người nhận, mục đích ứng, chứng từ hoàn ứng và mã công trình.',
    hint: 'Gợi ý học tập: đây là bài kiểm soát dòng tiền và chứng từ, không phải phần mềm hạch toán thay ERP.'
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
  ['cases', 'Case mô phỏng'],
  ['costs', 'Thẻ chi phí'],
  ['docs', 'Quiz chứng từ'],
  ['score', 'Score lab'],
  ['coverage', 'Rà soát module'],
  ['casebank', 'Case nâng cao'],
  ['blueprint', 'Blueprint triển khai'],
  ['companyos', 'Company OS'],
  ['departments', 'Sơ đồ công ty'],
  ['agents', 'Nhân viên AI'],
  ['datasets', 'Dataset mô phỏng'],
  ['experiments', 'Thí nghiệm R&D'],
  ['roadmap', 'Roadmap bán hàng'],
  ['tools', 'Tool miễn phí/rẻ'],
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
    budgetLabel: 'Dự toán công trình/dự án mẫu',
    actualLabel: 'Chi phí công trình thực tế',
    advanceLabel: 'Tạm ứng chỉ huy trưởng/thầu phụ',
    settledLabel: 'Đã hoàn ứng/nghiệm thu khối lượng',
    budgetUsedLabel: 'Mức dùng dự toán công trình',
    advanceLeftLabel: 'Treo tạm ứng công trình',
    defaultBudget: 1200000000,
    defaultActual: 735000000,
    defaultAdvance: 180000000,
    defaultSettled: 95000000
  }
];
