export type MarketingV2RolloutStatus = 'done' | 'wired' | 'pending';

export interface MarketingV2RolloutItem {
  id: string;
  title: string;
  area: 'data' | 'component' | 'routing' | 'upgrade';
  status: MarketingV2RolloutStatus;
  filePaths: string[];
  summary: string;
  nextAction: string;
}

export const MARKETING_V2_ROLLOUT_STATUS: MarketingV2RolloutItem[] = [
  {
    id: 'data-copy-lab',
    title: 'Landing Page Copy Knowledge',
    area: 'data',
    status: 'done',
    filePaths: ['src/data/landingPageCopyKnowledge.ts'],
    summary: 'Copy formulas, hero templates, CTA variants, landing page sections and AI prompt are available as typed data.',
    nextAction: 'Keep as source of truth for LandingPageCopyLab.',
  },
  {
    id: 'data-email-sequence',
    title: 'Email Sequence Knowledge',
    area: 'data',
    status: 'done',
    filePaths: ['src/data/emailSequenceKnowledge.ts'],
    summary: 'Welcome, activation, trial nurture, churn prevention, upgrade and winback sequences are normalized in one export set.',
    nextAction: 'Use EmailSequenceBuilder as the UI surface.',
  },
  {
    id: 'data-plg',
    title: 'PLG Knowledge',
    area: 'data',
    status: 'done',
    filePaths: ['src/data/plgKnowledge.ts'],
    summary: 'Aha moments, activation milestones, freemium strategy, metrics and recommendation prompt are available.',
    nextAction: 'Use PLGConversionHub as the UI surface.',
  },
  {
    id: 'data-marketing-command',
    title: 'Marketing Command Knowledge',
    area: 'data',
    status: 'done',
    filePaths: ['src/data/marketingCommandKnowledge.ts'],
    summary: 'Channel KPIs, daily brief, scorecard and battle card briefs are available.',
    nextAction: 'Use MarketingCommandCenter as the UI surface.',
  },
  {
    id: 'component-workspace',
    title: 'Marketing Growth V2 Workspace',
    area: 'component',
    status: 'done',
    filePaths: ['src/components/MarketingGrowthV2Workspace.tsx'],
    summary: 'Workspace combines MarketingCommandCenter, LandingPageCopyLab, EmailSequenceBuilder and PLGConversionHub behind local tabs.',
    nextAction: 'Wire route /marketing_growth_v2 in App.tsx.',
  },
  {
    id: 'component-outbound-upgrade',
    title: 'Outbound Battle Cards Panel',
    area: 'upgrade',
    status: 'wired',
    filePaths: ['src/components/OutboundBattleCardsPanel.tsx', 'src/components/OutboundSalesHub.tsx'],
    summary: 'OutboundSalesHub now has a Battle cards tab backed by BATTLE_CARDS and AI_MESSAGE_VARIABLES.',
    nextAction: 'Run lint/build locally and adjust UI spacing if needed.',
  },
  {
    id: 'component-lead-upgrade',
    title: 'Lead Persona Canvas Panel',
    area: 'upgrade',
    status: 'wired',
    filePaths: ['src/components/LeadPersonaCanvasPanel.tsx', 'src/components/LeadScoringEngine.tsx'],
    summary: 'LeadScoringEngine now has a Persona/JTBD tab backed by PERSONA_CANVAS_TEMPLATE and JTBD_FRAMEWORK.',
    nextAction: 'Run lint/build locally and adjust UI spacing if needed.',
  },
  {
    id: 'app-route',
    title: 'App route for Marketing Growth V2',
    area: 'routing',
    status: 'pending',
    filePaths: ['src/App.tsx'],
    summary: 'simulationRegistry has marketing_growth_v2, but App.tsx still needs lazy import, TabType, sidebar/mobile option and render block.',
    nextAction: 'Use the Codex patch doc to wire App.tsx without rewriting the file.',
  },
];

export const MARKETING_V2_NEXT_CHECKS = [
  'npm run lint',
  'npm run check:simulations',
  'npm run build',
];
