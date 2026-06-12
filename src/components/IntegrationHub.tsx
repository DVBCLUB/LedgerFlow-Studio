import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Github,
  Network,
  PlayCircle,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow,
  Zap,
} from 'lucide-react';

type HubStatus = 'connected' | 'planned' | 'manual' | 'local';
type HubCategory = 'ai' | 'devops' | 'workspace' | 'accounting' | 'documents' | 'automation' | 'data';

interface IntegrationCard {
  id: string;
  title: string;
  subtitle: string;
  category: HubCategory;
  status: HubStatus;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  icon: React.ComponentType<{ className?: string }>;
  capabilities: string[];
  quickActions: Array<{ label: string; href?: string; hash?: string }>;
  notes: string;
}

const statusConfig: Record<HubStatus, { label: string; className: string }> = {
  connected: {
    label: 'Đã có nền',
    className: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  },
  local: {
    label: 'Local-first',
    className: 'border-sky-500/40 bg-sky-950/30 text-sky-200',
  },
  manual: {
    label: 'Handoff thủ công',
    className: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  },
  planned: {
    label: 'Đang quy hoạch',
    className: 'border-slate-600 bg-slate-900 text-slate-300',
  },
};

const categoryLabels: Record<HubCategory | 'all', string> = {
  all: 'Tất cả',
  ai: 'AI',
  devops: 'DevOps',
  workspace: 'Google/Office',
  accounting: 'Kế toán/ERP',
  documents: 'Chứng từ',
  automation: 'Tự động hóa',
  data: 'Dữ liệu',
};

