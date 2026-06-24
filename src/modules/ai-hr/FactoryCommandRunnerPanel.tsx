import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, PlayCircle, RefreshCw, Terminal, XCircle } from 'lucide-react';

interface CommandCatalogItem {
  kind: string;
  commands: string[];
}

interface CommandRun {
  id: string;
  kind: string;
  command: string;
  status: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  updatedAt: string;
}

const API_BASE = 'http://localhost:3011/api/software-factory';

function StatusBadge({ status }: { status: string }) {
  const ok = status === 'complete';
  const failed = status === 'failed';
  const cls = ok
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : failed
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
      : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${cls}`}>{status}</span>;
}

export default function FactoryCommandRunnerPanel() {
  const [catalog, setCatalog] = useState<CommandCatalogItem[]>([]);
  const [runs, setRuns] = useState<CommandRun[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [catalogResponse, runsResponse] = await Promise.all([
        fetch(`${API_BASE}/commands/catalog`),
        fetch(`${API_BASE}/commands`),
      ]);
      if (!catalogResponse.ok || !runsResponse.ok) throw new Error('Command runner API is not ready');
      const catalogPayload = await catalogResponse.json();
      const runsPayload = await runsResponse.json();
      setCatalog(catalogPayload.catalog || []);
      setRuns(runsPayload.runs || []);
      setStats(runsPayload.stats || {});
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cannot load command runner');
    } finally {
      setLoading(false);
    }
  };

  const runCommand = async (kind: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/commands/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, commandIndex: 0 }),
      });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Command run failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const latest = runs[0];
  const outputPreview = useMemo(() => {
    const text = latest?.stderr || latest?.stdout || '';
    return text.trim().slice(-1200);
  }, [latest]);

  return <section className="space-y-4 rounded-[2rem] border border-cyan-400/20 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200"><Terminal className="mr-2 inline h-4 w-4" />Build/test command runner</p>
        <h3 className="mt-2 text-xl font-black text-white">Workspace command runner</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">Panel này gọi command runner backend theo danh sách lệnh đã định nghĩa sẵn để kiểm tra typecheck, lint, test và build.</p>
      </div>
      <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-cyan-400/40 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
      </button>
    </div>

    {message && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">{message}</div>}

    <div className="grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">runs</p><p className="mt-1 text-2xl font-black text-white">{stats.total ?? runs.length}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">complete</p><p className="mt-1 text-2xl font-black text-emerald-200">{stats.complete ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">failed</p><p className="mt-1 text-2xl font-black text-rose-200">{stats.failed ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">running</p><p className="mt-1 text-2xl font-black text-cyan-200">{stats.running ?? 0}</p></div>
    </div>

    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-cyan-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-white">Allowed commands</p></div>
        {catalog.map((item) => <div key={item.kind} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-black text-white">{item.kind}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{item.commands[0]}</p></div>
            <button onClick={() => runCommand(item.kind)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[11px] font-black text-cyan-100 disabled:opacity-60">Run</button>
          </div>
        </div>)}
      </div>

      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2">{latest?.status === 'failed' ? <XCircle className="h-5 w-5 text-rose-300" /> : <CheckCircle2 className="h-5 w-5 text-emerald-300" />}<p className="text-xs font-black uppercase tracking-[0.2em] text-white">Latest command run</p></div>
        {!latest ? <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-500">Chưa có command run.</div> : <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-white">{latest.command}</p><StatusBadge status={latest.status} /></div>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Exit {latest.exitCode ?? 'pending'} / {latest.durationMs}ms / {latest.kind}</p>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950 p-3 text-[11px] leading-5 text-slate-300">{outputPreview || 'No output.'}</pre>
        </div>}
      </div>
    </div>
  </section>;
}
