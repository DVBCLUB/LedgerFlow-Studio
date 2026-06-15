import React from 'react';

export type ModuleId =
  | 'command-center'
  | 'product-studio'
  | 'marketing-growth'
  | 'sales-crm'
  | 'finance-accounting'
  | 'projects-delivery'
  | 'ai-workforce'
  | 'documents-approval'
  | 'analytics-sandbox'
  | 'integration-hub'
  | 'system-settings'
  | 'industry-templates';

export type ModuleGroup = 'Operate' | 'Build' | 'Sell' | 'Control' | 'Extend';
export type ModuleStatus = 'core' | 'next' | 'template';

export type AppModuleComponent = React.LazyExoticComponent<React.ComponentType>;

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  labelVi: string;
  icon: string;
  group: ModuleGroup;
  status: ModuleStatus;
  roleAccess: string[];
  hashRoute: string;
  component: AppModuleComponent;
  badge?: string;
  tags?: string[];
}

export interface LegacyRouteDefinition {
  id: string;
  label: string;
  hashRoute: string;
  component: AppModuleComponent;
}

const CommandCenter = React.lazy(() => import('../components/CommandCenter'));
const ProductStudioHub = React.lazy(() => import('../components/product-studio/ProductStudioHub'));
const MarketingGrowthHub = React.lazy(() => import('../components/marketing-growth/MarketingGrowthHub'));
const AnalyticsSandboxHub = React.lazy(() => import('../components/analytics-sandbox/AnalyticsSandboxHub'));
const GuerrillaProductHub = React.lazy(() => import('../components/GuerrillaProductHub'));
const MarketingSuite = React.lazy(() => import('../components/MarketingSuite'));
const OutboundSalesHub = React.lazy(() => import('../components/OutboundSalesHub'));
const AccountingVietnam = React.lazy(() => import('../components/AccountingVietnam'));
const ProjectsDeliveryCoreTab = React.lazy(() => import('../components/agent-ops/tabs/ProjectsDeliveryCoreTab'));
const AgentOpsHub = React.lazy(() => import('../components/agent-ops/AgentOpsHub'));
const DocumentsApprovalTab = React.lazy(() => import('../components/agent-ops/tabs/DocumentsApprovalTab'));
const GameAndMLWorkbench = React.lazy(() => import('../components/GameAndMLWorkbench'));
const IntegrationHub = React.lazy(() => import('../components/IntegrationHub'));
const AISettingsManager = React.lazy(() => import('../components/AISettingsManager'));
const MultiIndustryCaseBank = React.lazy(() => import('../components/MultiIndustryCaseBank'));

const SoloFounderBusiness = React.lazy(() => import('../components/SoloFounderBusiness'));
const WebAccountingRoadmap = React.lazy(() => import('../components/WebAccountingRoadmap'));
const DataScienceEngineering = React.lazy(() => import('../components/DataScienceEngineering'));
const PromptPlayground = React.lazy(() => import('../components/PromptPlayground'));
const GeminiPlayground = React.lazy(() => import('../components/GeminiPlayground'));
const CustomDataWorkbench = React.lazy(() => import('../components/CustomDataWorkbench'));
const AIEcosystemArchitecture = React.lazy(() => import('../components/AIEcosystemArchitecture'));
const MLApplied = React.lazy(() => import('../components/MLApplied'));
const DeployBusiness = React.lazy(() => import('../components/DeployBusiness'));
const AdvisoryBoardReport = React.lazy(() => import('../components/AdvisoryBoardReport'));
const MarketSurveySimulator = React.lazy(() => import('../components/MarketSurveySimulator'));
const GoogleKeywordStrategy = React.lazy(() => import('../components/GoogleKeywordStrategy'));
const InternalAuditWorkspace = React.lazy(() => import('../components/InternalAuditWorkspace'));
const PythonSandbox = React.lazy(() => import('../components/PythonSandbox'));
const MarketingFunnelLab = React.lazy(() => import('../components/MarketingFunnelLab'));
const LeadScoringEngine = React.lazy(() => import('../components/LeadScoringEngine'));
const ZaloMarketingHub = React.lazy(() => import('../components/ZaloMarketingHub'));
const CustomerLTVDashboard = React.lazy(() => import('../components/CustomerLTVDashboard'));
const PricingStrategyLab = React.lazy(() => import('../components/PricingStrategyLab'));
const NPSReviewManager = React.lazy(() => import('../components/NPSReviewManager'));
const AffiliateReferralHub = React.lazy(() => import('../components/AffiliateReferralHub'));
const AdvancedAIEngine = React.lazy(() => import('../components/AdvancedAIEngine'));

