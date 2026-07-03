import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Code2,
  FileDiff,
  RefreshCw,
  ShieldCheck,
  Wrench,
  X,
  Play,
  RotateCcw,
  Check,
  FileCode,
  Lock
} from 'lucide-react';
import { daemonFetch, readFile } from '../../utils/assistantApi';

type PatchArtifact = { id: string; type: string; summary: string; createdAt?: string; path?: string; metadata?: Record<string, unknown> };
type PatchStep = { id: string; toolId?: string; title?: string; status?: string; risk?: string; requiresApproval?: boolean; approvalFingerprint?: string; observation?: string };
type PatchRun = { id: string; goal: string; status: string; createdAt: string; updatedAt?: string; steps?: PatchStep[]; artifacts?: PatchArtifact[] };
type BackendPatchReviewSession = { id: string; runId: string; stepId: string; artifactId?: string; status: string; goal: string; summary: string; manifestPath?: string; targetFiles?: string[]; approvalFingerprint?: string; rollbackHint?: string; createdAt: string; updatedAt: string };
type PatchSessionView = { id: string; runId: string; stepId?: string; status: string; goal: string; updatedAt?: string; summary: string; artifactId?: string; manifestPath?: string; targetFiles?: string[]; approvalFingerprint?: string; rollbackHint?: string; source: 'backend' | 'runtime'; run?: PatchRun; step?: PatchStep; artifact?: PatchArtifact };

// Phrase constants
const PATCH_APPLY_PHRASE = 'APPLY REVIEWED PATCH';
const PATCH_ROLLBACK_PHRASE = 'ROLLBACK REVIEWED PATCH';

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const array = record[key];
    if (Array.isArray(array)) return array as T[];
  }
  return [];
}

