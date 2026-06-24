import React, { Suspense, useState } from 'react';
import { TabType } from './companyNavigation';
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
    { id: 'brief', label: 'Bảng chiến lược', icon: Briefcase },
    { id: 'daily_weekly', label: 'CEO Standup & Lịch tuần', icon: Activity },
    { id: 'library', label: 'Cơ sở tri thức (RAG)', icon: Database },
    { id: 'sop_rd', label: 'Quy trình SOP & Kiểm định', icon: ShieldCheck }
  ],
  product_studio: [
    { id: 'ideas_moat', label: 'Ý tưởng & Lợi thế (Moats)', icon: Target },
    { id: 'dev_hub', label: 'Phát triển & Lộ trình', icon: FolderKanban },
    { id: 'game_studio', label: 'Game Studio', icon: PlayCircle },
    { id: 'pricing', label: 'Gói bán & Định giá', icon: Coins },
    { id: 'tasks_progress', label: 'Quản lý công việc & Tiến độ', icon: LayoutList },
    { id: 'deploy', label: 'Pháp lý & Thanh toán', icon: PlayCircle }
  ],
  growth_sales: [
    { id: 'campaign_funnel', label: 'Chiến dịch & Phễu (SEO)', icon: BarChart3 },
    { id: 'content_zalo', label: 'Nội dung & Zalo Hub', icon: Mail },
    { id: 'video_creator', label: 'Video & Media Lab', icon: PlayCircle },
    { id: 'market_research', label: 'Khảo sát & Nghiên cứu', icon: MessageSquare },
    { id: 'rollout', label: 'Bảng điều hành & QA', icon: Code },
    { id: 'leads_outreach', label: 'Phễu Lead & Tiếp cận', icon: UsersRound },
    { id: 'ltv_nps', label: 'Giữ chân & NPS', icon: UserCheck },
    { id: 'affiliate', label: 'Đại lý & Liên kết', icon: Sparkles },
    { id: 'pricing_lab', label: 'Phòng thí nghiệm giá', icon: Coins }
  ],
  finance_accounting: [
    { id: 'ledger_accounting', label: 'Sổ cái & Định khoản VAS', icon: Database },
    { id: 'reports', label: 'Báo cáo tài chính', icon: Calculator },
    { id: 'revenue', label: 'Doanh thu & Dòng tiền', icon: TrendingUp },
    { id: 'founder_review', label: 'Founder Review', icon: ClipboardList },
    { id: 'runway_advisory', label: 'Runway & Cố vấn rủi ro', icon: ShieldCheck },
    { id: 'approval', label: 'Phê duyệt chứng từ', icon: CheckCircle },
    { id: 'coso', label: 'Kiểm toán nội bộ COSO', icon: ShieldCheck }
  ],
  ai_staff_sandbox: [
    { id: 'staff_assistants', label: 'Đội ngũ & Trợ lý AI', icon: Bot },
    { id: 'ai_ops', label: 'AI Operations Center', icon: Cpu },
    { id: 'robot_lab', label: 'Robot Lab', icon: Bot },
    { id: 'automation_rules', label: 'Automation Rules', icon: Zap },
    { id: 'prompt_labs', label: 'Kỹ nghệ Prompts & Labs', icon: Cpu },
    { id: 'quality', label: 'Kiểm định chất lượng', icon: ShieldCheck },
    { id: 'python_sql_datascience', label: 'Python & SQL Sandbox', icon: Terminal },
    { id: 'browser_sim', label: 'Browser Simulation', icon: Globe },
    { id: 'finance_ds', label: 'Financial Data Science', icon: TrendingUp },
    { id: 'project_memory', label: 'Project Memory Log', icon: BookOpen },
    { id: 'ai_game_studio', label: 'Studio AI, Game & Mạng', icon: Code },
    { id: 'simulation', label: 'Kinh tế học mô phỏng', icon: PlayCircle }
  ],
  system_settings: [
    { id: 'general', label: 'Cài đặt hệ thống', icon: Settings },
    { id: 'connections', label: 'Tích hợp platform', icon: Network },
    { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
    { id: 'build_monitor', label: 'Build Monitor', icon: Terminal },
    { id: 'config_health', label: 'Config Health', icon: Activity },
    { id: 'security', label: 'Security Control', icon: ShieldCheck },
    { id: 'merge_readiness', label: 'Merge Readiness', icon: GitCommit },
    { id: 'pr_control', label: 'PR Control', icon: GitPullRequest },
    { id: 'patch_diff', label: 'Patch Diff Review', icon: FileDiff },
    { id: 'release_artifact', label: 'Release Artifacts', icon: Package },
    { id: 'rollback', label: 'Rollback Center', icon: Rewind },
    { id: 'sandbox_patch', label: 'Sandbox Patch', icon: FlaskConical },
    { id: 'ci_recovery', label: 'CI Recovery', icon: RefreshCw },
    { id: 'ci_run', label: 'CI Run Inspector', icon: Search },
    { id: 'dev_handoff', label: 'Dev Handoff', icon: Send },
    { id: 'ci_doctor', label: 'CI Doctor', icon: Stethoscope },
    { id: 'approved_pr', label: 'Approved PR', icon: CheckCircle }
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
    product_studio: 'ideas_moat',
    growth_sales: 'campaign_funnel',
    finance_accounting: 'ledger_accounting',
    ai_staff_sandbox: 'staff_assistants',
    system_settings: 'general',
  });

  // Sync subtab from hash if present
  React.useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/\?subtab=([^&]+)/);
    if (match && match[1]) {
      const subTabId = match[1];
      const validSubTabs = SUB_TABS_CONFIG[activeSegment] || [];
      if (validSubTabs.some((t) => t.id === subTabId)) {
        setActiveSubTabs((prev) => ({
          ...prev,
          [activeSegment]: subTabId,
        }));
      }
    }
  }, [activeSegment]);

  const subTabs = SUB_TABS_CONFIG[activeSegment] || [];
  const currentSubTabId = activeSubTabs[activeSegment] || '';

  const handleSubTabChange = (newSubTabId: string) => {
    setActiveSubTabs((prev) => ({
      ...prev,
      [activeSegment]: newSubTabId,
    }));
    window.location.hash = `/${activeSegment}?subtab=${newSubTabId}`;
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
            {currentSubTabId === 'library' && <KnowledgeBaseTab />}
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
            {currentSubTabId === 'ideas_moat' && (
              <div className="space-y-6">
                <SoloFounderBusiness />
                <MoatDefensibilityTracker />
              </div>
            )}
            {currentSubTabId === 'dev_hub' && (
              <div className="space-y-6">
                <GuerrillaProductHub />
                <WebAccountingRoadmap />
              </div>
            )}
            {currentSubTabId === 'pricing' && <PricingOfferBuilder />}
            {currentSubTabId === 'game_studio' && <GameStudioBuilder />}
            {currentSubTabId === 'tasks_progress' && (
              <div className="space-y-6">
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
            {currentSubTabId === 'deploy' && <DeployBusiness />}
          </>
        )}

        {/* 3. Marketing & Growth */}
        {activeSegment === 'growth_sales' && (
          <>
            {currentSubTabId === 'campaign_funnel' && (
              <div className="space-y-6">
                <AdCampaignSimulator />
                <MarketingCommandCenter />
                <MarketingV2LaunchPlaybookPanel />
                <MarketingSuite />
                <GoogleKeywordStrategy />
                <MarketingFunnelLab />
              </div>
            )}
            {currentSubTabId === 'content_zalo' && (
              <div className="space-y-6">
                <LandingPageCopyLab />
                <EmailSequenceBuilder />
                <ZaloMarketingHub />
              </div>
            )}
            {currentSubTabId === 'video_creator' && <AIContentVideoLab />}
            {currentSubTabId === 'market_research' && (
              <div className="space-y-6">
                <SyntheticSurveyBuilder />
                <MarketSurveySimulator />
              </div>
            )}
            {currentSubTabId === 'rollout' && (
              <div className="space-y-6">
                <MarketingV2ExecutionBoardPanel />
                <MarketingV2QAConsole />
              </div>
            )}
            {currentSubTabId === 'leads_outreach' && (
              <div className="space-y-6">
                <SalesRoleplayLab />
                <OutboundSalesHub />
                <DistributionLeadBoard />
                <LeadScoringEngine />
              </div>
            )}

            {currentSubTabId === 'ltv_nps' && (
              <div className="space-y-6">
                <CustomerLTVDashboard />
                <NPSReviewManager />
              </div>
            )}
            {currentSubTabId === 'affiliate' && <AffiliateReferralHub />}
            {currentSubTabId === 'pricing_lab' && <PricingStrategyLab />}
          </>
        )}

        {/* 4. Tài chính & Kế toán */}
        {activeSegment === 'finance_accounting' && (
          <>
            {currentSubTabId === 'ledger_accounting' && <LedgerAccountingWorkspace />}
            {currentSubTabId === 'reports' && <FinancialReportsVN />}
            {currentSubTabId === 'revenue' && <RevenueDashboard />}
            {currentSubTabId === 'founder_review' && <FounderReviewChecklist />}
            {currentSubTabId === 'runway_advisory' && <AdvisoryBoardReport />}
            {currentSubTabId === 'approval' && <ApprovalWorkflow />}
            {currentSubTabId === 'coso' && (
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
            {currentSubTabId === 'staff_assistants' && (
              <div className="space-y-6">
                <AgentAssemblyBuilder />
                <PeopleTab />
                <AIAssistantLauncher />
              </div>
            )}
            {currentSubTabId === 'ai_ops' && <AIOperationsCenter />}
            {currentSubTabId === 'robot_lab' && <RobotLabPanel />}
            {currentSubTabId === 'automation_rules' && <AutomationRulesPanel />}
            {currentSubTabId === 'prompt_labs' && (
              <div className="space-y-6">
                <PromptPlayground />
                <AdvancedAIEngine />
              </div>
            )}
            {currentSubTabId === 'quality' && <AIOutputQualityReview />}
            {currentSubTabId === 'python_sql_datascience' && (
              <div className="space-y-6">
                <PythonSandbox />
                <DataScienceEngineering />
              </div>
            )}
            {currentSubTabId === 'browser_sim' && <BrowserSimulationPlanner />}
            {currentSubTabId === 'finance_ds' && <FinancialDataScienceLab />}
            {currentSubTabId === 'project_memory' && <ProjectMemoryDecisionLog />}
            {currentSubTabId === 'ai_game_studio' && (
              <div className="space-y-6">
                <GameAndMLWorkbench />
                <MLApplied />
                <AIEcosystemArchitecture />
              </div>
            )}
            {currentSubTabId === 'simulation' && <FounderLabsDock embedded />}

          </>
        )}

        {/* 6. Cài đặt hệ thống */}
        {activeSegment === 'system_settings' && (
          <>
            {currentSubTabId === 'general' && <SystemSettingsPanel />}
            {currentSubTabId === 'connections' && <IntegrationHub />}
            {currentSubTabId === 'audit' && <AuditTrailPanel />}
            {currentSubTabId === 'build_monitor' && <BuildMonitorPanel />}
            {currentSubTabId === 'config_health' && <ConfigHealthMonitor />}
            {currentSubTabId === 'security' && <SecurityControlCenter />}
            {currentSubTabId === 'merge_readiness' && <MergeReadinessCenter />}
            {currentSubTabId === 'pr_control' && <PRControlCenter />}
            {currentSubTabId === 'patch_diff' && <PatchDiffReviewCenter />}
            {currentSubTabId === 'release_artifact' && <ReleaseArtifactCenter />}
            {currentSubTabId === 'rollback' && <RollbackCenter />}
            {currentSubTabId === 'sandbox_patch' && <SandboxPatchWorkspace />}
            {currentSubTabId === 'ci_recovery' && <CIRecoveryQueue />}
            {currentSubTabId === 'ci_run' && <CIRunInspectorPanel />}
            {currentSubTabId === 'dev_handoff' && <DevHandoffLauncher />}
            {currentSubTabId === 'ci_doctor' && <GitHubCIDoctorLauncher />}
            {currentSubTabId === 'approved_pr' && <ApprovedPrLauncher />}
          </>
        )}
      </Suspense>
    </div>
  );
}
