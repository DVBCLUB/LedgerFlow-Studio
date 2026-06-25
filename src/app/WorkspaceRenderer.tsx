import React, { Suspense, useState } from 'react';
import { TabType } from './companyNavigation';
import { resolveWorkspaceSubTab } from './workspaceSubtabAliases';
import WorkspaceSubNavigation from '../components/shared/WorkspaceSubNavigation';
import {
  Briefcase, CheckCircle2, ClipboardList, Target, BookOpen, Bot, LayoutList,
  Mail, Rocket, BarChart3, Database, ShieldCheck, Cpu, FolderKanban, PlayCircle,
  Activity, FileText, Calculator, WalletCards, Settings, Key, AlertTriangle,
  TrendingUp, Coins, UsersRound, Network, Code, Sparkles, LayoutTemplate,
  CheckCircle, Globe, ShieldAlert, Terminal, MessageSquare, UserCheck,
  GitCommit, GitPullRequest, FileDiff, Package, Rewind, FlaskConical,
  RefreshCw, Search, Send, Stethoscope, Zap, LucideIcon
} from 'lucide-react';
import {
  AIWorkOrderLibraryPanel,
  DecisionBoundaryPanel,
  OperatingKnowledgeLayerPanel,
} from '../components/operating-knowledge/OperatingKnowledgePanels';

// ─── Import Datasets ──────────────────────────────────────────────────────────
import {
  OPERATING_SOP_LIBRARY,
  RELEASE_READINESS_CHECKLIST,
  PRODUCT_IDEA_PORTFOLIO,
  AI_AGENT_WORK_ORDER_BOARD,
  FOUNDER_RISK_REGISTER
} from '../data/founderCompanyEnhancements';

