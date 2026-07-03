import React, { Suspense, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
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
  TrendingUp,
  UsersRound,
  Film,
} from 'lucide-react';
import { TabType, RoleType } from './companyNavigation';
import { resolveWorkspaceSubTab } from './workspaceSubtabAliases';
import WorkspaceSubNavigation from '../components/shared/WorkspaceSubNavigation';
import SimplePanelCard from '../components/shared/SimplePanelCard';

const LedgerAccountingWorkspace = React.lazy(() => import('../modules/finance-accounting/LedgerAccountingWorkspace'));
const FinancialReportsVN = React.lazy(() => import('../modules/finance-accounting/FinancialReportsVN'));
const RevenueDashboard = React.lazy(() => import('../modules/finance-accounting/RevenueDashboard'));
const ApprovalWorkflow = React.lazy(() => import('../modules/dev-ops/ApprovalWorkflow'));
const PythonSandbox = React.lazy(() => import('../modules/analytics-sandbox/PythonSandbox'));
const Analytics3DLab = React.lazy(() => import('../modules/analytics-sandbox/Analytics3DLab'));
const BusinessSimulationEngine = React.lazy(() => import('../modules/analytics-sandbox/BusinessSimulationEngine'));
const SystemSettingsPanel = React.lazy(() => import('../modules/system-settings/SystemSettingsPanel'));
const IntegrationHub = React.lazy(() => import('../modules/dev-ops/IntegrationHub'));
const BuildMonitorPanel = React.lazy(() => import('../modules/dev-ops/BuildMonitorPanel'));
const MergeReadinessCenter = React.lazy(() => import('../modules/dev-ops/MergeReadinessCenter'));
const PRControlCenter = React.lazy(() => import('../modules/dev-ops/PRControlCenter'));
const GitHubCIDoctorLauncher = React.lazy(() => import('../modules/dev-ops/GitHubCIDoctorLauncher'));
const AIOperationsCenter = React.lazy(() => import('../modules/ai-hr/AIOperationsCenter'));
const AutomationRulesPanel = React.lazy(() => import('../modules/ai-hr/AutomationRulesPanel'));
const AIWorkforceTaskBoard = React.lazy(() => import('../modules/ai-hr/AIWorkforceTaskBoard'));
const ModelDispatchMatrix = React.lazy(() => import('../modules/ai-hr/ModelDispatchMatrix'));
const VideoMakerPanel = React.lazy(() => import('../modules/video-maker/ui/index'));
const SalesFunnelLab = React.lazy(() => import('../modules/sales-crm/SalesFunnelLab'));

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
  ],
  product_studio: [
    { id: 'portfolio', label: 'Danh mục sản phẩm', icon: FolderKanban },
    { id: 'release', label: 'Bản phát hành', icon: Rocket },
  ],
  marketing_growth: [
    { id: 'campaigns', label: 'Chiến dịch', icon: Rocket },
    { id: 'content', label: 'Nội dung', icon: Mail },
    { id: 'video_studio', label: 'Studio Kỹ thuật số', icon: Film },
  ],
  sales_crm: [
    { id: 'funnel_lab', label: 'Phễu khách hàng', icon: Target },
    { id: 'pipeline', label: 'Cơ hội bán hàng', icon: BarChart3 },
    { id: 'followup', label: 'Việc cần chăm sóc', icon: UsersRound },
  ],
  finance_accounting: [
    { id: 'ledger', label: 'Sổ kế toán', icon: Database },
    { id: 'reports', label: 'Báo cáo tài chính', icon: Calculator },
    { id: 'cashflow', label: 'Dòng tiền', icon: TrendingUp },
    { id: 'approval', label: 'Duyệt chi phí', icon: CheckCircle },
  ],
  ai_factory: [
    { id: 'command', label: 'AI và Agent', icon: Bot },
    { id: 'dispatch_matrix', label: 'Định tuyến AI', icon: Network },
    { id: 'automation', label: 'Robot và Tự động hóa', icon: Sparkles },
    { id: 'tasks', label: 'Bảng Nhiệm vụ', icon: FolderKanban },
  ],
  analytics: [
    { id: '3d_lab', label: 'Phòng thí nghiệm 3D', icon: Code },
    { id: 'simulation', label: 'Mô phỏng 36 Tháng', icon: Target },
    { id: 'python_sandbox', label: 'Sandbox dữ liệu', icon: Code },
    { id: 'data', label: 'Báo cáo điều hành', icon: Database },
  ],
  system_settings: [
    { id: 'general', label: 'Cài đặt chung', icon: Settings },
    { id: 'integrations', label: 'Tích hợp', icon: Network },
    { id: 'devops', label: 'Phát hành & khôi phục', icon: ShieldCheck },
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

function MarketingWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'video_studio') return <VideoMakerPanel />;
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function SalesWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'funnel_lab') return <SalesFunnelLab />;
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function FinanceWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'ledger') return <LedgerAccountingWorkspace />;
  if (subtab === 'reports') return <FinancialReportsVN />;
  if (subtab === 'cashflow') return <RevenueDashboard />;
  if (subtab === 'approval') return <ApprovalWorkflow />;
  return <LedgerAccountingWorkspace />;
}

function AIWorkforceWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'dispatch_matrix') return <ModelDispatchMatrix />;
  if (subtab === 'automation') return <AutomationRulesPanel />;
  if (subtab === 'tasks') return <AIWorkforceTaskBoard />;
  return <AIOperationsCenter />;
}

function AnalyticsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === '3d_lab') return <Analytics3DLab />;
  if (subtab === 'simulation') return <BusinessSimulationEngine />;
  if (subtab === 'python_sandbox') return <PythonSandbox />;
  return (
    <div className="space-y-5">
      <WorkspaceHero title="Phân tích & Tri thức" description="Gom dữ liệu, phân tích, báo cáo và bộ nhớ vận hành của doanh nghiệp." chips={["Nguồn dữ liệu", "Báo cáo điều hành", "Sandbox dữ liệu"]} />
      <CardGrid>
        <SimplePanelCard eyebrow="Data" title="Nguồn dữ liệu" description="Import/export và chuẩn hóa dữ liệu khi cần." icon={Database} tone="cyan" items={['CSV/Excel', 'JSON', 'Báo cáo']} />
        <SimplePanelCard eyebrow="Phân tích nâng cao" title="Phân tích dữ liệu" description="Các mô hình và sandbox chỉ mở khi có câu hỏi dữ liệu cụ thể." icon={BarChart3} tone="violet" items={['Thống kê', 'Dự báo', 'Kiểm tra bất thường']} />
      </CardGrid>
    </div>
  );
}

function SettingsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'general') return <SystemSettingsPanel />;
  if (subtab === 'integrations') return <IntegrationHub />;
  return (
    <div className="space-y-5">
      <WorkspaceHero title="Phát hành & khôi phục" description="Theo dõi bản phát hành, kiểm tra lỗi và khôi phục khi cần." chips={["Bản phát hành", "Kiểm tra", "Khôi phục"]} />
      <CardGrid>
        <BuildMonitorPanel />
        <MergeReadinessCenter />
        <PRControlCenter />
        <GitHubCIDoctorLauncher />
      </CardGrid>
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
        {staticConfig && !['ai_factory', 'marketing_growth', 'sales_crm'].includes(activeSegment) && <StaticWorkspace config={staticConfig} subtab={currentSubTabId} />}
        {activeSegment === 'marketing_growth' && staticConfig && <MarketingWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'sales_crm' && staticConfig && <SalesWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'ai_factory' && <AIWorkforceWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'finance_accounting' && <FinanceWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'analytics' && <AnalyticsWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'system_settings' && <SettingsWorkspace subtab={currentSubTabId} />}
        {!staticConfig && !['finance_accounting', 'analytics', 'system_settings', 'ai_factory', 'marketing_growth'].includes(activeSegment) && <LegacyWorkspace />}
      </Suspense>
    </div>
  );
}
