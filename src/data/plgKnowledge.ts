// ============================================================
// PRODUCT-LED GROWTH KNOWLEDGE — LedgerFlow Studio
// ============================================================

export interface AhaMoment {
  id: string;
  action: string;
  timeframe: string;
  whyItMatters: string;
  howToAccelerate: string;
  metric: string;
}

export const AHA_MOMENTS: AhaMoment[] = [
  {
    id: 'aha_first_project',
    action: 'Tạo công trình đầu tiên và nhập 5 khoản chi phí mẫu',
    timeframe: 'Trong 10 phút đầu',
    whyItMatters: 'Người dùng thấy dashboard thật với dữ liệu của mình, không phải demo mẫu',
    howToAccelerate: 'Pre-fill tên công trình từ form đăng ký. Onboarding wizard 3 bước. Không yêu cầu thông tin không cần thiết.',
    metric: '% user tạo project trong 24h đầu (target: >40%)',
  },
  {
    id: 'aha_boss_report',
    action: 'Xuất báo cáo sếp 5 KPI lần đầu',
    timeframe: 'Trong 3 ngày đầu',
    whyItMatters: 'User thấy giá trị thực — có thứ để show cho sếp hoặc khách hàng ngay',
    howToAccelerate: 'Nút "Xuất báo cáo sếp" nổi bật ngay trên dashboard. 1 click không cần config.',
    metric: '% user export report trong 7 ngày đầu (target: >30%)',
  },
  {
    id: 'aha_warning_trigger',
    action: 'Nhận cảnh báo đầu tiên (hồ sơ thiếu / tạm ứng vượt / kho lệch)',
    timeframe: 'Trong 7 ngày đầu',
    whyItMatters: 'Lần đầu hệ thống "tự nói chuyện" với user thay vì user phải chủ động check',
    howToAccelerate: 'Hạ ngưỡng cảnh báo mặc định để user sớm thấy cảnh báo với dữ liệu mẫu. Sau đó để user tự điều chỉnh.',
    metric: '% user kích hoạt ít nhất 1 cảnh báo (target: >50%)',
  },
];

export interface ActivationMilestone {
  milestone: string;
  targetDay: number;
  description: string;
  checkCondition: string;
  nextStep: string;
  dropOffRisk: string;
}

export const ACTIVATION_MILESTONES: ActivationMilestone[] = [
  {
    milestone: 'D0 — Tạo tài khoản',
    targetDay: 0,
    description: 'User đăng ký thành công',
    checkCondition: 'account_created = true',
    nextStep: 'Email welcome + wizard tạo project đầu tiên',
    dropOffRisk: 'User không nhận email confirm / form đăng ký quá nhiều trường',
  },
  {
    milestone: 'D1 — First Project Created',
    targetDay: 1,
    description: 'Tạo ít nhất 1 công trình/dự án',
    checkCondition: 'projects.count >= 1',
    nextStep: 'Gợi ý nhập chi phí đầu tiên với template mẫu',
    dropOffRisk: 'Không biết bắt đầu từ đâu — cần wizard rõ hơn',
  },
  {
    milestone: 'D3 — Data Entered',
    targetDay: 3,
    description: 'Nhập ít nhất 5 transactions (chi phí / tạm ứng / vật tư)',
    checkCondition: 'transactions.count >= 5',
    nextStep: 'Trigger email "Dashboard của bạn đang sống" + gợi ý export báo cáo',
    dropOffRisk: 'Form nhập quá phức tạp — cần mobile-friendly và giảm trường bắt buộc',
  },
  {
    milestone: 'D7 — Aha Moment',
    targetDay: 7,
    description: 'Export báo cáo sếp hoặc nhận 1 cảnh báo tự động',
    checkCondition: 'report_exported OR alert_triggered',
    nextStep: 'Suggest upgrade hoặc invite colleague',
    dropOffRisk: 'Dashboard không đủ ấn tượng nếu dữ liệu ít — cần "wow moment" với ít data',
  },
  {
    milestone: 'D14 — Paid Conversion Window',
    targetDay: 14,
    description: 'Trial kết thúc — quyết định nâng cấp hay rời bỏ',
    checkCondition: 'subscription.status = trial_ending',
    nextStep: 'Churn prevention sequence + offer demo 1-1',
    dropOffRisk: 'Chưa thấy đủ giá trị / pricing không rõ ROI',
  },
];

