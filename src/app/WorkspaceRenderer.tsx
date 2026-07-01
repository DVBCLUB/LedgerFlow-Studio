import React, { Suspense, useState } from 'react';
import { TabType, RoleType } from './companyNavigation';
import { resolveWorkspaceSubTab } from './workspaceSubtabAliases';
import WorkspaceSubNavigation from '../components/shared/WorkspaceSubNavigation';
import DynamicModuleComponentLoader from './DynamicModuleComponentLoader';
import {
  Briefcase, CheckCircle2, ClipboardList, Target, BookOpen, Bot, LayoutList, Mail, Rocket, BarChart3, Database, ShieldCheck, Cpu, FolderKanban, PlayCircle, Activity, FileText, FileCheck2, Calculator, WalletCards, Settings, Key, AlertTriangle, TrendingUp, Coins, UsersRound, Network, Code, Sparkles, LayoutTemplate, CheckCircle, Globe, ShieldAlert, Terminal, MessageSquare, UserCheck, GitCommit, GitPullRequest, FileDiff, Package, Rewind, FlaskConical, RefreshCw, Search, Send, Stethoscope, Zap, ShoppingCart, LucideIcon } from 'lucide-react';
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

// AI Personnel & Sandbox
const PeopleTab                = React.lazy(() => import('../modules/ai-hr/PeopleTab'));
const GeminiPlayground         = React.lazy(() => import('../modules/analytics-sandbox/GeminiPlayground'));
const PromptPlayground         = React.lazy(() => import('../modules/analytics-sandbox/PromptPlayground'));

// Analytics & Sandbox
const DataScienceEngineering   = React.lazy(() => import('../modules/analytics-sandbox/DataScienceEngineering'));
const AIEcosystemArchitecture  = React.lazy(() => import('../modules/analytics-sandbox/AIEcosystemArchitecture'));
const MLApplied                = React.lazy(() => import('../modules/analytics-sandbox/MLApplied'));
const GameAndMLWorkbench       = React.lazy(() => import('../modules/product-studio/GameAndMLWorkbench'));
const PythonSandbox            = React.lazy(() => import('../modules/analytics-sandbox/PythonSandbox'));

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
const FinancialDataScienceLab  = React.lazy(() => import('../modules/analytics-sandbox/FinancialDataScienceLab'));
const ProjectMemoryDecisionLog = React.lazy(() => import('../modules/analytics-sandbox/ProjectMemoryDecisionLog'));

