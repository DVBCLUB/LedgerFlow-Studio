import { useEffect, useState } from 'react';
import { AlertTriangle, Bot, Brain, Play, RefreshCw, ShieldAlert } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type Metrics = { emergencyStop?: boolean; totalRuns?: number; activeRuns?: number; waitingApproval?: number; completedRuns?: number; failedRuns?: number; artifactCount?: number };
type Run = { id: string; goal: string; status: string; planner?: string; createdAt: string };
type Role = { id: string; emoji?: string; group?: string };

function rows<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any)[key])) return (value as any)[key] as T[];
  return [];
}

function metricsOf(value: unknown): Metrics {
  if (value && typeof value === 'object' && (value as any).metrics) return (value as any).metrics as Metrics;
  return (value || {}) as Metrics;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-cyan-300">{value}</p></div>;
}

export default function AIOperationsDaemonPanel() {
  const [metrics, setMetrics] = useState<Metrics>({});
  const [runs, setRuns] = useState<Run[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const [m, r, roleData] = await Promise.all([
        daemonFetch<unknown>('/api/agent-runtime/metrics', undefined, 10000),
        daemonFetch<unknown>('/api/agent-runtime/runs?limit=20', undefined, 10000),
        daemonFetch<unknown>('/api/roles', undefined, 10000),
      ]);
      setMetrics(metricsOf(m));
      setRuns(rows<Run>(r, 'runs'));
      setRoles(rows<Role>(roleData, 'roles'));
      setError('');
    } catch (err: any) {
      setError(err?.message || 'AI operations daemon connection failed.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const createRun = async () => {
    if (!goal.trim()) return;
    setBusy(true); setMessage('');
    try {
      const data = await daemonFetch<any>('/api/agent-runtime/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: goal.trim(), maxSteps: 4, plannerMode: 'auto' }) }, 60000);
      setGoal('');
      setMessage(`Agent run created: ${data?.run?.id || data?.id || 'created'}`);
      await load();
    } catch (err: any) { setError(err?.message || 'Cannot create agent run.'); }
    finally { setBusy(false); }
  };

  const toggleStop = async () => {
    setBusy(true);
    try {
      await daemonFetch('/api/agent-runtime/emergency-stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !metrics.emergencyStop, reason: 'Founder toggled from desktop AI Operations.' }) });
      await load();
    } catch (err: any) { setError(err?.message || 'Cannot update emergency stop.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6 text-slate-100">
    <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-6 shadow-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300"><Brain className="h-3.5 w-3.5" /> AI Operations</div><h1 className="text-2xl font-black tracking-tight text-white">AI Operations Center</h1><p className="mt-1 text-sm font-semibold text-slate-400">Live daemon-backed view for agent runtime, roles, and safe run creation.</p></div><div className="flex gap-2"><button onClick={() => void load()} disabled={busy} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-black text-slate-300"><RefreshCw className="mr-1 inline h-4 w-4" />Refresh</button><button onClick={() => void toggleStop()} disabled={busy} className={metrics.emergencyStop ? 'rounded-xl bg-rose-500 px-4 py-2 text-xs font-black text-white' : 'rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-300'}><ShieldAlert className="mr-1 inline h-4 w-4" />{metrics.emergencyStop ? 'Reset Stop' : 'Emergency Stop'}</button></div></div>
    </section>
    {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
    {message && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">{message}</div>}
    <div className="grid gap-4 md:grid-cols-4"><Stat label="Total runs" value={metrics.totalRuns || 0} /><Stat label="Active" value={metrics.activeRuns || 0} /><Stat label="Waiting" value={metrics.waitingApproval || 0} /><Stat label="Artifacts" value={metrics.artifactCount || 0} /></div>
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-3 text-sm font-black text-white"><Play className="mr-2 inline h-4 w-4 text-cyan-300" />Create safe agent run</h2><div className="flex flex-col gap-3 lg:flex-row"><input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Describe a safe task for the AI workforce..." className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" /><button onClick={() => void createRun()} disabled={busy || !goal.trim()} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Create Run</button></div></div>
    <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-3 text-sm font-black text-white"><Bot className="mr-2 inline h-4 w-4 text-cyan-300" />Recent runs</h2><div className="space-y-2">{runs.map((run) => <div key={run.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-[10px] font-black uppercase text-cyan-300">{run.status} | {run.planner || 'planner'}</p><p className="mt-1 text-sm font-bold text-white">{run.goal}</p><p className="mt-1 text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</p></div>)}{runs.length === 0 && <p className="text-xs font-bold text-slate-500">No runs returned by daemon.</p>}</div></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-3 text-sm font-black text-white">Agent roles</h2><div className="grid gap-2 sm:grid-cols-2">{roles.map((role) => <div key={role.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="font-black text-white">{role.emoji || 'AI'} {role.id}</p><p className="text-xs text-slate-500">{role.group || 'Agent'}</p></div>)}{roles.length === 0 && <p className="text-xs font-bold text-slate-500">No roles returned by daemon.</p>}</div></div></div>
  </div>;
}