export interface FreemiumTier {
  name: string;
  limits: string[];
  targetUser: string;
  upgradeHook: string;
  conversionTactic: string;
}

export const FREEMIUM_STRATEGY: FreemiumTier[] = [
  {
    name: 'Free — Dùng thử không giới hạn thời gian',
    limits: [
      '1 công trình / dự án',
      '50 transactions / tháng',
      'Dashboard cơ bản (không có cảnh báo AI)',
      'Không có export PDF',
      'Không có phân quyền team',
    ],
    targetUser: 'Kế toán cá nhân, thử sản phẩm, không có ngân sách',
    upgradeHook: 'Hiện "Bạn đã dùng 45/50 entries tháng này" khi còn 5 entries',
    conversionTactic: 'Paywall chặn ở tính năng báo cáo sếp: "Xuất báo cáo sếp — tính năng gói Team"',
  },
  {
    name: 'Trial 14 ngày — Full features',
    limits: [
      'Tất cả tính năng gói Team không giới hạn',
      'Hết 14 ngày về lại Free tier',
    ],
    targetUser: 'Lead đã qualified, có intention mua',
    upgradeHook: 'Countdown banner trong app từ D10 trở đi',
    conversionTactic: 'Email D7 offer giảm 20% nếu nâng cấp trong 48h còn lại',
  },
];

export const PLG_METRICS_TO_TRACK = [
  { metric: 'Time to First Value (TTFV)', definition: 'Thời gian từ đăng ký đến lần đầu export báo cáo sếp', target: '< 3 ngày', tool: 'Mixpanel / PostHog event tracking' },
  { metric: 'Activation Rate', definition: '% user đạt D7 Aha Moment trong 14 ngày', target: '> 35%', tool: 'Funnel analysis' },
  { metric: 'Trial-to-Paid Conversion', definition: '% trial user nâng cấp trong 30 ngày', target: '> 8%', tool: 'Stripe webhook + user table' },
  { metric: 'Product Qualified Lead (PQL)', definition: 'User đã nhập > 10 transactions và export ít nhất 1 báo cáo', target: 'Track và prioritize outreach', tool: 'Database query / webhook' },
  { metric: 'DAU/MAU Ratio', definition: 'Tỷ lệ người dùng hoạt động hằng ngày / tháng', target: '> 25% (kế toán dùng daily)', tool: 'Session analytics' },
  { metric: 'Feature Adoption Rate', definition: '% user dùng ít nhất 3 tính năng core trong 30 ngày', target: '> 50%', tool: 'Feature flag tracking' },
];

export const PLG_GROWTH_LOOPS = [
  {
    loop: 'Viral Loop — Báo cáo sếp',
    description: 'Mỗi khi kế toán xuất báo cáo và gửi cho sếp → sếp thấy "Powered by LedgerFlow" → tò mò → khả năng trở thành user mới',
    howToImplement: 'Watermark nhỏ "Báo cáo từ LedgerFlow Studio" trên PDF export (có thể tắt ở gói cao). Link QR đến landing page.',
    estimatedK: 0.3,
  },
  {
    loop: 'Community Loop — Kế toán giới thiệu kế toán',
    description: 'Kế toán dịch vụ có nhiều khách → 1 người giới thiệu có thể kéo 5–10 khách mới',
    howToImplement: 'Referral code có thể chia sẻ. Hoa hồng 20% tháng đầu. Badge "Kế toán dịch vụ Partner".',
    estimatedK: 0.5,
  },
  {
    loop: 'Content Loop — Tutorial → SEO → User mới',
    description: 'Video tutorial YouTube / bài blog → rank SEO từ khóa kế toán → organic traffic → trial sign-up',
    howToImplement: 'Mỗi tính năng mới = 1 video tutorial 5 phút. Link đến free trial ở description + pinned comment.',
    estimatedK: 0.2,
  },
];