// AI Personnel — simplified (OpenClaw-style Command Center)
const AICommandCenter = React.lazy(() => import('../modules/ai-hr/AICommandCenter'));
const AISettingsLauncher = React.lazy(() => import('../modules/ai-hr/AISettingsLauncher'));
const AIWorkforceCommandCenter = React.lazy(() => import('../modules/ai-hr/AIWorkforceCommandCenter'));
const AIOperationsCenter = React.lazy(() => import('../modules/ai-hr/AIOperationsCenter'));
const AIOperationsDaemonPanel = React.lazy(() => import('../modules/ai-hr/AIOperationsDaemonPanel'));
const AIWorkforceMobileCommandCenter = React.lazy(() => import('../modules/ai-hr/AIWorkforceMobileCommandCenter'));
const AIGovernanceQualityHubPanel = React.lazy(() => import('../modules/ai-hr/AIGovernanceQualityHubPanel'));
const AIOutputQualityReview = React.lazy(() => import('../modules/ai-hr/AIOutputQualityReview'));
const AIWorkforceRuntimePanel = React.lazy(() => import('../modules/ai-hr/AIWorkforceRuntimePanel'));
const AIWorkforceMissionControl = React.lazy(() => import('../modules/ai-hr/AIWorkforceMissionControl'));
const AIWorkforceMissionTemplates = React.lazy(() => import('../modules/ai-hr/AIWorkforceMissionTemplates'));
const AIWorkforceMissionTrace = React.lazy(() => import('../modules/ai-hr/AIWorkforceMissionTrace'));
const MissionOperatorRunbookPanel = React.lazy(() => import('../modules/ai-hr/MissionOperatorRunbookPanel'));
const MissionReleaseGatePanel = React.lazy(() => import('../modules/ai-hr/MissionReleaseGatePanel'));
const MissionSnapshotExportPanel = React.lazy(() => import('../modules/ai-hr/MissionSnapshotExportPanel'));
const MissionReviewNoteSavePanel = React.lazy(() => import('../modules/ai-hr/MissionReviewNoteSavePanel'));
const ReleaseGateDashboardCard = React.lazy(() => import('../modules/ai-hr/ReleaseGateDashboardCard'));
const AIMemoryRagPanel = React.lazy(() => import('../modules/ai-hr/AIMemoryRagPanel'));
const KnowledgeContentHubPanel = React.lazy(() => import('../modules/ai-hr/KnowledgeContentHubPanel'));
const AdvancedAIEngine = React.lazy(() => import('../modules/ai-hr/AdvancedAIEngine'));
const AIWorkforceOpenClawReadiness = React.lazy(() => import('../modules/ai-hr/AIWorkforceOpenClawReadiness'));
const AIWorkforceSkillDirectory = React.lazy(() => import('../modules/ai-hr/AIWorkforceSkillDirectory'));
const AIWorkforceSkillInvocationPlanner = React.lazy(() => import('../modules/ai-hr/AIWorkforceSkillInvocationPlanner'));
const AIWorkforcePatchSafetyRunbook = React.lazy(() => import('../modules/ai-hr/AIWorkforcePatchSafetyRunbook'));
const AIWorkforcePatchReviewSessions = React.lazy(() => import('../modules/ai-hr/AIWorkforcePatchReviewSessions'));
const AIWorkforceNextBackendActions = React.lazy(() => import('../modules/ai-hr/AIWorkforceNextBackendActions'));
const AIWorkforceRobotAutomationBridge = React.lazy(() => import('../modules/ai-hr/AIWorkforceRobotAutomationBridge'));
const AutomationRulesHealthPanel = React.lazy(() => import('../modules/ai-hr/AutomationRulesHealthPanel'));
const RobotLabPanel = React.lazy(() => import('../modules/ai-hr/RobotLabPanel'));
const AutomationRulesPanel = React.lazy(() => import('../modules/ai-hr/AutomationRulesPanel'));
const AIWorkforceToolCatalog = React.lazy(() => import('../modules/ai-hr/AIWorkforceToolCatalog'));
const AIWorkforcePluginSecurityGuard = React.lazy(() => import('../modules/ai-hr/AIWorkforcePluginSecurityGuard'));
const AgentAssemblyBuilder = React.lazy(() => import('../modules/ai-hr/AgentAssemblyBuilder'));
const FactoryOperatorGuidePanel = React.lazy(() => import('../modules/ai-hr/FactoryOperatorGuidePanel'));
const FactoryHealthSummaryPanel = React.lazy(() => import('../modules/ai-hr/FactoryHealthSummaryPanel'));
const FactoryBackendRuntimePanel = React.lazy(() => import('../modules/ai-hr/FactoryBackendRuntimePanel'));
const FactoryCatalogStatusPanel = React.lazy(() => import('../modules/ai-hr/FactoryCatalogStatusPanel'));
const FactoryConnectorMatrixPanel = React.lazy(() => import('../modules/ai-hr/FactoryConnectorMatrixPanel'));
const FactoryExecutionDecisionPanel = React.lazy(() => import('../modules/ai-hr/FactoryExecutionDecisionPanel'));
const FactoryCommandRunnerPanel = React.lazy(() => import('../modules/ai-hr/FactoryCommandRunnerPanel'));
const FactoryAuditLogPanel = React.lazy(() => import('../modules/ai-hr/FactoryAuditLogPanel'));
import AIStaffTaskAssignmentPanel from '../components/ai-hr/AIStaffTaskAssignmentPanel';
import { ProjectPortfolioPanel, ProcurementLogisticsPanel } from '../components/operations/OperationsPanels';
import FinancialChartsModelPanel from '../components/analytics/FinancialChartsModelPanel';
import FounderLabsDock from '../components/shared/FounderLabsDock';

