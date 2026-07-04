import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, Database, GitBranch, Loader2, Network, PlayCircle, PlusCircle, RefreshCw, Rocket, Server, Terminal } from 'lucide-react';

type BackendState = 'idle' | 'loading' | 'online' | 'offline';

interface FactoryRun { id: string; title: string; status: string; workType: string; owner: string; updatedAt: string; }
interface FactoryExecution { id: string; runId: string; status: string; updatedAt: string; steps: Array<{ id: string; label: string; status: string }>; }
interface FactoryStats { total: number; byStatus: Record<string, number>; }
interface ProviderProfile { id: string; label: string; kind: string; priority: number; health: string; supportedWork: string[]; reviewRequired: boolean; note: string; }
interface ReleaseItem { id: string; runId: string; channel: string; title: string; status: string; owner: string; deliverable: string; }
interface AssetItem { id: string; runId: string; kind: string; status: string; title: string; fileName: string; relativePath: string; sizeBytes: number; notes: string; }

interface RuntimePayload {
  runs?: FactoryRun[];
  stats?: FactoryStats;
  executionStats?: Record<string, number>;
  executions?: FactoryExecution[];
  providerStats?: Record<string, number>;
  providers?: ProviderProfile[];
  releaseStats?: FactoryStats;
  releaseItems?: ReleaseItem[];
  assetStats?: FactoryStats;
  assetItems?: AssetItem[];
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
  return <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">{label}</p>
    <p className="mt-1 text-2xl font-black text-text-primary">{value}</p>
    <p className="mt-1 text-[11px] font-bold leading-5 text-text-tertiary">{note}</p>
  </div>;
}

function StatusPill({ state }: { state: BackendState }) {
  const className = state === 'online'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : state === 'offline'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
      : 'border-border-secondary bg-bg-primary text-text-secondary';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>{state}</span>;
}

function ActionButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-2 rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-xs font-black text-slate-200 hover:border-emerald-400/40 disabled:opacity-60">{children}</button>;
}

