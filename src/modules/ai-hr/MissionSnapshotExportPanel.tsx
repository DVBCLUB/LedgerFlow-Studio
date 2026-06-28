import React from 'react';
import { FileJson, FileText, Loader2, RefreshCw } from 'lucide-react';
import { exportMissionQueueSnapshot, listMissionExecutionQueues } from '../../services/aiWorkforceRuntimeClient';

const panelClass = 'rounded-3xl border border-indigo-500/20 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-black uppercase text-indigo-100 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50';
const inputClass = 'w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60';

export default function MissionSnapshotExportPanel() {
  const [loading, setLoading] = React.useState<'refresh' | 'json' | 'markdown' | null>(null);
  const [queue, setQueue] = React.useState<any>(null);
  const [snapshot, setSnapshot] = React.useState<any>(null);
  const [reviewer, setReviewer] = React.useState('Founder');
  const [decision, setDecision] = React.useState<'approved' | 'needs_changes' | 'blocked' | 'info'>('info');
  const [reviewSummary, setReviewSummary] = React.useState('Snapshot reviewed from Live Runtime Hub.');
  const [requestedAction, setRequestedAction] = React.useState('Confirm CI remains green before release handoff.');
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading('refresh');
    setError(null);
    try {
      const response = await listMissionExecutionQueues();
      setQueue(response.queues?.[0] || response.stats?.latestQueue || null);
    } catch (err: any) {
      setError(err?.message || 'Cannot load mission queue for snapshot export.');
    } finally {
      setLoading(null);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function preview(format: 'json' | 'markdown') {
    setLoading(format);
    setError(null);
    try {
      const response = await exportMissionQueueSnapshot({
        queueId: queue?.id,
        format,
        includeRawQueue: format === 'json',
        reviewNotes: reviewSummary.trim() ? [{ reviewer, decision, summary: reviewSummary, requestedAction }] : [],
      });
      setSnapshot(response.snapshot);
    } catch (err: any) {
      setError(err?.message || 'Cannot build mission snapshot export.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-black text-white">Mission Snapshot Export</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-300">
            Preview JSON snapshot hoặc Markdown handoff từ daemon route: queue, runbook, next safe action, owner handoff, rollback note, operator review notes, checklist, evidence artifacts và timeline.
          </p>
        </div>
        <button className={buttonClass} onClick={refresh} disabled={Boolean(loading)}>
          {loading === 'refresh' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh source
        </button>
      </div>

      {error && <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-100">{error}</p>}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300">Queue source</p>
          <p className="mt-2 truncate text-xs font-black text-white">{queue?.id || 'latest queue'}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{queue?.status || 'route fallback if queue id is empty'}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300">Snapshot file</p>
          <p className="mt-2 truncate text-xs font-black text-white">{snapshot?.filename || '—'}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{snapshot?.format || 'json / markdown'}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300">Checksum</p>
          <p className="mt-2 truncate text-xs font-black text-white">{snapshot?.checksum || '—'}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">SHA-256 content fingerprint</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300">Review status</p>
          <p className="mt-2 text-xl font-black text-white">{snapshot?.summary?.reviewStatus || '—'}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{snapshot?.summary?.reviewNotes ?? 0} review note(s)</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300">Operator review note</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <input className={inputClass} value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Reviewer" />
          <select className={inputClass} value={decision} onChange={(event) => setDecision(event.target.value as any)}>
            <option value="info">info</option>
            <option value="approved">approved</option>
            <option value="needs_changes">needs_changes</option>
            <option value="blocked">blocked</option>
          </select>
          <input className={`${inputClass} lg:col-span-2`} value={reviewSummary} onChange={(event) => setReviewSummary(event.target.value)} placeholder="Review summary" />
          <input className={`${inputClass} lg:col-span-4`} value={requestedAction} onChange={(event) => setRequestedAction(event.target.value)} placeholder="Requested action" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={buttonClass} onClick={() => preview('json')} disabled={Boolean(loading)}>
          {loading === 'json' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
          Preview JSON snapshot
        </button>
        <button className={buttonClass} onClick={() => preview('markdown')} disabled={Boolean(loading)}>
          {loading === 'markdown' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Preview Markdown handoff
        </button>
      </div>

      {snapshot?.summary && (
        <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-200">Next safe action</p>
          <p className="mt-2 text-xs font-bold leading-5 text-white">{snapshot.summary.nextSafeAction}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-200">Rollback note</p>
          <p className="mt-2 text-xs font-bold leading-5 text-white">{snapshot.summary.rollbackNote}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-200">Review release gate</p>
          <p className="mt-2 text-xs font-bold leading-5 text-white">{snapshot.summary.reviewStatus} · release ready: {String(snapshot.summary.releaseReady)}</p>
        </div>
      )}

      {snapshot?.content && (
        <pre className="mt-4 max-h-80 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-[11px] font-semibold leading-5 text-slate-300">
          {snapshot.content}
        </pre>
      )}
    </section>
  );
}
