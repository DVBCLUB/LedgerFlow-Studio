import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type CheckState = {
  name: string;
  path: string;
  ok: boolean;
  detail: string;
};

const CHECKS: Array<{ name: string; path: string }> = [
  { name: 'Assistant service', path: '/health' },
  { name: 'AI router status', path: '/api/status' },
  { name: 'Agent runtime', path: '/api/agent-runtime/metrics' },
  { name: 'Agent roles', path: '/api/roles' },
  { name: 'Robot simulator', path: '/api/robot-simulation/status' },
  { name: 'Automation rules', path: '/api/automation-rules' },
  { name: 'Telemetry', path: '/api/telemetry/latest' },
  { name: 'RPA scripts', path: '/api/rpa/scripts' },
];

export default function AIIntegrationHealthPanel() {
  const [checks, setChecks] = useState<CheckState[]>([]);
  const [loading, setLoading] = useState(false);

  const runChecks = async () => {
    setLoading(true);
    const results = await Promise.all(CHECKS.map(async (item) => {
      try {
        const data = await daemonFetch<any>(item.path, undefined, 8000);
        return { name: item.name, path: item.path, ok: true, detail: data?.status || data?.service || data?.ok || data?.success ? 'connected' : 'responded' };
      } catch (error: any) {
        return { name: item.name, path: item.path, ok: false, detail: error?.message || 'failed' };
      }
    }));
    setChecks(results);
    setLoading(false);
  };

  useEffect(() => {
    void runChecks();
  }, []);

  const passed = checks.filter((item) => item.ok).length;

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300">
              <Activity className="h-3.5 w-3.5" /> AI Integration Health
            </div>
            <h1 className="mt-4 text-2xl font-black text-white">AI, robot and automation wiring</h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">Checks the packaged desktop app against the local assistant service on port 3001.</p>
          </div>
          <button onClick={() => void runChecks()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> {loading ? 'Checking...' : 'Run checks'}
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Connected</p>
          <p className="mt-3 text-3xl font-black text-cyan-300">{passed}/{checks.length || CHECKS.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:col-span-2">
          <p className="text-sm font-bold text-slate-300">If many checks fail, build still runs but AI panels cannot talk to the assistant service. Rebuild with npm run build and npm run desktop:pack.</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {checks.map((item) => (
          <div key={item.path} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-start gap-3">
              {item.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" /> : <XCircle className="mt-0.5 h-5 w-5 text-rose-300" />}
              <div className="min-w-0">
                <p className="font-black text-white">{item.name}</p>
                <p className="mt-1 text-xs font-mono text-slate-500">{item.path}</p>
                <p className={item.ok ? 'mt-2 text-xs font-bold text-emerald-200' : 'mt-2 text-xs font-bold text-rose-200'}>{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