export default function FactoryBackendRuntimePanel() {
  const [state, setState] = useState<BackendState>('idle');
  const [payload, setPayload] = useState<RuntimePayload | null>(null);
  const [gitPayload, setGitPayload] = useState<GitPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);

  const postJson = async (url: string, body?: unknown) => {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    return response.json();
  };

  const patchJson = async (url: string, body?: unknown) => {
    const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    return response.json();
  };

  const refresh = async () => {
    setState('loading');
    setError(null);
    try {
      const [runsResponse, executionsResponse, providersResponse, releaseResponse, assetsResponse, gitResponse] = await Promise.all([
        fetch(`${API_BASE}/runs`),
        fetch(`${API_BASE}/executions`).catch(() => null),
        fetch(`${API_BASE}/providers`).catch(() => null),
        fetch(`${API_BASE}/release-kit`).catch(() => null),
        fetch(`${API_BASE}/assets`).catch(() => null),
        fetch(`${API_BASE}/git/status`).catch(() => null),
      ]);
      if (!runsResponse.ok) throw new Error(`Backend returned ${runsResponse.status}`);
      const runsJson = await runsResponse.json();
      const executionsJson = executionsResponse && executionsResponse.ok ? await executionsResponse.json() : null;
      const providersJson = providersResponse && providersResponse.ok ? await providersResponse.json() : null;
      const releaseJson = releaseResponse && releaseResponse.ok ? await releaseResponse.json() : null;
      const assetsJson = assetsResponse && assetsResponse.ok ? await assetsResponse.json() : null;
      const gitJson = gitResponse && gitResponse.ok ? await gitResponse.json() : null;
      setPayload({
        ...runsJson,
        executions: executionsJson?.executions || [],
        executionStats: executionsJson?.stats || runsJson.executionStats,
        providers: providersJson?.profiles || [],
        providerStats: providersJson?.stats || runsJson.providerStats,
        releaseItems: releaseJson?.items || [],
        releaseStats: releaseJson?.stats || runsJson.releaseStats,
        assetItems: assetsJson?.assets || [],
        assetStats: assetsJson?.stats || runsJson.assetStats,
      });
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
    try { await action(); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); } finally { setActionState(null); }
  };

  useEffect(() => { refresh(); }, []);

  const latestRuns = useMemo(() => (payload?.runs || []).slice(0, 4), [payload]);
  const latestRun = latestRuns[0];
  const latestExecution = useMemo(() => (payload?.executions || [])[0], [payload]);
  const stats = payload?.stats;
  const executionStats = payload?.executionStats;
  const providerStats = payload?.providerStats;
  const providers = payload?.providers || [];
  const releaseStats = payload?.releaseStats;
  const releaseItems = payload?.releaseItems || [];
  const latestReleaseItem = releaseItems[0];
  const assetStats = payload?.assetStats;
  const assetItems = payload?.assetItems || [];
  const latestAsset = assetItems[0];
  const git = gitPayload?.runner;
  const changedFiles = git ? git.status.modified.length + git.status.staged.length + git.status.untracked.length + git.status.deleted.length : 0;
  const busy = state === 'loading' || Boolean(actionState);

  return <section className="space-y-4 rounded-[2rem] border border-emerald-400/20 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200"><Server className="mr-2 inline h-4 w-4" />Backend runtime</p>
        <h3 className="mt-2 text-xl font-black text-text-primary">Software Factory daemon connection</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-text-secondary">UI này gọi daemon cục bộ ở port 3011 để đọc runs, executions, provider profiles, release kit, asset store, Git runner status và kích hoạt các bước runtime cơ bản.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2"><StatusPill state={state} /><ActionButton onClick={refresh} disabled={busy}>{state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh</ActionButton></div>
    </div>

    {error && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">Daemon chưa online hoặc thao tác chưa chạy được: {error}. Chạy server/software-factory-daemon.ts để bật runtime API.</div>}
    {actionState && <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold leading-6 text-cyan-100"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Đang chạy: {actionState}</div>}

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-8">
      <SmallStat label="runs" value={stats?.total ?? 0} note="factory run records" />
      <SmallStat label="queued" value={stats?.byStatus?.queued ?? 0} note="waiting for execution" />
      <SmallStat label="review" value={stats?.byStatus?.review ?? 0} note="needs founder check" />
      <SmallStat label="executions" value={executionStats?.total ?? 0} note={`${executionStats?.running ?? 0} running`} />
      <SmallStat label="providers" value={providerStats?.total ?? providers.length} note={`${providerStats?.healthy ?? 0} healthy / ${providerStats?.limited ?? 0} limited`} />
      <SmallStat label="release" value={releaseStats?.total ?? releaseItems.length} note={`${releaseStats?.byStatus?.ready ?? 0} ready / ${releaseStats?.byStatus?.review ?? 0} review`} />
      <SmallStat label="assets" value={assetStats?.total ?? assetItems.length} note={`${assetStats?.byStatus?.stored ?? 0} stored / ${assetStats?.byStatus?.checked ?? 0} checked`} />
      <SmallStat label="git files" value={changedFiles} note={git ? `branch ${git.branch || 'unknown'}` : 'no git status'} />
    </div>

    <div className="rounded-3xl border border-border-primary bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-emerald-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Runtime actions</p></div>
      <div className="flex flex-wrap gap-2">
        <ActionButton disabled={busy} onClick={() => runAction('Seed sample runs', () => postJson(`${API_BASE}/seed`))}>Seed runs</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Create sample run', () => postJson(`${API_BASE}/runs`, { title: 'Founder idea to prototype', workType: 'planning', owner: 'Product Architect', input: 'Create product brief, build plan and release checklist.' }))}>Create run</ActionButton>
        <ActionButton disabled={busy || !latestRun} onClick={() => latestRun && runAction('Start latest run execution', () => postJson(`${API_BASE}/runs/${latestRun.id}/executions`))}>Start latest run</ActionButton>
        <ActionButton disabled={busy || !latestExecution} onClick={() => latestExecution && runAction('Advance latest execution', () => postJson(`${API_BASE}/executions/${latestExecution.id}/advance`))}>Advance execution</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Choose planning provider', () => postJson(`${API_BASE}/providers/choose`, { workKind: 'planning' }))}>Choose provider</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Seed release kit', () => postJson(`${API_BASE}/release-kit/seed`, { runId: latestRun?.id || 'sample-run' }))}>Seed release kit</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Create release item', () => postJson(`${API_BASE}/release-kit`, { runId: latestRun?.id || 'sample-run', channel: 'creative_pack', title: 'New creative pack', owner: 'Growth Automation', deliverable: 'Hooks, audience angles and creative checklist' }))}>Create release item</ActionButton>
        <ActionButton disabled={busy || !latestReleaseItem} onClick={() => latestReleaseItem && runAction('Mark latest release ready', () => patchJson(`${API_BASE}/release-kit/${latestReleaseItem.id}/status`, { status: 'ready', notes: 'Prepared for founder review.' }))}>Mark release ready</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Seed assets', () => postJson(`${API_BASE}/assets/seed`, { runId: latestRun?.id || 'sample-run' }))}>Seed assets</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Create product note asset', () => postJson(`${API_BASE}/assets`, { runId: latestRun?.id || 'sample-run', kind: 'document', title: 'Runtime product note', fileName: 'runtime-product-note.md', content: '# Runtime product note\n\nCreated from Factory UI.', notes: 'Created from backend runtime panel' }))}>Create asset</ActionButton>
        <ActionButton disabled={busy || !latestAsset} onClick={() => latestAsset && runAction('Mark latest asset checked', () => patchJson(`${API_BASE}/assets/${latestAsset.id}/status`, { status: 'checked', notes: 'Checked from Factory UI.' }))}>Mark asset checked</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Prepare commit draft', () => postJson(`${API_BASE}/git/commit-draft`))}>Commit draft</ActionButton>
        <ActionButton disabled={busy} onClick={() => runAction('Prepare PR draft', () => postJson(`${API_BASE}/git/pr-draft`, { base: 'main' }))}>PR draft</ActionButton>
      </div>
      <p className="mt-3 text-[11px] font-semibold leading-5 text-text-tertiary">Các nút này chỉ gọi API runtime cục bộ, tạo dữ liệu mẫu, chọn provider profile, quản lý release kit, ghi asset local, khởi chạy execution, advance từng bước và tạo draft Git review. Các hành động public release hoặc merge vẫn giữ ở review gate.</p>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-emerald-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Latest runs</p></div>
        {latestRuns.length === 0 ? <p className="rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs font-bold text-text-tertiary">No backend runs yet. Click Seed runs or Create run.</p> : latestRuns.map((run) => <div key={run.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-text-primary">{run.title}</p><span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100">{run.status}</span></div><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{run.workType} / {run.owner}</p></div>)}
      </div>
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><Database className="h-5 w-5 text-amber-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Asset backend</p></div>
        {assetItems.length === 0 ? <p className="rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs font-bold text-text-tertiary">Asset store chưa có dữ liệu. Click Seed assets.</p> : assetItems.slice(0, 4).map((item) => <div key={item.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-text-primary">{item.title}</p><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100">{item.status}</span></div><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{item.kind} / {item.sizeBytes} bytes</p><p className="mt-1 break-all text-[11px] font-semibold leading-5 text-slate-600">{item.relativePath}</p></div>)}
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><Rocket className="h-5 w-5 text-emerald-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Release kit backend</p></div>
        {releaseItems.length === 0 ? <p className="rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs font-bold text-text-tertiary">Release kit chưa có dữ liệu. Click Seed release kit.</p> : releaseItems.slice(0, 4).map((item) => <div key={item.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-text-primary">{item.title}</p><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-100">{item.status}</span></div><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{item.channel} / {item.owner}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">{item.deliverable}</p></div>)}
      </div>
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2"><Network className="h-5 w-5 text-violet-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Provider runtime</p></div>
        {providers.length === 0 ? <p className="rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs font-bold text-text-tertiary">Provider runtime chưa trả dữ liệu.</p> : providers.slice(0, 4).map((profile) => <div key={profile.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-text-primary">{profile.label}</p><span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-violet-100">{profile.health}</span></div><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">{profile.kind} / priority {profile.priority} / {profile.supportedWork.join(', ')}</p><div className="mt-2 flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => runAction(`Set ${profile.label} healthy`, () => patchJson(`${API_BASE}/providers/${profile.id}/health`, { health: 'healthy' }))}>Healthy</ActionButton><ActionButton disabled={busy} onClick={() => runAction(`Set ${profile.label} limited`, () => patchJson(`${API_BASE}/providers/${profile.id}/health`, { health: 'limited' }))}>Limited</ActionButton><ActionButton disabled={busy} onClick={() => runAction(`Pause ${profile.label}`, () => patchJson(`${API_BASE}/providers/${profile.id}/health`, { health: 'paused' }))}>Pause</ActionButton></div></div>)}
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="mb-2 flex items-center gap-2"><GitBranch className="h-5 w-5 text-cyan-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Git runner</p></div><p className="text-xs font-black text-text-primary">Current branch: {git?.branch || 'unknown'}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">Diff: {git?.diff.filesChanged ?? 0} files, {git?.diff.insertions ?? 0} insertions, {git?.diff.deletions ?? 0} deletions.</p></div>
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-violet-300" /><p className="text-xs font-black text-text-primary">Execution stats</p></div><p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">pending {executionStats?.pending ?? 0} / running {executionStats?.running ?? 0} / review {executionStats?.review ?? 0} / complete {executionStats?.complete ?? 0}</p>{latestExecution && <p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">Latest execution: {latestExecution.status} / {latestExecution.steps.filter((step) => step.status !== 'pending').length}/{latestExecution.steps.length} steps</p>}<div className="mt-3 flex items-center gap-2"><Terminal className="h-4 w-4 text-amber-300" /><p className="break-all text-[11px] font-semibold leading-5 text-text-tertiary">{API_BASE}</p></div></div>
    </div>
  </section>;
}
