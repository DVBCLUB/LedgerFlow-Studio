export type MarketingV2AccessOptionStatus = 'recommended' | 'optional' | 'not_recommended';

export interface MarketingV2AccessOption {
  id: string;
  title: string;
  status: MarketingV2AccessOptionStatus;
  summary: string;
  steps: string[];
  risk: string;
  owner: 'Codex' | 'Founder';
}

export const MARKETING_V2_ACCESS_OPTIONS: MarketingV2AccessOption[] = [
  {
    id: 'marketing-suite-tab',
    title: 'Gắn vào MarketingSuite thành tab V2 Growth OS',
    status: 'recommended',
    summary: 'Dùng route marketing_suite đã có sẵn, không cần sửa App.tsx hoặc main router.',
    steps: [
      'Import MarketingGrowthV2Workspace trong src/components/MarketingSuite.tsx.',
      'Mở rộng union activeSubTab thêm v2_growth_os.',
      'Thêm nút V2 Growth OS vào subnav.',
      'Render MarketingGrowthV2Workspace khi activeSubTab === v2_growth_os.',
      'Chạy npm run lint và npm run build.',
    ],
    risk: 'Thấp hơn sửa App.tsx vì không động router chính; vẫn cần Codex/local patch do file MarketingSuite dài.',
    owner: 'Codex',
  },
  {
    id: 'new-app-route',
    title: 'Tạo route riêng /marketing_growth_v2 trong App.tsx',
    status: 'optional',
    summary: 'Phù hợp khi muốn Marketing V2 là module độc lập trong sidebar/search.',
    steps: [
      'Lazy import MarketingGrowthV2Workspace trong App.tsx.',
      'Thêm marketing_growth_v2 vào TabType.',
      'Thêm mobile select option và sidebar button.',
      'Thêm render block trong Suspense.',
      'Chạy npm run check:simulations, npm run lint và npm run build.',
    ],
    risk: 'Trung bình vì App.tsx dài và là router chính; chỉ làm bằng Codex/local có lint/build ngay.',
    owner: 'Codex',
  },
  {
    id: 'rewrite-marketing-suite',
    title: 'Rewrite lại MarketingSuite từ đầu',
    status: 'not_recommended',
    summary: 'Không phù hợp với Master V2 vì dễ phá campaign builder, segment, A/B ROI và compliance hiện có.',
    steps: [
      'Không thực hiện trừ khi founder yêu cầu rebuild toàn bộ module.',
    ],
    risk: 'Cao, trái guardrail additive-only.',
    owner: 'Founder',
  },
];

export const MARKETING_V2_ACCESS_CHECKS = [
  'npm run lint',
  'npm run check:simulations',
  'npm run build',
];
