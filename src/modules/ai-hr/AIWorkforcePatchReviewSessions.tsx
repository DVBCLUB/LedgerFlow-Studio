import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, Code2, FileDiff, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type PatchArtifact = { id: string; type: string; summary: string; createdAt?: string; path?: string; metadata?: Record<string, unknown> };
type PatchStep = { id: string; toolId?: string; title?: string; status?: string; risk?: string; requiresApproval?: boolean; approvalFingerprint?: string; observation?: string };
type PatchRun = { id: string; goal: string; status: string; createdAt: string; updatedAt?: string; steps?: PatchStep[]; artifacts?: PatchArtifact[] };
type PatchSession = { run: PatchRun; step?: PatchStep; artifact?: PatchArtifact };

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any)[key])) return (value as any)[key] as T[];
  return [];
}

function compactDate(value?: string) {
  if (!value) return 'unknown time';
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase();
  if (value.includes('completed') || value.includes('approved')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (value.includes('waiting') || value.includes('planned') || value.includes('running')) return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (value.includes('failed') || value.includes('stopped') || value.includes('blocked')) return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

export default function AIWorkforcePatchReviewSessions() {
  const [runs, setRuns] = useState<PatchRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setBusy(true); setError('');
    try {
      const result = await daemonFetch<unknown>('/api/agent-runtime/runs?limit=40', undefined, 10000);
      setRuns(readArray<PatchRun>(result, 'runs'));
    } catch (err: any) {
      setError(err?.message || 'Cannot load patch review sessions.');
    } finally { setBusy(false); }
  };

  useEffect(() => { void load(); }, []);

  const sessions = useMemo<PatchSession[]>(() => {
    return runs.flatMap((run) => {
      const patchSteps = (run.steps || []).filter((step) => step.toolId === 'draft_patch' || step.title?.toLowerCase().includes('patch'));
      const patchArtifacts = (run.artifacts || []).filter((artifact) => artifact.type?.toLowerCase().includes('patch') || artifact.summary?.toLowerCase().includes('patch'));
      const pairs: PatchSession[] = [];
      const max = Math.max(patchSteps.length, patchArtifacts.length);
      for (let index = 0; index < max; index += 1) pairs.push({ run, step: patchSteps[index], artifact: patchArtifacts[index] });
      return pairs;
    });
  }, [runs]);

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><FileDiff className="mr-2 inline h-4 w-4" />Reviewed Patch Sessions</p>
        <h3 className="mt-2 text-lg font-black text-white">Patch artifacts waiting for founder review</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Tách riêng các mission có `draft_patch` để founder kiểm tra diff/manifest trước khi áp dụng thật.</p>
      </div>
      <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
    </div>

    {error && <p className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}

    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Archive className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-slate-500">Patch sessions</p><p className="mt-1 text-2xl font-black text-white">{sessions.length}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><ShieldCheck className="mb-2 h-4 w-4 text-amber-300" /><p className="text-[10px] font-black uppercase text-slate-500">Need review</p><p className="mt-1 text-2xl font-black text-white">{sessions.filter((session) => session.step?.requiresApproval || String(session.run.status).includes('waiting')).length}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Code2 className="mb-2 h-4 w-4 text-emerald-300" /><p className="text-[10px] font-black uppercase text-slate-500">Patch artifacts</p><p className="mt-1 text-2xl font-black text-white">{sessions.filter((session) => session.artifact).length}</p></div>
    </div>

    <div className="space-y-3">
      {sessions.map((session, index) => <div key={`${session.run.id}-${session.step?.id || session.artifact?.id || index}`} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(session.step?.status || session.run.status)}`}>{session.step?.status || session.run.status}</span>
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-violet-200">draft_patch</span>
              {session.step?.requiresApproval && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-amber-200">approval gated</span>}
            </div>
            <p className="mt-3 text-sm font-black text-white">{session.run.goal}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Run {session.run.id} • {compactDate(session.run.updatedAt || session.run.createdAt)}</p>
          </div>
          <Wrench className="h-5 w-5 text-cyan-300" />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Review instruction</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{session.step?.title || 'Patch step detected. Inspect artifact summary and approval fingerprint before applying any repository write.'}</p>
            {session.step?.approvalFingerprint && <p className="mt-2 break-all rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] font-bold text-amber-100">fingerprint: {session.step.approvalFingerprint}</p>}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Patch artifact</p>
            <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-300">{session.artifact?.summary || session.step?.observation || 'No patch artifact summary returned yet.'}</p>
            {session.artifact?.id && <p className="mt-2 text-[10px] font-bold text-slate-500">artifact: {session.artifact.id}</p>}
          </div>
        </div>
      </div>)}
      {sessions.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-bold text-slate-500">No draft_patch sessions found yet. Create a mission that requests a patch plan or code change review.</p>}
    </div>
  </section>;
}
