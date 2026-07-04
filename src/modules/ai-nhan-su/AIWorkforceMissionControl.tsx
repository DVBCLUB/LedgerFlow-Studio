import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Archive,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  MessageSquare,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  StopCircle,
  Zap,
  ChevronRight,
  Info,
  X,
  Lock,
  Eye,
  Terminal
} from 'lucide-react';
import { askAI, daemonFetch } from '../../utils/assistantApi';

type Tone = 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
type Metrics = { emergencyStop?: boolean; totalRuns?: number; activeRuns?: number; waitingApproval?: number; completedRuns?: number; failedRuns?: number; artifactCount?: number };
type AgentStep = { id: string; title?: string; toolId?: string; status?: string; observation?: string; risk?: string; requiresApproval?: boolean; approvalFingerprint?: string; approvalSignature?: string; executionMode?: string; permission?: string; latencyMs?: number; tokensUsed?: number };
type AgentRun = { id: string; goal: string; status: string; planner?: string; plannerSummary?: string; createdAt: string; updatedAt?: string; steps?: AgentStep[]; artifacts?: Array<{ id: string; type: string; summary: string; createdAt: string }> };
type MemoryHit = { id?: string; title?: string; body?: string; summary?: string; citation?: string; tags?: string[] | string };
type Role = { id: string; emoji?: string; group?: string };
type HubData = { status: Record<string, unknown> | null; metrics: Metrics; runs: AgentRun[]; roles: Role[]; memoryHits: MemoryHit[]; fabricHealth: Record<string, unknown> | null; controlPlane: Record<string, unknown> | null };
type CreateRunResponse = { run?: { id?: string }; id?: string };

const DEFAULT_GOAL = 'Review LedgerFlow AI workforce, produce a safe implementation plan, and list approvals needed before any external action.';
const DEFAULT_QUERY = 'LedgerFlow AI operations memory safety runtime approval';
const APPROVAL_PHRASE = 'APPROVE AGENT STEP';

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

function readMetrics(value: unknown): Metrics {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.metrics && typeof record.metrics === 'object') return record.metrics as Metrics;
    return record as Metrics;
  }
  return {};
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function toneForStatus(status?: string): Tone {
  const value = String(status || '').toLowerCase();
  if (value.includes('completed') || value.includes('clear') || value.includes('ok')) return 'emerald';
  if (value.includes('waiting') || value.includes('planned') || value.includes('running')) return 'amber';
  if (value.includes('failed') || value.includes('stop') || value.includes('blocked')) return 'rose';
  return 'slate';
}

function Badge({ children, tone = 'slate' }: { children: string; tone?: Tone }) {
  const cls = tone === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : tone === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : tone === 'rose' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : tone === 'violet' ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-border-secondary bg-bg-primary text-text-secondary';
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{children}</span>;
}

function StatCard({ label, value, hint, icon, tone = 'slate' }: { label: string; value: string | number; hint: string; icon: ReactNode; tone?: Tone }) {
  const cls = tone === 'cyan' ? 'text-cyan-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'rose' ? 'text-rose-300' : tone === 'violet' ? 'text-violet-300' : 'text-text-primary';
  return <div className="rounded-3xl border border-border-primary bg-slate-950/70 p-4">
    <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{label}</p><span className={cls}>{icon}</span></div>
    <p className={`mt-2 text-3xl font-black ${cls}`}>{value}</p>
    <p className="mt-1 text-[11px] font-bold text-text-tertiary">{hint}</p>
  </div>;
}

function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: ReactNode; children: ReactNode }) {
  return <section className="rounded-3xl border border-border-primary bg-slate-950/55 p-4 text-left">
    <div className="mb-4 flex items-start gap-3"><div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-200">{icon}</div><div><h3 className="text-sm font-black text-text-primary">{title}</h3>{subtitle && <p className="mt-1 text-xs font-semibold leading-5 text-text-tertiary">{subtitle}</p>}</div></div>
    {children}
  </section>;
}

