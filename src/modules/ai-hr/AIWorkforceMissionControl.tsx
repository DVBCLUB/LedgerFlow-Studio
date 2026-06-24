import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, AlertTriangle, Archive, Bot, Brain, CheckCircle2, ClipboardList, Database, FileText, MessageSquare, PlayCircle, RefreshCw, Search, ShieldAlert, Sparkles, StopCircle, Zap } from 'lucide-react';
import { askAI, daemonFetch } from '../../utils/assistantApi';

type Tone = 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
type Metrics = { emergencyStop?: boolean; totalRuns?: number; activeRuns?: number; waitingApproval?: number; completedRuns?: number; failedRuns?: number; artifactCount?: number };
type AgentStep = { id: string; title?: string; toolId?: string; status?: string; observation?: string };
type AgentRun = { id: string; goal: string; status: string; planner?: string; plannerSummary?: string; createdAt: string; updatedAt?: string; steps?: AgentStep[]; artifacts?: Array<{ id: string; type: string; summary: string; createdAt: string }> };
type MemoryHit = { id?: string; title?: string; body?: string; summary?: string; citation?: string; tags?: string[] | string };
type Role = { id: string; emoji?: string; group?: string };
type HubData = { status: Record<string, unknown> | null; metrics: Metrics; runs: AgentRun[]; roles: Role[]; memoryHits: MemoryHit[]; fabricHealth: Record<string, unknown> | null; controlPlane: Record<string, unknown> | null };

const DEFAULT_GOAL = 'Review LedgerFlow AI workforce, produce a safe implementation plan, and list approvals needed before any external action.';
const DEFAULT_QUERY = 'LedgerFlow AI operations memory safety runtime approval';

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any)[key])) return (value as any)[key] as T[];
  return [];
}

function readMetrics(value: unknown): Metrics {
  if (value && typeof value === 'object' && (value as any).metrics) return (value as any).metrics as Metrics;
  return (value || {}) as Metrics;
}

function toneForStatus(status?: string): Tone {
  const value = String(status || '').toLowerCase();
  if (value.includes('completed') || value.includes('clear') || value.includes('ok')) return 'emerald';
  if (value.includes('waiting') || value.includes('planned') || value.includes('running')) return 'amber';
  if (value.includes('failed') || value.includes('stop') || value.includes('blocked')) return 'rose';
  return 'slate';
}

function Badge({ children, tone = 'slate' }: { children: string; tone?: Tone }) {
  const cls = tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : tone === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'violet' ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-slate-700 bg-slate-900 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function StatCard({ label, value, hint, icon, tone = 'slate' }: { label: string; value: string | number; hint: string; icon: ReactNode; tone?: Tone }) {
  const cls = tone === 'cyan' ? 'text-cyan-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'rose' ? 'text-rose-300' : tone === 'violet' ? 'text-violet-300' : 'text-white';
  return <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
    <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p><span className={cls}>{icon}</span></div>
    <p className={`mt-2 text-3xl font-black ${cls}`}>{value}</p>
    <p className="mt-1 text-[11px] font-bold text-slate-500">{hint}</p>
  </div>;
}

function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: ReactNode; children: ReactNode }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4 text-left">
    <div className="mb-4 flex items-start gap-3"><div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-200">{icon}</div><div><h3 className="text-sm font-black text-white">{title}</h3>{subtitle && <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{subtitle}</p>}</div></div>
    {children}
  </section>;
}

function EmptyState({ children }: { children: string }) {
  return <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-500">{children}</p>;
}

