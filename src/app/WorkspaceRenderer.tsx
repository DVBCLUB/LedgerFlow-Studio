import React, { Suspense } from 'react';
import { TabType } from './companyNavigation';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
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

// ─── Lazy Workspace Imports ───────────────────────────────────────────────────
const SoloFounderBusiness      = React.lazy(() => import('../components/SoloFounderBusiness'));
const WebAccountingRoadmap     = React.lazy(() => import('../components/WebAccountingRoadmap'));
const DataScienceEngineering   = React.lazy(() => import('../components/DataScienceEngineering'));
const PromptPlayground         = React.lazy(() => import('../components/PromptPlayground'));
const GeminiPlayground         = React.lazy(() => import('../components/GeminiPlayground'));
const CustomDataWorkbench      = React.lazy(() => import('../components/CustomDataWorkbench'));
const AIEcosystemArchitecture  = React.lazy(() => import('../components/AIEcosystemArchitecture'));
const AnalyticsWorkspace      = React.lazy(() => import('../components/AnalyticsWorkspace'));
const GuerrillaProductHub      = React.lazy(() => import('../components/GuerrillaProductHub'));
const AccountingVietnam        = React.lazy(() => import('../components/AccountingVietnam'));
const MLApplied                = React.lazy(() => import('../components/MLApplied'));
const DeployBusiness           = React.lazy(() => import('../components/DeployBusiness'));
const CommandCenter            = React.lazy(() => import('../components/CommandCenter'));
const AdvisoryBoardReport      = React.lazy(() => import('../components/AdvisoryBoardReport'));
const MarketSurveySimulator    = React.lazy(() => import('../components/MarketSurveySimulator'));
const GoogleKeywordStrategy    = React.lazy(() => import('../components/GoogleKeywordStrategy'));
const InternalAuditWorkspace   = React.lazy(() => import('../components/InternalAuditWorkspace'));
const PythonSandbox            = React.lazy(() => import('../components/PythonSandbox'));
const MarketingSuite           = React.lazy(() => import('../components/MarketingSuite'));
const MarketingFunnelLab       = React.lazy(() => import('../components/MarketingFunnelLab'));
const LeadScoringEngine        = React.lazy(() => import('../components/LeadScoringEngine'));
const ZaloMarketingHub         = React.lazy(() => import('../components/ZaloMarketingHub'));
const CustomerLTVDashboard     = React.lazy(() => import('../components/CustomerLTVDashboard'));
const PricingStrategyLab       = React.lazy(() => import('../components/PricingStrategyLab'));
const NPSReviewManager         = React.lazy(() => import('../components/NPSReviewManager'));
const AffiliateReferralHub     = React.lazy(() => import('../components/AffiliateReferralHub'));
const OutboundSalesHub         = React.lazy(() => import('../components/OutboundSalesHub'));
const AdvancedAIEngine         = React.lazy(() => import('../components/AdvancedAIEngine'));
const AIContentVideoLab        = React.lazy(() => import('../components/AIContentVideoLab'));
const MarketingGrowthV2Workspace = React.lazy(() => import('../components/MarketingGrowthV2Workspace'));
const ApprovalWorkflow         = React.lazy(() => import('../components/ApprovalWorkflow'));
const FinancialReportsVN       = React.lazy(() => import('../components/FinancialReportsVN'));
const IntegrationHub           = React.lazy(() => import('../components/IntegrationHub'));
const SystemSettingsPanel      = React.lazy(() => import('../modules/system-settings/SystemSettingsPanel'));
const KnowledgeBaseTab         = React.lazy(() => import('../modules/knowledge-library/KnowledgeBaseTab'));
const PeopleTab                = React.lazy(() => import('../components/agent-ops/tabs/PeopleTab'));

// ─── Props ────────────────────────────────────────────────────────────────────
interface WorkspaceRendererProps {
  activeSegment: TabType;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────
export default function WorkspaceRenderer({ activeSegment }: WorkspaceRendererProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {activeSegment === 'dashboard'          && <CommandCenter />}
      {activeSegment === 'knowledge'          && <KnowledgeBaseTab />}
      {activeSegment === 'advisory'           && <AdvisoryBoardReport />}
      {activeSegment === 'market_survey'      && <MarketSurveySimulator />}
      {activeSegment === 'guerrilla'          && <GuerrillaProductHub />}
      {activeSegment === 'founder'            && <SoloFounderBusiness />}
      {activeSegment === 'roadmap'            && <WebAccountingRoadmap />}
      {activeSegment === 'datascience'        && <DataScienceEngineering />}
      {activeSegment === 'prompts'            && <PromptPlayground />}
      {activeSegment === 'assistant'          && <GeminiPlayground />}
      {activeSegment === 'ai_staff'           && <PeopleTab />}
      {activeSegment === 'advanced_ai'        && <AdvancedAIEngine />}
      {activeSegment === 'custom_data'        && <CustomDataWorkbench />}
      {activeSegment === 'architecture'       && <AIEcosystemArchitecture />}
      {activeSegment === 'game_ml'            && <AnalyticsWorkspace />}
      {activeSegment === 'accounting_vn'      && <AccountingVietnam />}
      {activeSegment === 'audit_workspace'    && <InternalAuditWorkspace />}
      {activeSegment === 'python_sandbox'     && <PythonSandbox />}
      {activeSegment === 'ml_applied'         && <MLApplied />}
      {activeSegment === 'deploy_business'    && <DeployBusiness />}
      {activeSegment === 'seo_strategy'       && <GoogleKeywordStrategy />}
      {activeSegment === 'marketing_suite'    && <MarketingSuite />}
      {activeSegment === 'funnel_lab'         && <MarketingFunnelLab />}
      {activeSegment === 'lead_scoring'       && <LeadScoringEngine />}
      {activeSegment === 'zalo_hub'           && <ZaloMarketingHub />}
      {activeSegment === 'ltv_dashboard'      && <CustomerLTVDashboard />}
      {activeSegment === 'pricing_lab'        && <PricingStrategyLab />}
      {activeSegment === 'nps_manager'        && <NPSReviewManager />}
      {activeSegment === 'affiliate_hub'      && <AffiliateReferralHub />}
      {activeSegment === 'outbound_hub'       && <OutboundSalesHub />}
      {activeSegment === 'video_lab'          && <AIContentVideoLab />}
      {activeSegment === 'marketing_growth_v2' && <MarketingGrowthV2Workspace />}
      {activeSegment === 'approval_workflow'  && <ApprovalWorkflow />}
      {activeSegment === 'financial_reports'  && <FinancialReportsVN />}
      {activeSegment === 'integration_hub'    && <IntegrationHub />}
      {activeSegment === 'system_settings'    && <SystemSettingsPanel />}
    </Suspense>
  );
}
