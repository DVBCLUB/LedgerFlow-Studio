import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Gauge, Loader2, RefreshCw, XCircle } from 'lucide-react';

interface HealthSignal {
  id: string;
  label: string;
  status: 'healthy' | 'attention' | 'blocked';
  value: number | string;
  detail: string;
}

interface HealthSummary {
  status: 'healthy' | 'attention' | 'blocked';
  readiness: number;
  checkedAt: string;
  signals: HealthSignal[];
}

const API_BASE = 'http://localhost:3011/api/software-factory';

function StatusIcon({ status }: { status: HealthSignal['status'] }) {
  if (status === 'healthy') return <CheckCircle2 className="h-5 w-5 text-emerald-300" />;
  if (status === 'attention') return <AlertTriangle className="h-5 w-5 text-amber-300" />;
  return <XCircle className="h-5 w-5 text-rose-300" />;
}

function StatusBadge({ status }: { status: HealthSignal['status'] }) {
  const cls = status === 'healthy'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : status === 'attention'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      : 'border-rose-500/30 bg-rose-500/10 text-rose-100';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${cls}`}>{status}</span>;
}

export default function FactoryHealthSummaryPanel() {
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/health-summary`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const payload = await response.json();
      setHealth(payload.health || null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cannot load health summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const healthyCount = useMemo(() => health?.signals.filter((signal) => signal.status === 'healthy').length || 0, [health]);
  const attentionCount = useMemo(() => health?.signals.filter((signal) => signal.status === 'attention').length || 0, [health]);
  const blockedCount = useMemo(() => health?.signals.filter((signal) => signal.status === 'blocked').length || 0, [health]);

  return <section className="space-y-4 rounded-[2rem] border border-emerald-400/20 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200"><Gauge className="mr-2 inline h-4 w-4" />Workspace health summary</p>
        <h3 className="mt-2 text-xl font-black text-white">Factory readiness overview</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">Panel này tổng hợp trạng thái runs, executions, providers, commands, assets, release kit và audit log thành một điểm readiness.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {health && <StatusBadge status={health.status} />}
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-emerald-400/40 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
      </div>
    </div>

    {message && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">{message}</div>}

    {!health ? <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-bold text-slate-500">Health summary chưa có dữ liệu. Hãy chạy daemon và refresh.</div> : <>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">readiness</p>
          <p className="mt-1 text-3xl font-black text-white">{health.readiness}%</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">checked {new Date(health.checkedAt).toLocaleTimeString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">healthy</p><p className="mt-1 text-3xl font-black text-emerald-200">{healthyCount}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">attention</p><p className="mt-1 text-3xl font-black text-amber-200">{attentionCount}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">blocked</p><p className="mt-1 text-3xl font-black text-rose-200">{blockedCount}</p></div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {health.signals.map((signal) => <div key={signal.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <StatusIcon status={signal.status} />
              <div>
                <p className="text-xs font-black text-white">{signal.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-100">{signal.value}</p>
              </div>
            </div>
            <StatusBadge status={signal.status} />
          </div>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-500">{signal.detail}</p>
        </div>)}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-300" /><p className="text-xs font-black text-white">Next operator action</p></div>
        <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{health.status === 'healthy' ? 'Workspace sẵn sàng cho run tiếp theo.' : health.status === 'attention' ? 'Có mục cần review hoặc bổ sung dữ liệu trước khi chạy full pipeline.' : 'Có mục đang blocked; cần xem command/audit/execution trước khi tiếp tục.'}</p>
      </div>
    </>}
  </section>;
}
