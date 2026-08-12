import React, { Suspense, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  Calculator,
  CheckCircle,
  ClipboardList,
  Code,
  Database,
  FileCheck2,
  FolderKanban,
  Mail,
  Network,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TestTubeDiagonal,
  TrendingUp,
  UsersRound,
  Film,
  Gamepad2,
  Lightbulb,
} from 'lucide-react';
import { TabType, RoleType } from './companyNavigation';
import { resolveWorkspaceSubTab } from './workspaceSubtabAliases';
import WorkspaceSubNavigation from '../components/shared/WorkspaceSubNavigation';
import SimplePanelCard from '../components/shared/SimplePanelCard';
import Skeleton from '../components/ui/Skeleton';

const LedgerAccountingWorkspace = React.lazy(() => import('../modules/finance-accounting/LedgerAccountingWorkspace'));
const FinancialReportsVN = React.lazy(() => import('../modules/finance-accounting/FinancialReportsVN'));
const RevenueDashboard = React.lazy(() => import('../modules/finance-accounting/RevenueDashboard'));
const ApprovalWorkflow = React.lazy(() => import('../modules/dev-ops/ApprovalWorkflow'));
const PythonSandbox = React.lazy(() => import('../modules/analytics-models-sandbox/PythonSandbox'));
const Analytics3DLab = React.lazy(() => import('../modules/analytics-models-sandbox/Analytics3DLab'));
const BusinessSimulationEngine = React.lazy(() => import('../modules/analytics-models-sandbox/BusinessSimulationEngine'));
const FinancialChartsModelPanel = React.lazy(() => import('../components/analytics/FinancialChartsModelPanel'));
const AIObservabilityDashboard = React.lazy(() => import('../modules/analytics-models-sandbox/AIObservabilityDashboard'));
const AIEcosystemArchitecture = React.lazy(() => import('../modules/analytics-models-sandbox/AIEcosystemArchitecture'));
const MarketSurveySimulator = React.lazy(() => import('../modules/analytics-models-sandbox/MarketSurveySimulator'));
const FinancialDataScienceLab = React.lazy(() => import('../modules/analytics-models-sandbox/FinancialDataScienceLab'));
const PromptPlayground = React.lazy(() => import('../modules/analytics-models-sandbox/PromptPlayground'));
const ProjectMemoryDecisionLog = React.lazy(() => import('../modules/analytics-models-sandbox/ProjectMemoryDecisionLog'));
const BrowserSimulationPlanner = React.lazy(() => import('../modules/analytics-models-sandbox/BrowserSimulationPlanner'));
const DataScienceEngineering = React.lazy(() => import('../modules/analytics-models-sandbox/DataScienceEngineering'));
const DeployBusiness = React.lazy(() => import('../modules/analytics-models-sandbox/DeployBusiness'));
const GeminiPlayground = React.lazy(() => import('../modules/analytics-models-sandbox/GeminiPlayground'));
const MLApplied = React.lazy(() => import('../modules/analytics-models-sandbox/MLApplied'));
const ABSimulationLab = React.lazy(() => import('../modules/analytics-models-sandbox/ABSimulationLab'));
const ExperimentDashboard = React.lazy(() => import('../modules/analytics-models-sandbox/ExperimentDashboard'));
const ExperimentDecisionLog = React.lazy(() => import('../modules/analytics-models-sandbox/ExperimentDecisionLog'));
const CustomDataWorkbench = React.lazy(() => import('../modules/analytics-models-sandbox/CustomDataWorkbench'));
const MultiIndustryCaseBank = React.lazy(() => import('../modules/analytics-models-sandbox/MultiIndustryCaseBank'));
const N8nAutomationBlueprint = React.lazy(() => import('../modules/analytics-models-sandbox/N8nAutomationBlueprint'));
const MoatDefensibilityTracker = React.lazy(() => import('../modules/analytics-models-sandbox/MoatDefensibilityTracker'));
const MoRReadinessChecklist = React.lazy(() => import('../modules/analytics-models-sandbox/MoRReadinessChecklist'));
const StartHereLab = React.lazy(() => import('../modules/analytics-models-sandbox/StartHereLab'));
const StrategicLabsMini = React.lazy(() => import('../modules/analytics-models-sandbox/StrategicLabsMini'));
const OperatingKnowledgeLayerPanel = React.lazy(() => import('../components/operating-knowledge/OperatingKnowledgePanels').then((module) => ({ default: module.OperatingKnowledgeLayerPanel })));
const FounderLabsDock = React.lazy(() => import('../components/shared/FounderLabsDock'));
const SystemSettingsPanel = React.lazy(() => import('../modules/system-settings/SystemSettingsPanel'));
const IntegrationHub = React.lazy(() => import('../modules/dev-ops/IntegrationHub'));
const BuildMonitorPanel = React.lazy(() => import('../modules/dev-ops/BuildMonitorPanel'));
const MergeReadinessCenter = React.lazy(() => import('../modules/dev-ops/MergeReadinessCenter'));
const PRControlCenter = React.lazy(() => import('../modules/dev-ops/PRControlCenter'));
const GitHubCIDoctorLauncher = React.lazy(() => import('../modules/dev-ops/GitHubCIDoctorLauncher'));
const DevHandoffCenter = React.lazy(() => import('../modules/dev-ops/DevHandoffCenter'));
const ApprovedPrPanel = React.lazy(() => import('../modules/dev-ops/ApprovedPrPanel'));
const GitAssistantDaemonPanel = React.lazy(() => import('../modules/dev-ops/GitAssistantDaemonPanel'));
const PatchDiffReviewCenter = React.lazy(() => import('../modules/dev-ops/PatchDiffReviewCenter'));
const ReleaseArtifactCenter = React.lazy(() => import('../modules/dev-ops/ReleaseArtifactCenter'));
const RollbackCenter = React.lazy(() => import('../modules/dev-ops/RollbackCenter'));
const SandboxPatchWorkspace = React.lazy(() => import('../modules/dev-ops/SandboxPatchWorkspace'));
const AuditTrailPanel = React.lazy(() => import('../modules/dev-ops/AuditTrailPanel'));
const ArtifactInspectorPanel = React.lazy(() => import('../modules/dev-ops/ArtifactInspectorPanel'));
const CIRecoveryQueue = React.lazy(() => import('../modules/dev-ops/CIRecoveryQueue'));
const CIRunInspectorPanel = React.lazy(() => import('../modules/dev-ops/CIRunInspectorPanel'));
const ConfigHealthMonitor = React.lazy(() => import('../modules/dev-ops/ConfigHealthMonitor'));
const ConnectorContractPanel = React.lazy(() => import('../modules/dev-ops/ConnectorContractPanel'));
const GitHubConnectorPanel = React.lazy(() => import('../modules/dev-ops/GitHubConnectorPanel'));
const LocalToolsPanel = React.lazy(() => import('../modules/dev-ops/LocalToolsPanel'));
const SecurityControlCenter = React.lazy(() => import('../modules/dev-ops/SecurityControlCenter'));
const WebAiSyncPanel = React.lazy(() => import('../modules/dev-ops/WebAiSyncPanel'));
const SystemOverviewDaemonPanel = React.lazy(() => import('../modules/dev-ops/SystemOverviewDaemonPanel'));
const DevOpsReleaseHubPanel = React.lazy(() => import('../modules/dev-ops/DevOpsReleaseHubPanel'));
const DeveloperIntelligenceHubPanel = React.lazy(() => import('../modules/dev-ops/DeveloperIntelligenceHubPanel'));
const AIIntegrationHealthPanel = React.lazy(() => import('../modules/system-settings/AIIntegrationHealthPanel'));
const ApiConnectionHealthMatrix = React.lazy(() => import('../modules/system-settings/components/ApiConnectionHealthMatrix'));
const CEOOverviewPanel = React.lazy(() => import('../modules/command-center/CEOOverviewPanel'));
const AiAgentControlCenter = React.lazy(() => import('../modules/command-center/components/AiAgentControlCenter'));
const FounderBurnoutMonitor = React.lazy(() => import('../modules/command-center/components/FounderBurnoutMonitor'));
const NorthStarMetricBuilder = React.lazy(() => import('../modules/command-center/components/NorthStarMetricBuilder'));
const OnboardingGuide = React.lazy(() => import('../modules/command-center/components/OnboardingGuide'));
// ai-nhan-su — core panels (rendered in workspace)
const AutomationRulesPanel = React.lazy(() => import('../modules/ai-nhan-su/AutomationRulesPanel'));
const AIAssistantPanel = React.lazy(() => import('../modules/ai-nhan-su/AIAssistantPanel'));
const AICommandCenter = React.lazy(() => import('../modules/ai-nhan-su/AICommandCenter'));
const AgentAssemblyBuilder = React.lazy(() => import('../modules/ai-nhan-su/AgentAssemblyBuilder'));
const AIOperationsDaemonPanel = React.lazy(() => import('../modules/ai-nhan-su/AIOperationsDaemonPanel'));
// ai-nhan-su — internal/advanced panels (rendered under advanced sub-tab only)
const AIWorkforceTaskBoard = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceTaskBoard'));
const ModelDispatchMatrix = React.lazy(() => import('../modules/ai-nhan-su/ModelDispatchMatrix'));
const AIWorkforceOpenClawReadiness = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceOpenClawReadiness'));
const AIWorkforceSkillDirectory = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceSkillDirectory'));
const AISettingsManager = React.lazy(() => import('../modules/ai-nhan-su/AISettingsManager'));
const AIVaultSecurityPanel = React.lazy(() => import('../modules/ai-nhan-su/AIVaultSecurityPanel'));
const AIWorkforceRobotAutomationBridge = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceRobotAutomationBridge'));
const AIWorkforcePatchReviewSessions = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforcePatchReviewSessions'));
const MissionOperatorRunbookPanel = React.lazy(() => import('../modules/ai-nhan-su/MissionOperatorRunbookPanel'));
const MissionReleaseGatePanel = React.lazy(() => import('../modules/ai-nhan-su/MissionReleaseGatePanel'));
const MissionSnapshotExportPanel = React.lazy(() => import('../modules/ai-nhan-su/MissionSnapshotExportPanel'));
const AIWorkforceMissionTemplates = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMissionTemplates'));
const AIWorkforceMobileCommandCenter = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMobileCommandCenter'));
const AIWorkforceNextBackendActions = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceNextBackendActions'));
const AIWorkforceToolCatalog = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceToolCatalog'));
const AutomationRulesHealthPanel = React.lazy(() => import('../modules/ai-nhan-su/AutomationRulesHealthPanel'));
const Level6RobotSynthesizerPanel = React.lazy(() => import('../modules/ai-nhan-su/Level6RobotSynthesizerPanel'));
const MissionReviewNoteSavePanel = React.lazy(() => import('../modules/ai-nhan-su/MissionReviewNoteSavePanel'));
const MultiPlatformRobotSwarmPanel = React.lazy(() => import('../modules/ai-nhan-su/MultiPlatformRobotSwarmPanel'));
const OpenClawWebRobotPanel = React.lazy(() => import('../modules/ai-nhan-su/OpenClawWebRobotPanel').then((module) => ({ default: module.OpenClawWebRobotPanel })));
const RobotFleetAnalyticsPanel = React.lazy(() => import('../modules/ai-nhan-su/RobotFleetAnalyticsPanel'));
const RobotLabPanel = React.lazy(() => import('../modules/ai-nhan-su/RobotLabPanel'));
const WorldClassReadinessPanel = React.lazy(() => import('../modules/ai-nhan-su/WorldClassReadinessPanel').then((module) => ({ default: module.WorldClassReadinessPanel })));
const SystemStatusPage = React.lazy(() => import('../modules/ai-nhan-su/ai-assistant/SystemStatusPage'));
const WebAISchedulerPanel = React.lazy(() => import('../modules/ai-nhan-su/ai-assistant/WebAISchedulerPanel').then((module) => ({ default: module.WebAISchedulerPanel })));
const KnowledgeBaseTab = React.lazy(() => import('../modules/knowledge-library/KnowledgeBaseTab'));

