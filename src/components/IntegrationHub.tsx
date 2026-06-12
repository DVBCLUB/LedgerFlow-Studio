import React, { useEffect, useMemo, useState } from 'react';
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
  Loader2,
  Network,
  PlayCircle,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import GitHubConnectorPanel from './GitHubConnectorPanel';
import {
  fetchIntegrations,
  testIntegrationConnector,
  updateIntegrationConnector,
  type IntegrationCategory,
  type IntegrationConnector,
  type IntegrationEvent,
  type IntegrationStatus,
} from '../utils/integrationHubApi';

type HubCategory = IntegrationCategory;

type ConnectorIcon = React.ComponentType<{ className?: string }>;

const statusConfig: Record<IntegrationStatus, { label: string; className: string }> = {
  connected: { label: 'Đã kết nối', className: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200' },
  local: { label: 'Local-first', className: 'border-sky-500/40 bg-sky-950/30 text-sky-200' },
  manual: { label: 'Handoff thủ công', className: 'border-amber-500/40 bg-amber-950/30 text-amber-200' },
  planned: { label: 'Đang quy hoạch', className: 'border-slate-600 bg-slate-900 text-slate-300' },
  error: { label: 'Cần xử lý', className: 'border-rose-500/50 bg-rose-950/30 text-rose-200' },
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

const iconById: Record<string, ConnectorIcon> = {
  'ai-gateway': Bot,
  github: Github,
  'vscode-cursor': Code2,
  'google-workspace': Cloud,
  'accounting-erp': Boxes,
  'document-vault': FileText,
  automation: Workflow,
  'data-hub': Database,
};

const fallbackIconByCategory: Record<HubCategory, ConnectorIcon> = {
  ai: Bot,
  devops: Code2,
  workspace: Cloud,
  accounting: Boxes,
  documents: FileText,
  automation: Workflow,
  data: Database,
};

const roadmap = [
  'V1: màn hình trung tâm kết nối, link nhanh, trạng thái, checklist, handoff prompt.',
  'V2: registry API lưu trạng thái thật, test connector, event log local.',
  'V3: GitHub connector đọc Actions/Issues/PR và tạo issue phát triển.',
  'V4: Google Workspace connector cho Sheets/Drive/Gmail/Calendar.',
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

function getIcon(item: IntegrationConnector): ConnectorIcon {
  return iconById[item.id] ?? fallbackIconByCategory[item.category] ?? Network;
}

export default function IntegrationHub() {
  const [category, setCategory] = useState<HubCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadHub() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIntegrations();
      setConnectors(data.connectors);
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được Integration Hub registry.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHub();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return connectors.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const haystack = [item.title, item.subtitle, item.notes, item.category, ...item.capabilities].join(' ').toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, connectors, query]);

  const summary = useMemo(() => {
    return connectors.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { connected: 0, local: 0, manual: 0, planned: 0, error: 0 } as Record<IntegrationStatus, number>,
    );
  }, [connectors]);

  const githubConnector = connectors.find((item) => item.id === 'github');

  async function handleTest(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await testIntegrationConnector(id);
      setConnectors((current) => current.map((item) => (item.id === id ? result.connector : item)));
      setEvents(result.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test connector thất bại.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(item: IntegrationConnector) {
    setBusyId(item.id);
    setError(null);
    try {
      const connector = await updateIntegrationConnector(item.id, { enabled: !item.enabled });
      setConnectors((current) => current.map((entry) => (entry.id === item.id ? connector : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được connector.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/60 shadow-2xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
              <Network className="h-4 w-4" /> Integration Hub v2
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                LedgerFlow là trung tâm đầu mối kết nối mọi nền tảng
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300">
                Không clone GitHub, VS Code, Google Drive, MISA hay n8n. LedgerFlow điều phối: gom yêu cầu, chuẩn hóa dữ liệu,
                gọi AI Gateway, mở đúng công cụ, ghi log, kiểm tra và yêu cầu duyệt trước khi tự động hóa.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Connected" value={summary.connected} icon={Sparkles} />
              <Metric label="Local-first" value={summary.local} icon={ShieldCheck} />
              <Metric label="Handoff" value={summary.manual} icon={TerminalSquare} />
              <Metric label="Roadmap" value={summary.planned} icon={ClipboardList} />
              <Metric label="Issues" value={summary.error} icon={XCircle} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Zap className="h-4 w-4 text-amber-300" /> Registry sống
              </div>
              <button
                type="button"
                onClick={() => void loadHub()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-cyan-500"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Tải lại
              </button>
            </div>
            <ul className="mt-4 space-y-3 text-xs font-semibold leading-6 text-slate-300">
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> Trạng thái connector được lưu local qua backend, không còn là card tĩnh.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> GitHub connector đã đọc được repo, Actions, Issues, PR và có thể tạo issue nếu có token.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> Hành động sâu như push code/gửi mail/đồng bộ dữ liệu sẽ thêm lớp duyệt ở các connector sau.</li>
            </ul>
            {error && <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold text-rose-100">{error}</div>}
          </div>
        </div>
      </section>

      {githubConnector?.enabled && <GitHubConnectorPanel repoUrl={githubConnector.url} onChanged={() => void loadHub()} />}

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
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-sm font-black text-slate-300">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-300" /> Đang tải registry connector...
            </div>
          ) : (
            filtered.map((item) => (
              <IntegrationCardView key={item.id} item={item} busy={busyId === item.id} onTest={handleTest} onToggle={handleToggle} />
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
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
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
            <Activity className="h-4 w-4 text-emerald-300" /> Event log gần nhất
          </div>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {events.length === 0 ? (
              <p className="text-xs font-semibold text-slate-500">Chưa có log connector.</p>
            ) : (
              events.slice(0, 12).map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    <span>{event.connectorId}</span>
                    <span>{event.level}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{event.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: ConnectorIcon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <Icon className="mb-3 h-5 w-5 text-cyan-300" />
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
    </div>
  );
}

function IntegrationCardView({
  item,
  busy,
  onTest,
  onToggle,
}: {
  item: IntegrationConnector;
  busy: boolean;
  onTest: (id: string) => Promise<void>;
  onToggle: (item: IntegrationConnector) => Promise<void>;
}) {
  const Icon = getIcon(item);
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
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${item.enabled ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
          {item.enabled ? 'Đang bật' : 'Đang tắt'}
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

      {item.lastMessage && (
        <p className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs font-semibold leading-6 text-cyan-100">
          {item.lastMessage}
        </p>
      )}

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
        <button
          type="button"
          onClick={() => void onTest(item.id)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-900/30 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Test
        </button>
        <button
          type="button"
          onClick={() => void onToggle(item)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-amber-500 disabled:opacity-60"
        >
          {item.enabled ? 'Tắt' : 'Bật'} connector
        </button>
      </div>
    </article>
  );
}
