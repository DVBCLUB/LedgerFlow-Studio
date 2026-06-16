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
    id: 'aha_daily_brief',
    action: 'Mở Command Center và thấy 3 việc cần quyết định tiếp theo',
    timeframe: 'Trong 3 phút đầu',
    whyItMatters: 'Người dùng hiểu LedgerFlow không chỉ là dashboard, mà là hệ điều hành giúp quyết định việc cần làm.',
    howToAccelerate: 'Dùng dữ liệu mẫu ngay lần đầu, hiển thị boundary note offline-first, cho copy daily brief để đưa vào team.',
    metric: '>= 60% activated users mở daily brief trong ngày đầu',
  },
  {
    id: 'aha_first_artifact',
    action: 'Tạo artifact đầu tiên: landing copy, email sequence, audit checklist hoặc accounting scenario',
    timeframe: 'Trong 24 giờ',
    whyItMatters: 'Giá trị bắt đầu khi user biến template thành tài sản riêng, không chỉ xem demo.',
    howToAccelerate: 'Gợi ý workflow theo vai trò, tự lưu localStorage, nút copy/export rõ.',
    metric: '>= 35% new users lưu ít nhất 1 artifact',
  },
  {
    id: 'aha_review_loop',
    action: 'Đánh dấu artifact đã được review hoặc ghi next action sau review',
    timeframe: 'Trong 7 ngày đầu',
    whyItMatters: 'LedgerFlow cần trở thành thói quen điều hành, không phải tool tạo nội dung một lần.',
    howToAccelerate: 'Weekly review prompt, checklist human approval, lịch sử artifact gần đây.',
    metric: '>= 20% activated users có review loop trong tuần đầu',
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
    milestone: 'D0 — First brief viewed',
    targetDay: 0,
    description: 'User mở Command Center hoặc Marketing Command Center và thấy brief mẫu.',
    checkCondition: 'viewed_command_center = true',
    nextStep: 'Gợi ý tạo artifact nhỏ theo persona: copy, email, checklist, lead score.',
    dropOffRisk: 'Không hiểu sản phẩm dùng để quyết định việc gì.',
  },
  {
    milestone: 'D1 — First artifact created',
    targetDay: 1,
    description: 'User tạo hoặc copy ít nhất 1 artifact từ module marketing/accounting/audit.',
    checkCondition: 'artifacts.count >= 1',
    nextStep: 'Hiển thị CTA review artifact và lưu next action.',
    dropOffRisk: 'User chỉ xem demo rồi rời đi.',
  },
  {
    milestone: 'D3 — Workflow repeated',
    targetDay: 3,
    description: 'User quay lại và dùng lại workflow hoặc tạo artifact thứ hai.',
    checkCondition: 'return_session AND artifacts.count >= 2',
    nextStep: 'Suggest template library, export, hoặc email follow-up.',
    dropOffRisk: 'Không có lý do quay lại vì chưa gắn workflow vào công việc thật.',
  },
  {
    milestone: 'D7 — Review loop closed',
    targetDay: 7,
    description: 'User review artifact/daily brief và cập nhật next action.',
    checkCondition: 'review_completed = true',
    nextStep: 'Suggest upgrade/pilot scope hoặc invite teammate.',
    dropOffRisk: 'Tool hữu ích một lần nhưng không thành operating rhythm.',
  },
  {
    milestone: 'D14 — Paid pilot signal',
    targetDay: 14,
    description: 'User hỏi giá, scope pilot, dữ liệu mẫu, demo hoặc quyết định triển khai nhỏ.',
    checkCondition: 'paid_signal = true',
    nextStep: 'Offer pilot nhỏ: 1 lane, 1 metric, 1 review meeting.',
    dropOffRisk: 'Không thấy ROI đủ rõ hoặc pricing chưa gắn vào kết quả.',
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
    name: 'Free — Simulation workspace',
    limits: [
      'Dùng data mẫu/offline-first',
      'Tạo tối đa 5 artifacts/tháng',
      'Không có team approval workflow',
      'Không có export PDF branded',
      'Không có sync Supabase nâng cao',
    ],
    targetUser: 'Founder/kế toán/marketer đang khám phá workflow và template.',
    upgradeHook: 'Hiện “Bạn đã dùng 4/5 artifact tháng này” khi còn 1 artifact.',
    conversionTactic: 'Paywall nhẹ ở export/approval/team workflow, không chặn xem demo.',
  },
  {
    name: 'Trial 14 ngày — Full local features',
    limits: [
      'Mở toàn bộ marketing/accounting/audit/deep-dive panels',
      'Hết 14 ngày quay về Free tier nếu chưa nâng cấp',
      'Không yêu cầu thẻ tín dụng ở giai đoạn demo',
    ],
    targetUser: 'Lead đã qualified, có pain rõ và muốn thử workflow thật.',
    upgradeHook: 'Countdown banner từ D10, kèm checklist ROI đã dùng trong trial.',
    conversionTactic: 'Offer pilot scope nhỏ 1 lane nếu user đã tạo >= 3 artifacts.',
  },
];

