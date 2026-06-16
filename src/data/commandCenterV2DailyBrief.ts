export type CommandBriefStatus = 'on_track' | 'watch' | 'next';

export interface CommandCenterBriefCard {
  id: string;
  title: string;
  lane: 'Command' | 'Build' | 'Sell' | 'Control' | 'Extend';
  status: CommandBriefStatus;
  metric: string;
  summary: string;
  nextAction: string;
}

export interface CommandCenterRevenueTrackerItem {
  id: string;
  lane: 'Sell' | 'Finance' | 'Product';
  label: string;
  currentValue: number;
  targetValue: number;
  unit: 'VND' | 'count' | 'percent';
  trend: 'up' | 'flat' | 'down';
  nextAction: string;
}

export interface StaticRecommendationRule {
  id: string;
  trigger: string;
  recommendation: string;
  why: string;
  humanReview: string;
  priority: 'P0' | 'P1' | 'P2';
}

export const COMMAND_CENTER_V2_DAILY_BRIEF: CommandCenterBriefCard[] = [
  {
    id: 'brief-accounting-vn',
    title: 'AccountingVietnam deep-dive',
    lane: 'Control',
    status: 'on_track',
    metric: 'Data + panel ready',
    summary: 'Đã có nội dung chuyên sâu kế toán Việt Nam và panel riêng để nối vào tab chính.',
    nextAction: 'Nối AccountingVietnamDeepDivePanel vào AccountingVietnam khi sửa bằng VS Code.'
  },
  {
    id: 'brief-internal-audit',
    title: 'InternalAuditWorkspace deep-dive',
    lane: 'Control',
    status: 'watch',
    metric: 'Data ready',
    summary: 'Đã có data chu trình kiểm soát nội bộ để làm panel SME Việt Nam.',
    nextAction: 'Tạo panel nhỏ render audit cycles trước, chưa mở rộng phức tạp.'
  },
  {
    id: 'brief-custom-data',
    title: 'CustomDataWorkbench deep-dive',
    lane: 'Build',
    status: 'on_track',
    metric: 'Schema + query + pivot data',
    summary: 'Đã có schema preview, query recipes và pivot templates cho dữ liệu mô phỏng.',
    nextAction: 'Tạo panel schema preview khi connector hoặc Codex local xử lý được TSX.'
  },
  {
    id: 'brief-v2-framing',
    title: 'Company OS V2 framing',
    lane: 'Command',
    status: 'next',
    metric: 'Backlog seed ready',
    summary: 'Đã có backlog V2 để chuyển framing sang Company OS và giảm hiểu nhầm thành ERP đơn lẻ.',
    nextAction: 'Rà label hiển thị, không đổi route/id nếu không cần.'
  }
];

export const COMMAND_CENTER_REVENUE_TRACKER: CommandCenterRevenueTrackerItem[] = [
  {
    id: 'mock-mrr',
    lane: 'Finance',
    label: 'Mock MRR pipeline',
    currentValue: 3980000,
    targetValue: 10000000,
    unit: 'VND',
    trend: 'up',
    nextAction: 'Review 3 lead co paid signal va chot offer pilot nho truoc.'
  },
  {
    id: 'paid-pilot-count',
    lane: 'Sell',
    label: 'Paid pilot candidates',
    currentValue: 3,
    targetValue: 5,
    unit: 'count',
    trend: 'flat',
    nextAction: 'Them demo script cho SME accounting, service va trading.'
  },
  {
    id: 'activation-rate',
    lane: 'Product',
    label: 'Activation mock rate',
    currentValue: 42,
    targetValue: 60,
    unit: 'percent',
    trend: 'up',
    nextAction: 'Giam friction Start Here va dua Company OS lanes len ro hon.'
  },
  {
    id: 'overdue-followup',
    lane: 'Sell',
    label: 'Overdue follow-up',
    currentValue: 4,
    targetValue: 0,
    unit: 'count',
    trend: 'down',
    nextAction: 'Chon 4 lead qua han, ghi owner va next action trong ngay.'
  }
];

export const COMMAND_CENTER_STATIC_RECOMMENDATIONS: StaticRecommendationRule[] = [
  {
    id: 'p0-before-p1',
    trigger: 'Neu con task P0 chua pass lint/build/offline checks.',
    recommendation: 'HOLD P1 Knowledge Base/RAG va Chief of Staff backend.',
    why: 'P0 wiring, framing va boundary notes can on dinh truoc khi them backend nang.',
    humanReview: 'Founder hoac lead engineer xac nhan P0 checklist truoc khi mo P1.',
    priority: 'P0'
  },
  {
    id: 'revenue-followup',
    trigger: 'Neu overdue follow-up > 0 hoac paid pilot candidates < target.',
    recommendation: 'Uu tien Sales/CRM follow-up truoc khi build them feature moi.',
    why: 'Company OS can vong lap doanh thu som, khong chi build demo noi bo.',
    humanReview: 'Nguoi phu trach sales xac nhan lead nao goi/demo trong ngay.',
    priority: 'P0'
  },
  {
    id: 'activation-gap',
    trigger: 'Neu activation mock rate thap hon target.',
    recommendation: 'Don lai Start Here, Company OS lanes va Daily Brief de nguoi dung thay viec tiep theo.',
    why: 'Activation thap thuong den tu navigation roi va khong biet bat dau o dau.',
    humanReview: 'Founder review screenshot/flow truoc khi doi label top-level.',
    priority: 'P1'
  },
  {
    id: 'control-exception',
    trigger: 'Neu missing docs, overdue advance hoac control exception tang.',
    recommendation: 'Mo Internal Audit/Accounting deep-dive de tao exception list, chua ket luan thay reviewer.',
    why: 'Rule/static recommendation chi sang loc, bang chung that can nguoi duyet.',
    humanReview: 'Ke toan/reviewer xac minh ho so goc va quyet dinh xu ly.',
    priority: 'P0'
  }
];

export const COMMAND_CENTER_V2_ACCEPTANCE = [
  'Daily Brief dùng dữ liệu static hoặc local first để chạy offline.',
  'Mỗi card có lane, status, metric, summary và nextAction.',
  'Không cần thêm backend trong bước V2 nhỏ.',
  'Không thay thế module khác, chỉ tổng hợp trạng thái điều hành.'
];
