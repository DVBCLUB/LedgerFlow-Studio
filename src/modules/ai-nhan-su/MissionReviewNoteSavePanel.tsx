import React from 'react';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { listMissionExecutionQueues, listMissionQueueReviewNotes, saveMissionQueueReviewNote, type MissionReviewDecision } from '../../services/aiWorkforceRuntimeClient';

const panelClass = 'rounded-3xl border border-violet-500/20 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-black uppercase text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50';
const inputClass = 'w-full rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-bold text-text-primary outline-none transition placeholder:text-slate-600 focus:border-violet-500/60';

export default function MissionReviewNoteSavePanel() {
  const [loading, setLoading] = React.useState<'refresh' | 'save' | null>(null);
  const [queue, setQueue] = React.useState<any>(null);
  const [reviewState, setReviewState] = React.useState<any>(null);
  const [reviewer, setReviewer] = React.useState('Founder');
  const [decision, setDecision] = React.useState<MissionReviewDecision>('info');
  const [summary, setSummary] = React.useState('Snapshot reviewed from Live Runtime Hub.');
  const [requestedAction, setRequestedAction] = React.useState('Confirm CI remains green before release handoff.');
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading('refresh');
    setError(null);
    try {
      const queueResponse = await listMissionExecutionQueues();
      const latestQueue = queueResponse.queues?.[0] || queueResponse.stats?.latestQueue || null;
      setQueue(latestQueue);
      setReviewState(latestQueue?.id ? await listMissionQueueReviewNotes(latestQueue.id) : null);
    } catch (err: any) {
      setError(err?.message || 'Cannot load persisted review notes.');
    } finally {
      setLoading(null);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  async function saveNote() {
    if (!queue?.id) {
      setError('Create or refresh a mission queue before saving a review note.');
      return;
    }
    setLoading('save');
    setError(null);
    try {
      setReviewState(await saveMissionQueueReviewNote({ queueId: queue.id, reviewer, decision, summary, requestedAction }));
    } catch (err: any) {
      setError(err?.message || 'Cannot save persisted review note.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-black text-text-primary">Persisted Review Notes</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-text-secondary">
            Save review note vào local queue store để snapshot export sau này tự kèm reviewer decision, release gate và checksum dossier.
          </p>
        </div>
        <button className={buttonClass} onClick={refresh} disabled={Boolean(loading)}>
          {loading === 'refresh' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh notes
        </button>
      </div>

      {error && <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-100">{error}</p>}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">Queue</p><p className="mt-2 truncate text-xs font-black text-text-primary">{queue?.id || 'No queue yet'}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">Saved notes</p><p className="mt-2 text-2xl font-black text-text-primary">{reviewState?.notes?.length ?? 0}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">Review status</p><p className="mt-2 truncate text-xs font-black text-text-primary">{reviewState?.dossier?.status || 'not reviewed'}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">Release ready</p><p className="mt-2 text-xl font-black text-text-primary">{String(Boolean(reviewState?.dossier?.releaseReady))}</p></div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <input className={inputClass} value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Reviewer" />
        <select className={inputClass} value={decision} onChange={(event) => setDecision(event.target.value as MissionReviewDecision)}>
          <option value="info">info</option>
          <option value="approved">approved</option>
          <option value="needs_changes">needs_changes</option>
          <option value="blocked">blocked</option>
        </select>
        <input className={`${inputClass} lg:col-span-2`} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Review summary" />
        <input className={`${inputClass} lg:col-span-4`} value={requestedAction} onChange={(event) => setRequestedAction(event.target.value)} placeholder="Requested action" />
      </div>

      <button className={`${buttonClass} mt-4`} onClick={saveNote} disabled={Boolean(loading) || !queue?.id}>
        {loading === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save review note
      </button>
    </section>
  );
}
