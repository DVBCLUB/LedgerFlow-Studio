export type MarketingV2ExecutionStatus = 'done' | 'wired' | 'pending' | 'blocked';

export interface MarketingV2ExecutionItem {
  id: string;
  area: 'new_module' | 'existing_upgrade' | 'routing' | 'qa' | 'growth_ops';
  title: string;
  status: MarketingV2ExecutionStatus;
  relatedFiles: string[];
  whyItMatters: string;
  nextAction: string;
  owner: 'ChatGPT' | 'Codex' | 'Founder';
}

export const MARKETING_V2_EXECUTION_BOARD: MarketingV2ExecutionItem[] = [
  {
    id: 'landing-copy-lab',
    area: 'new_module',
    title: 'Landing Page Copy Lab',
    status: 'done',
    relatedFiles: ['src/components/LandingPageCopyLab.tsx', 'src/data/landingPageCopyKnowledge.ts'],
    whyItMatters: 'Giải quyết gap lớn nhất: chưa có công cụ viết copy landing page cho thị trường Việt Nam.',
    nextAction: 'Mở trong Marketing Growth V2 Workspace và test các công thức PAS/FAB/AIDA.',
    owner: 'Founder',
  },
  {
    id: 'email-sequence-builder',
    area: 'new_module',
    title: 'Email Sequence Builder',
    status: 'done',
    relatedFiles: ['src/components/EmailSequenceBuilder.tsx', 'src/data/emailSequenceKnowledge.ts'],
    whyItMatters: 'Biến marketing từ single campaign sang drip sequence có logic activation, trial, winback.',
    nextAction: 'Test welcome sequence và activation sequence bằng dữ liệu persona kế toán xây dựng.',
    owner: 'Founder',
  },
  {
    id: 'plg-conversion-hub',
    area: 'new_module',
    title: 'PLG Conversion Hub',
    status: 'done',
    relatedFiles: ['src/components/PLGConversionHub.tsx', 'src/data/plgKnowledge.ts'],
    whyItMatters: 'Bổ sung Product-Led Growth: aha moment, activation milestones, freemium limits, conversion hooks.',
    nextAction: 'Chọn 1 aha moment chính để đưa lên CommandCenter hoặc onboarding sau này.',
    owner: 'Founder',
  },
  {
    id: 'marketing-command-center',
    area: 'new_module',
    title: 'Marketing Command Center',
    status: 'done',
    relatedFiles: ['src/components/MarketingCommandCenter.tsx', 'src/data/marketingCommandKnowledge.ts'],
    whyItMatters: 'Tổng hợp KPI kênh, daily brief, battle card briefs và scorecard marketing.',
    nextAction: 'Sau khi có dữ liệu thật, thay seed bằng localStorage hoặc Supabase read-only.',
    owner: 'Codex',
  },
  {
    id: 'outbound-battle-cards',
    area: 'existing_upgrade',
    title: 'Outbound Battle Cards',
    status: 'wired',
    relatedFiles: ['src/components/OutboundSalesHub.tsx', 'src/components/OutboundBattleCardsPanel.tsx', 'src/data/outboundSalesKnowledge.ts'],
    whyItMatters: 'Biến dữ liệu đối thủ thành action card dùng được cho outbound sales.',
    nextAction: 'Mở OutboundSalesHub và kiểm tra tab Battle cards.',
    owner: 'Founder',
  },
  {
    id: 'lead-persona-jtbd',
    area: 'existing_upgrade',
    title: 'Lead Persona Canvas / JTBD',
    status: 'wired',
    relatedFiles: ['src/components/LeadScoringEngine.tsx', 'src/components/LeadPersonaCanvasPanel.tsx', 'src/data/leadScoringKnowledge.ts'],
    whyItMatters: 'Bổ sung qualification theo persona, job-to-be-done và buying trigger.',
    nextAction: 'Mở LeadScoringEngine và kiểm tra tab Persona/JTBD.',
    owner: 'Founder',
  },
  {
    id: 'marketing-growth-v2-workspace',
    area: 'routing',
    title: 'Marketing Growth V2 Workspace access',
    status: 'pending',
    relatedFiles: ['src/components/MarketingGrowthV2Workspace.tsx', 'docs/CODEX_PATCH_MARKETING_SUITE_V2_TAB.md'],
    whyItMatters: 'Workspace tổng hợp đã có nhưng cần nối vào MarketingSuite hoặc App route để người dùng bấm được.',
    nextAction: 'Codex mở docs/CODEX_PATCH_MARKETING_SUITE_V2_TAB.md và thêm tab V2 Growth OS vào MarketingSuite.tsx.',
    owner: 'Codex',
  },
  {
    id: 'qa-console',
    area: 'qa',
    title: 'Marketing V2 QA Console',
    status: 'done',
    relatedFiles: ['src/components/MarketingV2QAConsole.tsx', 'src/data/marketingV2QaChecklist.ts'],
    whyItMatters: 'Founder không cần nhớ test gì; checklist trong app chỉ rõ màn hình và lệnh phải chạy.',
    nextAction: 'Sau khi nối UI, chạy checklist theo thứ tự trong QA Console.',
    owner: 'Founder',
  },
  {
    id: 'launch-playbook',
    area: 'growth_ops',
    title: 'Marketing V2 Launch Playbook',
    status: 'done',
    relatedFiles: ['src/components/MarketingV2LaunchPlaybookPanel.tsx', 'src/data/marketingV2LaunchPlaybook.ts'],
    whyItMatters: 'Chuyển spec code thành quy trình go-to-market: setup, activate, convert, retain.',
    nextAction: 'Founder dùng Launch Playbook để chạy pilot marketing đầu tiên.',
    owner: 'Founder',
  },
];

export const MARKETING_V2_EXECUTION_SUMMARY = {
  total: MARKETING_V2_EXECUTION_BOARD.length,
  done: MARKETING_V2_EXECUTION_BOARD.filter((item) => item.status === 'done').length,
  wired: MARKETING_V2_EXECUTION_BOARD.filter((item) => item.status === 'wired').length,
  pending: MARKETING_V2_EXECUTION_BOARD.filter((item) => item.status === 'pending').length,
  blocked: MARKETING_V2_EXECUTION_BOARD.filter((item) => item.status === 'blocked').length,
};
