export type MarketingV2QaStatus = 'manual' | 'lint' | 'build' | 'simulation-check';

export interface MarketingV2QaItem {
  id: string;
  area: string;
  status: MarketingV2QaStatus;
  check: string;
  expected: string;
}

export const MARKETING_V2_QA_CHECKLIST: MarketingV2QaItem[] = [
  {
    id: 'qa-marketing-route-visible',
    area: 'MarketingSuite / V2 Growth OS',
    status: 'manual',
    check: 'Open the existing marketing_suite route and click the V2 Growth OS tab.',
    expected: 'MarketingGrowthV2Workspace renders without blank screen and shows Command Center, Landing Copy, Email Sequence, PLG Hub, and Rollout Status tabs.',
  },
  {
    id: 'qa-landing-copy',
    area: 'LandingPageCopyLab',
    status: 'manual',
    check: 'Open the Landing Copy tab and switch between formula, hero template, CTA, and AI prompt sections.',
    expected: 'All knowledge cards render from landingPageCopyKnowledge.ts and no frontend API key is required.',
  },
  {
    id: 'qa-email-sequence',
    area: 'EmailSequenceBuilder',
    status: 'manual',
    check: 'Select at least two sequence types and generate/copy the prompt preview.',
    expected: 'Sequence timeline, metrics benchmarks, and AI email prompt preview render from emailSequenceKnowledge.ts.',
  },
  {
    id: 'qa-plg-hub',
    area: 'PLGConversionHub',
    status: 'manual',
    check: 'Review Aha Moments, Activation Milestones, Freemium strategy, PLG metrics, and recommendation prompt.',
    expected: 'All PLG sections render from plgKnowledge.ts with no external dependency.',
  },
  {
    id: 'qa-marketing-command',
    area: 'MarketingCommandCenter',
    status: 'manual',
    check: 'Review scorecard, channel KPIs, daily brief, and battle card briefs.',
    expected: 'Dashboard renders from marketingCommandKnowledge.ts and stays offline-first.',
  },
  {
    id: 'qa-outbound-battle-cards',
    area: 'OutboundSalesHub',
    status: 'manual',
    check: 'Open outbound_hub and click Battle cards.',
    expected: 'Battle cards and AI message variables render via OutboundBattleCardsPanel.',
  },
  {
    id: 'qa-lead-persona',
    area: 'LeadScoringEngine',
    status: 'manual',
    check: 'Open lead_scoring and click Persona/JTBD.',
    expected: 'Persona canvas, JTBD framework, and qualification prompt render via LeadPersonaCanvasPanel.',
  },
  {
    id: 'qa-typescript',
    area: 'Repository checks',
    status: 'lint',
    check: 'Run npm run lint.',
    expected: 'TypeScript and lint checks pass without missing exports or implicit any errors.',
  },
  {
    id: 'qa-simulations',
    area: 'Simulation registry',
    status: 'simulation-check',
    check: 'Run npm run check:simulations.',
    expected: 'Registry recognizes marketing_growth_v2 and all existing modules remain registered.',
  },
  {
    id: 'qa-build',
    area: 'Production build',
    status: 'build',
    check: 'Run npm run build.',
    expected: 'Vite production build completes successfully.',
  },
];