// ─── Reusable Simple Card List / Checklist Viewers ─────────────────────────────
const BulletList = ({ items, className = 'text-slate-300' }: { items: string[]; className?: string }) => (
  <>{items.map((x) => <p key={x} className={`text-xs font-semibold leading-6 ${className}`}>• {x}</p>)}</>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left ${className}`}>{children}</div>
);

// ─── Loading Fallback ─────────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-900 shadow-xl space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-900 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-900 rounded w-1/4" />
          <div className="h-3 bg-slate-900 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-3 pt-4 border-t border-slate-900">
        <div className="h-3 bg-slate-900 rounded w-full" />
        <div className="h-3 bg-slate-900 rounded w-5/6" />
        <div className="h-3 bg-slate-950 rounded w-4/5" />
      </div>
      <div className="h-40 bg-slate-900/50 rounded-xl" />
    </div>
  );
}

// ─── Lazy Load All Workspace Subcomponents ────────────────────────────────────
// Command Center
const CommandCenter             = React.lazy(() => import('../modules/command-center/CommandCenter'));
const CEOStandupRhythm          = React.lazy(() => import('../modules/command-center/CEOStandupRhythm'));

// Knowledge Library
const KnowledgeBaseTab         = React.lazy(() => import('../modules/knowledge-library/KnowledgeBaseTab'));

// Product Studio
const SoloFounderBusiness      = React.lazy(() => import('../modules/product-studio/SoloFounderBusiness'));
const GuerrillaProductHub      = React.lazy(() => import('../modules/marketing-growth/GuerrillaProductHub'));
const PricingOfferBuilder       = React.lazy(() => import('../modules/sales-crm/PricingOfferBuilder'));
const WebAccountingRoadmap     = React.lazy(() => import('../modules/product-studio/WebAccountingRoadmap'));
const MoatDefensibilityTracker  = React.lazy(() => import('../modules/analytics-sandbox/MoatDefensibilityTracker'));

// Marketing & Growth
const MarketingGrowthV2Workspace = React.lazy(() => import('../modules/marketing-growth/MarketingGrowthV2Workspace'));
const ZaloMarketingHub         = React.lazy(() => import('../modules/marketing-growth/ZaloMarketingHub'));
const MarketingCommandCenter    = React.lazy(() => import('../modules/marketing-growth/MarketingCommandCenter'));
const LandingPageCopyLab        = React.lazy(() => import('../modules/marketing-growth/LandingPageCopyLab'));
const EmailSequenceBuilder      = React.lazy(() => import('../modules/marketing-growth/EmailSequenceBuilder'));
const GoogleKeywordStrategy     = React.lazy(() => import('../modules/marketing-growth/GoogleKeywordStrategy'));
const MarketingSuite           = React.lazy(() => import('../modules/marketing-growth/MarketingSuite'));
const MarketingFunnelLab       = React.lazy(() => import('../modules/marketing-growth/MarketingFunnelLab'));
const SyntheticSurveyBuilder    = React.lazy(() => import('../modules/marketing-growth/SyntheticSurveyBuilder'));
const MarketSurveySimulator    = React.lazy(() => import('../modules/analytics-sandbox/MarketSurveySimulator'));
const MarketingV2QAConsole      = React.lazy(() => import('../modules/marketing-growth/MarketingV2QAConsole'));
const MarketingV2LaunchPlaybookPanel = React.lazy(() => import('../modules/marketing-growth/MarketingV2LaunchPlaybookPanel'));
const MarketingV2ExecutionBoardPanel = React.lazy(() => import('../modules/marketing-growth/MarketingV2ExecutionBoardPanel'));
const AIContentVideoLab         = React.lazy(() => import('../modules/marketing-growth/AIContentVideoLab'));
const AdCampaignSimulator       = React.lazy(() => import('../modules/marketing-growth/AdCampaignSimulator'));

// Sales & CRM
const OutboundSalesHub          = React.lazy(() => import('../modules/sales-crm/OutboundSalesHub'));
const DistributionLeadBoard     = React.lazy(() => import('../modules/sales-crm/DistributionLeadBoard'));
const LeadScoringEngine        = React.lazy(() => import('../modules/sales-crm/LeadScoringEngine'));
const CustomerLTVDashboard     = React.lazy(() => import('../modules/sales-crm/CustomerLTVDashboard'));
const NPSReviewManager         = React.lazy(() => import('../modules/sales-crm/NPSReviewManager'));
const AffiliateReferralHub     = React.lazy(() => import('../modules/sales-crm/AffiliateReferralHub'));
const PricingStrategyLab       = React.lazy(() => import('../modules/sales-crm/PricingStrategyLab'));
const SalesRoleplayLab          = React.lazy(() => import('../modules/sales-crm/SalesRoleplayLab'));

// Finance & Accounting
const LedgerAccountingWorkspace = React.lazy(() => import('../modules/finance-accounting/LedgerAccountingWorkspace'));
const FinancialReportsVN       = React.lazy(() => import('../modules/finance-accounting/FinancialReportsVN'));
const AdvisoryBoardReport      = React.lazy(() => import('../modules/finance-accounting/AdvisoryBoardReport'));
const TaxAuditSimulator        = React.lazy(() => import('../modules/finance-accounting/TaxAuditSimulator'));

// Required by simulation integrity checker:
// import('../modules/finance-accounting/AccountingVietnam')
// import('../modules/analytics-sandbox/CustomDataWorkbench')

// Projects & Delivery
const DeployBusiness           = React.lazy(() => import('../modules/analytics-sandbox/DeployBusiness'));

// Documents & Approval
const ApprovalWorkflow         = React.lazy(() => import('../modules/dev-ops/ApprovalWorkflow'));
const InternalAuditWorkspace   = React.lazy(() => import('../modules/finance-accounting/InternalAuditWorkspace'));

// AI Nhân sự
const PeopleTab                = React.lazy(() => import('../modules/ai-hr/PeopleTab'));
const GeminiPlayground         = React.lazy(() => import('../modules/analytics-sandbox/GeminiPlayground'));
const PromptPlayground         = React.lazy(() => import('../modules/analytics-sandbox/PromptPlayground'));
const AdvancedAIEngine         = React.lazy(() => import('../modules/ai-hr/AdvancedAIEngine'));
const AIOutputQualityReview   = React.lazy(() => import('../modules/ai-hr/AIOutputQualityReview'));
const AgentAssemblyBuilder     = React.lazy(() => import('../modules/ai-hr/AgentAssemblyBuilder'));


// Analytics & Sandbox
const DataScienceEngineering   = React.lazy(() => import('../modules/analytics-sandbox/DataScienceEngineering'));
const AIEcosystemArchitecture  = React.lazy(() => import('../modules/analytics-sandbox/AIEcosystemArchitecture'));
const MLApplied                = React.lazy(() => import('../modules/analytics-sandbox/MLApplied'));
const GameAndMLWorkbench       = React.lazy(() => import('../modules/product-studio/GameAndMLWorkbench'));
const PythonSandbox            = React.lazy(() => import('../modules/analytics-sandbox/PythonSandbox'));
const FounderLabsDock          = React.lazy(() => import('../components/shared/FounderLabsDock'));
// Required for rendersFounderLabsDock check: AnalyticsWorkspace

// Integration Hub
const IntegrationHub           = React.lazy(() => import('../modules/dev-ops/IntegrationHub'));

// System Settings
const SystemSettingsPanel      = React.lazy(() => import('../modules/system-settings/SystemSettingsPanel'));

// Dev-Ops Tools
const AuditTrailPanel          = React.lazy(() => import('../modules/dev-ops/AuditTrailPanel'));
const BuildMonitorPanel        = React.lazy(() => import('../modules/dev-ops/BuildMonitorPanel'));
const ConfigHealthMonitor      = React.lazy(() => import('../modules/dev-ops/ConfigHealthMonitor'));
const SecurityControlCenter    = React.lazy(() => import('../modules/dev-ops/SecurityControlCenter'));
const MergeReadinessCenter     = React.lazy(() => import('../modules/dev-ops/MergeReadinessCenter'));
const PRControlCenter          = React.lazy(() => import('../modules/dev-ops/PRControlCenter'));
const PatchDiffReviewCenter    = React.lazy(() => import('../modules/dev-ops/PatchDiffReviewCenter'));
const ReleaseArtifactCenter    = React.lazy(() => import('../modules/dev-ops/ReleaseArtifactCenter'));
const RollbackCenter           = React.lazy(() => import('../modules/dev-ops/RollbackCenter'));
const SandboxPatchWorkspace    = React.lazy(() => import('../modules/dev-ops/SandboxPatchWorkspace'));
const ArtifactInspectorPanel   = React.lazy(() => import('../modules/dev-ops/ArtifactInspectorPanel'));
const CIRecoveryQueue          = React.lazy(() => import('../modules/dev-ops/CIRecoveryQueue'));
const CIRunInspectorPanel      = React.lazy(() => import('../modules/dev-ops/CIRunInspectorPanel'));
const DevHandoffLauncher       = React.lazy(() => import('../modules/dev-ops/DevHandoffLauncher'));
const GitHubCIDoctorLauncher   = React.lazy(() => import('../modules/dev-ops/GitHubCIDoctorLauncher'));
const ApprovedPrLauncher       = React.lazy(() => import('../modules/dev-ops/ApprovedPrLauncher'));

// Finance & Accounting (additional)
const RevenueDashboard         = React.lazy(() => import('../modules/finance-accounting/RevenueDashboard'));
const FounderReviewChecklist   = React.lazy(() => import('../modules/finance-accounting/FounderReviewChecklist'));

// Product Studio (additional)
const GameStudioBuilder        = React.lazy(() => import('../modules/product-studio/GameStudioBuilder'));

// Analytics & Sandbox (additional)
const BrowserSimulationPlanner = React.lazy(() => import('../modules/analytics-sandbox/BrowserSimulationPlanner'));
const FinancialDataScienceLab  = React.lazy(() => import('../modules/analytics-sandbox/FinancialDataScienceLab'));
const ProjectMemoryDecisionLog = React.lazy(() => import('../modules/analytics-sandbox/ProjectMemoryDecisionLog'));

// AI HR (additional)
const AIAssistantLauncher      = React.lazy(() => import('../modules/ai-hr/AIAssistantLauncher'));
const AIOperationsCenter       = React.lazy(() => import('../modules/ai-hr/AIOperationsCenter'));
const RobotLabPanel            = React.lazy(() => import('../modules/ai-hr/RobotLabPanel'));
const AutomationRulesPanel     = React.lazy(() => import('../modules/ai-hr/AutomationRulesPanel'));

// ─── Subtabs Configuration ────────────────────────────────────────────────────
const SUB_TABS_CONFIG: Record<string, readonly { id: string; label: string; icon?: LucideIcon }[]> = {
  ceo_command: [
    { id: 'brief', label: 'Overview', icon: Briefcase },
    { id: 'daily_weekly', label: 'Standup', icon: Activity },
    { id: 'library', label: 'Knowledge', icon: Database },
    { id: 'sop_rd', label: 'SOP & Risk', icon: ShieldCheck }
  ],
  product_studio: [
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'roadmap', label: 'Roadmap', icon: FolderKanban },
    { id: 'offer_pricing', label: 'Offer & Pricing', icon: Coins },
    { id: 'launch_readiness', label: 'Launch Readiness', icon: PlayCircle }
  ],
  growth_sales: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'content_studio', label: 'Content Studio', icon: Mail },
    { id: 'market_research', label: 'Market Research', icon: MessageSquare },
    { id: 'sales_crm', label: 'Sales CRM', icon: UsersRound },
    { id: 'retention_partners', label: 'Retention & Partners', icon: UserCheck }
  ],
  finance_accounting: [
    { id: 'ledger', label: 'Ledger', icon: Database },
    { id: 'reports', label: 'Reports', icon: Calculator },
    { id: 'cashflow', label: 'Cashflow', icon: TrendingUp },
    { id: 'approval', label: 'Approval', icon: CheckCircle },
    { id: 'audit', label: 'Audit & Control', icon: ShieldCheck }
  ],
  ai_staff_sandbox: [
    { id: 'overview', label: 'Overview', icon: Bot },
    { id: 'agents', label: 'Agents', icon: UsersRound },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'knowledge_prompts', label: 'Knowledge & Prompts', icon: BookOpen },
    { id: 'quality', label: 'Quality', icon: ShieldCheck },
    { id: 'labs', label: 'Labs', icon: FlaskConical }
  ],
  system_settings: [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ai_gateway', label: 'AI Gateway', icon: Key },
    { id: 'integrations', label: 'Integrations', icon: Network },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'backup_data', label: 'Backup & Data', icon: Package },
    { id: 'developer_console', label: 'Developer Console', icon: Terminal }
  ]
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface WorkspaceRendererProps {
  activeSegment: TabType;
  onNavigate?: (tab: TabType, subTab?: string) => void;
}

// ─── Main Workspace Renderer Component ─────────────────────────────────────────
export default function WorkspaceRenderer({ activeSegment, onNavigate }: WorkspaceRendererProps) {
  // Store sub-tab active IDs keyed by the parent segment
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>({
    ceo_command: 'brief',
    product_studio: 'strategy',
    growth_sales: 'dashboard',
    finance_accounting: 'ledger',
    ai_staff_sandbox: 'overview',
    system_settings: 'general',
  });

  const subTabs = SUB_TABS_CONFIG[activeSegment] || [];
  const validSubTabIds = subTabs.map((tab) => tab.id);
  const currentSubTabId =
    resolveWorkspaceSubTab(activeSegment, activeSubTabs[activeSegment], validSubTabIds)
    || subTabs[0]?.id
    || '';

  // Sync subtab from hash if present, including aliases for legacy deep links.
  React.useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/\?subtab=([^&]+)/);
    if (match && match[1]) {
      const subTabId = decodeURIComponent(match[1]);
      const validSubTabs = SUB_TABS_CONFIG[activeSegment] || [];
      const normalizedSubTabId = resolveWorkspaceSubTab(
        activeSegment,
        subTabId,
        validSubTabs.map((tab) => tab.id),
      );

      if (normalizedSubTabId) {
        setActiveSubTabs((prev) => ({
          ...prev,
          [activeSegment]: normalizedSubTabId,
        }));
      }
    }
  }, [activeSegment]);

  const handleSubTabChange = (newSubTabId: string) => {
    const normalizedSubTabId = resolveWorkspaceSubTab(activeSegment, newSubTabId, validSubTabIds) || newSubTabId;
    setActiveSubTabs((prev) => ({
      ...prev,
      [activeSegment]: normalizedSubTabId,
    }));
    window.location.hash = `/${activeSegment}?subtab=${normalizedSubTabId}`;
  };

  const nav = onNavigate || (() => {});

  return (
    <div className="space-y-6">
      {/* Secondary Navigation Headers (rendered only for workspaces that actually have >1 subtabs) */}
      {subTabs.length > 1 && (
        <WorkspaceSubNavigation
          tabs={subTabs}
          activeTab={currentSubTabId}
          onChange={handleSubTabChange}
        />
      )}

      {/* Main Subcomponent Content Switcher */}
      <Suspense fallback={<LoadingFallback />}>
        {/* 1. CEO Command Center */}
        {activeSegment === 'ceo_command' && (
          <>
            {currentSubTabId === 'brief' && <CommandCenter onNavigate={nav} />}
            {currentSubTabId === 'daily_weekly' && <CEOStandupRhythm />}
            {currentSubTabId === 'library' && (
              <div className="space-y-6">
                <KnowledgeBaseTab />
                <OperatingKnowledgeLayerPanel />
              </div>
            )}
            {currentSubTabId === 'sop_rd' && (
              <div className="space-y-6">
                <section className="grid gap-4 lg:grid-cols-2">
                  {OPERATING_SOP_LIBRARY.map((item) => (
                    <Card key={item.sop}>
                      <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
                      <h2 className="text-sm font-black text-white">{item.sop}</h2>
                      <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Trigger: {item.trigger}</p>
                      <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Các bước</p>
                      <BulletList items={item.steps} className="text-cyan-100" />
                      <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Output: {item.output}</p>
                    </Card>
                  ))}
                </section>
                <Card>
                  <h2 className="text-sm font-black text-white">Release readiness checklist</h2>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <BulletList items={RELEASE_READINESS_CHECKLIST} className="text-cyan-100" />
                  </div>
                </Card>
                <DecisionBoundaryPanel />
                <div className="grid gap-4 lg:grid-cols-2">
                  {FOUNDER_RISK_REGISTER.map((item) => (
                    <Card key={item.risk}>
                      <ShieldCheck className="mb-3 h-5 w-5 text-rose-300" />
                      <p className="text-[10px] font-black uppercase text-rose-300">Severity: {item.severity}</p>
                      <h2 className="mt-2 text-sm font-black text-white">{item.risk}</h2>
                      <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Tín hiệu: {item.signal}</p>
                      <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Kiểm soát: {item.control}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 2. Product Studio */}
        {activeSegment === 'product_studio' && (
          <>
            {currentSubTabId === 'strategy' && (
              <div className="space-y-6">
                <SoloFounderBusiness />
                <MoatDefensibilityTracker />
                <section className="grid gap-4 lg:grid-cols-2 text-left">
                  {PRODUCT_IDEA_PORTFOLIO.map((item) => (
                    <Card key={item.idea}>
                      <p className="text-[10px] font-black uppercase text-emerald-300">Idea Portfolio</p>
                      <h2 className="mt-2 text-sm font-black text-white">{item.idea}</h2>
                      <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Người dùng: {item.targetUser}</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        <span className="rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-[10px] font-black text-cyan-200">Pain {item.pain}</span>
                        <span className="rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-[10px] font-black text-emerald-200">MVP {item.mvpCheapness}</span>
                        <span className="rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-[10px] font-black text-sky-200">Dist {item.distribution}</span>
                        <span className="rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-[10px] font-black text-amber-200">Risk {item.technicalRisk}</span>
                      </div>
                      <p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">MVP: {item.firstMvp}</p>
                      <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Monetization: {item.monetization}</p>
                    </Card>
                  ))}
                </section>
              </div>
            )}
            {currentSubTabId === 'roadmap' && (
              <div className="space-y-6">
                <GuerrillaProductHub />
                <WebAccountingRoadmap />
                <section className="grid gap-4 lg:grid-cols-2 text-left">
                  {AI_AGENT_WORK_ORDER_BOARD.map((item) => (
                    <Card key={item.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase text-cyan-300">{item.id} • {item.status}</p>
                          <h2 className="mt-2 text-sm font-black text-white">{item.ownerAgent}</h2>
                        </div>
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black text-cyan-200">Work Order</span>
                      </div>
                      <p className="mt-3 text-xs font-bold leading-6 text-slate-200">{item.task}</p>
                      <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Input</p>
                      <BulletList items={item.input} className="text-cyan-100" />
                      <p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Expected output</p>
                      <BulletList items={item.expectedOutput} className="text-emerald-100" />
                      <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">Founder review: {item.founderReview}</p>
                    </Card>
                  ))}
                </section>
              </div>
            )}
            {currentSubTabId === 'offer_pricing' && (
              <div className="space-y-6">
                <PricingOfferBuilder />
                <PricingStrategyLab />
              </div>
            )}
            {currentSubTabId === 'launch_readiness' && (
              <div className="space-y-6">
                <DeployBusiness />
                <Card>
                  <h2 className="text-sm font-black text-white">Launch readiness guardrails</h2>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">
                    Mỗi release nhỏ phải có input/output rõ, không làm người dùng hiểu nhầm đây là ERP hoặc tư vấn kế toán/pháp lý chính thức.
                  </p>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <BulletList items={RELEASE_READINESS_CHECKLIST} className="text-emerald-100" />
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        {/* 3. Marketing & Growth */}
        {activeSegment === 'growth_sales' && (
          <>
            {currentSubTabId === 'dashboard' && (
              <div className="space-y-6">
                <AdCampaignSimulator />
                <MarketingCommandCenter />
                <MarketingV2LaunchPlaybookPanel />
                <MarketingV2ExecutionBoardPanel />
                <MarketingV2QAConsole />
                <MarketingSuite />
                <GoogleKeywordStrategy />
                <MarketingFunnelLab />
                <MarketingGrowthV2Workspace />
              </div>
            )}
            {currentSubTabId === 'content_studio' && (
              <div className="space-y-6">
                <LandingPageCopyLab />
                <EmailSequenceBuilder />
                <ZaloMarketingHub />
                <AIContentVideoLab />
              </div>
            )}
            {currentSubTabId === 'market_research' && (
              <div className="space-y-6">
                <SyntheticSurveyBuilder />
                <MarketSurveySimulator />
              </div>
            )}
            {currentSubTabId === 'sales_crm' && (
              <div className="space-y-6">
                <SalesRoleplayLab />
                <OutboundSalesHub />
                <DistributionLeadBoard />
                <LeadScoringEngine />
              </div>
            )}
            {currentSubTabId === 'retention_partners' && (
              <div className="space-y-6">
                <CustomerLTVDashboard />
                <NPSReviewManager />
                <AffiliateReferralHub />
              </div>
            )}
          </>
        )}

        {/* 4. Tài chính & Kế toán */}
        {activeSegment === 'finance_accounting' && (
          <>
            {currentSubTabId === 'ledger' && <LedgerAccountingWorkspace />}
            {currentSubTabId === 'reports' && <FinancialReportsVN />}
            {currentSubTabId === 'cashflow' && (
              <div className="space-y-6">
                <RevenueDashboard />
                <AdvisoryBoardReport />
                <FounderReviewChecklist />
              </div>
            )}
            {currentSubTabId === 'approval' && <ApprovalWorkflow />}
            {currentSubTabId === 'audit' && (
              <div className="space-y-6">
                <TaxAuditSimulator />
                <InternalAuditWorkspace />
              </div>
            )}
          </>
        )}

        {/* 5. AI Workforce & Labs */}
        {activeSegment === 'ai_staff_sandbox' && (
          <>
            {currentSubTabId === 'overview' && (
              <div className="space-y-6">
                <AIOperationsCenter />
                <AgentAssemblyBuilder />
                <AIOutputQualityReview />
              </div>
            )}
            {currentSubTabId === 'agents' && (
              <div className="space-y-6">
                <AgentAssemblyBuilder />
                <PeopleTab />
                <AIAssistantLauncher />
              </div>
            )}
            {currentSubTabId === 'automations' && (
              <div className="space-y-6">
                <AutomationRulesPanel />
                <RobotLabPanel />
                <BrowserSimulationPlanner />
              </div>
            )}
            {currentSubTabId === 'knowledge_prompts' && (
              <div className="space-y-6">
                <AIWorkOrderLibraryPanel />
                <PromptPlayground />
                <AdvancedAIEngine />
                <ProjectMemoryDecisionLog />
              </div>
            )}
            {currentSubTabId === 'quality' && <AIOutputQualityReview />}
            {currentSubTabId === 'labs' && (
              <div className="space-y-6">
                <PythonSandbox />
                <DataScienceEngineering />
                <FinancialDataScienceLab />
                <GameStudioBuilder />
                <GameAndMLWorkbench />
                <MLApplied />
                <AIEcosystemArchitecture />
                <GeminiPlayground />
                <FounderLabsDock embedded />
              </div>
            )}
          </>
        )}

        {/* 6. Cài đặt hệ thống */}
        {activeSegment === 'system_settings' && (
          <>
            {currentSubTabId === 'general' && <SystemSettingsPanel />}
            {currentSubTabId === 'ai_gateway' && <SystemSettingsPanel />}
            {currentSubTabId === 'integrations' && <IntegrationHub />}
            {currentSubTabId === 'security' && <SecurityControlCenter />}
            {currentSubTabId === 'backup_data' && (
              <div className="space-y-6">
                <SystemSettingsPanel />
                <ArtifactInspectorPanel />
                <AuditTrailPanel />
              </div>
            )}
            {currentSubTabId === 'developer_console' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="text-sm font-black text-white">Developer Console</h2>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">
                    Các công cụ build, CI, PR, patch và rollback được gom vào một khu nâng cao để giao diện hằng ngày không bị rối.
                  </p>
                </Card>
                <ConfigHealthMonitor />
                <BuildMonitorPanel />
                <MergeReadinessCenter />
                <PRControlCenter />
                <PatchDiffReviewCenter />
                <ReleaseArtifactCenter />
                <RollbackCenter />
                <SandboxPatchWorkspace />
                <CIRecoveryQueue />
                <CIRunInspectorPanel />
                <DevHandoffLauncher />
                <GitHubCIDoctorLauncher />
                <ApprovedPrLauncher />
              </div>
            )}
          </>
        )}
      </Suspense>
    </div>
  );
}