const WebAccountingRoadmap = React.lazy(() => import('../modules/product-studio/WebAccountingRoadmap'));
const ProductIdeationLab = React.lazy(() => import('../modules/product-studio/ProductIdeationLab'));
const GameAndMLWorkbench = React.lazy(() => import('../modules/product-studio/GameAndMLWorkbench'));
const GameStudioBuilder = React.lazy(() => import('../modules/product-studio/GameStudioBuilder'));
const VaporwareSmokeTester = React.lazy(() => import('../modules/product-studio/components/VaporwareSmokeTester'));

const InternalAuditWorkspace = React.lazy(() => import('../modules/finance-accounting/InternalAuditWorkspace'));
const TaxAuditSimulator = React.lazy(() => import('../modules/finance-accounting/TaxAuditSimulator'));
const AdvisoryBoardReport = React.lazy(() => import('../modules/finance-accounting/AdvisoryBoardReport'));
const FounderReviewChecklist = React.lazy(() => import('../modules/finance-accounting/FounderReviewChecklist'));
const ProjectPortfolioPanel = React.lazy(() => import('../components/operations/OperationsPanels').then((module) => ({ default: module.ProjectPortfolioPanel })));
const ProcurementLogisticsPanel = React.lazy(() => import('../components/operations/OperationsPanels').then((module) => ({ default: module.ProcurementLogisticsPanel })));
const HRAdminPanel = React.lazy(() => import('../components/operations/OperationsPanels').then((module) => ({ default: module.HRAdminPanel })));

