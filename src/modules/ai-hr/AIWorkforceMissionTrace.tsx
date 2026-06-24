import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Archive, Bot, Brain, CheckCircle2, ClipboardList, FileText, GitBranch, RefreshCw, ShieldAlert, Timer, Zap } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type TraceArtifact = { id: string; type: string; summary: string; createdAt?: string };
type TraceStep = {
  id: string;
  title?: string;
  toolId?: string;
  status?: string;
  risk?: string;
  requiresApproval?: boolean;
  approvalFingerprint?: string;
  observation?: string;
  evidence?: unknown;
};
type TraceRun = {
  id: string;
  goal: string;
  status: string;
  planner?: string;
  plannerSummary?: string;
  createdAt: string;
  updatedAt?: string;
  sourceType?: string;
  maxSteps?: number;
  maxRuntimeMs?: number;
  observations?: string[];
  steps?: TraceStep[];
  artifacts?: TraceArtifact[];
};

type Tone = 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any)[key])) return (value as any)[key] as T[];
  return [];
}

function toneForStatus(status?: string): Tone {
  const value = String(status || '').toLowerCase();
  if (value.includes('completed') || value.includes('success') || value.includes('approved')) return 'emerald';
  if (value.includes('waiting') || value.includes('planned') || value.includes('running')) return 'amber';
  if (value.includes('failed') || value.includes('stopped') || value.includes('blocked') || value.includes('rejected')) return 'rose';
  return 'slate';
}