function compactDate(value?: string) {
  if (!value) return 'unknown time';
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase();
  if (value.includes('completed') || value.includes('approved') || value.includes('applied')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (value.includes('waiting') || value.includes('planned') || value.includes('running') || value.includes('draft')) return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (value.includes('failed') || value.includes('stopped') || value.includes('blocked') || value.includes('rejected')) return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

function backendSessionToView(session: BackendPatchReviewSession): PatchSessionView {
  return {
    id: session.id,
    runId: session.runId,
    stepId: session.stepId,
    status: session.status,
    goal: session.goal,
    updatedAt: session.updatedAt,
    summary: session.summary,
    artifactId: session.artifactId,
    manifestPath: session.manifestPath,
    targetFiles: session.targetFiles,
    approvalFingerprint: session.approvalFingerprint,
    rollbackHint: session.rollbackHint,
    source: 'backend',
  };
}

function runtimeSessionsFromRuns(runs: PatchRun[]): PatchSessionView[] {
  return runs.flatMap((run) => {
    const patchSteps = (run.steps || []).filter((step) => step.toolId === 'draft_patch' || step.title?.toLowerCase().includes('patch'));
    const patchArtifacts = (run.artifacts || []).filter((artifact) => artifact.type?.toLowerCase().includes('patch') || artifact.summary?.toLowerCase().includes('patch'));
    const pairs: PatchSessionView[] = [];
    const max = Math.max(patchSteps.length, patchArtifacts.length);
    for (let index = 0; index < max; index += 1) {
      const step = patchSteps[index];
      const artifact = patchArtifacts[index];
      pairs.push({
        id: `${run.id}-${step?.id || artifact?.id || index}`,
        runId: run.id,
        stepId: step?.id,
        status: step?.status || run.status,
        goal: run.goal,
        updatedAt: run.updatedAt || run.createdAt,
        summary: artifact?.summary || step?.observation || 'Patch step detected. Backend patch-review session has not been created yet.',
        artifactId: artifact?.id,
        approvalFingerprint: step?.approvalFingerprint,
        source: 'runtime',
        run,
        step,
        artifact,
      });
    }
    return pairs;
  });
}

interface PatchFileDiff {
  path: string;
  originalContent: string;
  newContent: string;
}

export default function AIWorkforcePatchReviewSessions() {
  const [runs, setRuns] = useState<PatchRun[]>([]);
  const [backendSessions, setBackendSessions] = useState<BackendPatchReviewSession[]>([]);
  const [backendReady, setBackendReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Diff drawer states
  const [activeSession, setActiveSession] = useState<PatchSessionView | null>(null);
  const [diffFiles, setDiffFiles] = useState<PatchFileDiff[]>([]);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const load = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const [sessionsResult, runsResult] = await Promise.allSettled([
        daemonFetch<{ success: boolean; sessions: BackendPatchReviewSession[] }>('/api/patch-review-sessions?limit=80', undefined, 10000),
        daemonFetch<unknown>('/api/agent-runtime/runs?limit=40', undefined, 10000),
      ]);
      if (sessionsResult.status === 'fulfilled' && sessionsResult.value?.success) {
        setBackendReady(true);
        setBackendSessions(sessionsResult.value.sessions || []);
      } else {
        setBackendReady(false);
        setBackendSessions([]);
      }
      if (runsResult.status === 'fulfilled') {
        setRuns(readArray<PatchRun>(runsResult.value, 'runs'));
      } else {
        setRuns([]);
        throw runsResult.reason;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot load patch review sessions.';
      setError(msg);
    } finally { setBusy(false); }
  };

  const createFromRun = async (runId: string) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await daemonFetch(`/api/patch-review-sessions/from-run/${encodeURIComponent(runId)}`, { method: 'POST' }, 12000);
      setMessage(`Đã tạo patch-review session cho Run ${runId}.`);
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot create patch review session from run.';
      setError(msg);
    } finally { setBusy(false); }
  };

  const handleApplyPatch = async (sessionId: string) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<{ success: boolean; result?: any }>(`/api/patch-review-sessions/${encodeURIComponent(sessionId)}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: PATCH_APPLY_PHRASE })
      }, 30000);
      if (res.success) {
        setMessage(`Đã áp dụng (apply) patch session ${sessionId} thành công!`);
        setActiveSession(null);
        await load();
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể apply patch session này.');
    } finally { setBusy(false); }
  };

  const handleRollbackPatch = async (sessionId: string) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<{ success: boolean; result?: any }>(`/api/patch-review-sessions/${encodeURIComponent(sessionId)}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: PATCH_ROLLBACK_PHRASE })
      }, 30000);
      if (res.success) {
        setMessage(`Đã khôi phục (rollback) patch session ${sessionId} thành công!`);
        setActiveSession(null);
        await load();
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể rollback patch session này.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenDiff = async (session: PatchSessionView) => {
    if (!session.manifestPath) {
      setError('Session này không có patch manifest để so sánh.');
      return;
    }
    setActiveSession(session);
    setLoadingDiff(true);
    setDiffFiles([]);
    try {
      // 1. Đọc manifest file chứa thông tin code mới
      const manifestCtx = await readFile(session.manifestPath);
      const manifest = JSON.parse(manifestCtx.content) as { files?: Array<{ path: string; newContent: string }> };
      const files = manifest.files || [];
      
      // 2. Với mỗi file đích, đọc nội dung hiện tại để tạo diff
      const diffResults: PatchFileDiff[] = [];
      for (const f of files) {
        let originalContent = '';
        try {
          const orig = await readFile(f.path);
          originalContent = orig.content;
        } catch {
          // File có thể mới được tạo nên chưa có nội dung cũ
          originalContent = '// File mới (chưa tồn tại trong codebase)';
        }
        diffResults.push({
          path: f.path,
          originalContent,
          newContent: f.newContent
        });
      }
      setDiffFiles(diffResults);
    } catch (err: any) {
      setError(`Không thể tải chi tiết diff: ${err.message}`);
    } finally {
      setLoadingDiff(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const runtimeViews = useMemo(() => runtimeSessionsFromRuns(runs), [runs]);
  const sessions = useMemo<PatchSessionView[]>(() => {
    const backendViews = backendSessions.map(backendSessionToView);
    const backendKeys = new Set(backendViews.map((session) => `${session.runId}:${session.stepId || ''}`));
    const missingRuntimeViews = runtimeViews.filter((session) => !backendKeys.has(`${session.runId}:${session.stepId || ''}`));
    return [...backendViews, ...missingRuntimeViews];
  }, [backendSessions, runtimeViews]);

  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><FileDiff className="mr-2 inline h-4 w-4" />Reviewed Patch Sessions</p>
          <h3 className="mt-2 text-lg font-black text-white">Lưu trữ & Phê duyệt các bản cập nhật Code ngầm</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Mọi hành động sửa đổi file của Agent đều tạo ra session nháp để Founder duyệt trước khi ghi đè thực tế.</p>
        </div>
        <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60 transition-all"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
      </div>

      {!backendReady && <p className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-5 text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />Backend patch-review routes chưa sẵn sàng. Chạy local: <code>node scripts/patch-ai-workforce-local.mjs</code></p>}
      {error && <p className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}
      {message && <p className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-100">{message}</p>}

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Archive className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-slate-500">Patch sessions</p><p className="mt-1 text-2xl font-black text-white">{sessions.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><ShieldCheck className="mb-2 h-4 w-4 text-amber-300" /><p className="text-[10px] font-black uppercase text-slate-500">Need review</p><p className="mt-1 text-2xl font-black text-white">{sessions.filter((session) => String(session.status).includes('waiting') || String(session.status).includes('draft')).length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Code2 className="mb-2 h-4 w-4 text-emerald-300" /><p className="text-[10px] font-black uppercase text-slate-500">Backend sessions</p><p className="mt-1 text-2xl font-black text-white">{backendSessions.length}</p></div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(session.status)}`}>{session.status}</span>
                  <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-violet-200">draft_patch</span>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">{session.source}</span>
                </div>
                <p className="mt-3 text-sm font-black text-white">{session.goal}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">Run {session.runId} {session.stepId ? `• Step ${session.stepId}` : ''} • {compactDate(session.updatedAt)}</p>
              </div>
              <div className="flex gap-2">
                {session.manifestPath && (
                  <button
                    onClick={() => void handleOpenDiff(session)}
                    className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-black text-cyan-200 hover:bg-cyan-500/25 transition-all"
                  >
                    <FileDiff className="h-3.5 w-3.5" /> Diff Preview
                  </button>
                )}
                <Wrench className="h-5 w-5 text-cyan-300 mt-1.5" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Review instruction</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{session.rollbackHint || 'Inspect patch manifest and approval fingerprint before applying any repository write.'}</p>
                {session.approvalFingerprint && <p className="mt-2 break-all rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] font-bold text-amber-100">fingerprint: {session.approvalFingerprint}</p>}
                {session.source === 'runtime' && backendReady && <button onClick={() => void createFromRun(session.runId)} disabled={busy} className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[11px] font-black text-cyan-100 disabled:opacity-60">Create backend session from run</button>}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Patch artifact</p>
                <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-300">{session.summary || 'No patch artifact summary returned yet.'}</p>
                {session.artifactId && <p className="mt-2 text-[10px] font-bold text-slate-500">artifact: {session.artifactId}</p>}
                {session.manifestPath && <p className="mt-1 text-[10px] font-bold text-slate-500">manifest: {session.manifestPath}</p>}
                {session.targetFiles && session.targetFiles.length > 0 && <p className="mt-2 text-[10px] font-bold text-slate-500">targets: {session.targetFiles.join(', ')}</p>}
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-bold text-slate-500">No draft_patch sessions found yet. Create a mission that requests a patch plan or code change review.</p>}
      </div>

      {/* Diff Preview Drawer (Modal) */}
      {activeSession && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden h-[85vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileDiff className="h-5 w-5 text-cyan-400 animate-pulse" />
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Patch Diff Preview & Approval Panel</h2>
                  <p className="text-[10px] font-bold text-slate-500">Session ID: {activeSession.id} • Run {activeSession.runId}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSession(null)}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {loadingDiff ? (
                <div className="h-48 flex flex-col justify-center items-center gap-3">
                  <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                  <p className="text-xs font-semibold text-slate-500">Đang đọc manifest và giải quyết diff của các file nguồn...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {diffFiles.map((df, i) => (
                    <div key={i} className="rounded-2xl border border-slate-850 bg-slate-950/40 overflow-hidden">
                      <div className="px-4 py-2 border-b border-slate-850 bg-slate-950 flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-cyan-300" />
                        <span className="text-xs font-bold text-slate-300">{df.path}</span>
                      </div>
                      
                      {/* Side-by-side or stacked simple representation */}
                      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-850">
                        <div className="p-4">
                          <p className="text-[10px] font-black uppercase text-rose-400 mb-2">Original Content</p>
                          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-72 overflow-y-auto p-2 bg-slate-950/60 rounded text-rose-200/70 leading-5">
                            {df.originalContent}
                          </pre>
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-black uppercase text-emerald-400 mb-2">Suggested Content (New)</p>
                          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-72 overflow-y-auto p-2 bg-slate-950/60 rounded text-emerald-200 leading-5">
                            {df.newContent}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2">
                <span className="text-xs font-bold text-slate-400">Trạng thái:</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${statusClass(activeSession.status)}`}>
                  {activeSession.status}
                </span>
              </div>
              <div className="flex gap-2.5">
                {activeSession.status !== 'applied' && (
                  <button
                    onClick={() => void handleApplyPatch(activeSession.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-500/20 transition-all"
                  >
                    <Check className="h-4 w-4" /> Phê duyệt & Apply Code
                  </button>
                )}
                {activeSession.status === 'applied' && (
                  <button
                    onClick={() => void handleRollbackPatch(activeSession.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-2 text-xs font-black text-rose-200 hover:bg-rose-900/35 transition-all"
                  >
                    <RotateCcw className="h-4 w-4" /> Rollback Patch
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