const integrations: IntegrationCard[] = [
  {
    id: 'ai-gateway',
    title: 'AI Gateway',
    subtitle: 'Nhiều provider, nhiều API key, fallback quota, vault bảo mật.',
    category: 'ai',
    status: 'connected',
    priority: 'P0',
    icon: Bot,
    capabilities: ['Gemini / Groq / OpenRouter / Claude / Ollama', 'Fallback nhiều key', 'Vault, backup, auto-lock', 'Usage log và preflight'],
    quickActions: [{ label: 'Mở AI Gateway', hash: '/ai_settings' }],
    notes: 'Đây là lớp AI trung tâm để các connector khác dùng chung, không hard-code một API cố định.',
  },
  {
    id: 'github',
    title: 'GitHub',
    subtitle: 'Repo code, issue, pull request, Actions CI/CD, release note.',
    category: 'devops',
    status: 'manual',
    priority: 'P0',
    icon: Github,
    capabilities: ['Mở repo nhanh', 'Theo dõi CI xanh/đỏ', 'Quản lý issue/task', 'Chuẩn bị PR/release checklist'],
    quickActions: [
      { label: 'Mở repo', href: 'https://github.com/DVBCLUB/LedgerFlow-Studio' },
      { label: 'Mở Actions', href: 'https://github.com/DVBCLUB/LedgerFlow-Studio/actions' },
      { label: 'Mở Issues', href: 'https://github.com/DVBCLUB/LedgerFlow-Studio/issues' },
    ],
    notes: 'V1 mở nhanh/handoff. V2 sẽ đọc workflow run, log lỗi CI và dùng AI Gateway phân tích lỗi.',
  },
  {
    id: 'vscode-cursor',
    title: 'VS Code / Cursor / Copilot',
    subtitle: 'Xưởng code chuyên dụng; LedgerFlow chỉ điều phối, sinh prompt và checklist.',
    category: 'devops',
    status: 'manual',
    priority: 'P0',
    icon: Code2,
    capabilities: ['Sinh prompt sửa code', 'Checklist test', 'File plan', 'Handoff sang IDE có sẵn'],
    quickActions: [{ label: 'Mẫu handoff', hash: '/integration_hub?focus=vscode-cursor' }],
    notes: 'Không clone VS Code trong app. Dùng app làm bộ não quản lý yêu cầu, còn IDE là nơi sửa sâu.',
  },
  {
    id: 'google-workspace',
    title: 'Google Workspace',
    subtitle: 'Sheets, Drive, Gmail, Calendar cho dữ liệu, chứng từ, lịch và email.',
    category: 'workspace',
    status: 'planned',
    priority: 'P1',
    icon: Cloud,
    capabilities: ['Import/export Google Sheets', 'Lưu chứng từ Drive', 'Gửi báo cáo Gmail', 'Nhắc hạn Calendar'],
    quickActions: [
      { label: 'Drive', href: 'https://drive.google.com' },
      { label: 'Sheets', href: 'https://sheets.google.com' },
      { label: 'Gmail', href: 'https://mail.google.com' },
    ],
    notes: 'Ưu tiên sau DevOps: đồng bộ bảng chi phí, chứng từ và báo cáo sếp.',
  },
  {
    id: 'accounting-erp',
    title: 'MISA / SmartPro / ERP Legacy',
    subtitle: 'Kết nối hoặc hỗ trợ nhập liệu với phần mềm kế toán đang dùng.',
    category: 'accounting',
    status: 'planned',
    priority: 'P1',
    icon: Boxes,
    capabilities: ['Mapping tài khoản/khoản mục', 'Xuất file trung gian Excel/CSV', 'Checklist đối chiếu', 'Hỗ trợ nhập liệu nhanh'],
    quickActions: [{ label: 'Tạo checklist tích hợp', hash: '/integration_hub?focus=accounting-erp' }],
    notes: 'Không thay SmartPro/MISA ngay. LedgerFlow đứng giữa để chuẩn hóa dữ liệu và kiểm soát chứng từ.',
  },
  {
    id: 'document-vault',
    title: 'Document / Evidence Vault',
    subtitle: 'Quản lý hồ sơ chứng từ, hợp đồng, hóa đơn, phiếu nhập kho.',
    category: 'documents',
    status: 'local',
    priority: 'P0',
    icon: FileText,
    capabilities: ['Cây thư mục chứng từ', 'Mã hồ sơ', 'Trạng thái thiếu/đủ chứng từ', 'Liên kết chi phí - file chứng từ'],
    quickActions: [{ label: 'Quy hoạch chứng từ', hash: '/integration_hub?focus=document-vault' }],
    notes: 'Đây là lõi nghiệp vụ xây dựng: chi phí phải bám chứng từ và trạng thái duyệt.',
  },
  {
    id: 'automation',
    title: 'n8n / Make / Zapier / Webhook',
    subtitle: 'Tự động hóa liên nền tảng theo trigger/action có kiểm soát.',
    category: 'automation',
    status: 'planned',
    priority: 'P2',
    icon: Workflow,
    capabilities: ['Webhook inbound/outbound', 'Nhắc hạn chứng từ', 'Gửi báo cáo định kỳ', 'Đồng bộ trạng thái task'],
    quickActions: [{ label: 'Thiết kế workflow', hash: '/integration_hub?focus=automation' }],
    notes: 'Sau khi dữ liệu ổn mới bật tự động hóa để tránh tự động đẩy sai dữ liệu.',
  },
  {
    id: 'data-hub',
    title: 'Data Hub / Import Export',
    subtitle: 'CSV, Excel, JSON, API staging để gom dữ liệu từ nhiều nơi.',
    category: 'data',
    status: 'local',
    priority: 'P1',
    icon: Database,
    capabilities: ['Import Excel/CSV', 'Chuẩn hóa cột', 'Mapping nguồn dữ liệu', 'Audit log dữ liệu vào/ra'],
    quickActions: [{ label: 'Chuẩn hóa dữ liệu', hash: '/integration_hub?focus=data-hub' }],
    notes: 'Dữ liệu đi qua staging trước khi vào sổ chính để dễ kiểm tra và rollback.',
  },
];

const roadmap = [
  'V1: màn hình trung tâm kết nối, link nhanh, trạng thái, checklist, handoff prompt.',
  'V2: GitHub connector đọc Actions/Issues/PR và phân tích lỗi CI bằng AI Gateway.',
  'V3: Google Workspace connector cho Sheets/Drive/Gmail/Calendar.',
  'V4: Document Vault + Data Hub chuẩn hóa chứng từ/Excel/CSV.',
  'V5: Automation Hub với webhook/n8n/Make/Zapier, có duyệt trước khi chạy.',
];