const CampaignsLab = React.lazy(() => import('../modules/marketing-growth/CampaignsLab'));
const ContentLab = React.lazy(() => import('../modules/marketing-growth/ContentLab'));
const DigitalStudioLab = React.lazy(() => import('../modules/marketing-growth/DigitalStudioLab'));

const CustomerConversionLab = React.lazy(() => import('../modules/sales-crm/CustomerConversionLab'));
const PricingAndLTVLab = React.lazy(() => import('../modules/sales-crm/PricingAndLTVLab'));
const ReferralAndNPSLab = React.lazy(() => import('../modules/sales-crm/ReferralAndNPSLab'));

type Tone = 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
type WorkspaceSubtab = { id: string; label: string; icon?: LucideIcon };
type CardConfig = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
  items: string[];
};
type StaticWorkspaceConfig = {
  title: string;
  description: string;
  chips: string[];
  cards: CardConfig[];
  compactNoticeOn?: string;
};

const SUB_TABS_CONFIG: Record<string, readonly WorkspaceSubtab[]> = {
  ceo_command: [
    { id: 'overview', label: 'Tổng quan hôm nay', icon: Briefcase },
    { id: 'today', label: 'Việc cần quyết định', icon: Activity },
    { id: 'autonomous_command', label: 'Autonomous Command', icon: Bot },
    { id: 'standup_rhythm', label: 'Founder Rhythm', icon: ClipboardList },
  ],
  knowledge_library: [
    { id: 'library', label: 'Kho tri thức', icon: BookOpen },
    { id: 'rag_simulator', label: 'RAG Sandbox', icon: Database },
    { id: 'operating_layer', label: 'Operating Layer', icon: Network },
  ],
  product_studio: [
    { id: 'portfolio', label: 'Danh mục sản phẩm', icon: FolderKanban },
    { id: 'ideation', label: 'Phòng ý tưởng', icon: Lightbulb },
    { id: 'games_ml', label: 'Studio Game & ML', icon: Gamepad2 },
    { id: 'game_builder', label: 'Game Builder', icon: Gamepad2 },
    { id: 'smoke_test', label: 'Smoke Test', icon: TestTubeDiagonal },
  ],
  marketing_growth: [
    { id: 'campaigns', label: 'Chiến dịch', icon: Rocket },
    { id: 'content', label: 'Nội dung', icon: Mail },
    { id: 'video_studio', label: 'Studio Kỹ thuật số', icon: Film },
  ],
  sales_crm: [
    { id: 'funnel_lab', label: 'Phễu khách hàng', icon: Target },
    { id: 'pricing_ltv', label: 'Báo giá & LTV', icon: BarChart3 },
    { id: 'referral_nps', label: 'Đại lý & NPS', icon: UsersRound },
  ],
  finance_accounting: [
    { id: 'ledger', label: 'Sổ kế toán', icon: Database },
    { id: 'reports', label: 'Báo cáo tài chính', icon: Calculator },
    { id: 'cashflow', label: 'Dòng tiền', icon: TrendingUp },
    { id: 'founder_control', label: 'Founder Control', icon: ClipboardList },
    { id: 'approval', label: 'Duyệt chi phí', icon: CheckCircle },
    { id: 'audit', label: 'Kiểm toán nội bộ', icon: ShieldCheck },
    { id: 'tax_simulator', label: 'Kịch bản Thuế & Audit', icon: Calculator },
  ],
  projects_delivery: [
    { id: 'portfolio', label: 'Danh mục dự án', icon: FolderKanban },
    { id: 'industry_templates', label: 'Mẫu ngành', icon: Database },
    { id: 'admin_ops', label: 'Admin Ops', icon: UsersRound },
  ],
  documents_approval: [
    { id: 'approvals', label: 'Luồng phê duyệt', icon: CheckCircle },
    { id: 'audit', label: 'Kiểm soát hồ sơ', icon: ShieldCheck },
    { id: 'evidence', label: 'Audit trail', icon: FileCheck2 },
  ],
  ai_factory: [
    { id: 'command', label: 'Trung tâm Điều hành', icon: Bot },
    { id: 'builder', label: 'Lắp ráp & Năng lực', icon: Sparkles },
    { id: 'automation', label: 'Tự động hóa & Robot', icon: Activity },
    { id: 'governance', label: 'Quản trị & Định tuyến', icon: ShieldCheck },
    { id: 'release', label: 'Phát hành & Chiến dịch', icon: Rocket },
    { id: 'advanced', label: 'Nội bộ & Giám sát', icon: Code },
  ],
  analytics: [
    { id: 'dashboard', label: 'Báo cáo & Giám sát', icon: Activity },
    { id: 'simulations', label: 'Mô phỏng & Chiến lược', icon: Target },
    { id: 'data_engineering', label: 'Khai thác & Xử lý Dữ liệu', icon: Database },
    { id: 'ai_sandbox', label: 'AI Playground', icon: TestTubeDiagonal },
    { id: 'python_sandbox', label: 'Python Sandbox', icon: Code },
  ],
  system_settings: [
    { id: 'general', label: 'Hệ thống & Cấu hình', icon: Settings },
    { id: 'security', label: 'Bảo mật & Phân quyền', icon: ShieldCheck },
    { id: 'connectors', label: 'Tích hợp & Kết nối', icon: Network },
    { id: 'dev_ops', label: 'GitOps & Phát hành', icon: Rocket },
    { id: 'recovery_ops', label: 'Bảo trì & Khôi phục', icon: FileCheck2 },
  ],
  operations: [
    { id: 'portfolio', label: 'Project Portfolio', icon: FolderKanban },
    { id: 'industry_templates', label: 'Industry Templates', icon: Database },
    { id: 'admin_ops', label: 'Admin Ops', icon: UsersRound },
  ],
};

