import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Network, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { daemonFetch } from '../../../utils/assistantApi';

interface Connection {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'warning' | 'error';
  quota: string;
  expiry: string;
  latency: string;
  endpoint: string;
  mode: 'main' | 'assistant';
}

const CONNECTIONS: Connection[] = [
  { id: 'main-health', name: 'Desktop backend', provider: 'LedgerFlow server', status: 'warning', quota: 'local', expiry: 'always on', latency: '-', endpoint: '/api/health', mode: 'main' },
  { id: 'assistant-health', name: 'Assistant service', provider: 'AI daemon', status: 'warning', quota: 'local', expiry: 'port 3001', latency: '-', endpoint: '/health', mode: 'assistant' },
  { id: 'ai-router', name: 'AI router status', provider: 'AI gateway', status: 'warning', quota: 'vault based', expiry: 'local vault', latency: '-', endpoint: '/api/status', mode: 'assistant' },
  { id: 'agent-runtime', name: 'Agent runtime', provider: 'AgentOps', status: 'warning', quota: 'runs and approvals', expiry: 'local runtime', latency: '-', endpoint: '/api/agent-runtime/metrics', mode: 'assistant' },
  { id: 'robot-sim', name: 'Robot simulator', provider: 'Digital twin', status: 'warning', quota: 'simulation only', expiry: 'local runtime', latency: '-', endpoint: '/api/robot-simulation/status', mode: 'assistant' },
  { id: 'automation-rules', name: 'Automation rules', provider: 'Rule engine', status: 'warning', quota: 'local rules', expiry: 'local runtime', latency: '-', endpoint: '/api/automation-rules', mode: 'assistant' },
];

async function checkConnection(item: Connection): Promise<Connection> {
  const start = performance.now();
  try {
    if (item.mode === 'assistant') {
      await daemonFetch<any>(item.endpoint, undefined, 8000);
    } else {
      const response = await fetch(item.endpoint, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.json().catch(() => null);
    }
    return { ...item, status: 'active', latency: `${Math.round(performance.now() - start)}ms` };
  } catch {
    return { ...item, status: 'error', latency: 'failed' };
  }
}

export default function ApiConnectionHealthMatrix() {
  const [connections, setConnections] = useState<Connection[]>(CONNECTIONS);
  const [pinging, setPinging] = useState<string | null>(null);

  const handlePing = async (id: string) => {
    setPinging(id);
    const current = connections.find((item) => item.id === id);
    if (current) {
      const next = await checkConnection(current);
      setConnections((prev) => prev.map((item) => item.id === id ? next : item));
    }
    setPinging(null);
  };

  const checkAll = async () => {
    setPinging('all');
    const next = await Promise.all(CONNECTIONS.map(checkConnection));
    setConnections(next);
    setPinging(null);
  };

  useEffect(() => {
    void checkAll();
  }, []);

  const healthy = connections.filter((item) => item.status === 'active').length;

  return (
    <div className="rounded-2xl border border-border-primary bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-border-primary pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-500/25 bg-slate-500/10 p-2 text-text-secondary">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-text-primary">API Connection Health Matrix</h3>
            <p className="text-[11px] font-semibold leading-relaxed text-text-secondary">Real checks for desktop backend, assistant service, AI, robot and automation routes.</p>
          </div>
        </div>
        <button onClick={() => void checkAll()} disabled={pinging === 'all'} className="inline-flex items-center gap-2 rounded-lg border border-border-primary bg-bg-primary px-3 py-2 text-[10px] font-black text-text-secondary hover:text-text-primary disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${pinging === 'all' ? 'animate-spin' : ''}`} /> Check all
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 text-xs font-bold text-cyan-100">
        Connected: {healthy}/{connections.length}. If assistant routes fail, the EXE opens but AI Workforce panels cannot load live robot/automation data.
      </div>

      <div className="space-y-4">
        {connections.map((c) => {
          const isOk = c.status === 'active';
          const isLoading = pinging === c.id;
          const dotColor = isOk ? 'bg-emerald-500' : 'bg-rose-500';
          const borderColor = isOk ? 'border-emerald-500/20' : 'border-rose-500/20';
          const textColor = isOk ? 'text-emerald-300' : 'text-rose-300';

          return (
            <div key={c.id} className={`flex flex-col justify-between gap-4 rounded-xl border bg-slate-950/40 p-4 md:flex-row md:items-center ${borderColor}`}>
              <div className="flex items-start gap-3">
                <div className="relative mt-1">
                  <span className={`block h-3.5 w-3.5 rounded-full ${dotColor} ${isOk ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-text-primary">{c.name}</h4>
                  <p className="mt-1 text-[10px] font-semibold leading-none text-text-tertiary">Provider: {c.provider}</p>
                  <p className="mt-2 text-[10px] font-mono text-slate-600">{c.endpoint}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-left text-xs">
                <div><span className="block text-[9px] font-black uppercase tracking-wider text-text-tertiary">Scope</span><span className="mt-1 block font-bold text-text-secondary">{c.quota}</span></div>
                <div><span className="block text-[9px] font-black uppercase tracking-wider text-text-tertiary">Runtime</span><span className="mt-1 block font-bold text-text-secondary">{c.expiry}</span></div>
                <div><span className="block text-[9px] font-black uppercase tracking-wider text-text-tertiary">Latency</span><span className={`mt-1 block font-mono font-bold ${textColor}`}>{isLoading ? 'checking...' : c.latency}</span></div>
              </div>

              <button disabled={isLoading} onClick={() => void handlePing(c.id)} className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border-primary bg-bg-primary px-3 py-1.5 text-[10px] font-black text-slate-350 transition-all hover:border-border-secondary hover:text-text-primary disabled:opacity-50">
                <Activity className="h-3.5 w-3.5" /> {isLoading ? 'Checking...' : 'Check'} {isOk ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <XCircle className="h-3.5 w-3.5 text-rose-300" />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-1.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2.5 text-[9px] font-black text-emerald-400/90">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span>These checks are safe read-only diagnostics.</span>
      </div>
    </div>
  );
}
