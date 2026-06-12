import { useEffect, useState } from 'react';
import type { ReviewMode } from '../../../types/agentOps';

const KEY = 'ledgerflow_review_mode_v1';
const fastMode: ReviewMode = { mode: 'Fast', singleReviewDeskApproval: true, note: 'Một lớp review chính, các màn còn lại hỗ trợ scan và audit.' };
const strictMode: ReviewMode = { mode: 'Strict', singleReviewDeskApproval: false, note: 'Nhiều lớp review hơn trước khi thực hiện bước rủi ro.' };

function readMode(): ReviewMode {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fastMode, ...JSON.parse(raw) } as ReviewMode : fastMode;
  } catch {
    return fastMode;
  }
}

export default function ReviewModeTab() {
  const [mode, setMode] = useState<ReviewMode>(() => readMode());
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(mode));
    window.dispatchEvent(new CustomEvent('ledgerflow-review-mode-updated', { detail: mode }));
  }, [mode]);
  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Convenience profile</p><h3 className="mt-1 text-xl font-black text-white">Review Mode</h3><p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Giữ nguyên key ledgerflow_review_mode_v1.</p></div><span className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-100">{mode.mode}</span></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2"><button onClick={() => setMode(fastMode)} className={`rounded-2xl border p-4 text-left ${mode.mode === 'Fast' ? 'border-emerald-300 bg-emerald-400/15' : 'border-slate-700 bg-slate-950/60 hover:border-emerald-300'}`}><p className="text-sm font-black text-white">Fast Secure</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Ít bước hơn, vẫn giữ review chính.</p></button><button onClick={() => setMode(strictMode)} className={`rounded-2xl border p-4 text-left ${mode.mode === 'Strict' ? 'border-amber-300 bg-amber-400/15' : 'border-slate-700 bg-slate-950/60 hover:border-amber-300'}`}><p className="text-sm font-black text-white">Strict Review</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Nhiều cổng kiểm hơn, chậm hơn nhưng kỹ hơn.</p></button></div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current rule</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{mode.note}</p></div>
    </section>
  );
}
