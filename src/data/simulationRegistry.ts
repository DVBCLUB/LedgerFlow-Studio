export type SimulationRegistryItem = {
  id: string;
  title: string;
  component: string;
  category: string;
  route: string;
  offlineMode: 'full' | 'partial' | 'online-required';
  notes: string;
};

export const SIMULATION_REGISTRY: SimulationRegistryItem[] = [
  { id: 'founder', title: 'Solo Founder Business', component: 'SoloFounderBusiness', category: 'Business Simulation', route: '/founder', offlineMode: 'full', notes: 'Finance and bootstrap business planning simulation.' },
  { id: 'roadmap', title: 'Web Accounting Roadmap', component: 'WebAccountingRoadmap', category: 'Learning Roadmap', route: '/roadmap', offlineMode: 'full', notes: 'Web accounting product roadmap learning module.' },
  { id: 'datascience', title: 'Data Science Engineering', component: 'DataScienceEngineering', category: 'Data Science', route: '/datascience', offlineMode: 'full', notes: 'Data science and data engineering learning lab.' },
  { id: 'prompts', title: 'Prompt Playground', component: 'PromptPlayground', category: 'AI Prompting', route: '/prompts', offlineMode: 'partial', notes: 'Prompt design works locally; AI generation requires API/internet.' },
  { id: 'assistant', title: 'Gemini Playground', component: 'GeminiPlayground', category: 'AI Playground', route: '/assistant', offlineMode: 'partial', notes: 'UI and saved prompts work offline; Gemini calls require internet.' },
  { id: 'custom_data', title: 'Custom Data Workbench', component: 'CustomDataWorkbench', category: 'Data Workbench', route: '/custom_data', offlineMode: 'full', notes: 'Ledger/data sandbox for local experiments.' },
  { id: 'architecture', title: 'AI Ecosystem Architecture', component: 'AIEcosystemArchitecture', category: 'Architecture', route: '/architecture', offlineMode: 'full', notes: 'Hybrid/cloud architecture learning diagrams.' },
  { id: 'game_ml', title: 'Game And ML Workbench', component: 'GameAndMLWorkbench', category: 'Machine Learning', route: '/game_ml', offlineMode: 'full', notes: 'Game and ML simulation workbench.' },
  { id: 'guerrilla', title: 'Guerrilla Product Hub', component: 'GuerrillaProductHub', category: 'Business Simulation', route: '/guerrilla', offlineMode: 'full', notes: 'Lean product experiment hub.' },
  { id: 'accounting_vn', title: 'Accounting Vietnam', component: 'AccountingVietnam', category: 'Accounting Vietnam', route: '/accounting_vn', offlineMode: 'full', notes: 'Vietnam accounting learning and simulation module.' },
  { id: 'strategic_labs', title: 'Strategic Labs', component: 'StrategicLabsMini', category: 'Founder Strategy', route: '/strategic_labs', offlineMode: 'full', notes: 'Persona, finance, payment, distribution and game education strategy labs.' },
  { id: 'finance_lab_mini', title: 'Finance Lab Calculator', component: 'FinanceLabMini', category: 'Founder Finance', route: '/finance_lab_mini', offlineMode: 'full', notes: 'Burn rate, runway, MRR and gross margin calculator for solo founder decisions.' },
  { id: 'distribution_lead_board', title: 'Distribution Lead Board', component: 'DistributionLeadBoard', category: 'Distribution Engine', route: '/distribution_lead_board', offlineMode: 'full', notes: 'Local lead, pain point, paid signal and next-action board for commercialization experiments.' },
  { id: 'persona_interview_lab', title: 'Persona Interview Lab', component: 'PersonaInterviewLab', category: 'Persona Research', route: '/persona_interview_lab', offlineMode: 'full', notes: 'Local persona interviews, pain scoring, paid-signal scoring and evidence tracking.' },
  { id: 'experiment_decision_log', title: 'Experiment Decision Log', component: 'ExperimentDecisionLog', category: 'Founder Decision System', route: '/experiment_decision_log', offlineMode: 'full', notes: 'Local BUILD/HOLD/KILL decision log for experiments, evidence and next actions.' },
  { id: 'experiment_dashboard', title: 'Experiment Dashboard', component: 'ExperimentDashboard', category: 'Founder Decision System', route: '/experiment_dashboard', offlineMode: 'full', notes: 'Aggregates persona interviews, distribution leads and experiment decisions into a founder validation dashboard.' },
  { id: 'ml_applied', title: 'ML Applied', component: 'MLApplied', category: 'Machine Learning', route: '/ml_applied', offlineMode: 'partial', notes: 'ML concepts offline; external AI/API features require internet.' },
  { id: 'deploy_business', title: 'Deploy Business', component: 'DeployBusiness', category: 'Go To Market', route: '/deploy_business', offlineMode: 'full', notes: 'Deployment and business launch planning.' },
  { id: 'dashboard', title: 'Command Center', component: 'CommandCenter', category: 'Command Center', route: '/dashboard', offlineMode: 'full', notes: 'Main command dashboard.' },
  { id: 'advisory', title: 'Advisory Board Report', component: 'AdvisoryBoardReport', category: 'Business Advisory', route: '/advisory', offlineMode: 'full', notes: 'Advisory report simulation.' },
  { id: 'market_survey', title: 'Market Survey Simulator', component: 'MarketSurveySimulator', category: 'Market Research', route: '/market_survey', offlineMode: 'partial', notes: 'Fallback simulation works offline; live grounded research requires internet.' },
  { id: 'seo_strategy', title: 'Google Keyword Strategy', component: 'GoogleKeywordStrategy', category: 'Marketing', route: '/seo_strategy', offlineMode: 'partial', notes: 'Strategy UI works offline; live keyword research may need internet.' },
  { id: 'audit_workspace', title: 'Internal Audit Workspace', component: 'InternalAuditWorkspace', category: 'Audit', route: '/audit_workspace', offlineMode: 'full', notes: 'Internal audit workspace and checklist simulations.' },
  { id: 'python_sandbox', title: 'Python Sandbox', component: 'PythonSandbox', category: 'Sandbox', route: '/python_sandbox', offlineMode: 'partial', notes: 'UI works offline; real execution depends on available runtime/browser logic.' },
  { id: 'marketing_suite', title: 'Marketing Suite', component: 'MarketingSuite', category: 'Marketing', route: '/marketing_suite', offlineMode: 'full', notes: 'Marketing automation planning suite.' },
  { id: 'funnel_lab', title: 'Marketing Funnel Lab', component: 'MarketingFunnelLab', category: 'Marketing', route: '/funnel_lab', offlineMode: 'full', notes: 'Funnel and CRO simulation lab.' },
  { id: 'lead_scoring', title: 'Lead Scoring Engine', component: 'LeadScoringEngine', category: 'Sales', route: '/lead_scoring', offlineMode: 'full', notes: 'Lead scoring simulation engine.' },
  { id: 'zalo_hub', title: 'Zalo Marketing Hub', component: 'ZaloMarketingHub', category: 'Marketing Vietnam', route: '/zalo_hub', offlineMode: 'full', notes: 'Zalo marketing planning module.' },
  { id: 'ltv_dashboard', title: 'Customer LTV Dashboard', component: 'CustomerLTVDashboard', category: 'Analytics', route: '/ltv_dashboard', offlineMode: 'full', notes: 'Customer LTV and churn dashboard.' },
  { id: 'pricing_lab', title: 'Pricing Strategy Lab', component: 'PricingStrategyLab', category: 'Pricing', route: '/pricing_lab', offlineMode: 'full', notes: 'Pricing and sensitivity simulation lab.' },
  { id: 'nps_manager', title: 'NPS Review Manager', component: 'NPSReviewManager', category: 'Customer Success', route: '/nps_manager', offlineMode: 'full', notes: 'NPS and review intelligence manager.' },
  { id: 'affiliate_hub', title: 'Affiliate Referral Hub', component: 'AffiliateReferralHub', category: 'Growth', route: '/affiliate_hub', offlineMode: 'full', notes: 'Affiliate and referral growth simulation.' },
  { id: 'outbound_hub', title: 'Outbound Sales Hub', component: 'OutboundSalesHub', category: 'Sales', route: '/outbound_hub', offlineMode: 'partial', notes: 'Outbound planning works offline; email/external outreach requires internet.' },
  { id: 'advanced_ai', title: 'Advanced AI Engine', component: 'AdvancedAIEngine', category: 'AI Engine', route: '/advanced_ai', offlineMode: 'partial', notes: 'Advanced AI workspace UI works offline; live AI generation requires internet.' }
];

export const SIMULATION_COMPONENTS = SIMULATION_REGISTRY.map((item) => item.component);