export const AI_PLG_ANALYSIS_PROMPT = (userData: {
  daysActive: number;
  projectsCreated: number;
  transactionsEntered: number;
  reportsExported: number;
  alertsTriggered: number;
}) => `Phân tích hành vi người dùng SaaS kế toán và đưa ra next best action.\n\nDữ liệu:\n- Ngày đã dùng: ${userData.daysActive}\n- Công trình đã tạo: ${userData.projectsCreated}\n- Giao dịch đã nhập: ${userData.transactionsEntered}\n- Báo cáo đã xuất: ${userData.reportsExported}\n- Cảnh báo đã nhận: ${userData.alertsTriggered}\n\nĐánh giá:\n1. User đang ở milestone nào trong activation journey?\n2. Nguy cơ churn (thấp/trung/cao)?\n3. Next best action cho product team (in-app nudge, email, outreach)?\n4. Feature nào user chưa dùng nhưng nên khám phá?\n\nTrả lời bằng tiếng Việt, ngắn gọn theo từng điểm đánh giá.`;
}

export const AHA_MOMENTS: AhaMoment[] = [
  {
    id: 'daily-brief-action',
    name: 'Thay next action trong daily brief',
    action: 'User mo Command Center va thay lane nao can xu ly tiep theo',
    timeframe: 'Trong 3 phut dau',
    whyItMatters: 'Nguoi dung hieu LedgerFlow khong chi la dashboard, ma la he dieu hanh dua ra viec can lam.',
    accelerate: ['Dung du lieu mau ngay lan dau', 'Hien boundary note offline-first', 'Cho copy brief de dua vao team'],
    metricTarget: '>= 60% activated users mo daily brief trong ngay dau',
  },
  {
    id: 'first-workflow-saved',
    name: 'Luu workflow dau tien',
    action: 'User tao landing copy, sales message, audit checklist hoac accounting scenario dau tien',
    timeframe: 'Trong 24 gio',
    whyItMatters: 'Gia tri bat dau khi user bien template thanh artifact cua rieng ho.',
    accelerate: ['Goi y workflow theo vai tro', 'Luu localStorage tu dong', 'Nut copy/export ro rang'],
    metricTarget: '>= 35% new users luu it nhat 1 artifact',
  },
  {
    id: 'review-loop',
    name: 'Dong vong review',
    action: 'User danh dau artifact da duoc review hoac ghi next action sau review',
    timeframe: 'Trong 7 ngay',
    whyItMatters: 'LedgerFlow can tro thanh thoi quen dieu hanh, khong phai tool tao noi dung mot lan.',
    accelerate: ['Weekly review prompt', 'Checklist human approval', 'Lich su artifact gan day'],
    metricTarget: '>= 20% activated users co review loop trong tuan dau',
  },
];

export interface ActivationMilestone {
  day: 'D0' | 'D1' | 'D3' | 'D7' | 'D14';
  milestone: string;
  checkCondition: string;
  dropOffRisk: string;
  nudge: string;
}

