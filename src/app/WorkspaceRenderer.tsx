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
const AIIntegrationHealthPanel = React.lazy(() => import('../modules/system-settings/AIIntegrationHealthPanel'));
const ApiConnectionHealthMatrix = React.lazy(() => import('../modules/system-settings/components/ApiConnectionHealthMatrix'));
const CEOOverviewPanel = React.lazy(() => import('../modules/command-center/CEOOverviewPanel'));
const AiAgentControlCenter = React.lazy(() => import('../modules/command-center/components/AiAgentControlCenter'));
const FounderBurnoutMonitor = React.lazy(() => import('../modules/command-center/components/FounderBurnoutMonitor'));
const NorthStarMetricBuilder = React.lazy(() => import('../modules/command-center/components/NorthStarMetricBuilder'));
const OnboardingGuide = React.lazy(() => import('../modules/command-center/components/OnboardingGuide'));
const AIOperationsCenter = React.lazy(() => import('../modules/ai-nhan-su/AIOperationsCenter'));
const AutomationRulesPanel = React.lazy(() => import('../modules/ai-nhan-su/AutomationRulesPanel'));
const AIWorkforceTaskBoard = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceTaskBoard'));
const ModelDispatchMatrix = React.lazy(() => import('../modules/ai-nhan-su/ModelDispatchMatrix'));
const AIAssistantPanel = React.lazy(() => import('../modules/ai-nhan-su/AIAssistantPanel'));
const AICommandCenter = React.lazy(() => import('../modules/ai-nhan-su/AICommandCenter'));
const AdvancedAIEngine = React.lazy(() => import('../modules/ai-nhan-su/AdvancedAIEngine'));
const AgentAssemblyBuilder = React.lazy(() => import('../modules/ai-nhan-su/AgentAssemblyBuilder'));
const AIOperationsDaemonPanel = React.lazy(() => import('../modules/ai-nhan-su/AIOperationsDaemonPanel'));
const AIMemoryRagPanel = React.lazy(() => import('../modules/ai-nhan-su/AIMemoryRagPanel'));
const AIWorkforceMissionTrace = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMissionTrace'));
const AIWorkforceMissionTemplates = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMissionTemplates'));
const AIWorkforceMobileCommandCenter = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMobileCommandCenter'));
const AIWorkforceNextBackendActions = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceNextBackendActions'));
const AIWorkforceOpenClawReadiness = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceOpenClawReadiness'));
const AIWorkforceToolCatalog = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceToolCatalog'));
const AIWorkforceSkillDirectory = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceSkillDirectory'));
const AIWorkforceSkillInvocationPlanner = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceSkillInvocationPlanner'));
const AISettingsManager = React.lazy(() => import('../modules/ai-nhan-su/AISettingsManager'));
const AIVaultSecurityPanel = React.lazy(() => import('../modules/ai-nhan-su/AIVaultSecurityPanel'));
const MissionOperatorRunbookPanel = React.lazy(() => import('../modules/ai-nhan-su/MissionOperatorRunbookPanel'));
const MissionReleaseGatePanel = React.lazy(() => import('../modules/ai-nhan-su/MissionReleaseGatePanel'));
const MissionReviewNoteSavePanel = React.lazy(() => import('../modules/ai-nhan-su/MissionReviewNoteSavePanel'));
const MissionSnapshotExportPanel = React.lazy(() => import('../modules/ai-nhan-su/MissionSnapshotExportPanel'));
const RobotLabPanel = React.lazy(() => import('../modules/ai-nhan-su/RobotLabPanel'));
const AutomationRulesHealthPanel = React.lazy(() => import('../modules/ai-nhan-su/AutomationRulesHealthPanel'));
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
    { id: 'audit', label: 'Kiểm toán nội bộ', icon: ShieldCheck },
    { id: 'tax_simulator', label: 'Tax Simulator', icon: Calculator },
    { id: 'approval', label: 'Duyệt chi phí', icon: CheckCircle },
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
  ],
  analytics: [
    { id: 'dashboard', label: 'Báo cáo & Giám sát', icon: Activity },
    { id: 'simulations', label: 'Mô phỏng & Chiến lược', icon: Target },
    { id: 'data_engineering', label: 'Khai thác & Xử lý Dữ liệu', icon: Database },
    { id: 'ai_sandbox', label: 'Phòng thí nghiệm AI', icon: TestTubeDiagonal },
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
    title: 'Trung tâm Điều hành',
    description: 'Toàn cảnh hôm nay, việc cần quyết định, rủi ro và hiệu suất vận hành.',
    chips: ['Tổng quan hôm nay', 'Cảnh báo rủi ro', 'Hộp phê duyệt'],
    compactNoticeOn: 'today',
    cards: [
      { eyebrow: 'Tổng quan hôm nay', title: 'Việc cần quyết định', description: 'Tập trung vào các việc chặn tiến độ hoặc cần chủ doanh nghiệp chốt hướng.', icon: ClipboardList, tone: 'cyan', items: ['Quyết định sản phẩm', 'Việc cần duyệt', 'Ưu tiên tiếp theo'] },
      { eyebrow: 'Sức khỏe doanh nghiệp', title: 'Dòng tiền & chi phí', description: 'Xem nhanh tình trạng tài chính và các khoản cần chú ý.', icon: TrendingUp, tone: 'emerald', items: ['Thu chi chính', 'Chi phí cần duyệt', 'Báo cáo cần xem'] },
      { eyebrow: 'Nhiệm vụ AI đang chạy', title: 'Công việc đang theo dõi', description: 'Theo dõi các việc sản phẩm, dữ liệu và AI đang xử lý.', icon: FolderKanban, tone: 'violet', items: ['Việc đang làm', 'Kết quả cần duyệt', 'Nhiệm vụ tiếp theo'] },
      { eyebrow: 'Cảnh báo rủi ro', title: 'Điểm cần xử lý', description: 'Chỉ hiển thị rủi ro thật sự ảnh hưởng đến vận hành.', icon: ShieldCheck, tone: 'amber', items: ['Có rủi ro', 'Cần xử lý', 'Chờ phê duyệt'] },
    ],
  },
  product_studio: {
    title: 'Xưởng Sản phẩm',
    description: 'Quản lý sản phẩm, lộ trình phát triển, lỗi, phản hồi và phát hành.',
    chips: ['Danh mục sản phẩm', 'Lộ trình phát triển', 'Bản phát hành'],
    compactNoticeOn: 'release',
    cards: [
      { eyebrow: 'Danh mục sản phẩm', title: 'Sản phẩm đang làm', description: 'Danh sách gọn các sản phẩm và module cần ưu tiên.', icon: FolderKanban, tone: 'cyan', items: ['LedgerFlow OS', 'Tài chính - Kế toán', 'Trợ lý AI theo việc'] },
      { eyebrow: 'Lộ trình phát triển', title: 'Việc đang làm', description: 'Mỗi lần ưu tiên một module để dễ kiểm thử và phát hành.', icon: Target, tone: 'emerald', items: ['Làm rõ giao diện', 'Giữ chức năng chính', 'Ẩn phần nội bộ'] },
      { eyebrow: 'Phản hồi & lỗi', title: 'Tiêu chí đạt', description: 'Màn hình dễ đọc, có trạng thái rõ và hành động cụ thể.', icon: FileCheck2, tone: 'violet', items: ['Không lộ prompt nội bộ', 'Có nút hành động rõ', 'Build ổn định'] },
      { eyebrow: 'Bản phát hành', title: 'Phát hành nội bộ', description: 'Xem trước trên môi trường local trước khi chia sẻ rộng hơn.', icon: Rocket, tone: 'amber', items: ['Hoàn tất', 'Đang theo dõi', 'Cần xử lý'] },
    ],
  },
  marketing_growth: {
    title: 'Tăng trưởng',
    description: 'Điều phối marketing, nội dung, thử nghiệm tăng trưởng và hiệu quả kênh.',
    chips: ['Chiến dịch', 'Lịch nội dung', 'Hiệu quả kênh'],
    compactNoticeOn: 'content',
    cards: [
      { eyebrow: 'Chiến dịch', title: 'Kế hoạch đang chạy', description: 'Theo dõi mục tiêu, kênh và trạng thái triển khai.', icon: Rocket, tone: 'cyan', items: ['Kênh chính', 'Thông điệp', 'Việc cần làm'] },
      { eyebrow: 'Lịch nội dung', title: 'Nội dung cần sản xuất', description: 'Theo dõi danh sách nội dung, kênh đăng và trạng thái hoàn tất.', icon: Mail, tone: 'violet', items: ['Bài viết', 'Video ngắn', 'Trang giới thiệu'] },
      { eyebrow: 'Tăng trưởng', title: 'Tín hiệu cần xem', description: 'Tập trung dữ liệu phản hồi thật, tránh dashboard giả quá nhiều chữ.', icon: TrendingUp, tone: 'emerald', items: ['Lead mới', 'Conversion', 'Feedback'] },
      { eyebrow: 'Ý tưởng tăng trưởng', title: 'Dọn nội dung', description: 'Các ý tưởng và bản nháp dài nằm ở công cụ riêng, màn hình chính giữ việc cần làm.', icon: ShieldCheck, tone: 'amber', items: ['Ẩn prompt', 'Giữ lời kêu gọi hành động', 'Giữ số liệu'] },
    ],
  },
  sales_crm: {
    title: 'Bán hàng & Khách hàng',
    description: 'Theo dõi lead, cơ hội bán hàng, báo giá, chăm sóc và quan hệ khách hàng.',
    chips: ['Cơ hội bán hàng', 'Khách hàng', 'Việc cần chăm sóc'],
    compactNoticeOn: 'followup',
    cards: [
      { eyebrow: 'Cơ hội bán hàng', title: 'Cơ hội đang theo dõi', description: 'Tổng quan lead và cơ hội theo trạng thái.', icon: BarChart3, tone: 'cyan', items: ['Lead mới', 'Đang tư vấn', 'Chốt hoặc không chốt'] },
      { eyebrow: 'Việc cần chăm sóc', title: 'Lịch chăm sóc', description: 'Việc cần nhắc lại và lịch chăm sóc khách hàng.', icon: UsersRound, tone: 'emerald', items: ['Gọi lại', 'Gửi báo giá', 'Nhắc thanh toán'] },
      { eyebrow: 'Báo giá', title: 'Bảng giá & đề xuất', description: 'Giữ bảng giá và đề xuất ở dạng dễ gửi cho khách.', icon: Target, tone: 'violet', items: ['Gói cơ bản', 'Gói mở rộng', 'Ưu đãi'] },
      { eyebrow: 'Lịch sử trao đổi', title: 'Dữ liệu khách hàng sạch', description: 'Giao diện chính ưu tiên thông tin thật cần hành động.', icon: ShieldCheck, tone: 'amber', items: ['Không prompt mẫu dài', 'Không bảng giả thừa', 'Ưu tiên lead thật'] },
    ],
  },
  ai_factory: {
    title: 'Đội ngũ AI',
    description: 'Giao việc, theo dõi và kiểm soát các agent AI vận hành doanh nghiệp.',
    chips: ['Nhân sự AI', 'Giao việc cho AI', 'Chờ phê duyệt'],
    compactNoticeOn: 'automation',
    cards: [
      { eyebrow: 'Nhân sự AI', title: 'Trợ lý theo yêu cầu', description: 'Dùng cho việc cụ thể: tóm tắt, kiểm tra lỗi, viết nháp hoặc phân tích.', icon: Bot, tone: 'violet', items: ['Nhập yêu cầu ngắn', 'Xem kết quả', 'Duyệt thủ công'] },
      { eyebrow: 'An toàn & dừng khẩn cấp', title: 'Không tự hành động nguy hiểm', description: 'AI không tự xóa dữ liệu, gửi email, đẩy code hoặc sửa lan rộng nếu chưa được duyệt.', icon: ShieldCheck, tone: 'emerald', items: ['An toàn', 'Chờ phê duyệt', 'Không lộ khóa'] },
      { eyebrow: 'Hàng đợi nhiệm vụ', title: 'Chạy ngầm khi cần', description: 'Tác vụ định kỳ chạy ở backend hoặc tự động hóa, UI chỉ hiện trạng thái.', icon: Sparkles, tone: 'cyan', items: ['Đang chạy', 'Hoàn tất', 'Cần xử lý'] },
      { eyebrow: 'Bằng chứng thực thi', title: 'Ẩn prompt nội bộ', description: 'Hướng dẫn hệ thống và prompt dài nằm trong code/backend, không hiển thị cho người dùng cuối.', icon: FileCheck2, tone: 'amber', items: ['Ẩn hướng dẫn nội bộ', 'Ẩn quy trình nội bộ', 'Giữ nút hành động'] },
    ],
  },
};

