import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Network, RefreshCw, ShieldCheck } from 'lucide-react';

interface ExecutionStep {
  id: string;
  label: string;
  status: string;
  detail: string;
  providerProfileId?: string;
  providerLabel?: string;
  providerReason?: string;
  reviewRequired?: boolean;
}

interface ExecutionRecord {
  id: string;
  runId: string;
  status: string;
  providerDecision?: {
    selected?: { id: string; label: string; kind: string; health: string } | null;
    reason: string;
    reviewRequired: boolean;
  };
  steps: ExecutionStep[];
  log: string[];
}

const API_BASE = 'http://localhost:3011/api/software-factory';

function Badge({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'emerald' | 'amber' | 'violet' }) {
  const cls = tone === 'emerald'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : tone === 'amber'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      : tone === 'violet'
        ? 'border-violet-500/30 bg-violet-500/10 text-violet-100'
        : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${cls}`}>{children}</span>;
}

export default function FactoryExecutionDecisionPanel() {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/executions`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const payload = await response.json();
      setExecutions(payload.executions || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cannot load executions');
    } finally {
      setLoading(false);
    }
  };

  const attachDecision = async (id: string, workKind = 'planning') => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/executions/${id}/provider-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workKind }),
      });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cannot attach provider decision');
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const latest = executions[0];
  const providerStep = useMemo(() => latest?.steps.find((step) => step.id === 'run'), [latest]);
  const decision = latest?.providerDecision;

  return <section className="space-y-4 rounded-[2rem] border border-violet-400/20 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-200"><Network className="mr-2 inline h-4 w-4" />Execution provider decision</p>
        <h3 className="mt-2 text-xl font-black text-white">Provider decision gắn vào execution step</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">Panel này đọc execution mới nhất, hiển thị provider được chọn cho bước Run workspace task và cho phép refresh/gắn lại provider decision.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-violet-400/40 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
        <button onClick={() => latest && attachDecision(latest.id, providerStep?.providerProfileId ? 'coding' : 'planning')} disabled={loading || !latest} className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-black text-violet-100 hover:border-violet-300/60 disabled:opacity-60">
          <ShieldCheck className="h-4 w-4" /> Attach decision
        </button>
      </div>
    </div>

    {message && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">{message}</div>}

    {!latest ? <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-bold text-slate-500">Chưa có execution. Hãy Seed/Create run rồi Start latest run trong Backend runtime panel.</div> : <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-white">Execution {latest.id}</p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Run: {latest.runId}</p>
          </div>
          <Badge tone={latest.status === 'review' ? 'amber' : 'emerald'}>{latest.status}</Badge>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Decision</p>
          <p className="text-sm font-black text-white">{decision?.selected?.label || providerStep?.providerLabel || 'No provider selected'}</p>
          <p className="text-[11px] font-semibold leading-5 text-slate-500">{decision?.reason || providerStep?.providerReason || 'No provider reason yet.'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={decision?.reviewRequired || providerStep?.reviewRequired ? 'amber' : 'emerald'}>{decision?.reviewRequired || providerStep?.reviewRequired ? 'review required' : 'direct run'}</Badge>
            {decision?.selected?.kind && <Badge tone="violet">{decision.selected.kind}</Badge>}
            {decision?.selected?.health && <Badge>{decision.selected.health}</Badge>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-white">Execution steps</p></div>
        {latest.steps.map((step) => <div key={step.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-white">{step.label}</p><Badge tone={step.status === 'review' ? 'amber' : step.status === 'complete' ? 'emerald' : 'slate'}>{step.status}</Badge></div>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{step.detail}</p>
          {step.providerLabel && <p className="mt-2 text-[11px] font-bold leading-5 text-violet-200">Provider: {step.providerLabel} — {step.providerReason}</p>}
        </div>)}
      </div>
    </div>}
  </section>;
}
