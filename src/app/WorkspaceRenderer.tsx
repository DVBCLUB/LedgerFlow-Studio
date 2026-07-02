import React, { Suspense, useMemo, useState } from 'react';
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
  GitPullRequest,
  LucideIcon,
  Mail,
  Network,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
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
const SystemSettingsPanel = React.lazy(() => import('../modules/system-settings/SystemSettingsPanel'));
const IntegrationHub = React.lazy(() => import('../modules/dev-ops/IntegrationHub'));
const BuildMonitorPanel = React.lazy(() => import('../modules/dev-ops/BuildMonitorPanel'));
const MergeReadinessCenter = React.lazy(() => import('../modules/dev-ops/MergeReadinessCenter'));
const PRControlCenter = React.lazy(() => import('../modules/dev-ops/PRControlCenter'));
const GitHubCIDoctorLauncher = React.lazy(() => import('../modules/dev-ops/GitHubCIDoctorLauncher'));

type WorkspaceSubtab = { id: string; label: string; icon?: LucideIcon };

const SUB_TABS_CONFIG: Record<string, readonly WorkspaceSubtab[]> = {
  ceo_command: [
    { id: 'overview', label: 'Tổng quan', icon: Briefcase },
    { id: 'today', label: 'Việc hôm nay', icon: Activity },
  ],
  product_studio: [
    { id: 'portfolio', label: 'Sản phẩm', icon: FolderKanban },
    { id: 'release', label: 'Phát hành', icon: Rocket },
  ],
  marketing_growth: [
    { id: 'campaigns', label: 'Chiến dịch', icon: Rocket },
    { id: 'content', label: 'Nội dung', icon: Mail },
  ],
  sales_crm: [
    { id: 'pipeline', label: 'Pipeline', icon: BarChart3 },
    { id: 'followup', label: 'Chăm sóc', icon: UsersRound },
  ],
  finance_accounting: [
    { id: 'ledger', label: 'Sổ cái', icon: Database },
    { id: 'reports', label: 'Báo cáo', icon: Calculator },
    { id: 'cashflow', label: 'Dòng tiền', icon: TrendingUp },
    { id: 'approval', label: 'Duyệt', icon: CheckCircle },
  ],
  ai_factory: [
    { id: 'command', label: 'Điều phối', icon: Bot },
    { id: 'automation', label: 'Tự động hóa', icon: Sparkles },
  ],
  analytics: [
    { id: 'python_sandbox', label: 'Python', icon: Code },
    { id: 'data', label: 'Dữ liệu', icon: Database },
  ],
  system_settings: [
    { id: 'general', label: 'Cài đặt', icon: Settings },
    { id: 'integrations', label: 'Tích hợp', icon: Network },
    { id: 'devops', label: 'DevOps', icon: ShieldCheck },
  ],
};

const DEFAULT_SUBTAB: Record<string, string> = Object.fromEntries(
  Object.entries(SUB_TABS_CONFIG).map(([key, tabs]) => [key, tabs[0]?.id || 'overview']),
);

function LoadingFallback() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm font-semibold text-slate-400">
      Đang tải module...
    </div>
  );
}

function WorkspaceHero({ title, description, chips = [] }: { title: string; description: string; chips?: string[] }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-left shadow-xl shadow-black/20">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">LedgerFlow workspace</p>
      <h1 className="mt-2 text-2xl font-black text-white">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-400">{description}</p>
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
              {chip}
            </span>
          ))}
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
      title="Nội dung kỹ thuật đã được ẩn khỏi giao diện chính"
      description="Prompt cho AI, checklist dài, log CI, runbook và câu giao việc cho agent không còn dàn trên màn hình. Khi cần debug, mở GitHub/Replit/terminal hoặc panel chi tiết riêng."
      icon={ShieldCheck}
      status="Review mode"
      tone="slate"
      items={[
        'UI chỉ hiển thị trạng thái và hành động cần bấm',
        'Logic, log và prompt chạy ngầm hoặc nằm trong docs',
        'Mỗi module giữ đúng mục đích nghiệp vụ chính',
        'Giảm chữ dài để review nhanh trên Replit/local',
      ]}
    />
  );
}

