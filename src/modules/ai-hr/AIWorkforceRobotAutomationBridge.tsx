import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Clock3, Gauge, Play, RefreshCw, ShieldCheck, Square, Zap } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type RobotCapability = {
  id?: string;
  name?: string;
  command?: string;
  mode?: 'simulation' | 'digital_twin' | 'hardware' | string;
  risk?: 'low' | 'medium' | 'high' | 'blocked' | string;
  requiresApproval?: boolean;
  description?: string;
  safetyNotes?: string[];
};

type SchedulerStatus = {
  running?: boolean;
  intervalMs?: number;
  startedAt?: string;
  lastTickAt?: string;
  lastDailyKey?: string;
  lastWeeklyKey?: string;
  tickCount?: number;
};

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

function readStatus(value: unknown): SchedulerStatus {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const status = record.status;
    if (status && typeof status === 'object') return status as SchedulerStatus;
  }
  return {};
}

function riskClass(risk?: string) {
  if (risk === 'low') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200';
  if (risk === 'medium') return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
  if (risk === 'high') return 'border-orange-500/25 bg-orange-500/10 text-orange-200';
  if (risk === 'blocked') return 'border-rose-500/25 bg-rose-500/10 text-rose-200';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

function formatMs(value?: number) {
  if (!value) return 'not set';
  if (value >= 3_600_000) return `${Math.round(value / 3_600_000)}h`;
  if (value >= 60_000) return `${Math.round(value / 60_000)}m`;
  return `${value}ms`;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function AIWorkforceRobotAutomationBridge() {
  const [capabilities, setCapabilities] = useState<RobotCapability[]>([]);
  const [scheduler, setScheduler] = useState<SchedulerStatus>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setBusy(true); setError('');
    try {
      const [capabilityResult, schedulerResult] = await Promise.allSettled([
        daemonFetch<unknown>('/api/robot-capabilities?includeBlocked=true', undefined, 10000),
        daemonFetch<unknown>('/api/automation-scheduler/status', undefined, 10000),
      ]);
      if (capabilityResult.status === 'fulfilled') setCapabilities(readArray<RobotCapability>(capabilityResult.value, 'capabilities'));
      else setCapabilities([]);
      if (schedulerResult.status === 'fulfilled') setScheduler(readStatus(schedulerResult.value));
      else setScheduler({});
      if (capabilityResult.status === 'rejected' || schedulerResult.status === 'rejected') setError('Robot/automation daemon routes are not patched yet. Run npm run ai:openclaw-plus locally.');
    } catch (err: unknown) {
      setError(errorMessage(err, 'Cannot load robot automation bridge.'));
      setCapabilities([]); setScheduler({});
    } finally { setBusy(false); }
  };

  const schedulerAction = async (action: 'start' | 'stop' | 'tick') => {
    setBusy(true); setError(''); setMessage('');
    try {
      const path = action === 'tick' ? '/api/automation-scheduler/tick' : `/api/automation-scheduler/${action}`;
      const result = await daemonFetch<unknown>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: action === 'start' ? JSON.stringify({ intervalMs: 60 * 60 * 1000 }) : '{}' }, 15000);
      setScheduler(readStatus(result));
      setMessage(action === 'tick' ? 'Scheduler tick fired safely.' : `Scheduler ${action} requested.`);
      await load();
    } catch (err: unknown) { setError(errorMessage(err, `Cannot ${action} automation scheduler.`)); }
    finally { setBusy(false); }
  };

  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => ({
    capabilities: capabilities.length,
    simulation: capabilities.filter((item) => item.mode === 'simulation').length,
    blocked: capabilities.filter((item) => item.risk === 'blocked').length,
    approvals: capabilities.filter((item) => item.requiresApproval).length,
  }), [capabilities]);

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Bot className="mr-2 inline h-4 w-4" />Robot + Automation Bridge</p>
        <h3 className="mt-2 text-lg font-black text-white">Capability registry and scheduler loop</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Hiển thị robot capability, hardware-block status và automation scheduler. Panel này không điều khiển hardware thật.</p>
      </div>
      <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
    </div>

    {error && <p className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}
    {message && <p className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-100"><CheckCircle2 className="mr-2 inline h-4 w-4" />{message}</p>}

    <div className="mb-4 grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Bot className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-slate-500">Capabilities</p><p className="mt-1 text-2xl font-black text-white">{totals.capabilities}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><ShieldCheck className="mb-2 h-4 w-4 text-emerald-300" /><p className="text-[10px] font-black uppercase text-slate-500">Simulation</p><p className="mt-1 text-2xl font-black text-white">{totals.simulation}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><AlertTriangle className="mb-2 h-4 w-4 text-rose-300" /><p className="text-[10px] font-black uppercase text-slate-500">Blocked</p><p className="mt-1 text-2xl font-black text-white">{totals.blocked}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Gauge className="mb-2 h-4 w-4 text-violet-300" /><p className="text-[10px] font-black uppercase text-slate-500">Approvals</p><p className="mt-1 text-2xl font-black text-white">{totals.approvals}</p></div>
    </div>

    <div className="mb-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-white"><Clock3 className="mr-2 inline h-4 w-4 text-cyan-300" />Automation Scheduler</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Status: <span className={scheduler.running ? 'text-emerald-200' : 'text-slate-300'}>{scheduler.running ? 'running' : 'stopped'}</span> • interval {formatMs(scheduler.intervalMs)} • ticks {scheduler.tickCount || 0}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">Last tick: {scheduler.lastTickAt || 'never'} • daily {scheduler.lastDailyKey || 'none'} • weekly {scheduler.lastWeeklyKey || 'none'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void schedulerAction('tick')} disabled={busy} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-100 disabled:opacity-50"><Zap className="mr-1 inline h-3.5 w-3.5" />Tick</button>
          <button onClick={() => void schedulerAction('start')} disabled={busy || scheduler.running} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase text-emerald-100 disabled:opacity-50"><Play className="mr-1 inline h-3.5 w-3.5" />Start</button>
          <button onClick={() => void schedulerAction('stop')} disabled={busy || !scheduler.running} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-black uppercase text-rose-100 disabled:opacity-50"><Square className="mr-1 inline h-3.5 w-3.5" />Stop</button>
        </div>
      </div>
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      {capabilities.map((capability, index) => <div key={capability.id || capability.command || index} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-200">{capability.mode || 'unknown'}</span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${riskClass(capability.risk)}`}>{capability.risk || 'risk'}</span>
              {capability.requiresApproval && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-amber-200">approval</span>}
            </div>
            <p className="mt-3 text-sm font-black text-white">{capability.name || capability.id || `Capability ${index + 1}`}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Command: {capability.command || 'unknown'}</p>
          </div>
          <Bot className="h-5 w-5 text-cyan-300" />
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">{capability.description || 'No description available.'}</p>
        {Array.isArray(capability.safetyNotes) && capability.safetyNotes.length > 0 && <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-bold text-slate-400">Safety: {capability.safetyNotes.join(' • ')}</p>}
      </div>)}
      {capabilities.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 lg:col-span-2">
        <p className="text-sm font-black text-white"><AlertTriangle className="mr-2 inline h-4 w-4 text-amber-300" />No robot capability data loaded</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Run the local patcher so daemon routes can expose robot capabilities and scheduler status.</p>
      </div>}
    </div>
  </section>;
}
