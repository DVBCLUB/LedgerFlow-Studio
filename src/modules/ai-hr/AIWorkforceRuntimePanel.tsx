import React from 'react';
import { Activity, AlertTriangle, Bot, CheckCircle2, Database, Gauge, Loader2, PlayCircle, ShieldCheck, WifiOff } from 'lucide-react';
import {
  createSampleGroundedContextPack,
  fetchAIWorkforceRuntimeDashboard,
  previewSampleAutomationSafety,
  scoreSamplePRReadiness,
} from '../../services/aiWorkforceRuntimeClient';

const cardClass = 'rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50';

type RuntimeAction = 'dashboard' | 'context' | 'safety' | 'readiness';

function MiniMetric({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {detail && <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{detail}</p>}
    </div>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-[11px] font-semibold leading-5 text-slate-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AIWorkforceRuntimePanel() {
  const [loading, setLoading] = React.useState<RuntimeAction | null>('dashboard');
  const [error, setError] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<any>(null);
  const [lastResult, setLastResult] = React.useState<any>(null);

  const refreshDashboard = React.useCallback(async () => {
    setLoading('dashboard');
    setError(null);
    try {
      const response = await fetchAIWorkforceRuntimeDashboard();
      setDashboard(response.dashboard);
      setLastResult({ type: 'runtime-dashboard', response });
    } catch (err: any) {
      setError(err?.message || 'Cannot reach AI Workforce Runtime Hub.');
    } finally {
      setLoading(null);
    }
  }, []);

  React.useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  async function runAction(action: RuntimeAction) {
    setLoading(action);
    setError(null);
    try {
      const response = action === 'context'
        ? await createSampleGroundedContextPack()
        : action === 'safety'
          ? await previewSampleAutomationSafety()
          : action === 'readiness'
            ? await scoreSamplePRReadiness()
            : await fetchAIWorkforceRuntimeDashboard();
      setLastResult({ type: action, response });
      const refreshed = await fetchAIWorkforceRuntimeDashboard();
      setDashboard(refreshed.dashboard);
    } catch (err: any) {
      setError(err?.message || `AI Workforce runtime action failed: ${action}`);
    } finally {
      setLoading(null);
    }
  }

  const readiness = dashboard?.readiness;
  const observability = dashboard?.observability;
  const storeStats = dashboard?.storeStats;
  const recentRecords = dashboard?.recentRecords || [];
  const offline = Boolean(error && !dashboard);

  return (
    <section className={`${cardClass} border-cyan-500/20`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
            {offline ? <WifiOff className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-base font-black text-white">Live Runtime Hub</h2>
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-300">
              Giao diện live cho AI Workforce Runtime Hub: đọc dashboard, tạo grounded context pack, preview safety envelope và chấm PR readiness.
            </p>
          </div>
        </div>
        <button className={buttonClass} onClick={() => runAction('dashboard')} disabled={Boolean(loading)}>
          {loading === 'dashboard' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
          Refresh runtime
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold leading-6 text-amber-100">
          <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4" /> <span>{error}</span></div>
          <p className="mt-2 text-[11px] text-amber-200/80">Runtime Hub sẽ hoạt động khi assistant daemon đang chạy và patch script đã được chạy.</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="Readiness" value={readiness ? `${readiness.grade} · ${readiness.overallScore}/5` : '—'} detail="Điểm runtime readiness động" />
        <MiniMetric label="Runs" value={observability?.runs ?? '—'} detail="AI run metrics đã ghi" />
        <MiniMetric label="Blocked rate" value={observability ? `${Math.round((observability.blockedRate || 0) * 100)}%` : '—'} detail="Tác vụ bị safety chặn" />
        <MiniMetric label="Runtime records" value={storeStats?.total ?? '—'} detail="Context, safety, PR readiness, snapshot" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <button className={buttonClass} onClick={() => runAction('context')} disabled={Boolean(loading)}>
          {loading === 'context' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          Build context pack
        </button>
        <button className={buttonClass} onClick={() => runAction('safety')} disabled={Boolean(loading)}>
          {loading === 'safety' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Preview safety
        </button>
        <button className={buttonClass} onClick={() => runAction('readiness')} disabled={Boolean(loading)}>
          {loading === 'readiness' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Score PR readiness
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-cyan-300">
            <Bot className="h-4 w-4" /> Recent runtime records
          </div>
          <div className="space-y-2">
            {recentRecords.length ? recentRecords.slice(0, 5).map((record: any) => (
              <div key={record.id} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                <p className="text-xs font-black text-white">{record.type}</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{record.id}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{record.createdAt}</p>
              </div>
            )) : (
              <p className="text-xs font-semibold text-slate-500">Chưa có runtime record hoặc daemon chưa online.</p>
            )}
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-violet-300">
            <PlayCircle className="h-4 w-4" /> Last action result
          </div>
          <JsonPreview value={lastResult || { status: offline ? 'offline' : 'waiting_for_runtime_action' }} />
        </div>
      </div>
    </section>
  );
}