function CommandWorkspace({ subtab }: { subtab: string }) {
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Command Center"
        description="Màn hình điều hành gọn: việc cần làm, tình trạng tiền, pipeline và điểm nghẽn. Không hiển thị runbook hay prompt nội bộ trên giao diện chính."
        chips={["Hôm nay", "Cảnh báo", "Ưu tiên"]}
      />
      <CardGrid>
        <SimplePanelCard eyebrow="Hôm nay" title="Việc cần xử lý" description="Tập trung vào các việc chặn tiến độ hoặc cần quyết định." icon={ClipboardList} tone="cyan" items={['Review module đang sửa', 'Kiểm tra lỗi preview', 'Chốt việc tiếp theo']} />
        <SimplePanelCard eyebrow="Tài chính" title="Dòng tiền & chi phí" description="Xem nhanh tình trạng tài chính, không trộn checklist kỹ thuật vào dashboard." icon={TrendingUp} tone="emerald" items={['Thu/chi chính', 'Chi phí cần duyệt', 'Báo cáo cần xem']} />
        <SimplePanelCard eyebrow="Sản phẩm" title="Module đang build" description="Theo dõi phần đang cải tổ, ảnh trước/sau và lỗi còn lại." icon={FolderKanban} tone="violet" items={['Cài đặt & DevOps', 'UI cleanup', 'Replit preview']} />
        <SimplePanelCard eyebrow="Rủi ro" title="Điểm cần chú ý" description="Chỉ hiển thị rủi ro thật sự ảnh hưởng sử dụng." icon={ShieldCheck} tone="amber" items={['Build lỗi', 'UI quá dài', 'Agent sửa lan man']} />
      </CardGrid>
      {subtab === 'today' && <CompactModuleNotice />}
    </div>
  );
}

function ProductWorkspace({ subtab }: { subtab: string }) {
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Product Studio"
        description="Quản lý sản phẩm, roadmap và bản phát hành. Các ý tưởng/prompt AI dài được đưa về hậu trường, chỉ giữ mục tiêu và trạng thái review."
        chips={["Roadmap", "Review", "Release"]}
      />
      <CardGrid>
        <SimplePanelCard eyebrow="Portfolio" title="Sản phẩm đang làm" description="Danh sách gọn các sản phẩm/module cần ưu tiên." icon={FolderKanban} tone="cyan" items={['LedgerFlow core app', 'Finance workflow', 'AI helper khi cần']} />
        <SimplePanelCard eyebrow="Roadmap" title="Việc tiếp theo" description="Một lần chỉ cải tổ một module để dễ test và revert." icon={Target} tone="emerald" items={['Dọn UI dài', 'Giữ chức năng chính', 'Ẩn phần kỹ thuật']} />
        <SimplePanelCard eyebrow="Review" title="Tiêu chí đạt" description="Màn hình dễ đọc, ít chữ thừa, không còn câu giao việc cho AI." icon={FileCheck2} tone="violet" items={['Không prompt lộ trên UI', 'Có nút hành động rõ', 'Không phá build']} />
        <SimplePanelCard eyebrow="Release" title="Phát hành nội bộ" description="Dùng Replit/local để xem trước; deploy public chỉ khi cần chia sẻ." icon={Rocket} tone="amber" items={['Pull code', 'Restart preview', 'Chụp lỗi nếu có']} />
      </CardGrid>
      {subtab === 'release' && <CompactModuleNotice />}
    </div>
  );
}

function MarketingWorkspace({ subtab }: { subtab: string }) {
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Marketing & Growth"
        description="Giữ phần marketing ở mức tác nghiệp: chiến dịch, nội dung, kênh phân phối và kết quả. Prompt copywriting dài không nằm sẵn trên màn hình."
        chips={["Campaign", "Content", "Metrics"]}
      />
      <CardGrid>
        <SimplePanelCard eyebrow="Chiến dịch" title="Kế hoạch đang chạy" description="Theo dõi mục tiêu, kênh và trạng thái triển khai." icon={Rocket} tone="cyan" items={['Kênh chính', 'Thông điệp', 'Việc cần làm']} />
        <SimplePanelCard eyebrow="Nội dung" title="Content queue" description="Chỉ giữ danh sách nội dung cần sản xuất, không dàn prompt AI ra UI." icon={Mail} tone="violet" items={['Bài viết', 'Video ngắn', 'Landing page']} />
        <SimplePanelCard eyebrow="Tăng trưởng" title="Tín hiệu cần xem" description="Tập trung dữ liệu phản hồi thật, tránh dashboard giả quá nhiều chữ." icon={TrendingUp} tone="emerald" items={['Lead mới', 'Conversion', 'Feedback']} />
        <SimplePanelCard eyebrow="Review" title="Dọn nội dung" description="Các kịch bản/prompt nên nằm trong tool tạo nội dung hoặc docs, không ở màn hình chính." icon={ShieldCheck} tone="amber" items={['Ẩn prompt', 'Giữ CTA', 'Giữ số liệu']} />
      </CardGrid>
      {subtab === 'content' && <CompactModuleNotice />}
    </div>
  );
}