export interface PLGMetric {
  metric: string;
  definition: string;
  target: string;
  tool: string;
}

export const PLG_METRICS_TO_TRACK: PLGMetric[] = [
  { metric: 'Time to First Value', definition: 'Thời gian từ mở app đến artifact đầu tiên được copy/export.', target: '< 15 phút', tool: 'Local event log trước, analytics backend sau' },
  { metric: 'Activation Rate', definition: '% user đạt D7 review loop trong 14 ngày.', target: '> 35%', tool: 'Funnel analysis' },
  { metric: 'Artifact Creation Rate', definition: 'Số copy/email/checklist/brief được tạo trên mỗi active user.', target: '>= 2 artifacts/user/week', tool: 'LocalStorage/Supabase event table' },
  { metric: 'Product Qualified Lead', definition: 'User đã tạo >= 3 artifacts và quay lại trong 7 ngày.', target: 'Track monthly', tool: 'Database query / CRM tag' },
  { metric: 'Trial-to-Paid Signal', definition: '% trial user hỏi giá, scope pilot hoặc demo triển khai.', target: '> 8%', tool: 'CRM + founder notes' },
  { metric: 'Review Loop Completion', definition: '% artifacts có trạng thái reviewed hoặc next action.', target: '> 25%', tool: 'Approval/review workflow' },
];

export interface PLGGrowthLoop {
  loop: string;
  description: string;
  howToImplement: string;
  estimatedK: number;
}

export const PLG_GROWTH_LOOPS: PLGGrowthLoop[] = [
  {
    loop: 'Artifact sharing loop',
    description: 'User copy/export báo cáo, email, checklist hoặc landing block và chia sẻ cho team/sếp/khách.',
    howToImplement: 'Watermark nhẹ “Made with LedgerFlow” trên bản Free, có thể tắt ở gói cao.',
    estimatedK: 0.25,
  },
  {
    loop: 'Community learning loop',
    description: 'Founder/kế toán chia sẻ checklist/case ẩn danh trong cộng đồng → kéo traffic về template.',
    howToImplement: 'Mỗi module có một artifact public-safe để chia sẻ.',
    estimatedK: 0.35,
  },
  {
    loop: 'Partner/referral loop',
    description: 'Kế toán dịch vụ/consultant dùng template cho khách và giới thiệu LedgerFlow.',
    howToImplement: 'Referral brief 1 trang và partner code sau khi paid pilot ổn.',
    estimatedK: 0.45,
  },
];

export const PLG_RECOMMENDATION_PROMPT = (userState: string) => `Bạn là Product-Led Growth strategist cho LedgerFlow Studio.

Bối cảnh user hiện tại:
${userState}

Hãy đánh giá:
1. User đang ở milestone nào trong activation journey?
2. Nguy cơ churn thấp/trung/cao?
3. Next-best-action nên là in-app nudge, email, outreach hay product change?
4. Artifact hoặc feature nào nên gợi ý tiếp?
5. Cần người thật duyệt điểm nào trước khi tự động hóa?

Trả lời bằng tiếng Việt, ngắn gọn, không dùng lời hứa quá mức.`;

export const AI_PLG_ANALYSIS_PROMPT = (userData: {
  daysActive: number;
  projectsCreated: number;
  transactionsEntered: number;
  reportsExported: number;
  alertsTriggered: number;
}) => PLG_RECOMMENDATION_PROMPT(`
- Ngày đã dùng: ${userData.daysActive}
- Dự án/công trình đã tạo: ${userData.projectsCreated}
- Giao dịch/artifacts đã nhập/tạo: ${userData.transactionsEntered}
- Báo cáo đã xuất: ${userData.reportsExported}
- Cảnh báo/brief đã nhận: ${userData.alertsTriggered}
`);
