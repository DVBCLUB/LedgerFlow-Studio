import React from 'react';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { buildMissionQueueReleaseGate, exportMissionQueueSnapshot, listMissionExecutionQueues, type MissionReleaseCiStatus } from '../../services/aiWorkforceRuntimeClient';

const panelClass = 'rounded-3xl border border-emerald-500/20 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50';
const inputClass = 'w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60';

export default function MissionReleaseGatePanel() {
  const [loading, setLoading] = React.useState<'refresh' | 'checksum' | 'gate' | null>(null);
  const [queue, setQueue] = React.useState<any>(null);
  const [gate, setGate] = React.useState<any>(null);
  const [ciStatus, setCiStatus] = React.useState<MissionReleaseCiStatus>('success');
  const [approvals, setApprovals] = React.useState(1);
  const [requiredApprovals, setRequiredApprovals] = React.useState(1);
  const [snapshotChecksum, setSnapshotChecksum] = React.useState('');
  const [releaseLabel, setReleaseLabel] = React.useState(true);
  const [rollbackConfirmed, setRollbackConfirmed] = React.useState(false);
  const [operatorConfirmed, setOperatorConfirmed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading('refresh');
    setError(null);
    try {
      const response = await listMissionExecutionQueues();
      setQueue(response.queues?.[0] || response.stats?.latestQueue || null);
    } catch (err: any) {
      setError(err?.message || 'Cannot load mission queue for release gate.');
    } finally {
      setLoading(null);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  async function loadChecksum() {
    if (!queue?.id) return setError('Create or refresh a mission queue before loading checksum.');
    setLoading('checksum');
    setError(null);
    try {
      const response = await exportMissionQueueSnapshot({ queueId: queue.id, format: 'markdown' });
      setSnapshotChecksum(response.snapshot?.checksum || '');
    } catch (err: any) {
      setError(err?.message || 'Cannot generate snapshot checksum.');
    } finally {
      setLoading(null);
    }
  }

  async function runGate() {
    if (!queue?.id) return setError('Create or refresh a mission queue before running release gate.');
    setLoading('gate');
    setError(null);
    try {
      const response = await buildMissionQueueReleaseGate({
        queueId: queue.id,
        ciStatus,
        approvals,
        requiredApprovals,
        snapshotChecksum,
        releaseLabel,
        rollbackConfirmed,
        operatorConfirmed,
        notes: ['Release Gate UI Panel'],
      });
      setGate(response.gate);
    } catch (err: any) {
      setError(err?.message || 'Cannot build release gate.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-black text-white">Mission Release Gate</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-300">
            Nhập CI/evidence, tạo release gate từ persisted review notes và snapshot checksum để xem decision, score, missing evidence và final action.
          </p>
        </div>
        <button className={buttonClass} onClick={refresh} disabled={Boolean(loading)}>
          {loading === 'refresh' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh queue
        </button>
      </div>

      {error && <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-100">{error}</p>}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Queue</p><p className="mt-2 truncate text-xs font-black text-white">{queue?.id || 'No queue yet'}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Decision</p><p className="mt-2 text-xl font-black text-white">{gate?.decision || '—'}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Score</p><p className="mt-2 text-xl font-black text-white">{gate?.score ?? '—'}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Ready</p><p className="mt-2 text-xl font-black text-white">{String(Boolean(gate?.releaseReady))}</p></div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <select className={inputClass} value={ciStatus} onChange={(event) => setCiStatus(event.target.value as MissionReleaseCiStatus)}>
          <option value="success">ci success</option><option value="pending">ci pending</option><option value="failed">ci failed</option><option value="unknown">ci unknown</option>
        </select>
        <input className={inputClass} type="number" min={0} value={approvals} onChange={(event) => setApprovals(Number(event.target.value || 0))} placeholder="Approvals" />
        <input className={inputClass} type="number" min={1} value={requiredApprovals} onChange={(event) => setRequiredApprovals(Number(event.target.value || 1))} placeholder="Required approvals" />
        <input className={inputClass} value={snapshotChecksum} onChange={(event) => setSnapshotChecksum(event.target.value)} placeholder="Snapshot checksum" />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-200">
        <label><input className="mr-2" type="checkbox" checked={releaseLabel} onChange={(event) => setReleaseLabel(event.target.checked)} />Release label</label>
        <label><input className="mr-2" type="checkbox" checked={rollbackConfirmed} onChange={(event) => setRollbackConfirmed(event.target.checked)} />Rollback confirmed</label>
        <label><input className="mr-2" type="checkbox" checked={operatorConfirmed} onChange={(event) => setOperatorConfirmed(event.target.checked)} />Operator confirmed</label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={buttonClass} onClick={loadChecksum} disabled={Boolean(loading) || !queue?.id}>{loading === 'checksum' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Load snapshot checksum</button>
        <button className={buttonClass} onClick={runGate} disabled={Boolean(loading) || !queue?.id}><ShieldCheck className="h-4 w-4" />Run release gate</button>
      </div>

      {gate && <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold leading-5 text-emerald-50">
        <p>Final action: {gate.finalAction}</p>
        <p className="mt-2">Missing evidence: {gate.missingEvidence?.length ? gate.missingEvidence.join('; ') : 'none'}</p>
        <p className="mt-2">Gate checksum: {gate.checksum}</p>
      </div>}
    </section>
  );
}