function SalesWorkspace({ subtab }: { subtab: string }) {
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Sales & CRM"
        description="Quản lý khách hàng, pipeline và follow-up. Màn hình CRM chỉ nên hiện thông tin bán hàng cần hành động."
        chips={["Leads", "Deals", "Follow-up"]}
      />
      <CardGrid>
        <SimplePanelCard eyebrow="Pipeline" title="Cơ hội bán hàng" description="Tổng quan lead/deal theo trạng thái." icon={BarChart3} tone="cyan" items={['Lead mới', 'Đang tư vấn', 'Chốt/không chốt']} />
        <SimplePanelCard eyebrow="Khách hàng" title="Follow-up" description="Việc cần nhắc lại và lịch chăm sóc." icon={UsersRound} tone="emerald" items={['Gọi lại', 'Gửi báo giá', 'Nhắc thanh toán']} />
        <SimplePanelCard eyebrow="Báo giá" title="Pricing" description="Giữ bảng giá và đề xuất đơn giản." icon={Target} tone="violet" items={['Gói cơ bản', 'Gói mở rộng', 'Ưu đãi']} />
        <SimplePanelCard eyebrow="Review" title="Dữ liệu sạch" description="Ẩn mô phỏng/prompt bán hàng dài khỏi giao diện chính." icon={ShieldCheck} tone="amber" items={['Không prompt mẫu dài', 'Không bảng giả thừa', 'Ưu tiên lead thật']} />
      </CardGrid>
      {subtab === 'followup' && <CompactModuleNotice />}
    </div>
  );
}

function FinanceWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'ledger') return <LedgerAccountingWorkspace />;
  if (subtab === 'reports') return <FinancialReportsVN />;
  if (subtab === 'cashflow') return <RevenueDashboard />;
  if (subtab === 'approval') return <ApprovalWorkflow />;
  return <LedgerAccountingWorkspace />;
}

function AIWorkspace({ subtab }: { subtab: string }) {
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="AI Operations"
        description="AI chỉ là trợ lý chạy tác vụ khi cần. Giao diện chính không hiển thị system prompt, role prompt, chain hướng dẫn hay checklist agent dài."
        chips={["Ra lệnh", "Theo dõi", "Kiểm soát"]}
      />
      <CardGrid>
        <SimplePanelCard eyebrow="AI" title="Trợ lý theo yêu cầu" description="Chỉ dùng khi có việc cụ thể: tóm tắt, kiểm tra lỗi, viết nháp hoặc phân tích." icon={Bot} tone="violet" items={['Nhập yêu cầu ngắn', 'Xem kết quả', 'Duyệt thủ công']} />
        <SimplePanelCard eyebrow="An toàn" title="Không tự hành động nguy hiểm" description="AI không tự xóa dữ liệu, gửi email, push code hoặc sửa lan rộng nếu chưa được duyệt." icon={ShieldCheck} tone="emerald" items={['Không auto delete', 'Không push main', 'Không lộ secret']} />
        <SimplePanelCard eyebrow="Automation" title="Chạy ngầm khi cần" description="Tác vụ định kỳ nên chạy ở backend/automation, UI chỉ hiện trạng thái." icon={Sparkles} tone="cyan" items={['Lịch chạy', 'Kết quả cuối', 'Lỗi cần xử lý']} />
        <SimplePanelCard eyebrow="Review" title="Ẩn prompt nội bộ" description="System instruction và prompt dài nằm trong code/backend, không hiển thị cho người dùng cuối." icon={FileCheck2} tone="amber" items={['Ẩn system prompt', 'Ẩn runbook', 'Giữ nút hành động']} />
      </CardGrid>
      {subtab === 'automation' && <CompactModuleNotice />}
    </div>
  );
}

function AnalyticsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'python_sandbox') return <PythonSandbox />;
  return (
    <div className="space-y-5">
      <WorkspaceHero title="Analytics & Models" description="Không gian phân tích dữ liệu. Chỉ mở notebook/sandbox khi cần xử lý thật, không dàn tài liệu kỹ thuật dài lên màn hình." chips={["Data", "Python", "Report"]} />
      <CardGrid>
        <SimplePanelCard eyebrow="Data" title="Nguồn dữ liệu" description="Import/export và chuẩn hóa dữ liệu khi cần." icon={Database} tone="cyan" items={['CSV/Excel', 'JSON', 'Báo cáo']} />
        <SimplePanelCard eyebrow="Model" title="Phân tích" description="Các mô hình và sandbox chỉ mở khi có câu hỏi dữ liệu cụ thể." icon={BarChart3} tone="violet" items={['Thống kê', 'Dự báo', 'Kiểm tra bất thường']} />
      </CardGrid>
    </div>
  );
}

function SettingsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'general') return <SystemSettingsPanel />;
  if (subtab === 'integrations') return <IntegrationHub />;
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="DevOps gọn"
        description="DevOps dùng để kiểm tra build, PR và lỗi preview. Log, prompt, checklist dài nằm ở GitHub/Replit/terminal, không dàn vào app."
        chips={["Build", "PR", "CI"]}
      />
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
      <WorkspaceHero
        title="Module đã được gom lại"
        description="Route cũ hoặc module thử nghiệm đã được ẩn khỏi giao diện chính để tránh rối. Hãy dùng các workspace chính ở thanh bên."
        chips={["Ẩn legacy", "Giao diện gọn", "Review mode"]}
      />
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
  const rawSubTabs = SUB_TABS_CONFIG[activeSegment] || [];
  const subTabs = rawSubTabs.filter((tab) => {
    if (activeRole === 'all' || activeRole === 'founder' || activeRole === 'admin') return true;
    if (activeSegment === 'system_settings' && tab.id === 'devops') return ['devops', 'agentops'].includes(activeRole);
    return true;
  });
  const validSubTabIds = useMemo(() => subTabs.map((tab) => tab.id), [subTabs]);
  const currentSubTabId = resolveWorkspaceSubTab(activeSegment, activeSubTabs[activeSegment], validSubTabIds) || subTabs[0]?.id || '';

  React.useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/\?subtab=([^&]+)/);
    if (!match?.[1]) return;
    const normalized = resolveWorkspaceSubTab(activeSegment, decodeURIComponent(match[1]), validSubTabIds);
    if (normalized) {
      setActiveSubTabs((prev) => ({ ...prev, [activeSegment]: normalized }));
    }
  }, [activeSegment, validSubTabIds]);

  const handleSubTabChange = (newSubTabId: string) => {
    const normalized = resolveWorkspaceSubTab(activeSegment, newSubTabId, validSubTabIds) || newSubTabId;
    setActiveSubTabs((prev) => ({ ...prev, [activeSegment]: normalized }));
    window.location.hash = `/${activeSegment}?subtab=${normalized}`;
  };

  return (
    <div className="space-y-6">
      {subTabs.length > 1 && (
        <WorkspaceSubNavigation tabs={subTabs} activeTab={currentSubTabId} onChange={handleSubTabChange} />
      )}

      <Suspense fallback={<LoadingFallback />}>
        {activeSegment === 'ceo_command' && <CommandWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'product_studio' && <ProductWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'marketing_growth' && <MarketingWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'sales_crm' && <SalesWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'finance_accounting' && <FinanceWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'ai_factory' && <AIWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'analytics' && <AnalyticsWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'system_settings' && <SettingsWorkspace subtab={currentSubTabId} />}
        {!['ceo_command', 'product_studio', 'marketing_growth', 'sales_crm', 'finance_accounting', 'ai_factory', 'analytics', 'system_settings'].includes(activeSegment) && <LegacyWorkspace />}
      </Suspense>
    </div>
  );
}
