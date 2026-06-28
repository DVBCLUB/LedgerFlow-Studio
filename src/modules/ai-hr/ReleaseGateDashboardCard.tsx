import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ReleaseGateDashboardCard({ releaseGate }: { releaseGate?: any }) {
  if (!releaseGate) return null;
  const ready = releaseGate.latestReleaseReady === true;
  const timeline = Array.isArray(releaseGate.timeline) ? releaseGate.timeline : [];
  const trend = releaseGate.trendAnalytics || {};
  return (
    <div className="mt-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-black text-white">Release Gate Dashboard</h3>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">Latest mission release gate record, audit event, metric evidence, historical timeline và trend analytics surfaced từ Runtime Hub.</p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${ready ? 'border-emerald-400/40 text-emerald-100' : 'border-amber-400/40 text-amber-100'}`}>{releaseGate.latestDecision || 'no gate'}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Score</p><p className="mt-2 text-xl font-black text-white">{releaseGate.latestScore ?? '—'}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Ready</p><p className="mt-2 text-xl font-black text-white">{String(Boolean(releaseGate.latestReleaseReady))}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Records</p><p className="mt-2 text-xl font-black text-white">{releaseGate.totalRecords ?? 0}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Metric</p><p className="mt-2 text-xl font-black text-white">{releaseGate.latestMetric?.status || '—'}</p></div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Release Gate Trend Analytics</p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Ready rate</p><p className="mt-2 text-lg font-black text-white">{Math.round((trend.readyRate || 0) * 100)}%</p></div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Avg score</p><p className="mt-2 text-lg font-black text-white">{trend.averageScore ?? '—'}</p></div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Score delta</p><p className="mt-2 text-lg font-black text-white">{trend.scoreDelta ?? 0}</p></div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Trend</p><p className="mt-2 text-lg font-black text-white">{trend.trendDirection || 'flat'}</p></div>
        </div>
        <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-400">Decision breakdown: ready {trend.decisionBreakdown?.ready || 0}, hold {trend.decisionBreakdown?.hold || 0}, not_ready {trend.decisionBreakdown?.not_ready || 0}.</p>
      </div>
      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold leading-5 text-slate-300">
        <p><span className="font-black text-white">Final action:</span> {releaseGate.latestFinalAction || 'No release gate recorded yet.'}</p>
        <p className="mt-2"><span className="font-black text-white">Checksum:</span> {releaseGate.latestChecksum || '—'}</p>
        <p className="mt-2"><span className="font-black text-white">Missing evidence:</span> {releaseGate.latestMissingEvidence?.length ? releaseGate.latestMissingEvidence.join('; ') : 'none'}</p>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Release Gate Historical Timeline</p>
        <div className="mt-3 space-y-2">
          {timeline.length ? timeline.slice(0, 6).map((item: any) => (
            <div key={item.id || item.checksum} className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black text-white">{item.decision || 'unknown'} · score {item.score ?? '—'}</p>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black uppercase text-slate-300">{item.releaseReady ? 'ready' : 'hold'}</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">{item.createdAt || '—'} · {item.queueId || 'no queue'}</p>
              <p className="mt-1 truncate text-[11px] font-semibold text-emerald-200">checksum: {item.checksum || '—'}</p>
              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-400">{item.finalAction || 'No final action captured.'}</p>
            </div>
          )) : (
            <p className="text-xs font-semibold text-slate-500">No release gate historical timeline yet. Run a release gate to populate this panel.</p>
          )}
        </div>
      </div>
    </div>
  );
}