export default function AIWorkforceMissionControl() {
  const [data, setData] = useState<HubData>({ status: null, metrics: {}, runs: [], roles: [], memoryHits: [], fabricHealth: null, controlPlane: null });
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [chatPrompt, setChatPrompt] = useState('Summarize the safest next action for LedgerFlow AI Workforce in 5 bullet points.');
  const [chatAnswer, setChatAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (searchText = query) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<Record<string, unknown>>('/api/status', undefined, 30000),
        daemonFetch<unknown>('/api/agent-runtime/metrics', undefined, 10000),
        daemonFetch<unknown>('/api/agent-runtime/runs?limit=30', undefined, 10000),
        daemonFetch<unknown>('/api/roles', undefined, 10000),
        daemonFetch<unknown>(`/api/agent-memory/search?q=${encodeURIComponent(searchText)}&limit=8&includeDrafts=true`, undefined, 10000),
        daemonFetch<Record<string, unknown>>('/api/ai-fabric/health', undefined, 10000),
        daemonFetch<Record<string, unknown>>('/api/control-plane/runs', undefined, 10000),
      ]);
      const [status, metrics, runs, roles, memory, fabric, control] = results;
      const memoryHits = memory.status === 'fulfilled' ? [...readArray<MemoryHit>(memory.value, 'results'), ...readArray<MemoryHit>(memory.value, 'memories')] : [];
      setData({
        status: status.status === 'fulfilled' ? status.value : null,
        metrics: metrics.status === 'fulfilled' ? readMetrics(metrics.value) : {},
        runs: runs.status === 'fulfilled' ? readArray<AgentRun>(runs.value, 'runs') : [],
        roles: roles.status === 'fulfilled' ? readArray<Role>(roles.value, 'roles') : [],
        memoryHits,
        fabricHealth: fabric.status === 'fulfilled' ? fabric.value : null,
        controlPlane: control.status === 'fulfilled' ? control.value : null,
      });
      const failed = results.filter((item) => item.status === 'rejected').length;
      setMessage(failed ? `Mission Control loaded with ${failed} degraded source(s).` : 'Mission Control loaded.');
    } catch (err: any) {
      setError(err?.message || 'Cannot load AI Workforce Mission Control.');
    } finally { setBusy(false); }
  };

  useEffect(() => { void load(DEFAULT_QUERY); }, []);

  const emergency = Boolean(data.metrics.emergencyStop);
  const activeRuns = useMemo(() => data.runs.filter((run) => ['planned', 'running', 'waiting_approval'].includes(String(run.status).toLowerCase())).length, [data.runs]);
  const waitingRuns = useMemo(() => data.runs.filter((run) => String(run.status).toLowerCase().includes('waiting')), [data.runs]);
  const artifactCount = useMemo(() => data.runs.reduce((total, run) => total + (run.artifacts?.length || 0), data.metrics.artifactCount || 0), [data.metrics.artifactCount, data.runs]);
  const missionQueue = useMemo(() => data.runs.filter((run) => ['planned', 'running', 'waiting_approval'].includes(String(run.status).toLowerCase())).slice(0, 8), [data.runs]);
  const recentArtifacts = useMemo(() => data.runs.flatMap((run) => (run.artifacts || []).map((artifact) => ({ ...artifact, runGoal: run.goal }))).slice(0, 8), [data.runs]);

  const createRun = async () => {
    if (!goal.trim() || emergency) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const created = await daemonFetch<any>('/api/agent-runtime/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: goal.trim(), maxSteps: 5, plannerMode: 'auto' }) }, 60000);
      setMessage(`Created mission: ${created?.run?.id || created?.id || 'agent run'}`);
      await load(query);
    } catch (err: any) { setError(err?.message || 'Cannot create agent mission.'); }
    finally { setBusy(false); }
  };

  const toggleStop = async (active: boolean) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await daemonFetch('/api/agent-runtime/emergency-stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active, reason: active ? 'Founder enabled AI Workforce emergency stop.' : 'Founder released AI Workforce emergency stop.' }) }, 10000);
      setMessage(active ? 'AI Workforce emergency stop enabled.' : 'AI Workforce emergency stop released.');
      await load(query);
    } catch (err: any) { setError(err?.message || 'Cannot update emergency stop.'); }
    finally { setBusy(false); }
  };

  const sendChat = async () => {
    if (!chatPrompt.trim()) return;
    setBusy(true); setError(''); setChatAnswer('');
    try {
      const context = `LedgerFlow AI Workforce context:\n- Emergency stop: ${emergency}\n- Active runs: ${activeRuns}\n- Waiting approval: ${waitingRuns.length}\n- Recent goals: ${data.runs.slice(0, 5).map((run) => `${run.status}: ${run.goal}`).join(' | ')}\n\nFounder command: ${chatPrompt.trim()}`;
      const result = await askAI(context, 'general');
      setChatAnswer(result.answer || 'No answer returned.');
    } catch (err: any) { setError(err?.message || 'Command chat failed.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6 text-slate-100">
    <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Brain className="mr-2 inline h-4 w-4" />AI Workforce Mission Control</p><h2 className="mt-2 text-2xl font-black tracking-tight text-white">One command layer for agents, approvals, artifacts, memory and safety</h2><p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">Giao việc như một đội nhân sự AI: nhập lệnh, tạo mission, theo dõi hàng chờ, kiểm tra approval, xem artifact và khóa khẩn cấp khi cần.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => void load(query)} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button><button onClick={() => void toggleStop(true)} disabled={busy || emergency} className="rounded-2xl border border-rose-500/40 bg-rose-950/30 px-4 py-2 text-xs font-black text-rose-100 disabled:opacity-40"><StopCircle className="mr-2 inline h-4 w-4" />Emergency Stop</button><button onClick={() => void toggleStop(false)} disabled={busy || !emergency} className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 disabled:opacity-40"><CheckCircle2 className="mr-2 inline h-4 w-4" />Release Stop</button></div>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Safety" value={emergency ? 'STOP' : 'Clear'} hint="global agent runtime gate" icon={<ShieldAlert className="h-5 w-5" />} tone={emergency ? 'rose' : 'emerald'} />
      <StatCard label="Active missions" value={activeRuns} hint={`${data.runs.length} recent runs loaded`} icon={<Activity className="h-5 w-5" />} tone={activeRuns ? 'amber' : 'slate'} />
      <StatCard label="Approvals" value={waitingRuns.length} hint="runs waiting for founder review" icon={<ClipboardList className="h-5 w-5" />} tone={waitingRuns.length ? 'amber' : 'emerald'} />
      <StatCard label="Artifacts" value={artifactCount} hint="inspectable outputs" icon={<Archive className="h-5 w-5" />} tone="violet" />
      <StatCard label="Memory" value={data.memoryHits.length} hint="retrieved RAG context" icon={<Database className="h-5 w-5" />} tone="cyan" />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Section title="Command Chat" subtitle="Hỏi, định hướng và lấy quyết định an toàn trước khi tạo mission." icon={<MessageSquare className="h-4 w-4" />}>
        <textarea value={chatPrompt} onChange={(event) => setChatPrompt(event.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-white outline-none focus:border-cyan-400" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><Badge tone="cyan">advisory only</Badge><button onClick={() => void sendChat()} disabled={busy || !chatPrompt.trim()} className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50"><Sparkles className="mr-2 inline h-4 w-4" />Ask AI</button></div>
        {chatAnswer && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-300">{chatAnswer}</pre>}
      </Section>

      <Section title="Mission Builder" subtitle="Tạo agent run có kiểm soát. Mission tự đi qua planner, runtime, approval và artifact." icon={<PlayCircle className="h-4 w-4" />}>
        <textarea value={goal} onChange={(event) => setGoal(event.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-white outline-none focus:border-emerald-400" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-2"><Badge tone="emerald">auto planner</Badge><Badge tone="amber">approval gated</Badge></div><button onClick={() => void createRun()} disabled={busy || !goal.trim() || emergency} className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 disabled:opacity-50"><Zap className="mr-2 inline h-4 w-4" />Create Mission</button></div>
        {emergency && <p className="mt-3 text-xs font-bold text-rose-200">Emergency stop đang bật nên không tạo mission mới.</p>}
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Section title="Mission Queue" subtitle="Các agent run đang planned/running/waiting approval." icon={<Bot className="h-4 w-4" />}>
        <div className="space-y-2">{missionQueue.map((run) => <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone={toneForStatus(run.status)}>{run.status}</Badge><Badge>{run.planner || 'planner'}</Badge></div><p className="mt-2 text-sm font-black text-white">{run.goal}</p>{run.plannerSummary && <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{run.plannerSummary}</p>}<div className="mt-3 grid gap-2 sm:grid-cols-2">{(run.steps || []).slice(0, 4).map((step) => <div key={step.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2"><p className="text-[10px] font-black uppercase text-cyan-300">{step.status || 'queued'} • {step.toolId || 'tool'}</p><p className="mt-1 line-clamp-2 text-xs font-bold text-slate-300">{step.title || step.observation || 'Step pending'}</p></div>)}</div></div>)}{missionQueue.length === 0 && <EmptyState>No active mission. Create one from Mission Builder.</EmptyState>}</div>
      </Section>

      <Section title="Approval Gate" subtitle="Tách riêng các mission cần founder review trước khi có side effect." icon={<ShieldAlert className="h-4 w-4" />}>
        <div className="space-y-2">{waitingRuns.map((run) => <div key={run.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3"><Badge tone="amber">waiting approval</Badge><p className="mt-2 text-sm font-black text-white">{run.goal}</p>{(run.steps || []).filter((step) => String(step.status).includes('waiting')).slice(0, 3).map((step) => <p key={step.id} className="mt-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-xs font-bold text-amber-100">{step.toolId}: {step.title || 'Approval required'}</p>)}</div>)}{waitingRuns.length === 0 && <EmptyState>No approval is waiting right now.</EmptyState>}</div>
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="Artifacts" subtitle="Output có thể kiểm tra lại sau mỗi mission." icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-2">{recentArtifacts.map((artifact) => <div key={artifact.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Badge tone="violet">{artifact.type}</Badge><p className="mt-2 text-xs font-bold leading-5 text-slate-300">{artifact.summary}</p><p className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-500">{artifact.runGoal}</p></div>)}{recentArtifacts.length === 0 && <EmptyState>No artifact returned yet.</EmptyState>}</div>
      </Section>

      <Section title="Memory Search" subtitle="RAG/context liên quan tới AI Workforce." icon={<Search className="h-4 w-4" />}>
        <div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-400" /><button onClick={() => void load(query)} disabled={busy} className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-xs font-black text-cyan-100">Search</button></div>
        <div className="mt-3 space-y-2">{data.memoryHits.slice(0, 5).map((hit, index) => <div key={hit.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{hit.title || hit.citation || `Memory ${index + 1}`}</p><p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-slate-500">{hit.summary || hit.body || 'No summary.'}</p></div>)}{data.memoryHits.length === 0 && <EmptyState>No memory found for this query.</EmptyState>}</div>
      </Section>

      <Section title="System Snapshot" subtitle="Tình trạng roles, fabric, daemon và control plane." icon={<Brain className="h-4 w-4" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="cyan">{data.roles.length} roles</Badge><Badge tone={data.fabricHealth ? 'emerald' : 'amber'}>{data.fabricHealth ? 'fabric loaded' : 'fabric unknown'}</Badge><Badge tone={data.status ? 'emerald' : 'amber'}>{data.status ? 'daemon ok' : 'daemon unknown'}</Badge></div>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] leading-5 text-slate-500">{JSON.stringify({ metrics: data.metrics, fabricHealth: data.fabricHealth, controlPlane: data.controlPlane }, null, 2)}</pre>
      </Section>
    </section>
  </div>;
}
