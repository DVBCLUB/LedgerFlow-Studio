import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  triggerEvent: string;
  triggerCount?: number;
  description?: string;
};

type Log = {
  id: string;
  ruleName: string;
  eventType: string;
  status: string;
  executedAt: string;
  durationMs?: number;
};

function listFrom<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any)[key])) return (value as any)[key] as T[];
  return [];
}

export default function AutomationRulesHealthPanel() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ruleData, logData] = await Promise.all([
        daemonFetch<unknown>('/api/automation-rules', undefined, 8000),
        daemonFetch<unknown>('/api/automation-rules/logs?limit=10', undefined, 8000),
      ]);
      setRules(listFrom<Rule>(ruleData, 'rules'));
      setLogs(listFrom<Log>(logData, 'logs'));
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Automation daemon connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const enabled = rules.filter((rule) => rule.enabled).length;

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/20 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300"><Zap className="h-3.5 w-3.5" /> Automation daemon</div>
            <h1 className="text-2xl font-black tracking-tight text-white">Automation Rules Health</h1>
            <p className="mt-1 text-sm font-semibold text-slate-400">Read-only live view for the rule engine on the assistant daemon.</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Checking...' : 'Refresh'}</button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Rules</p><p className="mt-2 text-3xl font-black text-cyan-300">{rules.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Enabled</p><p className="mt-2 text-3xl font-black text-emerald-300">{enabled}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Recent logs</p><p className="mt-2 text-3xl font-black text-amber-300">{logs.length}</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-sm font-black text-white">Rules</h2>
          <div className="space-y-2">
            {rules.map((rule) => <div key={rule.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="font-black text-white">{rule.enabled ? <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-300" /> : null}{rule.name}</p><p className="mt-1 text-xs text-slate-500">{rule.triggerEvent} | triggered {rule.triggerCount || 0}</p></div>)}
            {rules.length === 0 && <p className="text-xs font-bold text-slate-500">No rules returned by daemon.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-sm font-black text-white">Recent execution logs</h2>
          <div className="space-y-2">
            {logs.map((log) => <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="font-black text-white">{log.ruleName}</p><p className="mt-1 text-xs text-slate-500">{log.status} | {log.eventType} | {new Date(log.executedAt).toLocaleString()}</p></div>)}
            {logs.length === 0 && <p className="text-xs font-bold text-slate-500">No logs returned by daemon.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