function badgeClass(tone: Tone) {
  if (tone === 'cyan') return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
  if (tone === 'emerald') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (tone === 'amber') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (tone === 'rose') return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  if (tone === 'violet') return 'border-violet-500/30 bg-violet-500/10 text-violet-200';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

function Badge({ children, tone = 'slate' }: { children: string; tone?: Tone }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${badgeClass(tone)}`}>{children}</span>;
}

function TraceEvent({ index, title, meta, body, tone = 'slate' }: { index: number; title: string; meta?: string; body?: string; tone?: Tone }) {
  return <div className="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-3 pl-12">
    <div className={`absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-black ${badgeClass(tone)}`}>{index}</div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-black text-white">{title}</p>
      {meta && <Badge tone={tone}>{meta}</Badge>}
    </div>
    {body && <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-400">{body}</p>}
  </div>;
}

function compactDate(value?: string) {
  if (!value) return 'unknown time';
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

export default function AIWorkforceMissionTrace() {
  const [runs, setRuns] = useState<TraceRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setBusy(true); setError('');
    try {
      const result = await daemonFetch<unknown>('/api/agent-runtime/runs?limit=20', undefined, 10000);
      const loadedRuns = readArray<TraceRun>(result, 'runs');
      setRuns(loadedRuns);
      setSelectedRunId((current) => current && loadedRuns.some((run) => run.id === current) ? current : loadedRuns[0]?.id || '');
    } catch (err: any) {
      setError(err?.message || 'Cannot load mission trace.');
    } finally { setBusy(false); }
  };

  useEffect(() => { void load(); }, []);

  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedRunId) || runs[0], [runs, selectedRunId]);
  const traceEvents = useMemo(() => {
    if (!selectedRun) return [];
    const events: Array<{ title: string; meta?: string; body?: string; tone?: Tone }> = [
      { title: 'Mission created', meta: selectedRun.sourceType || 'mission', body: `${selectedRun.goal}\nCreated: ${compactDate(selectedRun.createdAt)}`, tone: 'cyan' },
      { title: 'Planner summary', meta: selectedRun.planner || 'planner', body: selectedRun.plannerSummary || 'No planner summary returned.', tone: 'violet' },
    ];
    (selectedRun.steps || []).forEach((step) => {
      const approval = step.requiresApproval ? `\nApproval fingerprint: ${step.approvalFingerprint || 'missing'}` : '';
      events.push({
        title: step.title || step.toolId || 'Agent step',
        meta: `${step.status || 'queued'} • ${step.toolId || 'tool'}`,
        body: `${step.observation || 'No observation recorded yet.'}${approval}`,
        tone: toneForStatus(step.status || step.risk),
      });
    });
    (selectedRun.artifacts || []).forEach((artifact) => {
      events.push({ title: `Artifact: ${artifact.type}`, meta: 'artifact', body: `${artifact.summary}\n${compactDate(artifact.createdAt)}`, tone: 'emerald' });
    });
    (selectedRun.observations || []).slice(-5).forEach((observation) => {
      events.push({ title: 'Observation', meta: 'runtime', body: observation, tone: toneForStatus(observation) });
    });
    return events;
  }, [selectedRun]);

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><GitBranch className="mr-2 inline h-4 w-4" />Mission Trace</p>
        <h3 className="mt-2 text-lg font-black text-white">Plan → Steps → Approvals → Artifacts</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Timeline dễ đọc cho từng mission, thay vì bắt founder mở raw diagnostics.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
      </div>
    </div>

    {error && <p className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}

    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-2">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge tone="cyan">{runs.length} loaded</Badge>
          <Badge tone={selectedRun ? toneForStatus(selectedRun.status) : 'slate'}>{selectedRun?.status || 'no run'}</Badge>
        </div>
        {runs.map((run) => <button key={run.id} onClick={() => setSelectedRunId(run.id)} className={`w-full rounded-2xl border p-3 text-left transition ${run.id === selectedRun?.id ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2"><Badge tone={toneForStatus(run.status)}>{run.status}</Badge><span className="text-[10px] font-bold text-slate-500">{compactDate(run.createdAt)}</span></div>
          <p className="mt-2 line-clamp-2 text-sm font-black text-white">{run.goal}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">{run.steps?.length || 0} steps • {run.artifacts?.length || 0} artifacts</p>
        </button>)}
        {runs.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-500">No mission runs returned by daemon.</p>}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-4">
        {selectedRun ? <>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Activity className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-slate-500">Status</p><p className="mt-1 text-sm font-black text-white">{selectedRun.status}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Brain className="mb-2 h-4 w-4 text-violet-300" /><p className="text-[10px] font-black uppercase text-slate-500">Planner</p><p className="mt-1 text-sm font-black text-white">{selectedRun.planner || 'unknown'}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><ClipboardList className="mb-2 h-4 w-4 text-amber-300" /><p className="text-[10px] font-black uppercase text-slate-500">Steps</p><p className="mt-1 text-sm font-black text-white">{selectedRun.steps?.length || 0}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Archive className="mb-2 h-4 w-4 text-emerald-300" /><p className="text-[10px] font-black uppercase text-slate-500">Artifacts</p><p className="mt-1 text-sm font-black text-white">{selectedRun.artifacts?.length || 0}</p></div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2"><Badge tone="cyan"><Timer className="mr-1 inline h-3 w-3" />{compactDate(selectedRun.updatedAt || selectedRun.createdAt)}</Badge>{(selectedRun.steps || []).some((step) => step.requiresApproval) && <Badge tone="amber"><ShieldAlert className="mr-1 inline h-3 w-3" />approval steps</Badge>}{(selectedRun.artifacts || []).length > 0 && <Badge tone="emerald"><FileText className="mr-1 inline h-3 w-3" />artifacts</Badge>}</div>
          <div className="space-y-3">{traceEvents.map((event, index) => <TraceEvent key={`${event.title}-${index}`} index={index + 1} title={event.title} meta={event.meta} body={event.body} tone={event.tone} />)}</div>
        </> : <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center"><Bot className="mx-auto mb-3 h-8 w-8 text-slate-500" /><p className="text-sm font-black text-white">No mission selected</p><p className="mt-1 text-xs font-semibold text-slate-500">Create or load a mission to inspect trace.</p></div>}
      </div>
    </div>
  </section>;
}