function openQuickAction(action: { href?: string; hash?: string }) {
  if (action.href) {
    window.open(action.href, '_blank', 'noopener,noreferrer');
    return;
  }
  if (action.hash) {
    window.location.hash = action.hash;
  }
}

export default function IntegrationHub() {
  const [category, setCategory] = useState<HubCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return integrations.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const haystack = [item.title, item.subtitle, item.notes, item.category, ...item.capabilities].join(' ').toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, query]);

  const summary = useMemo(() => {
    return integrations.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { connected: 0, local: 0, manual: 0, planned: 0 } as Record<HubStatus, number>,
    );
  }, []);

  return (
    <div className="space-y-6 text-slate-100">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/60 shadow-2xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
              <Network className="h-4 w-4" /> Integration Hub v1
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                LedgerFlow là trung tâm đầu mối kết nối mọi nền tảng
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300">
                Không clone GitHub, VS Code, Google Drive, MISA hay n8n. LedgerFlow đóng vai trò điều phối: gom yêu cầu,
                chuẩn hóa dữ liệu, gọi AI Gateway, mở đúng công cụ, ghi log, kiểm tra và yêu cầu duyệt trước khi tự động hóa.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="AI ready" value={summary.connected} icon={Sparkles} />
              <Metric label="Local-first" value={summary.local} icon={ShieldCheck} />
              <Metric label="Handoff" value={summary.manual} icon={TerminalSquare} />
              <Metric label="Roadmap" value={summary.planned} icon={ClipboardList} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <Zap className="h-4 w-4 text-amber-300" /> Nguyên tắc vận hành
            </div>
            <ul className="mt-4 space-y-3 text-xs font-semibold leading-6 text-slate-300">
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> Tận dụng phần mềm free/có sẵn thay vì tự xây lại từ đầu.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> AI Gateway là bộ não chung cho phân tích, prompt, checklist, log lỗi.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> Hành động nhạy cảm phải có duyệt: ghi file, push code, gửi mail, đồng bộ dữ liệu.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> Mỗi connector có trạng thái, log, test kết nối và rollback plan.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
            <Settings2 className="h-4 w-4 text-cyan-300" /> Bộ lọc connector
          </div>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm GitHub, Sheets, MISA..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
            />
          </div>
          <div className="space-y-2">
            {(Object.keys(categoryLabels) as Array<HubCategory | 'all'>).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-xs font-black transition ${
                  category === key
                    ? 'border border-cyan-500/50 bg-cyan-950/40 text-cyan-100'
                    : 'border border-slate-800 bg-slate-900/70 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {categoryLabels[key]}
              </button>
            ))}
          </div>
        </aside>

        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((item) => (
            <IntegrationCardView key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
          <GitBranch className="h-4 w-4 text-cyan-300" /> Lộ trình Integration Hub
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {roadmap.map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-950 text-xs font-black text-cyan-200">
                {index + 1}
              </div>
              <p className="text-xs font-semibold leading-6 text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <Icon className="mb-3 h-5 w-5 text-cyan-300" />
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
    </div>
  );
}

function IntegrationCardView({ item }: { item: IntegrationCard }) {
  const Icon = item.icon;
  const status = statusConfig[item.status];

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/30">
            <Icon className="h-5 w-5 text-cyan-200" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">{item.title}</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{item.subtitle}</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-300">{item.priority}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-black text-slate-300">
          {categoryLabels[item.category]}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {item.capabilities.map((capability) => (
          <div key={capability} className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs font-semibold leading-5 text-slate-300">
            <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            {capability}
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-xs font-semibold leading-6 text-slate-400">
        {item.notes}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => openQuickAction(action)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-cyan-500 hover:bg-cyan-950/30"
          >
            {action.href ? <ExternalLink className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
            {action.label}
          </button>
        ))}
      </div>
    </article>
  );
}