export const moduleRegistry: ModuleDefinition[] = [
  {
    id: 'command-center',
    label: 'Command Center',
    labelVi: 'Trung tâm điều hành',
    icon: 'layout-dashboard',
    group: 'Operate',
    status: 'core',
    roleAccess: ['founder', 'operator', 'admin'],
    hashRoute: '/command',
    component: CommandCenter,
    badge: 'Home',
    tags: ['overview', 'workboard'],
  },
  {
    id: 'product-studio',
    label: 'Product Studio',
    labelVi: 'Product Studio',
    icon: 'package',
    group: 'Build',
    status: 'core',
    roleAccess: ['founder', 'product', 'admin'],
    hashRoute: '/product',
    component: ProductStudioHub,
    tags: ['software', 'ai-products', 'games'],
  },
  {
    id: 'marketing-growth',
    label: 'Marketing & Growth',
    labelVi: 'Marketing & Growth',
    icon: 'trending-up',
    group: 'Sell',
    status: 'core',
    roleAccess: ['founder', 'growth', 'admin'],
    hashRoute: '/growth',
    component: MarketingGrowthHub,
    tags: ['campaigns', 'content', 'surveys'],
  },
  {
    id: 'sales-crm',
    label: 'Sales & CRM',
    labelVi: 'Sales & CRM',
    icon: 'users',
    group: 'Sell',
    status: 'core',
    roleAccess: ['founder', 'sales', 'admin'],
    hashRoute: '/sales',
    component: OutboundSalesHub,
    tags: ['leads', 'customers', 'follow-up'],
  },
  {
    id: 'finance-accounting',
    label: 'Finance & Accounting',
    labelVi: 'Tài chính & kế toán',
    icon: 'book-open',
    group: 'Operate',
    status: 'core',
    roleAccess: ['founder', 'finance', 'admin'],
    hashRoute: '/finance',
    component: AccountingVietnam,
    tags: ['finance', 'accounting', 'reports'],
  },
  {
    id: 'projects-delivery',
    label: 'Projects & Delivery',
    labelVi: 'Dự án & bàn giao',
    icon: 'briefcase',
    group: 'Operate',
    status: 'core',
    roleAccess: ['founder', 'delivery', 'admin'],
    hashRoute: '/projects',
    component: ProjectsDeliveryCoreTab,
    tags: ['delivery', 'tasks', 'handoff'],
  },
  {
    id: 'ai-workforce',
    label: 'AI Workforce',
    labelVi: 'AI Nhân sự',
    icon: 'bot',
    group: 'Control',
    status: 'core',
    roleAccess: ['founder', 'operator', 'admin'],
    hashRoute: '/ai_ops',
    component: AgentOpsHub,
    tags: ['staff', 'prompts', 'tasks'],
  },
  {
    id: 'documents-approval',
    label: 'Documents & Approval',
    labelVi: 'Tài liệu & phê duyệt',
    icon: 'file-text',
    group: 'Control',
    status: 'next',
    roleAccess: ['founder', 'operator', 'admin'],
    hashRoute: '/documents',
    component: DocumentsApprovalTab,
    tags: ['documents', 'approval'],
  },
  {
    id: 'analytics-sandbox',
    label: 'Analytics, Models & Sandbox',
    labelVi: 'Analytics, Models & Sandbox',
    icon: 'bar-chart-3',
    group: 'Build',
    status: 'core',
    roleAccess: ['founder', 'data', 'admin'],
    hashRoute: '/analytics',
    component: AnalyticsSandboxHub,
    tags: ['charts', 'simulation', 'ml'],
  },
  {
    id: 'integration-hub',
    label: 'Integration Hub',
    labelVi: 'Integration Hub',
    icon: 'network',
    group: 'Extend',
    status: 'core',
    roleAccess: ['founder', 'developer', 'admin'],
    hashRoute: '/integration_hub',
    component: IntegrationHub,
    tags: ['connectors', 'github', 'local-tools'],
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    labelVi: 'Cấu hình hệ thống',
    icon: 'settings',
    group: 'Control',
    status: 'core',
    roleAccess: ['admin'],
    hashRoute: '/settings',
    component: AISettingsManager,
    tags: ['settings', 'ai-gateway', 'diagnostics'],
  },
  {
    id: 'industry-templates',
    label: 'Industry Templates',
    labelVi: 'Mẫu ngành',
    icon: 'layers',
    group: 'Extend',
    status: 'template',
    roleAccess: ['founder', 'product', 'admin'],
    hashRoute: '/templates',
    component: MultiIndustryCaseBank,
    tags: ['construction', 'service', 'trading', 'manufacturing'],
  },
];

