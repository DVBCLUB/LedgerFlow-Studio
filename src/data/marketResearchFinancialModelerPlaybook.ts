export type MarketResearcherWorkflow = {
  id: string;
  title: string;
  objective: string;
  inputs: string[];
  method: string[];
  output: string;
  approvalGate: string;
};

export type FinancialModelerScenario = {
  id: string;
  title: string;
  driver: string;
  baseCase: string;
  stressCase: string;
  decisionRule: string;
  evidenceNeeded: string[];
};

export const MARKET_RESEARCHER_OFFLINE_WORKFLOWS: MarketResearcherWorkflow[] = [
  {
    id: 'researcher-icp-evidence',
    title: 'ICP evidence pass',
    objective: 'Turn raw interviews into a ranked ICP without claiming market certainty.',
    inputs: ['5-10 interview notes', 'Customer pain quotes', 'Current workaround', 'Buying trigger'],
    method: [
      'Tag each note by persona, pain, urgency and existing workaround.',
      'Score pain frequency, willingness to pay and access to buyer.',
      'Separate direct quotes from founder interpretation.',
      'List the weakest evidence before recommending the next test.'
    ],
    output: 'ICP shortlist with evidence table, unanswered questions and next interview targets.',
    approvalGate: 'Founder reviews before publishing claims, pricing pages or sales promises.'
  },
  {
    id: 'researcher-competitor-map',
    title: 'Competitor gap map',
    objective: 'Compare alternatives using observable product/workflow gaps only.',
    inputs: ['Competitor notes', 'Public pricing', 'Feature screenshots', 'Customer objections'],
    method: [
      'Map each competitor to workflow coverage, price friction and switching barrier.',
      'Avoid scraped/private data; use founder-provided notes or public observations.',
      'Mark every gap as confirmed, likely or assumption.',
      'Convert gaps into demo hypotheses instead of final positioning.'
    ],
    output: 'Gap matrix plus 3 demo hypotheses to test in calls.',
    approvalGate: 'Founder verifies public facts before using competitor comparison externally.'
  },
  {
    id: 'researcher-offer-test',
    title: 'Offer test memo',
    objective: 'Prepare one narrow offer test before building a larger module.',
    inputs: ['Target persona', 'Pain statement', 'Demo capability', 'Expected metric'],
    method: [
      'Write one promise, one proof point and one call to action.',
      'Define the smallest manual concierge test.',
      'Set stop/continue thresholds before posting or calling.',
      'Capture learnings back into Feedback Loop and Knowledge Base.'
    ],
    output: 'Offer test memo with message, channel, metric, stop rule and follow-up script.',
    approvalGate: 'Founder approves offer before external outreach.'
  }
];

export const FINANCIAL_MODELER_SCENARIOS: FinancialModelerScenario[] = [
  {
    id: 'modeler-revenue-runway',
    title: 'Revenue and runway model',
    driver: 'MRR, churn, gross margin, monthly fixed cost and cash on hand.',
    baseCase: 'Use current conversion and churn assumptions; show runway in months.',
    stressCase: 'Raise churn by 50 percent, delay new revenue by 2 months, add one unexpected cost.',
    decisionRule: 'If stress runway is under 6 months, freeze P2 spend and focus on paid pilots.',
    evidenceNeeded: ['Actual monthly revenue', 'Paid pilot pipeline', 'Monthly fixed cost', 'Cash buffer']
  },
  {
    id: 'modeler-channel-payback',
    title: 'Channel payback model',
    driver: 'CAC, activation rate, ARPU, churn and sales cycle days.',
    baseCase: 'Estimate payback with current content, sales call or referral channel.',
    stressCase: 'Double CAC and cut activation rate by 30 percent.',
    decisionRule: 'Only scale a channel when payback stays below 6 months in stress case.',
    evidenceNeeded: ['Lead source log', 'Demo-to-paid conversion', 'Average first invoice', 'Churn signal']
  },
  {
    id: 'modeler-feature-investment',
    title: 'Feature investment model',
    driver: 'Build days, expected paid users, price uplift and support burden.',
    baseCase: 'Calculate payback for one feature or template, not the whole platform.',
    stressCase: 'Increase build effort by 40 percent and halve expected paid adoption.',
    decisionRule: 'Build only if the feature protects revenue, unlocks paid pilots or removes a P0 blocker.',
    evidenceNeeded: ['User requests', 'Committed pilot value', 'Engineering estimate', 'Support risk']
  }
];