export const ACTIVATION_MILESTONES: ActivationMilestone[] = [
  {
    day: 'D0',
    milestone: 'Mo daily brief dau tien',
    checkCondition: 'User viewed Command Center or Marketing Command Center overview',
    dropOffRisk: 'Khong hieu san pham dung de quyet dinh viec gi',
    nudge: 'Hien 3 lane mau: Product, Marketing, Finance',
  },
  {
    day: 'D1',
    milestone: 'Tao artifact dau tien',
    checkCondition: 'Saved copy, email sequence, PLG analysis, lead score, or audit note',
    dropOffRisk: 'User chi xem demo roi roi di',
    nudge: 'CTA tao artifact nho theo persona',
  },
  {
    day: 'D3',
    milestone: 'Gan artifact vao workflow',
    checkCondition: 'Artifact has nextAction, owner, or review status',
    dropOffRisk: 'Output khong thanh hanh dong',
    nudge: 'Hoi: ai duyet, khi nao dung, bang chung nao can',
  },
  {
    day: 'D7',
    milestone: 'Review ket qua tuan dau',
    checkCondition: 'User opened weekly/monthly review or copied report',
    dropOffRisk: 'Khong tao duoc thoi quen van hanh',
    nudge: 'Gui prompt review 5 phut',
  },
  {
    day: 'D14',
    milestone: 'Chon paid pilot hoac learning',
    checkCondition: 'User chooses continue, pause, or paid pilot scope',
    dropOffRisk: 'Trial keo dai khong co quyet dinh',
    nudge: 'Dung decision checklist: keep, change, stop',
  },
];

export interface PLGMetric {
  metric: string;
  definition: string;
  formula: string;
  healthySignal: string;
  actionIfWeak: string;
}

export const PLG_METRICS_TO_TRACK: PLGMetric[] = [
  {
    metric: 'Activation rate',
    definition: 'Ty le user dat aha moment dau tien',
    formula: 'activated_users / new_signups',
    healthySignal: 'User mo daily brief va tao artifact trong 24h',
    actionIfWeak: 'Rut gon onboarding, dung du lieu mau, giam so lua chon dau tien',
  },
  {
    metric: 'Artifact save rate',
    definition: 'Ty le user luu copy/email/analysis/checklist',
    formula: 'users_with_saved_artifact / activated_users',
    healthySignal: 'User bien template thanh tai san cua rieng ho',
    actionIfWeak: 'Them save button ro hon va default mau theo persona',
  },
  {
    metric: 'Review loop rate',
    definition: 'Ty le user quay lai review artifact hoac next action',
    formula: 'users_with_review_event / activated_users',
    healthySignal: 'LedgerFlow tro thanh thoi quen weekly/daily',
    actionIfWeak: 'Them reminder va report mau, khong tang feature moi voi va',
  },
  {
    metric: 'Expansion signal',
    definition: 'Ty le user them workflow thu hai hoac moi teammate',
    formula: 'users_with_second_workflow / activated_users',
    healthySignal: 'User thay du gia tri de mo rong nhung van trong scope nho',
    actionIfWeak: 'De xuat workflow lien quan, khong day rollout toan cong ty',
  },
];

export interface FreemiumStrategy {
  model: 'free_plan' | 'time_boxed_trial' | 'paid_pilot';
  bestFor: string;
  includes: string[];
  risks: string[];
  upgradeTrigger: string;
}

export const FREEMIUM_STRATEGY: FreemiumStrategy[] = [
  {
    model: 'free_plan',
    bestFor: 'Solo founder va learner can thu Company OS bang du lieu mau',
    includes: ['Static data', 'LocalStorage', 'Copy/export manual', 'Limited saved artifacts'],
    risks: ['Dung de hoc nhung khong chuyen sang workflow that', 'Kho phan biet lead co kha nang tra tien'],
    upgradeTrigger: 'Can nhieu artifact, team review, hoac backend sync',
  },
  {
    model: 'time_boxed_trial',
    bestFor: 'SME/team da co pain ro va muon demo voi quy trinh that',
    includes: ['14 ngay', 'Guided workflow', 'Review checklist', 'Success metric'],
    risks: ['Qua ngan neu data onboarding cham', 'Qua dai neu khong dat decision gate'],
    upgradeTrigger: 'Dat success metric va co decision maker review',
  },
  {
    model: 'paid_pilot',
    bestFor: 'Lead co paid signal, can setup rieng hoac workflow lien phong ban',
    includes: ['Scope nho', 'Human approval', 'Setup support', 'Pilot report'],
    risks: ['Scope creep', 'Ky vong thanh ERP day du'],
    upgradeTrigger: 'Can them lane, connector, backend sync hoac governance',
  },
];