const DEFAULT_SUBTAB: Record<string, string> = Object.fromEntries(
  Object.entries(SUB_TABS_CONFIG).map(([key, tabs]) => [key, tabs[0]?.id || 'overview']),
);

const STATIC_WORKSPACES: Partial<Record<TabType, StaticWorkspaceConfig>> = {
  ceo_command: {
    title: 'Executive Control Center',
    description: 'Tổng quan chỉ số sức khỏe doanh nghiệp, danh mục phê duyệt và cảnh báo rủi ro vận hành.',
    chips: ['Tổng quan hôm nay', 'Cảnh báo rủi ro', 'Hộp phê duyệt'],
    compactNoticeOn: 'today',
    cards: [
      { eyebrow: 'Ưu tiên vận hành', title: 'Danh mục quyết định', description: 'Tập trung rà soát các điểm nghẽn tiến độ và phê duyệt ngân sách cấp cao.', icon: ClipboardList, tone: 'cyan', items: ['Quyết định sản phẩm', 'Duyệt khoản thu chi lớn', 'Ưu tiên chiến lược'] },
      { eyebrow: 'Tài chính & Dòng tiền', title: 'Sức khỏe tài chính', description: 'Giám sát chỉ số dòng tiền thực thu, ngân sách dự án và cảnh báo vượt hạn mức.', icon: TrendingUp, tone: 'emerald', items: ['Dòng tiền thuần', 'Công nợ quá hạn', 'Báo cáo quản trị'] },
      { eyebrow: 'Đội ngũ Agent AI', title: 'Nhiệm vụ đang thực thi', description: 'Giám sát tiến độ thực hiện nhiệm vụ tự trị của các agent AI toàn hệ thống.', icon: FolderKanban, tone: 'violet', items: ['Tác vụ đang chạy', 'Hàng đợi phê duyệt', 'Bằng chứng thực thi'] },
      { eyebrow: 'Quản trị rủi ro', title: 'Điểm kiểm soát', description: 'Cảnh báo tự động các rủi ro phát sinh về pháp lý, chứng từ và hạn mức.', icon: ShieldCheck, tone: 'amber', items: ['Kiểm soát chứng từ', 'Cảnh báo ngân sách', 'Dừng khẩn cấp'] },
    ],
  },
  product_studio: {
    title: 'Product Studio Workspace',
    description: 'Quản lý danh mục sản phẩm, lộ trình tính năng, phát hành và phản hồi khách hàng.',
    chips: ['Danh mục sản phẩm', 'Lộ trình phát triển', 'Bản phát hành'],
    compactNoticeOn: 'release',
    cards: [
      { eyebrow: 'Danh mục', title: 'Sản phẩm chủ lực', description: 'Theo dõi tiến độ phát triển các gói sản phẩm và tính năng chính.', icon: FolderKanban, tone: 'cyan', items: ['LedgerFlow OS', 'Phân hệ Kế toán VAS', 'Agent Assistant AI'] },
      { eyebrow: 'Lộ trình phát triển', title: 'Roadmap Sprint', description: 'Tập trung triển khai và kiểm thử dứt điểm từng cột mốc tính năng.', icon: Target, tone: 'emerald', items: ['Tối ưu UI/UX', 'Hoàn thiện API Gate', 'Kiểm thử khép kín'] },
      { eyebrow: 'Chất lượng & QC', title: 'Tiêu chuẩn phát hành', description: 'Đảm bảo giao diện chuẩn mực, tối ưu hiệu năng và an toàn mã nguồn.', icon: FileCheck2, tone: 'violet', items: ['Build ổn định 100%', 'Giao diện trực quan', 'Bảo mật kho khóa'] },
      { eyebrow: 'Phát hành', title: 'Release Center', description: 'Quản lý các bản phát hành nội bộ và môi trường thử nghiệm.', icon: Rocket, tone: 'amber', items: ['Local Preview', 'Bản phát hành chốt', 'Nhật ký thay đổi'] },
    ],
  },
  marketing_growth: {
    title: 'Marketing & Growth Engine',
    description: 'Điều phối chiến dịch tiếp thị, lịch sản xuất nội dung và đo lường phễu chuyển đổi.',
    chips: ['Chiến dịch tiếp thị', 'Lịch nội dung', 'Phễu chuyển đổi'],
    compactNoticeOn: 'content',
    cards: [
      { eyebrow: 'Chiến dịch', title: 'Chiến dịch đang chạy', description: 'Theo dõi mục tiêu tiếp thị, thông điệp truyền thông và tiến độ triển khai.', icon: Rocket, tone: 'cyan', items: ['Kênh truyền thông', 'Thông điệp cốt lõi', 'Chỉ số KPI'] },
      { eyebrow: 'Nội dung', title: 'Lịch biên tập nội dung', description: 'Quản lý danh mục bài viết, tài liệu sản phẩm và bài đăng đa kênh.', icon: Mail, tone: 'violet', items: ['Bài viết chuyên sâu', 'Video giới thiệu', 'Trang Landing Page'] },
      { eyebrow: 'Tăng trưởng', title: 'Chỉ số chuyển đổi', description: 'Đo lường hiệu quả thu hút khách hàng tiềm năng và tỷ lệ chuyển đổi thực tế.', icon: TrendingUp, tone: 'emerald', items: ['Leads mới', 'Tỷ lệ chuyển đổi', 'Phản hồi người dùng'] },
      { eyebrow: 'Chiến lược', title: 'Tối ưu hóa tiếp thị', description: 'Loại bỏ nội dung thừa, tập trung vào các thông điệp có tỷ lệ phản hồi cao nhất.', icon: ShieldCheck, tone: 'amber', items: ['Đo lường A/B', 'Tối ưu Call-to-Action', 'Phân tích ROI'] },
    ],
  },
  sales_crm: {
    title: 'Sales, Video Marketing & CRM Intelligence',
    description: 'Theo dõi cơ hội bán hàng, phễu chuyển đổi Lead, Video Tiếp thị Đa nền tảng (TikTok, Reels, YouTube), Quảng cáo Sản phẩm/Game nội bộ và Affiliate Marketing.',
    chips: ['Phễu bán hàng', 'Video Marketing (TikTok/Reels/Shorts)', 'Affiliate Revenue', 'Quảng cáo Sản phẩm/Game'],
    compactNoticeOn: 'followup',
    cards: [
      { eyebrow: 'Phễu bán hàng', title: 'Cơ hội kinh doanh', description: 'Phân loại và giám sát các cơ hội bán hàng theo từng giai đoạn phễu.', icon: BarChart3, tone: 'cyan', items: ['Leads tiềm năng', 'Đang đàm phán', 'Hợp đồng chốt'] },
      { eyebrow: 'Video & Affiliate', title: 'Tiếp thị Video Đa kênh', description: 'Đăng Video kiếm tiền AdSense/Creator Fund + kéo traffic dùng phần mềm & game + hoa hồng Affiliate.', icon: Rocket, tone: 'violet', items: ['Video TikTok / Reels / Shorts', 'Leads phần mềm & game nội bộ', 'Doanh thu Affiliate Marketing'] },
      { eyebrow: 'Chăm sóc', title: 'Lịch tương tác', description: 'Lịch hẹn nhắc nhở tư vấn, gửi báo giá và theo dõi phản hồi của khách hàng.', icon: UsersRound, tone: 'emerald', items: ['Lịch gọi tư vấn', 'Gửi báo giá bổ sung', 'Theo dõi thanh toán'] },
      { eyebrow: 'Dữ liệu CRM', title: 'Hồ sơ khách hàng sạch', description: 'Quản lý lịch sử tương tác và ghi chú giao dịch tập trung, chuẩn hóa.', icon: ShieldCheck, tone: 'amber', items: ['Lịch sử giao dịch', 'Ghi chú nhu cầu', 'Trạng thái tài khoản'] },
    ],
  },
  ai_factory: {
    title: 'AI Workforce Command Center',
    description: 'Điều phối, phân công và kiểm soát vận hành tự động của đội ngũ trợ lý AI.',
    chips: ['Đội ngũ Agent', 'Hàng đợi nhiệm vụ', 'Hệ thống an toàn'],
    compactNoticeOn: 'automation',
    cards: [
      { eyebrow: 'Đội ngũ Agent', title: 'Danh mục Trợ lý AI', description: 'Phân công nhiệm vụ chuyên biệt cho từng Agent: Phân tích, Kiểm soát, Soạn thảo.', icon: Bot, tone: 'violet', items: ['Phân công tác vụ', 'Theo dõi kết quả', 'Phê duyệt đầu ra'] },
      { eyebrow: 'Bảo mật & Safe-guard', title: 'Lớp kiểm soát an toàn', description: 'Đảm bảo các hành động quan trọng (xóa dữ liệu, gửi email, đẩy code) phải qua phê duyệt.', icon: ShieldCheck, tone: 'emerald', items: ['Duyệt trước khi thực thi', 'Dừng khẩn cấp', 'Mã hóa khóa API'] },
      { eyebrow: 'Hàng đợi', title: 'Tiến trình chạy ngầm', description: 'Theo dõi các tác vụ xử lý dữ liệu và tự động hóa đang vận hành ở backend.', icon: Sparkles, tone: 'cyan', items: ['Tiến trình đang chạy', 'Tác vụ hoàn thành', 'Xử lý ngoại lệ'] },
      { eyebrow: 'Minh bạch', title: 'Nhật ký thực thi', description: 'Lưu trữ nhật ký hoạt động và bằng chứng thực thi chi tiết của các Agent.', icon: FileCheck2, tone: 'amber', items: ['Nhật ký Audit Log', 'Bằng chứng thực thi', 'Minh bạch quy trình'] },
    ],
  },
};

