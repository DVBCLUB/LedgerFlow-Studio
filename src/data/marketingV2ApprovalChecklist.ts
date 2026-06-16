export type MarketingV2ApprovalStatus = 'open' | 'ready' | 'done';

export interface MarketingV2ApprovalChecklistItem {
  id: string;
  title: string;
  area: 'copy' | 'email' | 'plg' | 'dashboard' | 'sales' | 'qa';
  status: MarketingV2ApprovalStatus;
  owner: 'Founder' | 'Codex' | 'ChatGPT';
  checkPoints: string[];
  nextAction: string;
}

export const MARKETING_V2_APPROVAL_CHECKLIST: MarketingV2ApprovalChecklistItem[] = [
  {
    id: 'approve-landing-copy',
    title: 'Duyệt landing page copy trước khi public',
    area: 'copy',
    status: 'open',
    owner: 'Founder',
    checkPoints: [
      'Headline nêu đúng pain point của SME Việt Nam.',
      'Không dùng claim kiểu tốt nhất hoặc số một nếu chưa có bằng chứng.',
      'CTA rõ ràng và không gây hiểu nhầm về giá hoặc cam kết.',
    ],
    nextAction: 'Mở Landing Copy tab, tạo bản nháp, rồi founder duyệt nội dung cuối.',
  },
  {
    id: 'approve-email-flow',
    title: 'Duyệt email sequence trước khi gửi thật',
    area: 'email',
    status: 'open',
    owner: 'Founder',
    checkPoints: [
      'Subject không quá giật tít.',
      'Email có một CTA chính.',
      'Nội dung phù hợp người nhận và không spam.',
    ],
    nextAction: 'Tạo draft trong Email Sequence Builder, copy sang công cụ gửi mail sau khi duyệt.',
  },
  {
    id: 'approve-plg-playbook',
    title: 'Duyệt PLG activation playbook',
    area: 'plg',
    status: 'ready',
    owner: 'Founder',
    checkPoints: [
      'Aha moment có thể đo được.',
      'Milestone D0-D14 rõ ràng.',
      'Không cần backend mới để demo nội bộ.',
    ],
    nextAction: 'Dùng PLG Hub để chọn 1 Aha Moment ưu tiên cho bản demo.',
  },
  {
    id: 'approve-marketing-dashboard',
    title: 'Duyệt dashboard marketing tổng hợp',
    area: 'dashboard',
    status: 'ready',
    owner: 'ChatGPT',
    checkPoints: [
      'Card KPI tách rõ dữ liệu mô phỏng và dữ liệu thật.',
      'AI brief không tự bịa số liệu.',
      'Có fallback offline nếu AI Gateway lỗi.',
    ],
    nextAction: 'Chạy npm run build sau khi nối Marketing V2 vào UI chính.',
  },
  {
    id: 'approve-main-ui-access',
    title: 'Nối Marketing V2 vào UI chính',
    area: 'qa',
    status: 'open',
    owner: 'Codex',
    checkPoints: [
      'Không rewrite App.tsx.',
      'Ưu tiên nối vào MarketingSuite bằng tab V2 Growth OS.',
      'Chạy lint và build sau khi nối.',
    ],
    nextAction: 'Áp dụng docs/CODEX_PATCH_MARKETING_SUITE_V2_TAB.md.',
  },
];