function EmptyState({ children }: { children: string }) {
  return <p className="rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs font-bold text-text-tertiary">{children}</p>;
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

  // Trace Drawer states
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

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
    } catch (err: unknown) {
      setError(errorMessage(err, 'Cannot load AI Workforce Mission Control.'));
    } finally { setBusy(false); }
  };

  useEffect(() => { void load(DEFAULT_QUERY); }, []);

  const emergency = Boolean(data.metrics.emergencyStop);
  const activeRuns = useMemo(() => data.runs.filter((run) => ['planned', 'running', 'waiting_approval'].includes(String(run.status).toLowerCase())).length, [data.runs]);
  
  const waitingRuns = useMemo(() => {
    return data.runs.filter((run) => {
      const isWaiting = String(run.status).toLowerCase().includes('waiting') || 
                        (run.steps || []).some(s => s.status?.toLowerCase().includes('waiting') || s.requiresApproval);
      return isWaiting;
    });
  }, [data.runs]);

  const artifactCount = useMemo(() => data.runs.reduce((total, run) => total + (run.artifacts?.length || 0), data.metrics.artifactCount || 0), [data.metrics.artifactCount, data.runs]);
  const missionQueue = useMemo(() => data.runs.filter((run) => ['planned', 'running', 'waiting_approval'].includes(String(run.status).toLowerCase())).slice(0, 8), [data.runs]);
  const recentArtifacts = useMemo(() => data.runs.flatMap((run) => (run.artifacts || []).map((artifact) => ({ ...artifact, runGoal: run.goal }))).slice(0, 8), [data.runs]);

  const selectedRun = useMemo(() => {
    return data.runs.find(r => r.id === selectedRunId);
  }, [data.runs, selectedRunId]);

  const createRun = async () => {
    if (!goal.trim() || emergency) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const created = await daemonFetch<CreateRunResponse>('/api/agent-runtime/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: goal.trim(), maxSteps: 5, plannerMode: 'auto' }) }, 60000);
      setMessage(`Created mission: ${created.run?.id || created.id || 'agent run'}`);
      await load(query);
    } catch (err: unknown) { setError(errorMessage(err, 'Cannot create agent mission.')); }
    finally { setBusy(false); }
  };

  const advanceRun = async (runId: string) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await daemonFetch(`/api/agent-runtime/runs/${encodeURIComponent(runId)}/advance`, { method: 'POST' }, 60000);
      setMessage(`Advanced mission ${runId}.`);
      await load(query);
    } catch (err: unknown) { setError(errorMessage(err, 'Cannot advance mission.')); }
    finally { setBusy(false); }
  };

  const stopRun = async (runId: string) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await daemonFetch(`/api/agent-runtime/runs/${encodeURIComponent(runId)}/stop`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Founder stopped from AI Workforce Mission Control.' }) }, 10000);
      setMessage(`Stopped mission ${runId}.`);
      await load(query);
    } catch (err: unknown) { setError(errorMessage(err, 'Cannot stop mission.')); }
    finally { setBusy(false); }
  };

  const approveStep = async (run: AgentRun, step: AgentStep) => {
    if (!step.approvalFingerprint) { setError('This step is missing an approval fingerprint. Advance the run again or inspect the daemon state.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      await daemonFetch(`/api/agent-runtime/runs/${encodeURIComponent(run.id)}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stepId: step.id, fingerprint: step.approvalFingerprint, signature: step.approvalSignature, phrase: APPROVAL_PHRASE }) }, 60000);
      setMessage(`Approved ${step.toolId || 'step'} for ${run.id}.`);
      await load(query);
    } catch (err: unknown) { setError(errorMessage(err, 'Cannot approve step.')); }
    finally { setBusy(false); }
  };

  const rejectStep = async (run: AgentRun, step: AgentStep) => {
    if (!step.approvalFingerprint) { setError('This step is missing an approval fingerprint. Advance the run again or inspect the daemon state.'); return; }
    const reason = window.prompt("Nhập lý do từ chối bước này (Reject Reason):", "Founder từ chối chạy action do lo ngại rủi ro.");
    if (reason === null) return; // User cancelled prompt
    
    setBusy(true); setError(''); setMessage('');
    try {
      await daemonFetch(`/api/agent-runtime/runs/${encodeURIComponent(run.id)}/reject`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ stepId: step.id, fingerprint: step.approvalFingerprint, reason }) 
      }, 60000);
      setMessage(`Rejected ${step.toolId || 'step'} for ${run.id}. Audit event recorded.`);
      await load(query);
    } catch (err: unknown) { setError(errorMessage(err, 'Cannot reject step.')); }
    finally { setBusy(false); }
  };

  const toggleStop = async (active: boolean) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await daemonFetch('/api/agent-runtime/emergency-stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active, reason: active ? 'Founder enabled AI Workforce emergency stop.' : 'Founder released AI Workforce emergency stop.' }) }, 10000);
      setMessage(active ? 'AI Workforce emergency stop enabled.' : 'AI Workforce emergency stop released.');
      await load(query);
    } catch (err: unknown) { setError(errorMessage(err, 'Cannot update emergency stop.')); }
    finally { setBusy(false); }
  };

  const sendChat = async () => {
    if (!chatPrompt.trim()) return;
    setBusy(true); setError(''); setChatAnswer('');
    try {
      const context = `LedgerFlow AI Workforce context:\n- Emergency stop: ${emergency}\n- Active runs: ${activeRuns}\n- Waiting approval: ${waitingRuns.length}\n- Recent goals: ${data.runs.slice(0, 5).map((run) => `${run.status}: ${run.goal}`).join(' | ')}\n\nFounder command: ${chatPrompt.trim()}`;
      const result = await askAI(context, 'general');
      setChatAnswer(result.answer || 'No answer returned.');
    } catch (err: unknown) { setError(errorMessage(err, 'Command chat failed.')); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6 text-slate-100">
    <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Brain className="mr-2 inline h-4 w-4" />AI Workforce Mission Control</p><h2 className="mt-2 text-2xl font-black tracking-tight text-text-primary">One command layer for agents, approvals, artifacts, memory and safety</h2><p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-text-secondary">Giao việc như một đội nhân sự AI: nhập lệnh, tạo mission, theo dõi hàng chờ, kiểm tra approval, xem artifact và khóa khẩn cấp khi cần.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => void load(query)} disabled={busy} className="rounded-2xl border border-border-secondary px-4 py-2 text-xs font-black text-text-secondary hover:border-cyan-300 disabled:opacity-60 transition-all"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button><button onClick={() => void toggleStop(true)} disabled={busy || emergency} className="rounded-2xl border border-rose-500/40 bg-rose-950/30 px-4 py-2 text-xs font-black text-rose-100 disabled:opacity-40 transition-all"><StopCircle className="mr-2 inline h-4 w-4" />Emergency Stop</button><button onClick={() => void toggleStop(false)} disabled={busy || !emergency} className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 disabled:opacity-40 transition-all"><CheckCircle2 className="mr-2 inline h-4 w-4" />Release Stop</button></div>
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
        <textarea value={chatPrompt} onChange={(event) => setChatPrompt(event.target.value)} className="min-h-28 w-full rounded-2xl border border-border-primary bg-slate-950 p-3 text-sm font-semibold leading-6 text-text-primary outline-none focus:border-cyan-400" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><Badge tone="cyan">advisory only</Badge><button onClick={() => void sendChat()} disabled={busy || !chatPrompt.trim()} className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50"><Sparkles className="mr-2 inline h-4 w-4" />Ask AI</button></div>
        {chatAnswer && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-xs leading-5 text-text-secondary">{chatAnswer}</pre>}
      </Section>

      <Section title="Mission Builder" subtitle="Tạo agent run có kiểm soát. Mission tự đi qua planner, runtime, approval và artifact." icon={<PlayCircle className="h-4 w-4" />}>
        <textarea value={goal} onChange={(event) => setGoal(event.target.value)} className="min-h-28 w-full rounded-2xl border border-border-primary bg-slate-950 p-3 text-sm font-semibold leading-6 text-text-primary outline-none focus:border-emerald-400" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-2"><Badge tone="emerald">auto planner</Badge><Badge tone="amber">approval gated</Badge></div><button onClick={() => void createRun()} disabled={busy || !goal.trim() || emergency} className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 disabled:opacity-50"><Zap className="mr-2 inline h-4 w-4" />Create Mission</button></div>
        {emergency && <p className="mt-3 text-xs font-bold text-rose-200">Emergency stop đang bật nên không tạo mission mới.</p>}
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Section title="Mission Queue" subtitle="Các agent run đang planned/running/waiting approval." icon={<Bot className="h-4 w-4" />}>
        <div className="space-y-2">
          {missionQueue.map((run) => (
            <div key={run.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3 relative group hover:border-border-secondary transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2 items-center">
                  <Badge tone={toneForStatus(run.status)}>{run.status}</Badge>
                  <span className="text-[10px] text-text-tertiary font-bold">ID: {run.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge>{run.planner || 'planner'}</Badge>
                  <button 
                    onClick={() => setSelectedRunId(run.id)}
                    className="p-1 rounded-lg hover:bg-bg-surface text-text-secondary hover:text-text-primary transition-all"
                    title="Xem chi tiết Timeline & Tools"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm font-black text-text-primary">{run.goal}</p>
              {run.plannerSummary && <p className="mt-1 text-xs font-semibold leading-5 text-text-tertiary">{run.plannerSummary}</p>}
              
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(run.steps || []).slice(0, 4).map((step) => (
                  <div key={step.id} className="rounded-xl border border-border-primary bg-bg-surface/70 p-2">
                    <p className="text-[10px] font-black uppercase text-cyan-300">{step.status || 'queued'} • {step.toolId || 'tool'}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold text-text-secondary">{step.title || step.observation || 'Step pending'}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => void advanceRun(run.id)} disabled={busy || emergency || String(run.status).toLowerCase().includes('waiting')} className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-40">Advance</button>
                <button onClick={() => void stopRun(run.id)} disabled={busy} className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs font-black text-rose-100 disabled:opacity-40">Stop</button>
              </div>
            </div>
          ))}
          {missionQueue.length === 0 && <EmptyState>No active mission. Create one from Mission Builder.</EmptyState>}
        </div>
      </Section>

      <Section title="Approval Gate" subtitle="Tách riêng các mission cần founder review trước khi có side effect." icon={<ShieldAlert className="h-4 w-4" />}>
        <div className="space-y-2">
          {waitingRuns.map((run) => (
            <div key={run.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
              <Badge tone="amber">waiting approval</Badge>
              <p className="mt-2 text-sm font-black text-text-primary">{run.goal}</p>
              {(run.steps || []).filter((step) => String(step.status).toLowerCase().includes('waiting') || step.requiresApproval).slice(0, 3).map((step) => {
                const isHighRisk = step.risk?.toLowerCase() === 'high' || step.toolId?.includes('write') || step.toolId?.includes('delete');
                return (
                  <div key={step.id} className={`mt-3 rounded-xl border p-3 ${isHighRisk ? 'border-rose-500/30 bg-rose-950/10' : 'border-border-primary bg-slate-950/70'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                      <p className="text-xs font-bold text-amber-100">{step.toolId}: {step.title || 'Approval required'}</p>
                    </div>
                    {isHighRisk && (
                      <div className="mb-2 p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 flex gap-2 items-center">
                        <Lock className="h-3.5 w-3.5 text-rose-400" />
                        <span className="text-[9px] font-black text-rose-300 uppercase tracking-wider">HÀNH ĐỘNG RỦI RO CAO — CẦN THẬN TRỌNG</span>
                      </div>
                    )}
                    <div className="text-[10px] text-text-secondary space-y-1">
                      <p className="break-all font-semibold">fingerprint: <span className="text-text-secondary">{step.approvalFingerprint || 'missing'}</span></p>
                      {step.executionMode && <p>Chế độ thực thi: <span className="text-text-secondary">{step.executionMode}</span></p>}
                      {step.permission && <p>Quyền yêu cầu: <span className="text-text-secondary">{step.permission}</span></p>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <Badge tone={toneForStatus(step.risk)}>{step.risk || 'risk'}</Badge>
                      <button onClick={() => void approveStep(run, step)} disabled={busy || !step.approvalFingerprint || emergency} className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-[10px] font-black text-emerald-100 hover:bg-emerald-900/35 transition-all disabled:opacity-40">Approve Step</button>
                      <button onClick={() => void rejectStep(run, step)} disabled={busy || !step.approvalFingerprint} className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-[10px] font-black text-rose-100 hover:bg-rose-900/35 transition-all disabled:opacity-40">Reject Step</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {waitingRuns.length === 0 && <EmptyState>No approval is waiting right now.</EmptyState>}
        </div>
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="Artifacts" subtitle="Output có thể kiểm tra lại sau mỗi mission." icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-2">{recentArtifacts.map((artifact) => <div key={artifact.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><Badge tone="violet">{artifact.type}</Badge><p className="mt-2 text-xs font-bold leading-5 text-text-secondary">{artifact.summary}</p><p className="mt-1 line-clamp-1 text-[11px] font-semibold text-text-tertiary">{artifact.runGoal}</p></div>)}{recentArtifacts.length === 0 && <EmptyState>No artifact returned yet.</EmptyState>}</div>
      </Section>

      <Section title="Memory Search" subtitle="RAG/context liên quan tới AI Workforce." icon={<Search className="h-4 w-4" />}>
        <div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-cyan-400" /><button onClick={() => void load(query)} disabled={busy} className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-xs font-black text-cyan-100">Search</button></div>
        <div className="mt-3 space-y-2">{data.memoryHits.slice(0, 5).map((hit, index) => <div key={hit.id || index} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><p className="text-xs font-black text-text-primary">{hit.title || hit.citation || `Memory ${index + 1}`}</p><p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-text-tertiary">{hit.summary || hit.body || 'No summary.'}</p></div>)}{data.memoryHits.length === 0 && <EmptyState>No memory found for this query.</EmptyState>}</div>
      </Section>

      <Section title="System Snapshot" subtitle="Tình trạng roles, fabric, daemon và control plane." icon={<Brain className="h-4 w-4" />}>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="cyan">{`${data.roles.length} roles`}</Badge><Badge tone={data.fabricHealth ? 'emerald' : 'amber'}>{data.fabricHealth ? 'fabric loaded' : 'fabric unknown'}</Badge><Badge tone={data.status ? 'emerald' : 'amber'}>{data.status ? 'daemon ok' : 'daemon unknown'}</Badge></div>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-border-primary bg-slate-950/70 p-3 text-[11px] leading-5 text-text-tertiary">{JSON.stringify({ metrics: data.metrics, fabricHealth: data.fabricHealth, controlPlane: data.controlPlane }, null, 2)}</pre>
      </Section>
    </section>

    {/* Mission Trace Drawer (Modal) */}
    {selectedRun && (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-end animate-fade-in">
        <div className="w-full max-w-2xl bg-bg-primary border-l border-border-primary h-full p-6 overflow-y-auto relative shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border-primary pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-cyan-400 animate-pulse" />
                <div>
                  <h2 className="text-base font-black text-text-primary">Mission Trace Timeline</h2>
                  <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">ID: {selectedRun.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRunId(null)}
                className="p-1.5 rounded-xl border border-border-primary bg-slate-950 text-text-secondary hover:text-text-primary hover:border-border-secondary transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-border-primary/80 text-xs font-semibold leading-6">
                <span className="text-[10px] font-black uppercase text-text-tertiary tracking-wider">Mục tiêu chính (Goal)</span>
                <p className="text-slate-200 mt-1">{selectedRun.goal}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider mb-3">Lịch trình các bước của Agent</h3>
                {selectedRun.steps && selectedRun.steps.length > 0 ? (
                  <div className="space-y-3 relative border-l-2 border-border-primary ml-3 pl-5 py-2">
                    {selectedRun.steps.map((step, idx) => {
                      const isWaiting = step.status?.toLowerCase().includes('waiting') || step.requiresApproval;
                      const isRunning = step.status?.toLowerCase() === 'running';
                      const isCompleted = step.status?.toLowerCase() === 'completed';
                      return (
                        <div key={idx} className="relative">
                          {/* Node Bullet */}
                          <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border transition-all ${
                            isRunning ? 'bg-cyan-400 border-cyan-500 animate-ping' :
                            isCompleted ? 'bg-emerald-400 border-emerald-500' :
                            isWaiting ? 'bg-amber-400 border-amber-500' :
                            'bg-bg-surface border-border-secondary'
                          }`} />
                          
                          <div className="rounded-xl border border-border-primary bg-slate-950/30 p-3 hover:border-border-secondary transition-all">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                                {step.toolId || 'step'}
                                {step.latencyMs !== undefined && (
                                  <span className="text-text-tertiary font-bold ml-2 font-mono text-[9px] lowercase">
                                    {` (${(step.latencyMs / 1000).toFixed(1)}s`}
                                    {step.tokensUsed !== undefined && ` • ${step.tokensUsed} tokens`}
                                    {`)`}
                                  </span>
                                )}
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                isCompleted ? 'bg-emerald-500/20 text-emerald-300' :
                                isWaiting ? 'bg-amber-500/20 text-amber-300' :
                                'bg-bg-primary text-text-secondary'
                              }`}>
                                {step.status}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-200 mt-2">{step.title || 'Đang lập kế hoạch...'}</p>
                            
                            {step.observation && (
                              <details className="mt-2 rounded-lg bg-slate-950 p-2.5 border border-slate-900">
                                <summary className="cursor-pointer select-none text-[10px] font-bold text-text-tertiary hover:text-text-secondary">
                                  Xem kết quả / Bằng chứng (Observation)
                                </summary>
                                <pre className="mt-2 text-[10px] font-semibold font-mono text-text-secondary bg-bg-primary/60 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                                  {step.observation}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary italic">Chưa ghi nhận bước thực hiện nào.</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border-primary pt-4 mt-6 flex justify-between items-center text-xs font-semibold text-text-tertiary">
            <span>Trạng thái: <span className="font-bold text-text-secondary uppercase">{selectedRun.status}</span></span>
            <span>Khởi tạo: <span className="font-bold text-text-secondary">{new Date(selectedRun.createdAt).toLocaleTimeString('vi-VN')}</span></span>
          </div>
        </div>
      </div>
    )}
  </div>;
}