function LoadingFallback() {
  return <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6" aria-label="Đang tải module"><Skeleton className="h-5 w-44" variant="text" /><Skeleton className="h-4 w-full" variant="text" /><Skeleton className="h-4 w-4/5" variant="text" /></div>;
}

function WorkspaceHero({ title, description, chips = [] }: { title: string; description: string; chips?: string[] }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/20 p-6 text-left shadow-2xl shadow-black/40 backdrop-blur-xl transition-all">
      {/* Dual ambient radial glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/15 to-purple-500/0 blur-2xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">LedgerFlow OS Enterprise</p>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
        <p className="mt-2.5 max-w-3xl text-xs font-semibold leading-6 text-slate-300/90">{description}</p>
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-300 shadow-sm transition-transform hover:scale-105">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

function CompactModuleNotice() {
  return (
    <SimplePanelCard
      eyebrow="Đã tinh gọn"
      title="Nội dung nội bộ đã được ẩn khỏi giao diện chính"
      description="Prompt cho AI, checklist dài, log kiểm thử và hướng dẫn nội bộ không còn dàn trên màn hình. Khi cần kiểm tra sâu, mở panel chi tiết riêng."
      icon={ShieldCheck}
      status="Review mode"
      tone="slate"
      items={[
        'UI chỉ hiển thị trạng thái và hành động cần bấm',
        'Logic, log và prompt chạy ngầm hoặc nằm trong tài liệu',
        'Mỗi module giữ đúng mục đích nghiệp vụ chính',
        'Giảm chữ dài để review nhanh trên Replit/local',
      ]}
    />
  );
}

function StaticWorkspace({ config, subtab }: { config: StaticWorkspaceConfig; subtab: string }) {
  return (
    <div className="space-y-5">
      <WorkspaceHero title={config.title} description={config.description} chips={config.chips} />
      <CardGrid>
        {config.cards.map((card) => <SimplePanelCard key={card.title} {...card} />)}
      </CardGrid>
      {subtab === config.compactNoticeOn && <CompactModuleNotice />}
    </div>
  );
}

function CommandCenterWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'overview') return <CEOOverviewPanel />;
  if (subtab === 'autonomous_command') {
    return (
      <div className="space-y-5">
        <AiAgentControlCenter />
        <NorthStarMetricBuilder />
      </div>
    );
  }
  if (subtab === 'standup_rhythm') {
    return (
      <div className="space-y-5">
        <OnboardingGuide />
        <FounderBurnoutMonitor />
        <FounderLabsDock />
      </div>
    );
  }
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function ProductStudioWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'portfolio') return <WebAccountingRoadmap />;
  if (subtab === 'ideation') return <ProductIdeationLab />;
  if (subtab === 'games_ml') return <GameAndMLWorkbench />;
  if (subtab === 'game_builder') return <GameStudioBuilder />;
  if (subtab === 'smoke_test') return <VaporwareSmokeTester />;
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function KnowledgeWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'operating_layer') return <OperatingKnowledgeLayerPanel />;
  return <KnowledgeBaseTab initialSubTab={subtab === 'rag_simulator' ? 'rag_simulator' : 'library'} />;
}

function MarketingWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'campaigns') return <CampaignsLab />;
  if (subtab === 'content') return <ContentLab />;
  if (subtab === 'video_studio') return <DigitalStudioLab />;
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function SalesCRMWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'funnel_lab') return <CustomerConversionLab />;
  if (subtab === 'pricing_ltv') return <PricingAndLTVLab />;
  if (subtab === 'referral_nps') return <ReferralAndNPSLab />;
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function FinanceWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'ledger') return <LedgerAccountingWorkspace />;
  if (subtab === 'reports') return <FinancialReportsVN />;
  if (subtab === 'cashflow') return <RevenueDashboard />;
  if (subtab === 'founder_control') {
    return (
      <div className="space-y-5">
        <AdvisoryBoardReport />
        <FounderReviewChecklist />
      </div>
    );
  }
  if (subtab === 'audit') return <InternalAuditWorkspace />;
  if (subtab === 'tax_simulator') return <TaxAuditSimulator />;
  if (subtab === 'approval') return <ApprovalWorkflow />;
  return <LedgerAccountingWorkspace />;
}


function AIWorkforceAdvancedWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'tasks' | 'release' | 'robot' | 'patch' | 'health'>('tasks');

  return (
    <div className="space-y-5">
      {/* Streamlined Group Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'tasks'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>📋 Nhiệm vụ & Routing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('release')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'release'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🛡️ Phê duyệt & Release Gate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('robot')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'robot'
              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🤖 Skill & Robot Automation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('patch')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'patch'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔍 Audit & Patch Log</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('health')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'health'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>Health & Readiness</span>
        </button>
      </div>
      {/* Active Panel Group Content */}
      {activeGroup === 'tasks' && (
        <div className="space-y-5 animate-fade-in">
          <AIWorkforceTaskBoard />
          <ModelDispatchMatrix />
          <AIWorkforceMissionTemplates />
          <AIWorkforceToolCatalog />
          <AIWorkforceNextBackendActions />
          <AIWorkforceMobileCommandCenter />
        </div>
      )}

      {activeGroup === 'release' && (
        <div className="space-y-5 animate-fade-in">
          <MissionReleaseGatePanel />
          <MissionOperatorRunbookPanel />
          <MissionSnapshotExportPanel />
          <MissionReviewNoteSavePanel />
        </div>
      )}

      {activeGroup === 'robot' && (
        <div className="space-y-5 animate-fade-in">
          <AIWorkforceSkillDirectory />
          <AIWorkforceOpenClawReadiness />
          <AIWorkforceRobotAutomationBridge />
          <Level6RobotSynthesizerPanel />
          <MultiPlatformRobotSwarmPanel />
          <RobotFleetAnalyticsPanel />
          <RobotLabPanel />
          <OpenClawWebRobotPanel />
        </div>
      )}

      {activeGroup === 'patch' && (
        <div className="space-y-5 animate-fade-in">
          <AIWorkforcePatchReviewSessions />
        </div>
      )}

      {activeGroup === 'health' && (
        <div className="space-y-5 animate-fade-in">
          <WorldClassReadinessPanel />
          <AutomationRulesHealthPanel />
          <SystemStatusPage />
          <WebAISchedulerPanel />
        </div>
      )}
    </div>
  );
}

function AIWorkforceWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'builder') return <AgentAssemblyBuilder />;
  if (subtab === 'automation') return <div className="space-y-5"><AutomationRulesPanel /><AutomationRulesHealthPanel /></div>;
  if (subtab === 'governance') return <AICommandCenter />;
  if (subtab === 'release') return <AIOperationsDaemonPanel />;
  if (subtab === 'advanced') return <AIWorkforceAdvancedWorkspace />;
  // command is default
  return <AIAssistantPanel />;
}

function AnalyticsSimulationsWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'market' | 'experiments' | 'deploy'>('market');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('market')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'market'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>📊 Mô phỏng Thị trường & A/B</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('experiments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'experiments'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🧪 Thí nghiệm & Quyết định</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('deploy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'deploy'
              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🚀 Dự toán & Triển khai</span>
        </button>
      </div>

      {activeGroup === 'market' && (
        <div className="space-y-5 animate-fade-in">
          <BusinessSimulationEngine />
          <ABSimulationLab />
          <MarketSurveySimulator />
        </div>
      )}
      {activeGroup === 'experiments' && (
        <div className="space-y-5 animate-fade-in">
          <ExperimentDashboard />
          <ExperimentDecisionLog />
          <MoatDefensibilityTracker />
        </div>
      )}
      {activeGroup === 'deploy' && (
        <div className="space-y-5 animate-fade-in">
          <MoRReadinessChecklist />
          <N8nAutomationBlueprint />
          <StrategicLabsMini />
          <DeployBusiness />
          <BrowserSimulationPlanner />
          <FounderLabsDock embedded />
        </div>
      )}
    </div>
  );
}

function AnalyticsDataEngineeringWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'workbench' | 'science'>('workbench');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('workbench')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'workbench'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>💾 Workbench & Kỹ thuật Dữ liệu</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('science')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'science'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>📈 Dữ liệu Tài chính & ML</span>
        </button>
      </div>

      {activeGroup === 'workbench' && (
        <div className="space-y-5 animate-fade-in">
          <CustomDataWorkbench />
          <DataScienceEngineering />
        </div>
      )}
      {activeGroup === 'science' && (
        <div className="space-y-5 animate-fade-in">
          <FinancialDataScienceLab />
          <MultiIndustryCaseBank />
          <MLApplied />
        </div>
      )}
    </div>
  );
}

function AnalyticsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'simulations') return <AnalyticsSimulationsWorkspace />;
  if (subtab === 'data_engineering') return <AnalyticsDataEngineeringWorkspace />;
  if (subtab === 'ai_sandbox') {
    return (
      <div className="space-y-5">
        <PromptPlayground />
        <GeminiPlayground />
        <Analytics3DLab />
        <AIEcosystemArchitecture />
      </div>
    );
  }
  if (subtab === 'python_sandbox') {
    return <PythonSandbox />;
  }
  // dashboard is default
  return (
    <div className="space-y-5">
      <StartHereLab />
      <FinancialChartsModelPanel />
      <AIObservabilityDashboard />
      <ProjectMemoryDecisionLog />
    </div>
  );
}

function SettingsDevOpsWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'hub' | 'merge' | 'artifacts'>('hub');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('hub')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'hub'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🚀 Hub Phát hành & CI Doctor</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('merge')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'merge'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔀 Merge & Control PR</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('artifacts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'artifacts'
              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>📦 Artifacts & Dev Handoff</span>
        </button>
      </div>

      {activeGroup === 'hub' && (
        <div className="space-y-5 animate-fade-in">
          <DevOpsReleaseHubPanel />
          <DeveloperIntelligenceHubPanel />
          <BuildMonitorPanel />
          <GitHubCIDoctorLauncher />
        </div>
      )}
      {activeGroup === 'merge' && (
        <div className="space-y-5 animate-fade-in">
          <MergeReadinessCenter />
          <PRControlCenter />
          <ApprovedPrPanel />
          <GitAssistantDaemonPanel />
        </div>
      )}
      {activeGroup === 'artifacts' && (
        <div className="space-y-5 animate-fade-in">
          <ReleaseArtifactCenter />
          <ArtifactInspectorPanel />
          <DevHandoffCenter />
        </div>
      )}
    </div>
  );
}

function SettingsConnectorsWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'hub' | 'contracts'>('hub');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('hub')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'hub'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔌 Integration Hub & Connectors</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('contracts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'contracts'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🌐 Web AI & Connector Contracts</span>
        </button>
      </div>

      {activeGroup === 'hub' && (
        <div className="space-y-5 animate-fade-in">
          <IntegrationHub />
          <GitHubConnectorPanel />
          <LocalToolsPanel />
        </div>
      )}
      {activeGroup === 'contracts' && (
        <div className="space-y-5 animate-fade-in">
          <WebAiSyncPanel />
          <ConnectorContractPanel />
          <ConfigHealthMonitor />
        </div>
      )}
    </div>
  );
}

function SettingsSecurityWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'vault' | 'audit'>('vault');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('vault')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'vault'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔐 Key Vault & Cấu hình AI</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'audit'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🛡️ Bảo mật & Audit Trail</span>
        </button>
      </div>

      {activeGroup === 'vault' && (
        <div className="space-y-5 animate-fade-in">
          <AISettingsManager />
          <AIVaultSecurityPanel />
        </div>
      )}
      {activeGroup === 'audit' && (
        <div className="space-y-5 animate-fade-in">
          <SecurityControlCenter />
          <AuditTrailPanel />
        </div>
      )}
    </div>
  );
}

function SettingsRecoveryWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'diff' | 'rollback'>('diff');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('diff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'diff'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🩹 So sánh Diff & Patch Workspace</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('rollback')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'rollback'
              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm shadow-rose-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔄 Rollback & Khôi phục CI</span>
        </button>
      </div>

      {activeGroup === 'diff' && (
        <div className="space-y-5 animate-fade-in">
          <PatchDiffReviewCenter />
          <SandboxPatchWorkspace />
        </div>
      )}
      {activeGroup === 'rollback' && (
        <div className="space-y-5 animate-fade-in">
          <RollbackCenter />
          <CIRecoveryQueue />
          <CIRunInspectorPanel />
        </div>
      )}
    </div>
  );
}

function SettingsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'security') return <SettingsSecurityWorkspace />;
  if (subtab === 'connectors') return <SettingsConnectorsWorkspace />;
  if (subtab === 'dev_ops') return <SettingsDevOpsWorkspace />;
  if (subtab === 'recovery_ops') return <SettingsRecoveryWorkspace />;
  // general is default
  return (
    <div className="space-y-5">
      <SystemOverviewDaemonPanel />
      <SystemSettingsPanel />
      <AIIntegrationHealthPanel />
      <ApiConnectionHealthMatrix />
    </div>
  );
}

function OperationsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'industry_templates') {
    return (
      <div className="space-y-5">
        <ProjectPortfolioPanel />
        <ProcurementLogisticsPanel />
      </div>
    );
  }
  if (subtab === 'admin_ops') return <HRAdminPanel />;
  return <ProjectPortfolioPanel />;
}

function ProjectsDeliveryWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'industry_templates') {
    return (
      <div className="space-y-5">
        <WorkspaceHero
          title="Industry Templates Library"
          description="Thư viện mẫu phân hệ theo ngành (Xây dựng, Dịch vụ, Thương mại, Sản xuất) đóng gói chuẩn VAS."
          chips={['Construction', 'Service', 'Trading', 'Manufacturing']}
        />
        <ProjectPortfolioPanel />
        <ProcurementLogisticsPanel />
      </div>
    );
  }
  if (subtab === 'admin_ops') {
    return (
      <div className="space-y-5">
        <WorkspaceHero
          title="Admin Ops & HR Operations"
          description="Giám sát vận hành hành chính, nhân sự triển khai dự án và quản lý tổ đội thuê ngoài."
          chips={['HR & Admin', 'Project Delivery', 'Labor Management']}
        />
        <HRAdminPanel />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Project Portfolio & Delivery"
        description="Quản lý dự án phát triển sản phẩm, lộ trình triển khai khách hàng, ngân sách dự toán và rủi ro tiến độ."
        chips={['Project Portfolio', 'Delivery Milestone', 'Budget Tracking']}
      />
      <ProjectPortfolioPanel />
    </div>
  );
}

function DocumentsApprovalWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'audit') {
    return (
      <div className="space-y-5">
        <WorkspaceHero
          title="Kiểm soát hồ sơ"
          description="Kiểm tra chứng từ, bằng chứng nghiệp vụ, rủi ro phê duyệt và các điểm cần bổ sung."
          chips={['Hồ sơ', 'Audit', 'Risk']}
        />
        <InternalAuditWorkspace />
      </div>
    );
  }
  if (subtab === 'evidence') {
    return (
      <div className="space-y-5">
        <WorkspaceHero
          title="Audit trail & bằng chứng"
          description="Tập trung nhật ký kiểm soát, dấu vết thao tác và bằng chứng phục vụ phê duyệt hoặc phát hành."
          chips={['Audit trail', 'Evidence', 'Control']}
        />
        <AuditTrailPanel />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Hồ sơ & Phê duyệt"
        description="Quản lý luồng duyệt chi phí, yêu cầu phê duyệt, hồ sơ cần kiểm tra và trạng thái xử lý."
        chips={['Phê duyệt', 'Chứng từ', 'Kiểm soát']}
      />
      <ApprovalWorkflow />
    </div>
  );
}

function LegacyWorkspace() {
  return (
    <div className="space-y-5">
      <WorkspaceHero title="Module đã được gom lại" description="Route cũ hoặc module thử nghiệm đã được ẩn khỏi giao diện chính để tránh rối. Hãy dùng các workspace chính ở thanh bên." chips={["Ẩn legacy", "Giao diện gọn", "Review mode"]} />
      <CompactModuleNotice />
    </div>
  );
}

interface WorkspaceRendererProps {
  activeSegment: TabType;
  activeRole?: RoleType;
  onNavigate?: (tab: TabType, subTab?: string) => void;
}

export default function WorkspaceRenderer({ activeSegment, activeRole = 'all' }: WorkspaceRendererProps) {
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>(() => ({ ...DEFAULT_SUBTAB }));
  const subTabs = useMemo(() => {
    const rawSubTabs = SUB_TABS_CONFIG[activeSegment] || [];
    const isTechRole = ['devops', 'agentops'].includes(activeRole);
    const isPowerUser = ['all', 'founder', 'admin'].includes(activeRole);
    const isFinanceRole = ['cfo', 'accountant', 'finance'].includes(activeRole);
    return rawSubTabs.filter((tab) => {
      // system_settings: hide dev_ops and recovery_ops from non-tech roles
      if (activeSegment === 'system_settings') {
        if (tab.id === 'dev_ops' || tab.id === 'recovery_ops') {
          return isPowerUser || isTechRole;
        }
      }
      // ai_factory: hide governance and advanced sub-tabs from non-power users
      if (activeSegment === 'ai_factory' && (tab.id === 'governance' || tab.id === 'advanced')) {
        return isPowerUser || isTechRole;
      }
      // product_studio: hide smoke_test from general non-tech/non-product roles
      if (activeSegment === 'product_studio' && tab.id === 'smoke_test') {
        return isPowerUser || isTechRole || activeRole === 'product_owner';
      }
      // finance_accounting: hide tax_simulator and audit from general non-finance roles
      if (activeSegment === 'finance_accounting' && (tab.id === 'tax_simulator' || tab.id === 'audit')) {
        return isPowerUser || isFinanceRole;
      }
      return true;
    });
  }, [activeSegment, activeRole]);
  const validSubTabIds = useMemo(() => subTabs.map((tab) => tab.id), [subTabs]);
  const currentSubTabId = resolveWorkspaceSubTab(activeSegment, activeSubTabs[activeSegment], validSubTabIds) || subTabs[0]?.id || '';

  React.useEffect(() => {
    const match = window.location.hash.match(/\?subtab=([^&]+)/);
    if (!match?.[1]) return;
    const normalized = resolveWorkspaceSubTab(activeSegment, decodeURIComponent(match[1]), validSubTabIds);
    if (!normalized) return;
    setActiveSubTabs((prev) => (prev[activeSegment] === normalized ? prev : { ...prev, [activeSegment]: normalized }));
  }, [activeSegment, validSubTabIds]);

  const handleSubTabChange = (newSubTabId: string) => {
    const normalized = resolveWorkspaceSubTab(activeSegment, newSubTabId, validSubTabIds) || newSubTabId;
    setActiveSubTabs((prev) => ({ ...prev, [activeSegment]: normalized }));
    window.location.hash = `/${activeSegment}?subtab=${normalized}`;
  };

  const staticConfig = STATIC_WORKSPACES[activeSegment];

  return (
    <div key={`${activeSegment}-${currentSubTabId}`} className="space-y-6 animate-fade-in transition-all duration-300">
      {subTabs.length > 1 && <WorkspaceSubNavigation tabs={subTabs} activeTab={currentSubTabId} onChange={handleSubTabChange} />}
      <Suspense fallback={<LoadingFallback />}>
        {staticConfig && !['ceo_command', 'ai_factory', 'marketing_growth', 'sales_crm', 'product_studio'].includes(activeSegment) && <StaticWorkspace config={staticConfig} subtab={currentSubTabId} />}
        {activeSegment === 'ceo_command' && staticConfig && <CommandCenterWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'product_studio' && staticConfig && <ProductStudioWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'knowledge_library' && <KnowledgeWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'marketing_growth' && staticConfig && <MarketingWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'sales_crm' && staticConfig && <SalesCRMWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'ai_factory' && <AIWorkforceWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'finance_accounting' && <FinanceWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'projects_delivery' && <ProjectsDeliveryWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'documents_approval' && <DocumentsApprovalWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'analytics' && <AnalyticsWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'system_settings' && <SettingsWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'operations' && <OperationsWorkspace subtab={currentSubTabId} />}
        {!staticConfig && !['knowledge_library', 'finance_accounting', 'projects_delivery', 'documents_approval', 'analytics', 'system_settings', 'ai_factory', 'marketing_growth', 'product_studio', 'sales_crm', 'operations'].includes(activeSegment) && <LegacyWorkspace />}
      </Suspense>
    </div>
  );
}