function LoadingFallback() {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm font-semibold text-slate-400">Đang tải module...</div>;
}

function WorkspaceHero({ title, description, chips = [] }: { title: string; description: string; chips?: string[] }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-left shadow-xl shadow-black/20">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">LedgerFlow workspace</p>
      <h1 className="mt-2 text-2xl font-black text-white">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-400">{description}</p>
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => <span key={chip} className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">{chip}</span>)}
        </div>
      )}
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

function AIWorkforceWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'builder') {
    return (
      <div className="space-y-5">
        <AgentAssemblyBuilder />
        <AIWorkforceSkillDirectory />
        <AIWorkforceSkillInvocationPlanner />
        <AIWorkforceToolCatalog />
        <AIMemoryRagPanel />
      </div>
    );
  }
  if (subtab === 'automation') {
    return (
      <div className="space-y-5">
        <AutomationRulesPanel />
        <AutomationRulesHealthPanel />
        <RobotLabPanel />
      </div>
    );
  }
  if (subtab === 'governance') {
    return (
      <div className="space-y-5">
        <AICommandCenter />
        <AdvancedAIEngine />
        <AIWorkforceOpenClawReadiness />
        <ModelDispatchMatrix />
        <AIWorkforceMissionTrace />
      </div>
    );
  }
  if (subtab === 'release') {
    return (
      <div className="space-y-5">
        <AIOperationsDaemonPanel />
        <AIWorkforceNextBackendActions />
        <AIWorkforceMissionTemplates />
        <MissionOperatorRunbookPanel />
        <MissionReleaseGatePanel />
        <MissionReviewNoteSavePanel />
        <MissionSnapshotExportPanel />
        <AIWorkforceMobileCommandCenter />
      </div>
    );
  }
  // command is default
  return (
    <div className="space-y-5">
      <AIAssistantPanel />
      <AIWorkforceTaskBoard />
      <AIOperationsCenter />
    </div>
  );
}

function AnalyticsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'simulations') {
    return (
      <div className="space-y-5">
        <BusinessSimulationEngine />
        <MarketSurveySimulator />
        <DeployBusiness />
        <BrowserSimulationPlanner />
        <FounderLabsDock embedded />
      </div>
    );
  }
  if (subtab === 'data_engineering') {
    return (
      <div className="space-y-5">
        <DataScienceEngineering />
        <FinancialDataScienceLab />
        <MLApplied />
      </div>
    );
  }
  if (subtab === 'ai_sandbox') {
    return (
      <div className="space-y-5">
        <PromptPlayground />
        <GeminiPlayground />
        <PythonSandbox />
        <Analytics3DLab />
        <AIEcosystemArchitecture />
      </div>
    );
  }
  // dashboard is default
  return (
    <div className="space-y-5">
      <FinancialChartsModelPanel />
      <AIObservabilityDashboard />
      <ProjectMemoryDecisionLog />
    </div>
  );
}


function SettingsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'security') {
    return (
      <div className="space-y-5">
        <AISettingsManager />
        <AIVaultSecurityPanel />
        <SecurityControlCenter />
        <AuditTrailPanel />
      </div>
    );
  }
  if (subtab === 'connectors') {
    return (
      <div className="space-y-5">
        <IntegrationHub />
        <GitHubConnectorPanel />
        <LocalToolsPanel />
        <WebAiSyncPanel />
        <ConnectorContractPanel />
        <ConfigHealthMonitor />
      </div>
    );
  }
  if (subtab === 'dev_ops') {
    return (
      <div className="space-y-5">
        <BuildMonitorPanel />
        <MergeReadinessCenter />
        <PRControlCenter />
        <GitHubCIDoctorLauncher />
        <GitAssistantDaemonPanel />
        <ApprovedPrPanel />
        <ReleaseArtifactCenter />
        <ArtifactInspectorPanel />
        <DevHandoffCenter />
      </div>
    );
  }
  if (subtab === 'recovery_ops') {
    return (
      <div className="space-y-5">
        <PatchDiffReviewCenter />
        <SandboxPatchWorkspace />
        <RollbackCenter />
        <CIRecoveryQueue />
        <CIRunInspectorPanel />
      </div>
    );
  }
  // general is default
  return (
    <div className="space-y-5">
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
          title="Mẫu ngành & Delivery"
          description="Các template theo ngành được đặt dưới dự án/delivery, không còn là danh tính sản phẩm toàn cục."
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
          title="Admin Ops theo dự án"
          description="Theo dõi hành chính vận hành, nhân sự triển khai và chi phí hỗ trợ delivery."
          chips={['Admin', 'Delivery', 'Internal Ops']}
        />
        <HRAdminPanel />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Dự án & Delivery"
        description="Theo dõi dự án sản phẩm, triển khai khách hàng, milestone, ngân sách, rủi ro và gói template theo ngành."
        chips={['Sản phẩm', 'Triển khai', 'Mẫu ngành']}
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
    return rawSubTabs.filter((tab) => {
      if (activeRole === 'all' || activeRole === 'founder' || activeRole === 'admin') return true;
      if (activeSegment === 'system_settings' && tab.id === 'devops') return ['devops', 'agentops'].includes(activeRole);
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
    <div className="space-y-6">
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
