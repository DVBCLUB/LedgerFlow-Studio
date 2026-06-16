export type MarketingV2LaunchStage = 'setup' | 'activate' | 'convert' | 'retain';

export interface MarketingV2LaunchStep {
  id: string;
  stage: MarketingV2LaunchStage;
  title: string;
  owner: string;
  goal: string;
  actions: string[];
  evidence: string[];
  relatedModule: string;
}

export const MARKETING_V2_LAUNCH_PLAYBOOK: MarketingV2LaunchStep[] = [
  {
    id: 'setup-growth-os-route',
    stage: 'setup',
    title: 'Nối Marketing V2 vào MarketingSuite',
    owner: 'Lead Engineer / Codex',
    goal: 'Người dùng mở được V2 Growth OS từ route marketing_suite hiện có mà không cần sửa App.tsx.',
    actions: [
      'Import MarketingGrowthV2Workspace vào MarketingSuite.tsx.',
      'Thêm tab V2 Growth OS vào subnav hiện có.',
      'Render MarketingGrowthV2Workspace khi tab mới được chọn.',
    ],
    evidence: [
      'Tab V2 Growth OS xuất hiện trong MarketingSuite.',
      'Các tab Command, Landing, Email, PLG, Rollout và QA trong workspace hoạt động.',
      'npm run lint và npm run build không lỗi.',
    ],
    relatedModule: 'MarketingGrowthV2Workspace',
  },
  {
    id: 'activate-landing-copy',
    stage: 'activate',
    title: 'Tạo bộ landing copy đầu tiên',
    owner: 'Growth Marketer Agent',
    goal: 'Có bản copy landing page dùng được cho kế toán xây dựng và solo founder Việt Nam.',
    actions: [
      'Chọn persona kế toán dự án xây dựng.',
      'Chọn công thức PAS hoặc AIDA trong LandingPageCopyLab.',
      'Xuất 3 biến thể headline, subheadline và CTA.',
    ],
    evidence: [
      'Ít nhất 3 variant copy đã được lưu để test.',
      'Không có claim số 1/tốt nhất nếu chưa có bằng chứng.',
      'CTA có risk reversal rõ: demo, trial hoặc checklist miễn phí.',
    ],
    relatedModule: 'LandingPageCopyLab',
  },
  {
    id: 'convert-email-sequence',
    stage: 'convert',
    title: 'Kích hoạt email sequence trial → paid',
    owner: 'Growth Marketer Agent',
    goal: 'Có sequence onboarding/activation để tăng tỷ lệ user thấy giá trị trong 7 ngày đầu.',
    actions: [
      'Chọn Welcome hoặc Activation sequence.',
      'Điều chỉnh persona và tone founder-personal.',
      'Kiểm tra CTA từng email có gắn với hành động trong app.',
    ],
    evidence: [
      'Sequence có subject, preheader, goal, CTA và avoidIf.',
      'Không spam user đã hoàn thành hành động tương ứng.',
      'Mỗi email có một mục tiêu duy nhất.',
    ],
    relatedModule: 'EmailSequenceBuilder',
  },
  {
    id: 'retain-plg-loop',
    stage: 'retain',
    title: 'Theo dõi Aha Moment và retention loop',
    owner: 'Product Owner / Chief of Staff Agent',
    goal: 'Biết user có đạt first value hay chưa trước khi đầu tư backend event tracking.',
    actions: [
      'Review Aha moments trong PLGConversionHub.',
      'Chọn 3 event quan trọng nhất để theo dõi thủ công trước.',
      'Đưa các event đó vào roadmap Supabase/PostHog sau P0.',
    ],
    evidence: [
      'Danh sách event activation được thống nhất.',
      'Không thêm tracking SDK mới khi chưa cần.',
      'Daily Brief có next action rõ cho activation và retention.',
    ],
    relatedModule: 'PLGConversionHub',
  },
];

export const MARKETING_V2_LAUNCH_CHECKS = [
  'MarketingSuite mở được V2 Growth OS hoặc MarketingGrowthV2Workspace mở được qua route riêng.',
  'LandingPageCopyLab không gọi AI trực tiếp từ browser nếu chưa qua /api/ai/chat.',
  'EmailSequenceBuilder render đủ welcome, activation, trial, upgrade, churn, winback nếu data có.',
  'PLGConversionHub hiển thị Aha Moments, Activation Milestones, Freemium Strategy và metrics.',
  'MarketingCommandCenter hiển thị KPI, scorecard, daily brief và battle card briefs.',
  'OutboundSalesHub có tab Battle cards.',
  'LeadScoringEngine có tab Persona/JTBD.',
];