export interface GrowthLoop {
  id: string;
  name: string;
  steps: string[];
  kFactorEstimate: string;
  leadingMetric: string;
  constraint: string;
}

export const PLG_GROWTH_LOOPS: GrowthLoop[] = [
  {
    id: 'template-share-loop',
    name: 'Template share loop',
    steps: ['User tao artifact', 'Copy/export cho teammate/khach', 'Nguoi nhan hoi template tu dau', 'Moi nguoi nhan mo demo'],
    kFactorEstimate: '0.08-0.18 early stage',
    leadingMetric: 'So artifact duoc copy/export moi tuan',
    constraint: 'Khong gan branding qua day, khong lam lo du lieu nhay cam',
  },
  {
    id: 'review-rhythm-loop',
    name: 'Weekly review loop',
    steps: ['User tao next action', 'Tuan sau review ket qua', 'Phat hien gap moi', 'Tao artifact tiep theo'],
    kFactorEstimate: 'Retention loop, khong phai viral loop',
    leadingMetric: 'Weekly review completion rate',
    constraint: 'Neu review qua nang, user se bo qua',
  },
  {
    id: 'consultant-loop',
    name: 'Consultant/service loop',
    steps: ['Ke toan/consultant dung template', 'Ap dung cho khach', 'Khach thay report', 'Khach hoi cach dung truc tiep'],
    kFactorEstimate: '0.15-0.35 neu co template tot',
    leadingMetric: 'So report/checklist duoc dung cho khach ngoai',
    constraint: 'Can disclaimer ro: mo phong/ho tro, khong thay tu van chuyen nghiep',
  },
];

export interface NorthStarMetric {
  id: string;
  label: string;
  definition: string;
  target: string;
  why: string;
}

export const NORTH_STAR_METRICS: NorthStarMetric[] = [
  {
    id: 'weekly-reviewed-artifacts',
    label: 'Reviewed artifacts per week',
    definition: 'So copy/email/report/checklist da tao va duoc nguoi dung review',
    target: '>= 3 per active workspace',
    why: 'Do gia tri that hon so lan click vi LedgerFlow can tao hanh dong co review.',
  },
  {
    id: 'decision-briefs',
    label: 'Decision briefs opened',
    definition: 'So daily/weekly brief duoc mo va co next action',
    target: '>= 2 per week',
    why: 'Company OS thanh cong khi giup ra quyet dinh nhanh hon.',
  },
  {
    id: 'pilot-conversions',
    label: 'Pilot conversion signals',
    definition: 'So user chon paid pilot, demo, hoac scope review',
    target: '10-20% activated teams',
    why: 'Cho biet marketing va product dang gap pain co gia tri tien.',
  },
];

export const AI_PLG_ANALYSIS_PROMPT = (params: {
  daysActive: number;
  projectsCreated: number;
  transactionsEntered: number;
  reportsExported: number;
  alertsTriggered: number;
}) => `Ban la PLG analyst cho LedgerFlow Studio.

Hay phan tich user behavior sau:
- Days active: ${params.daysActive}
- Workflows/projects created: ${params.projectsCreated}
- Records/transactions entered: ${params.transactionsEntered}
- Reports exported: ${params.reportsExported}
- Alerts triggered: ${params.alertsTriggered}

Context:
- LedgerFlow la Company OS / Simulation Lab offline-first.
- Khong ket luan thay nguoi duyet. Chi dua ra next best action va rui ro drop-off.
- Muc tieu la dua user den artifact duoc review, khong phai click nhieu.

Output:
ASSESSMENT: [activated / at risk / not activated]
EVIDENCE: [3 bullet dua tren so lieu]
NEXT BEST ACTION: [1 hanh dong nho]
NUDGE COPY: [1 cau ngan gui user]
DO NOT DO: [1 dieu nen tranh]`;