export const legacyRouteRegistry: LegacyRouteDefinition[] = [
  { id: 'dashboard', label: 'Legacy Dashboard', hashRoute: '/dashboard', component: CommandCenter },
  { id: 'advisory', label: 'Advisory Board', hashRoute: '/advisory', component: AdvisoryBoardReport },
  { id: 'market_survey', label: 'Market Survey', hashRoute: '/market_survey', component: MarketSurveySimulator },
  { id: 'founder', label: 'Founder Lab', hashRoute: '/founder', component: SoloFounderBusiness },
  { id: 'roadmap', label: 'Roadmap', hashRoute: '/roadmap', component: WebAccountingRoadmap },
  { id: 'datascience', label: 'Data Science', hashRoute: '/datascience', component: DataScienceEngineering },
  { id: 'prompts', label: 'Prompt Playground', hashRoute: '/prompts', component: PromptPlayground },
  { id: 'assistant', label: 'AI Assistant', hashRoute: '/assistant', component: GeminiPlayground },
  { id: 'custom_data', label: 'Custom Data', hashRoute: '/custom_data', component: CustomDataWorkbench },
  { id: 'architecture', label: 'Architecture', hashRoute: '/architecture', component: AIEcosystemArchitecture },
  { id: 'game_ml', label: 'Game & ML', hashRoute: '/game_ml', component: GameAndMLWorkbench },
  { id: 'guerrilla', label: 'Guerrilla Product', hashRoute: '/guerrilla', component: GuerrillaProductHub },
  { id: 'accounting_vn', label: 'Accounting Vietnam', hashRoute: '/accounting_vn', component: AccountingVietnam },
  { id: 'ml_applied', label: 'Applied ML', hashRoute: '/ml_applied', component: MLApplied },
  { id: 'deploy_business', label: 'Deploy Business', hashRoute: '/deploy_business', component: DeployBusiness },
  { id: 'seo_strategy', label: 'SEO Strategy', hashRoute: '/seo_strategy', component: GoogleKeywordStrategy },
  { id: 'audit_workspace', label: 'Audit Workspace', hashRoute: '/audit_workspace', component: InternalAuditWorkspace },
  { id: 'python_sandbox', label: 'Python Sandbox', hashRoute: '/python_sandbox', component: PythonSandbox },
  { id: 'marketing_suite', label: 'Marketing Suite', hashRoute: '/marketing_suite', component: MarketingSuite },
  { id: 'funnel_lab', label: 'Funnel Lab', hashRoute: '/funnel_lab', component: MarketingFunnelLab },
  { id: 'lead_scoring', label: 'Lead Scoring', hashRoute: '/lead_scoring', component: LeadScoringEngine },
  { id: 'zalo_hub', label: 'Zalo Hub', hashRoute: '/zalo_hub', component: ZaloMarketingHub },
  { id: 'ltv_dashboard', label: 'LTV Dashboard', hashRoute: '/ltv_dashboard', component: CustomerLTVDashboard },
  { id: 'pricing_lab', label: 'Pricing Lab', hashRoute: '/pricing_lab', component: PricingStrategyLab },
  { id: 'nps_manager', label: 'NPS Manager', hashRoute: '/nps_manager', component: NPSReviewManager },
  { id: 'affiliate_hub', label: 'Affiliate Hub', hashRoute: '/affiliate_hub', component: AffiliateReferralHub },
  { id: 'outbound_hub', label: 'Outbound Hub', hashRoute: '/outbound_hub', component: OutboundSalesHub },
  { id: 'advanced_ai', label: 'Advanced AI', hashRoute: '/advanced_ai', component: AdvancedAIEngine },
];

export function normalizeRouteSegment(route: string): string {
  return route.replace(/^#/, '').replace(/^\//, '').replace(/\/$/, '') || 'command';
}

export function getModule(id: ModuleId): ModuleDefinition | undefined {
  return moduleRegistry.find((module) => module.id === id);
}

export function getModulesByGroup(group: ModuleGroup): ModuleDefinition[] {
  return moduleRegistry.filter((module) => module.group === group);
}

export function getCoreModules(): ModuleDefinition[] {
  return moduleRegistry.filter((module) => module.status === 'core');
}

export function getModuleByRoute(route: string): ModuleDefinition | undefined {
  const segment = normalizeRouteSegment(route);
  return moduleRegistry.find((module) => normalizeRouteSegment(module.hashRoute) === segment);
}

export function getLegacyRoute(route: string): LegacyRouteDefinition | undefined {
  const segment = normalizeRouteSegment(route);
  return legacyRouteRegistry.find((legacyRoute) => normalizeRouteSegment(legacyRoute.hashRoute) === segment);
}
