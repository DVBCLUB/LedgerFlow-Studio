import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Database, RefreshCw, Workflow, Zap } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type Overview = Record<string, unknown>;

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-cyan-300">{value}</p></div>;
}

function countOf(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length;
  if (typeof value === 'number') return value;
  return 0;
}

export default function SystemOverviewDaemonPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await daemonFetch<any>('/api/system/overview', undefined, 10000);
      const next = data?.overview || data;
      setOverview(next || {});
      setRaw(JSON.stringify(next || data, null, 2));
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Cannot load daemon system overview.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const keys = overview ? Object.keys(overview) : [];

  return <section className="space-y-5 rounded-3xl border border-cyan-400/25 bg-cyan-400/5 p-5 text-slate-100">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200"><Activity className="mr-2 inline h-3.5 w-3.5" />Daemon system overview</p><h3 className="mt-1 text-xl font-black text-white">Cross-service runtime map</h3><p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Live overview from assistant daemon route /api/system/overview.</p></div>
      <button onClick={() => void load()} disabled={loading} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Loading...' : 'Refresh'}</button>
    </div>
    {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
    <div className="grid gap-3 md:grid-cols-4"><Stat label="Sections" value={keys.length} /><Stat label="Agents" value={countOf((overview as any)?.agents || (overview as any)?.agentRuntime)} /><Stat label="Workflows" value={countOf((overview as any)?.workflows || (overview as any)?.agentWorkflows)} /><Stat label="Memory" value={countOf((overview as any)?.memory || (overview as any)?.knowledge)} /></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-sm font-black text-white"><Workflow className="mr-2 inline h-4 w-4 text-cyan-300" />Detected sections</p><div className="mt-3 flex flex-wrap gap-2">{keys.map((key) => <span key={key} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-black text-slate-300">{key}</span>)}{keys.length === 0 && <span className="text-xs font-bold text-slate-500">No sections returned.</span>}</div></div>
      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-sm font-black text-white"><Zap className="mr-2 inline h-4 w-4 text-amber-300" />Operational hint</p><p className="mt-3 text-sm font-semibold leading-6 text-slate-300">Use this panel to verify whether backend services are visible to the desktop app after packaging.</p></div>
    </div>
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-sm font-black text-white"><Database className="mr-2 inline h-4 w-4 text-emerald-300" />Raw overview</p><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-400">{raw || 'No overview loaded.'}</pre></div>
  </section>;
}