// ─── Subtabs Configuration ────────────────────────────────────────────────────
const SUB_TABS_CONFIG: Record<string, readonly { id: string; label: string; icon?: LucideIcon }[]> = {
  ceo_command: [
    { id: 'brief', label: 'Today', icon: Briefcase },
    { id: 'daily_weekly', label: 'Standup', icon: Activity },
    { id: 'library', label: 'Knowledge', icon: Database },
    { id: 'sop_rd', label: 'SOP & Risk', icon: ShieldCheck }
  ],
  finance_accounting: [
    { id: 'ledger', label: 'Ledger', icon: Database },
    { id: 'reports', label: 'Reports', icon: Calculator },
    { id: 'cashflow', label: 'Cashflow', icon: TrendingUp },
    { id: 'approval', label: 'Approval', icon: CheckCircle },
    { id: 'audit', label: 'Audit & Control', icon: ShieldCheck }
  ],
  product_studio: [
    { id: 'portfolio', label: 'Portfolio', icon: FolderKanban },
    { id: 'delivery', label: 'Delivery', icon: ClipboardList },
  ],
  marketing_growth: [
    { id: 'campaigns', label: 'Campaigns', icon: Rocket },
    { id: 'content', label: 'Content', icon: Mail },
  ],
  sales_crm: [
    { id: 'pipeline', label: 'Pipeline', icon: BarChart3 },
    { id: 'pricing_retention', label: 'Pricing & Retention', icon: Target },
  ],
  operations: [
    { id: 'product_studio', label: 'Product Studio', icon: FolderKanban },
    { id: 'growth_marketing', label: 'Marketing & Growth', icon: Rocket },
    { id: 'sales_crm', label: 'Sales & CRM', icon: BarChart3 },
    { id: 'logistics', label: 'Logistics', icon: ShoppingCart }
  ],
  ai_factory: [
    { id: 'command', label: 'Ra lệnh', icon: Bot },
    { id: 'missions', label: 'Nhiệm vụ', icon: ClipboardList },
    { id: 'robot_auto', label: 'Tự động hóa', icon: Cpu },
    { id: 'advanced', label: 'Kỹ thuật', icon: ShieldAlert },
  ],
  analytics: [
    { id: 'python_sandbox', label: 'Python Sandbox', icon: Code },
    { id: 'data_science', label: 'Data Science', icon: Database },
    { id: 'game_studio', label: 'Game Studio', icon: Rocket },
    { id: 'ml_applied', label: 'Applied ML', icon: Cpu },
    { id: 'architecture', label: 'AI Architecture', icon: Network },
    { id: 'gemini_playground', label: 'Gemini Playground', icon: Sparkles }
  ],
  system_settings: [
    { id: 'general', label: 'Cài đặt chung', icon: Settings },
    { id: 'devops', label: 'DevOps', icon: Network },
    { id: 'control', label: 'Bảo mật', icon: ShieldCheck },
    { id: 'safety_gates', label: 'Duyệt & phát hành', icon: FileCheck2 },
    { id: 'emergency', label: 'Dừng khẩn cấp', icon: ShieldAlert }
  ]
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface WorkspaceRendererProps {
  activeSegment: TabType;
  activeRole?: RoleType;
  onNavigate?: (tab: TabType, subTab?: string) => void;
}

// ─── Main Workspace Renderer Component ─────────────────────────────────────────
export default function WorkspaceRenderer({ activeSegment, activeRole = 'all', onNavigate }: WorkspaceRendererProps) {
  // Store sub-tab active IDs keyed by the parent segment
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>({
    ceo_command: 'brief',
    product_studio: 'portfolio',
    marketing_growth: 'campaigns',
    sales_crm: 'pipeline',
    finance_accounting: 'ledger',
    operations: 'product_studio',
    ai_factory: 'command',
    devops_hub: 'build_monitor',
    control_room: 'system_health',
    analytics: 'python_sandbox',
    system_settings: 'general',
  });

  // Filter subtabs based on role capabilities (Progressive Disclosure)
  const rawSubTabs = SUB_TABS_CONFIG[activeSegment] || [];
  const subTabs = rawSubTabs.filter((tab) => {
    if (activeRole === 'all' || activeRole === 'founder' || activeRole === 'admin') return true;
    
    // Hide Developer diagnostics tabs from non-technical/non-admin roles
    if (tab.id === 'advanced' && !['devops', 'agentops'].includes(activeRole)) return false;
    if (tab.id === 'devops' && !['devops', 'agentops'].includes(activeRole)) return false;
    if (tab.id === 'control' && !['devops', 'agentops', 'operations'].includes(activeRole)) return false;
    if (tab.id === 'safety_gates' && !['devops', 'agentops', 'operations'].includes(activeRole)) return false;
    if (tab.id === 'emergency' && !['devops', 'agentops', 'operations'].includes(activeRole)) return false;
    return true;
  });

  const validSubTabIds = subTabs.map((tab) => tab.id);
  const currentSubTabId =
    resolveWorkspaceSubTab(activeSegment, activeSubTabs[activeSegment], validSubTabIds)
    || subTabs[0]?.id
    || '';

  // Sync subtab from hash if present
  React.useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/\?subtab=([^&]+)/);
    if (match && match[1]) {
      const subTabId = decodeURIComponent(match[1]);
      const normalizedSubTabId = resolveWorkspaceSubTab(
        activeSegment,
        subTabId,
        validSubTabIds,
      );

      if (normalizedSubTabId) {
        setActiveSubTabs((prev) => ({
          ...prev,
          [activeSegment]: normalizedSubTabId,
        }));
      }
    }
  }, [activeSegment, validSubTabIds]);

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
      {/* Secondary Navigation Headers (rendered only if >1 subtabs exist for this role) */}
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
            {currentSubTabId === 'brief' && <CommandCenter onNavigate={nav} activeRole={activeRole} />}
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

        {/* 2. Finance & Accounting */}
        {activeSegment === 'finance_accounting' && (
          <>
            {currentSubTabId === 'ledger' && <LedgerAccountingWorkspace />}
            {currentSubTabId === 'reports' && <FinancialReportsVN />}
            {currentSubTabId === 'cashflow' && (
              <div className="space-y-6">
                <RevenueDashboard />
                <FinancialChartsModelPanel />
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

        {/* 3. Product Studio */}
        {activeSegment === 'product_studio' && (
          <>
            {currentSubTabId === 'portfolio' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <SoloFounderBusiness />
                  <WebAccountingRoadmap />
                </div>
                <GameStudioBuilder />
                <MoatDefensibilityTracker />
                <section className="grid gap-4 lg:grid-cols-2 text-left">
                  {PRODUCT_IDEA_PORTFOLIO.map((item) => (
                    <Card key={item.idea}>
                      <p className="text-[10px] font-black uppercase text-emerald-300">Product idea</p>
                      <h2 className="mt-2 text-sm font-black text-white">{item.idea}</h2>
                      <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Người dùng: {item.targetUser}</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        <span className="rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-[10px] font-black text-cyan-200">Pain {item.pain}</span>
                        <span className="rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-[10px] font-black text-emerald-200">MVP {item.mvpCheapness}</span>
                        <span className="rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-[10px] font-black text-sky-200">Dist {item.distribution}</span>
                        <span className="rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-[10px] font-black text-amber-200">Risk {item.technicalRisk}</span>
                      </div>
                      <p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">MVP: {item.firstMvp}</p>
                    </Card>
                  ))}
                </section>
              </div>
            )}
            {currentSubTabId === 'delivery' && (
              <div className="space-y-6">
                <ProjectPortfolioPanel />
                <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left">
                  <summary className="cursor-pointer select-none text-xs font-black uppercase tracking-[0.16em] text-slate-300 hover:text-white">
                    Optional logistics and industry-template operations
                  </summary>
                  <div className="mt-5">
                    <ProcurementLogisticsPanel />
                  </div>
                </details>
              </div>
            )}
          </>
        )}

        {/* 4. Marketing & Growth */}
        {activeSegment === 'marketing_growth' && (
          <>
            {currentSubTabId === 'campaigns' && (
              <div className="space-y-6">
                <MarketingCommandCenter />
                <div className="grid gap-4 md:grid-cols-2">
                  <MarketingSuite />
                  <MarketingFunnelLab />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <SyntheticSurveyBuilder />
                  <AdCampaignSimulator />
                </div>
              </div>
            )}
            {currentSubTabId === 'content' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <LandingPageCopyLab />
                  <EmailSequenceBuilder />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ZaloMarketingHub />
                  <AIContentVideoLab />
                </div>
              </div>
            )}
          </>
        )}

        {/* 5. Sales & CRM */}
        {activeSegment === 'sales_crm' && (
          <>
            {currentSubTabId === 'pipeline' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <OutboundSalesHub />
                  <DistributionLeadBoard />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <LeadScoringEngine />
                  <SalesRoleplayLab />
                </div>
              </div>
            )}
            {currentSubTabId === 'pricing_retention' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <PricingStrategyLab />
                  <PricingOfferBuilder />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <CustomerLTVDashboard />
                  <NPSReviewManager />
                </div>
                <AffiliateReferralHub />
              </div>
            )}
          </>
        )}

        {/* Legacy Operations Hub */}
        {activeSegment === 'operations' && (
          <>
            {currentSubTabId === 'product_studio' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <SoloFounderBusiness />
                  <WebAccountingRoadmap />
                </div>
                <GameStudioBuilder />
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
                    </Card>
                  ))}
                </section>
              </div>
            )}
            {currentSubTabId === 'growth_marketing' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <MarketingSuite />
                  <MarketingFunnelLab />
                </div>
                <MarketingCommandCenter />
                <div className="grid gap-4 md:grid-cols-2">
                  <LandingPageCopyLab />
                  <ZaloMarketingHub />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <SyntheticSurveyBuilder />
                  <AIContentVideoLab />
                </div>
                <AdCampaignSimulator />
              </div>
            )}
            {currentSubTabId === 'sales_crm' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <OutboundSalesHub />
                  <DistributionLeadBoard />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <LeadScoringEngine />
                  <AffiliateReferralHub />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <PricingStrategyLab />
                  <SalesRoleplayLab />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <CustomerLTVDashboard />
                  <PricingOfferBuilder />
                </div>
              </div>
            )}
            {currentSubTabId === 'logistics' && (
              <div className="space-y-6">
                <ProjectPortfolioPanel />
                <ProcurementLogisticsPanel />
              </div>
            )}
          </>
        )}

        {/* AI Operations */}
        {activeSegment === 'ai_factory' && (
          <>
            {currentSubTabId === 'command' && (
              <div className="space-y-6">
                <AIWorkforceCommandCenter />
                <AIWorkforceMissionControl />
              </div>
            )}
            {currentSubTabId === 'missions' && (
              <div className="space-y-6">
                <AIWorkforceRuntimePanel />
                <MissionOperatorRunbookPanel />
                <AIWorkforceMissionControl />
                <AIWorkforceMissionTemplates />
                <AIWorkforceMissionTrace />
                <MissionReleaseGatePanel />
                <MissionSnapshotExportPanel />
                <MissionReviewNoteSavePanel />
                <ReleaseGateDashboardCard />
              </div>
            )}
            {currentSubTabId === 'advanced' && (
              <div className="space-y-6">
                <AIOperationsCenter />
                <AIOperationsDaemonPanel />
                <AIWorkforceMobileCommandCenter />
                <AIGovernanceQualityHubPanel />
                <AIOutputQualityReview />
                <div className="grid gap-4 lg:grid-cols-2">
                  <PeopleTab />
                  <AIStaffTaskAssignmentPanel />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <AIMemoryRagPanel />
                  <KnowledgeContentHubPanel />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <PromptPlayground />
                  <AISettingsLauncher />
                </div>
                <AdvancedAIEngine />
                <AIWorkforceOpenClawReadiness />
                <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left">
                  <summary className="cursor-pointer select-none text-xs font-black uppercase tracking-[0.16em] text-slate-300 hover:text-white">
                    Mở MCP/tools, runtime, audit và diagnostics
                  </summary>
                  <div className="mt-5 space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <AIWorkforceSkillDirectory />
                      <AIWorkforceSkillInvocationPlanner />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <AIWorkforcePatchSafetyRunbook />
                      <AIWorkforcePatchReviewSessions />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <AIWorkforceNextBackendActions />
                      <AIWorkforceToolCatalog />
                    </div>
                    <AIWorkforcePluginSecurityGuard />
                    <AgentAssemblyBuilder />
                    <FactoryOperatorGuidePanel />
                    <FactoryHealthSummaryPanel />
                    <div className="grid gap-4 lg:grid-cols-2">
                      <FactoryBackendRuntimePanel />
                      <FactoryCatalogStatusPanel />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <FactoryConnectorMatrixPanel />
                      <FactoryExecutionDecisionPanel />
                    </div>
                    <FactoryCommandRunnerPanel />
                    <FactoryAuditLogPanel />
                    <FounderLabsDock embedded />
                  </div>
                </details>
              </div>
            )}
            {currentSubTabId === 'robot_auto' && (
              <div className="space-y-6">
                <AIWorkforceRobotAutomationBridge />
                <div className="grid gap-4 lg:grid-cols-2">
                  <AutomationRulesHealthPanel />
                  <AutomationRulesPanel />
                </div>
                <RobotLabPanel />
              </div>
            )}
          </>
        )}

        {/* 5. DevOps Hub */}
        {activeSegment === 'devops_hub' && (
          <>
            {currentSubTabId === 'build_monitor' && (
              <div className="space-y-6">
                <BuildMonitorPanel />
                <MergeReadinessCenter />
              </div>
            )}
            {currentSubTabId === 'pr_control' && (
              <div className="space-y-6">
                <PRControlCenter />
                <ApprovedPrLauncher />
              </div>
            )}
            {currentSubTabId === 'patch_review' && (
              <div className="space-y-6">
                <PatchDiffReviewCenter />
                <SandboxPatchWorkspace />
              </div>
            )}
            {currentSubTabId === 'rollback_center' && <RollbackCenter />}
            {currentSubTabId === 'ci_doctor' && (
              <div className="space-y-6">
                <GitHubCIDoctorLauncher />
                <CIRecoveryQueue />
              </div>
            )}
            {currentSubTabId === 'runtime_logs' && (
              <div className="space-y-6">
                <CIRunInspectorPanel />
                <DevHandoffLauncher />
              </div>
            )}
          </>
        )}

        {/* 6. Control Room */}
        {activeSegment === 'control_room' && (
          <>
            {currentSubTabId === 'system_health' && (
              <div className="space-y-6">
                <ConfigHealthMonitor />
              </div>
            )}
            {currentSubTabId === 'security' && <SecurityControlCenter />}
            {currentSubTabId === 'audit_trail' && <AuditTrailPanel />}
            {currentSubTabId === 'approvals' && <ApprovalWorkflow />}
            {currentSubTabId === 'backup_restore' && <ArtifactInspectorPanel />}
            {currentSubTabId === 'emergency_stop' && (
              <Card className="border-rose-900 bg-rose-950/20 text-center max-w-xl mx-auto py-10">
                <ShieldAlert className="mx-auto h-16 w-16 text-rose-500 animate-pulse" />
                <h2 className="mt-4 text-lg font-black text-rose-200">EMERGENCY STOP CENTER</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-rose-300/80">
                  Nhấn nút bên dưới sẽ lập tức ngắt toàn bộ tiến trình chạy tự động (Agent loops, browser automation, robot movement) trên local và ghi nhận biên bản sự cố.
                </p>
                <button
                  type="button"
                  onClick={() => alert('EMERGENCY STOP TRIGGERED: Daemon loop paused, emergency log serialized.')}
                  className="mt-6 rounded-2xl bg-rose-600 px-8 py-4 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-700 active:scale-95 transition shadow-lg shadow-rose-950/50 border border-rose-500/30"
                >
                  Dừng khẩn cấp (Emergency Stop)
                </button>
              </Card>
            )}
          </>
        )}

        {/* 7. Analytics Lab */}
        {activeSegment === 'analytics' && (
          <>
            {currentSubTabId === 'python_sandbox' && <PythonSandbox />}
            {currentSubTabId === 'data_science' && (
              <div className="space-y-6">
                <DataScienceEngineering />
                <FinancialDataScienceLab />
                <FinancialChartsModelPanel />
              </div>
            )}
            {currentSubTabId === 'game_studio' && (
              <div className="space-y-6">
                <GameStudioBuilder />
                <GameAndMLWorkbench />
              </div>
            )}
            {currentSubTabId === 'ml_applied' && <MLApplied />}
            {currentSubTabId === 'architecture' && <AIEcosystemArchitecture />}
            {currentSubTabId === 'gemini_playground' && <GeminiPlayground />}
          </>
        )}

        {/* 8. Settings & Admin */}
        {activeSegment === 'system_settings' && (
          <>
            {currentSubTabId === 'general' && (
              <div className="space-y-6">
                <SystemSettingsPanel />
                <IntegrationHub />
                <Card>
                  <h2 className="text-sm font-black text-white">User Roles</h2>
                  <p className="mt-1 text-xs text-slate-500">Founder, Admin, Finance, AgentOps, DevOps, Marketing và Viewer dùng cùng workspace nhưng khác mức hiển thị.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {['Founder: toàn quyền điều hành', 'AgentOps: AI Nhân sự và approvals', 'DevOps: build, CI, rollback'].map((item) => (
                      <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-bold text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
            {currentSubTabId === 'devops' && (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <BuildMonitorPanel />
                  <MergeReadinessCenter />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <PRControlCenter />
                  <PatchDiffReviewCenter />
                </div>
                <SandboxPatchWorkspace />
                <div className="grid gap-4 lg:grid-cols-2">
                  <GitHubCIDoctorLauncher />
                  <CIRecoveryQueue />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <CIRunInspectorPanel />
                  <DevHandoffLauncher />
                </div>
              </div>
            )}
            {currentSubTabId === 'control' && (
              <div className="space-y-6">
                <ConfigHealthMonitor />
                <SecurityControlCenter />
                <AuditTrailPanel />
                <RollbackCenter />
              </div>
            )}
            {currentSubTabId === 'safety_gates' && (
              <div className="space-y-6">
                <ApprovalWorkflow />
                <ApprovedPrLauncher />
                <ReleaseArtifactCenter />
                <ArtifactInspectorPanel />
              </div>
            )}
            {currentSubTabId === 'emergency' && (
              <Card className="border-rose-900 bg-rose-950/20 text-center max-w-xl mx-auto py-10">
                <ShieldAlert className="mx-auto h-16 w-16 text-rose-500 animate-pulse" />
                <h2 className="mt-4 text-lg font-black text-rose-200">EMERGENCY STOP CENTER</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-rose-300/80">
                  Dừng toàn bộ automation/agent loop trên local và ghi nhận biên bản sự cố để founder rà soát.
                </p>
                <button
                  type="button"
                  onClick={() => alert('EMERGENCY STOP TRIGGERED: Daemon loop paused, emergency log serialized.')}
                  className="mt-6 rounded-2xl bg-rose-600 px-8 py-4 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-700 active:scale-95 transition shadow-lg shadow-rose-950/50 border border-rose-500/30"
                >
                  Dừng khẩn cấp (Emergency Stop)
                </button>
              </Card>
            )}
            {currentSubTabId === 'ai_gateway' && <SystemSettingsPanel />}
            {currentSubTabId === 'integrations' && <IntegrationHub />}
            {currentSubTabId === 'user_roles' && (
              <Card>
                <h2 className="text-sm font-black text-white">Enterprise User Roles</h2>
                <p className="mt-1 text-xs text-slate-500">Bảng phân quyền truy cập module dựa trên chức vụ nhân sự thực tế.</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-semibold text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2">Chức vụ (Role)</th>
                        <th className="py-2">Module được phép</th>
                        <th className="py-2">Đặc quyền nguy hiểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-800/50">
                        <td className="py-3 font-black text-cyan-200">Founder</td>
                        <td className="py-3">Tất cả modules</td>
                        <td className="py-3 text-emerald-400">Đầy đủ (Full Access)</td>
                      </tr>
                      <tr className="border-b border-slate-800/50">
                        <td className="py-3 font-black text-cyan-200">Finance CFO</td>
                        <td className="py-3">Finance & Accounting, Analytics</td>
                        <td className="py-3 text-emerald-400">Phê duyệt giải ngân</td>
                      </tr>
                      <tr className="border-b border-slate-800/50">
                        <td className="py-3 font-black text-cyan-200">DevOps Engineer</td>
                        <td className="py-3">DevOps Hub, Control Room, Analytics</td>
                        <td className="py-3 text-amber-500">Rollback, PR Release</td>
                      </tr>
                      <tr className="border-b border-slate-800/50">
                        <td className="py-3 font-black text-cyan-200">AgentOps Engineer</td>
                        <td className="py-3">AI Operations, Control Room</td>
                        <td className="py-3 text-amber-500">Dừng khẩn cấp Agent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {currentSubTabId === 'permissions' && (
              <Card>
                <h2 className="text-sm font-black text-white">Agent Capabilities Allowed</h2>
                <p className="mt-1 text-xs text-slate-500">Danh mục các hành vi mà AI/Agent được phép thực hiện trên máy chủ.</p>
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                    <strong className="text-cyan-200 block text-xs">read_file / read_directory</strong>
                    <span className="text-[11px] text-slate-400">Cho phép AI đọc cấu trúc code và file tĩnh để hỗ trợ tư vấn.</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                    <strong className="text-cyan-200 block text-xs">write_file / code_patch</strong>
                    <span className="text-[11px] text-slate-400">Chỉ thực hiện trong sandbox, yêu cầu approval gate từ DevOps trước khi merge PR.</span>
                  </div>
                </div>
              </Card>
            )}
            {currentSubTabId === 'environment' && (
              <Card>
                <h2 className="text-sm font-black text-white">Environment Configuration</h2>
                <p className="mt-1 text-xs text-slate-500">Trạng thái cấu hình server thực thi cục bộ (Local parity check).</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex justify-between">
                    <span>Daemon Executable:</span>
                    <strong className="text-emerald-400">node (Standard CJS)</strong>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex justify-between">
                    <span>SQLite Backend:</span>
                    <strong className="text-emerald-400">Ready (Local persistent)</strong>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Dynamic Fallback Modules (for Auto-Registration from Backend) */}
        {!['ceo_command', 'product_studio', 'marketing_growth', 'sales_crm', 'finance_accounting', 'operations', 'ai_factory', 'devops_hub', 'control_room', 'analytics', 'system_settings'].includes(activeSegment) && (
          <DynamicModuleComponentLoader moduleId={activeSegment} />
        )}
      </Suspense>
    </div>
  );
}
