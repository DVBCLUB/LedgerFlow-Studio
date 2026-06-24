import { useEffect, useMemo, useState } from 'react';
import { Activity, GitBranch, Loader2, PlayCircle, PlusCircle, RefreshCw, Server, Terminal } from 'lucide-react';

type BackendState = 'idle' | 'loading' | 'online' | 'offline';

interface FactoryRun {
  id: string;
  title: string;
  status: string;
  workType: string;
  owner: string;
  updatedAt: string;
}

interface FactoryExecution {
  id: string;
  runId: string;
  status: string;
  updatedAt: string;
  steps: Array<{ id: string; label: string; status: string }>;
}

interface FactoryStats {
  total: number;
  byStatus: Record<string, number>;
}

interface RuntimePayload {
  runs?: FactoryRun[];
  stats?: FactoryStats;
  executionStats?: Record<string, number>;
  executions?: FactoryExecution[];
}

interface GitPayload {
  runner?: {
    branch: string;
    status: { staged: string[]; modified: string[]; untracked: string[]; deleted: string[] };
    diff: { filesChanged: number; insertions: number; deletions: number; summary: string };
  };
}

const API_BASE = 'http://localhost:3011/api/software-factory';

function SmallStat({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">{note}</p>
  </div>;
}

function StatusPill({ state }: { state: BackendState }) {
  const className = state === 'online'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : state === 'offline'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
      : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>{state}</span>;
}

function ActionButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-emerald-400/40 disabled:opacity-60">{children}</button>;
}

export default function FactoryBackendRuntimePanel() {
  const [state, setState] = useState<BackendState>('idle');
  const [payload, setPayload] = useState<RuntimePayload | null>(null);
  const [gitPayload, setGitPayload] = useState<GitPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);

  const postJson = async (url: string, body?: unknown) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    return response.json();
  };

  const refresh = async () => {
    setState('loading');
    setError(null);
    try {
      const [runsResponse, executionsResponse, gitResponse] = await Promise.all([
        fetch(`${API_BASE}/runs`),
        fetch(`${API_BASE}/executions`).catch(() => null),
        fetch(`${API_BASE}/git/status`).catch(() => null),
      ]);
      if (!runsResponse.ok) throw new Error(`Backend returned ${runsResponse.status}`);
      const runsJson = await runsResponse.json();
      const executionsJson = executionsResponse && executionsResponse.ok ? await executionsResponse.json() : null;
      const gitJson = gitResponse && gitResponse.ok ? await gitResponse.json() : null;
      setPayload({ ...runsJson, executions: executionsJson?.executions || [], executionStats: executionsJson?.stats || runsJson.executionStats });
      setGitPayload(gitJson);
      setState('online');
    } catch (err) {
      setState('offline');
      setError(err instanceof Error ? err.message : 'Cannot connect to Software Factory daemon');
    }
  };

  const runAction = async (label: string, action: () => Promise<unknown>) => {
    setActionState(label);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionState(null);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const latestRuns = useMemo(() => (payload?.runs || []).slice(0, 4), [payload]);
  const latestRun = latestRuns[0];
  const latestExecution = useMemo(() => (payload?.executions || [])[0], [payload]);
  const stats = payload?.stats;
  const executionStats = payload?.executionStats;
  const git = gitPayload?.runner;
  const changedFiles = git ? git.status.modified.length + git.status.staged.length + git.status.untracked.length + git.status.deleted.length : 0;
  const busy = state === 'loading' || Boolean(actionState);

  return <section className="space-y-4 rounded-[2rem] border border-emerald-400/20 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200"><Server className="mr-2 inline h-4 w-4" />Backend runtime</p>
        <h3 className="mt-2 text-xl font-black text-white">Software Factory daemon connection</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">UI này gọi daemon cục bộ ở port 3011 để đọc runs, executions, Git runner status và kích hoạt các bước runtime cơ bản.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill state={state} />
        <ActionButton onClick={refresh} disabled={busy}>{state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh</ActionButton>
      </div>
    </div>

    {error && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">Daemon chưa online hoặc thao tác chưa chạy được: {error}. Chạy server/software-factory-daemon.ts để bật runtime API.</div>}
    {actionState && <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold leading-6 text-cyan-100"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Đang chạy: {actionState}</div>}

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <SmallStat label="runs" value={stats?.total ?? 0} note="factory run records" />
      <SmallStat label="queued" value={stats?.byStatus?.queued ?? 0} note="waiting for execution" />
      <SmallStat label="review" value={stats?.byStatus?.review ?? 0} note="needs founder check" />
      <SmallStat label="executions" value={executionStats?.total ?? 0} note={`${executionStats?.running ?? 0} running`} />
      <SmallStat label="git files" value={changedFiles} note={git ? `branch ${git.branch || 'unknown'}` : 'no git status'} />
    </div>

    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-emerald-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-white">Runtime actions</p></div>
      <div className="flex flex-wrap gap-2">
        <ActionButton disabled={busy} onClick={() => runAction('Seed sample runs', () => postJson(`${API_BASE}/seed`))}>Seed runs</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Create sample run', () => postJson(`${API_BASE}/runs`, { title: 'Founder idea to prototype', workType: 'planning', owner: 'Product Architect', input: 'Create product brief, build plan and launch checklist.' }))}>Create run</ActionButton>
        <ActionButton disabled={busy || !latestRun} onClick={() => latestRun && runAction('Start latest run execution', () => postJson(`${API_BASE}/runs/${latestRun.id}/executions`))}>Start latest run</ActionButton>
        <ActionButton disabled={busy || !latestExecution} onClick={() => latestExecution && runAction('Advance latest execution', () => postJson(`${API_BASE}/executions/${latestExecution.id}/advance`))}>Advance execution</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Prepare commit draft', () => postJson(`${API_BASE}/git/commit-draft`))}>Commit draft</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Prepare PR draft', () => postJson(`${API_BASE}/git/pr-draft`, { base: 'main' }))}>PR draft</ActionButton>
      </div>
      <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-500">Các nút này chỉ gọi API runtime cục bộ, tạo dữ liệu mẫu, khởi chạy execution, advance từng bước và tạo draft Git review. Các hành động public release hoặc merge vẫn giữ ở review gate.</p>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-emerald-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-white">Latest runs</p></div>
        {latestRuns.length === 0 ? <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-500">No backend runs yet. Click Seed runs or Create run.</p> : latestRuns.map((run) => <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-white">{run.title}</p><span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100">{run.status}</span></div>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{run.workType} / {run.owner}</p>
        </div>)}
      </div>
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><GitBranch className="h-5 w-5 text-cyan-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-white">Git runner & execution</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs font-black text-white">Current branch: {git?.branch || 'unknown'}</p>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Diff: {git?.diff.filesChanged ?? 0} files, {git?.diff.insertions ?? 0} insertions, {git?.diff.deletions ?? 0} deletions.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-violet-300" /><p className="text-xs font-black text-white">Execution stats</p></div>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">pending {executionStats?.pending ?? 0} / running {executionStats?.running ?? 0} / review {executionStats?.review ?? 0} / complete {executionStats?.complete ?? 0}</p>
          {latestExecution && <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Latest execution: {latestExecution.status} / {latestExecution.steps.filter((step) => step.status !== 'pending').length}/{latestExecution.steps.length} steps</p>}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-amber-300" /><p className="text-xs font-black text-white">API base</p></div>
          <p className="mt-2 break-all text-[11px] font-semibold leading-5 text-slate-500">{API_BASE}</p>
        </div>
      </div>
    </div>
  </section>;
}
