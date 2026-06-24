import { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Brain, Database, PlayCircle, RefreshCw, Search, ShieldAlert, Sparkles, UsersRound, Zap } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type HubData = {
  metrics: Record<string, any> | null;
  runs: any[];
  roles: any[];
  memoryResults: any[];
  fabricHealth: Record<string, any> | null;
  controlPlane: any | null;
  status: Record<string, any> | null;
};

const empty: HubData = {
  metrics: null,
  runs: [],
  roles: [],
  memoryResults: [],
  fabricHealth: null,
  controlPlane: null,
  status: null,
};

function unwrap(value: any, ...keys: string[]) {
  for (const key of keys) if (value && value[key] !== undefined) return value[key];
  return value;
}
function arr(value: any) { return Array.isArray(value) ? value : []; }

function Badge({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' | 'violet' }) {
  const cls = tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : tone === 'violet' ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function Stat({ label, value, hint, tone = 'slate' }: { label: string; value: string | number; hint?: string; tone?: 'slate' | 'green' | 'amber' | 'rose' | 'cyan' | 'violet' }) {
  const cls = tone === 'green' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'rose' ? 'text-rose-300' : tone === 'cyan' ? 'text-cyan-300' : tone === 'violet' ? 'text-violet-300' : 'text-white';
  return <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    <p className={`mt-2 text-2xl font-black ${cls}`}>{value}</p>
    {hint && <p className="mt-1 text-[11px] font-bold text-slate-500">{hint}</p>}
  </div>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">{icon}{title}</div>
    {children}
  </section>;
}

function MiniList({ items, emptyText, render }: { items: any[]; emptyText: string; render: (item: any, index: number) => React.ReactNode }) {
  return <div className="space-y-2">{items.length === 0 ? <p className="text-xs font-bold text-slate-500">{emptyText}</p> : items.slice(0, 8).map(render)}</div>;
}

export default function AICommandCenterHubPanel() {
  const [data, setData] = useState<HubData>(empty);
  const [query, setQuery] = useState('LedgerFlow AI operations');
  const [goal, setGoal] = useState('Review LedgerFlow AI desktop integration and suggest the next safe action.');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rawOpen, setRawOpen] = useState(false);

  const load = async (searchText = query) => {
    setLoading(true); setError(''); setMessage('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<any>('/api/status', undefined, 30000),
        daemonFetch<any>('/api/agent-runtime/metrics', undefined, 10000),
        daemonFetch<any>('/api/agent-runtime/runs?limit=20', undefined, 10000),
        daemonFetch<any>('/api/roles', undefined, 10000),
        daemonFetch<any>(`/api/agent-memory/search?q=${encodeURIComponent(searchText)}&limit=8&includeDrafts=true`, undefined, 10000),
        daemonFetch<any>('/api/ai-fabric/health', undefined, 10000),
        daemonFetch<any>('/api/control-plane/runs', undefined, 10000),
      ]);
      const [status, metrics, runs, roles, memory, fabric, control] = results;
      setData({
        status: status.status === 'fulfilled' ? status.value : null,
        metrics: metrics.status === 'fulfilled' ? unwrap(metrics.value, 'metrics') : null,
        runs: runs.status === 'fulfilled' ? arr(unwrap(runs.value, 'runs')) : [],
        roles: roles.status === 'fulfilled' ? arr(unwrap(roles.value, 'roles')) : [],
        memoryResults: memory.status === 'fulfilled' ? arr(unwrap(memory.value, 'results', 'memories')) : [],
        fabricHealth: fabric.status === 'fulfilled' ? unwrap(fabric.value, 'health') : null,
        controlPlane: control.status === 'fulfilled' ? control.value : null,
      });
      const failed = results.filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải AI Command Center, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải AI Command Center.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được AI Command Center.');
    } finally { setLoading(false); }
  };

  const createRun = async () => {
    if (!goal.trim()) return;
    setLoading(true); setError(''); setMessage('');
    try {
      await daemonFetch<any>('/api/agent-runtime/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: goal.trim(), maxSteps: 4, plannerMode: 'deterministic' }) }, 30000);
      setMessage('Đã tạo agent run an toàn ở chế độ deterministic.');
      await load(query);
    } catch (err: any) { setError(err?.message || 'Không tạo được agent run.'); }
    finally { setLoading(false); }
  };

  const setEmergencyStop = async (active: boolean) => {
    setLoading(true); setError(''); setMessage('');
    try {
      await daemonFetch<any>('/api/agent-runtime/emergency-stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active, reason: active ? 'Founder enabled stop from AI Command Center' : 'Founder released stop from AI Command Center' }) }, 10000);
      setMessage(active ? 'Đã bật AI emergency stop.' : 'Đã tắt AI emergency stop.');
      await load(query);
    } catch (err: any) { setError(err?.message || 'Không đổi được AI emergency stop.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(query); }, []);

  const activeRuns = useMemo(() => data.runs.filter((run) => ['running', 'waiting_approval', 'planned'].includes(String(run.status).toLowerCase())).length, [data.runs]);
  const emergency = Boolean(data.metrics?.emergencyStop);
  const controlRuns = arr(data.controlPlane?.runs);
  const controlMetrics = data.controlPlane?.metrics || {};

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Brain className="mr-2 inline h-4 w-4" />AI Command Center</p>
          <h2 className="mt-2 text-2xl font-black text-white">Agents, runtime, roles, memory and control plane</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Một màn chỉ huy AI gọn: xem agent đang chạy, vai trò, memory liên quan, AI Fabric và Control Plane. Emergency stop luôn hiện rõ.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRawOpen((v) => !v)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300">{rawOpen ? 'Ẩn raw' : 'Raw JSON'}</button>
          <button onClick={() => void load(query)} disabled={loading} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Refresh'}</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm memory/context cho AI..." className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400" />
        <button onClick={() => void load(query)} disabled={loading} className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs font-black text-cyan-100"><Search className="mr-2 inline h-4 w-4" />Search memory</button>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-5">
      <Stat label="Emergency" value={emergency ? 'STOP' : 'Clear'} hint="agent runtime" tone={emergency ? 'rose' : 'green'} />
      <Stat label="Active runs" value={activeRuns} hint={`${data.runs.length} recent`} tone={activeRuns ? 'amber' : 'slate'} />
      <Stat label="Roles" value={data.roles.length} hint="agent profiles" tone="cyan" />
      <Stat label="Memory hits" value={data.memoryResults.length} hint="RAG context" tone="violet" />
      <Stat label="Fabric" value={data.fabricHealth?.ok ? 'OK' : 'Unknown'} hint={data.fabricHealth?.message || 'AI route health'} tone={data.fabricHealth?.ok ? 'green' : 'amber'} />
    </section>

    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Section title="Runtime safety" icon={<ShieldAlert className="h-4 w-4 text-rose-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={emergency ? 'rose' : 'green'}>{emergency ? 'emergency stop' : 'running allowed'}</Badge><Badge>{String(data.metrics?.totalRuns ?? 0)} total runs</Badge><Badge tone="amber">{String(data.metrics?.waitingApproval ?? 0)} waiting approval</Badge></div>
        <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data.metrics || {}, null, 2)}</pre>
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void setEmergencyStop(true)} disabled={loading} className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs font-black text-rose-100">Bật AI E-Stop</button><button onClick={() => void setEmergencyStop(false)} disabled={loading} className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-100">Tắt AI E-Stop</button></div>
      </Section>
      <Section title="Create safe agent run" icon={<PlayCircle className="h-4 w-4 text-emerald-300" />}>
        <textarea value={goal} onChange={(event) => setGoal(event.target.value)} className="min-h-32 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-white outline-none focus:border-emerald-400" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><Badge tone="green">deterministic planner</Badge><button onClick={() => void createRun()} disabled={loading || !goal.trim() || emergency} className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 disabled:opacity-50"><Zap className="mr-2 inline h-4 w-4" />Create run</button></div>
        {emergency && <p className="mt-3 text-xs font-bold text-rose-200">AI E-Stop đang bật, không tạo run mới.</p>}
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="Recent agent runs" icon={<Activity className="h-4 w-4 text-cyan-300" />}>
        <MiniList items={data.runs} emptyText="Chưa có agent run." render={(run, index) => <div key={run.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="line-clamp-1 text-xs font-black text-white">{run.goal || run.id || 'Agent run'}</p><Badge tone={String(run.status).includes('failed') ? 'rose' : String(run.status).includes('completed') ? 'green' : 'amber'}>{run.status || 'run'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{run.planner || run.updatedAt || run.createdAt || 'runtime'}</p></div>} />
      </Section>
      <Section title="Agent roles" icon={<UsersRound className="h-4 w-4 text-violet-300" />}>
        <MiniList items={data.roles} emptyText="Chưa tải được roles." render={(role, index) => <div key={role.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center gap-2"><span>{role.emoji || '🤖'}</span><p className="text-xs font-black text-white">{role.id || role.name || 'Agent role'}</p></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{role.group || role.description || 'role'}</p></div>} />
      </Section>
      <Section title="Memory context" icon={<Database className="h-4 w-4 text-emerald-300" />}>
        <MiniList items={data.memoryResults} emptyText="Không có memory match." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="line-clamp-1 text-xs font-black text-white">{item.title || item.kind || 'Memory'}</p><Badge tone="green">{String(item.status || item.kind || 'memory')}</Badge></div><p className="mt-2 line-clamp-3 text-[11px] font-semibold leading-5 text-slate-400">{item.content || item.citation || item.source || JSON.stringify(item).slice(0, 160)}</p></div>} />
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Section title="AI Fabric health" icon={<Sparkles className="h-4 w-4 text-cyan-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone={data.fabricHealth?.ok ? 'green' : 'amber'}>{data.fabricHealth?.ok ? 'ok' : 'unknown'}</Badge><Badge>{String(data.fabricHealth?.apiKeys ?? 0)} API keys</Badge><Badge>{String(data.fabricHealth?.webProfiles ?? 0)} web profiles</Badge></div>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data.fabricHealth || {}, null, 2)}</pre>
      </Section>
      <Section title="Control Plane" icon={<Bot className="h-4 w-4 text-violet-300" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="violet">{String(controlMetrics.totalRuns ?? controlRuns.length)} total</Badge><Badge tone="green">{String(controlMetrics.completed ?? 0)} completed</Badge><Badge tone="amber">{String(controlMetrics.waitingHandoff ?? 0)} waiting handoff</Badge></div>
        <MiniList items={controlRuns} emptyText="Chưa có control plane run." render={(run, index) => <div key={run.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="line-clamp-1 text-xs font-black text-white">{run.goal || run.id || 'Control run'}</p><Badge>{run.status || 'control'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{run.updatedAt || run.createdAt || 'control plane'}</p></div>} />
      </Section>
    </section>

    {rawOpen && <Section title="Raw AI Command Center payload" icon={<Database className="h-4 w-4 text-slate-300" />}>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data, null, 2)}</pre>
    </Section>}
  </div>;
}
