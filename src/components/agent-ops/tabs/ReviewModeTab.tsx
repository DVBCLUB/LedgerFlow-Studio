import { useState } from 'react';
import type { ReviewMode } from '../../../types/agentOps';
import { useFastReviewRouting } from '../useFastReviewRouting';

const REVIEW_KEY = 'ledgerflow_review_mode_v1';

const defaultMode: ReviewMode = {
  mode: 'Strict',
  singleReviewDeskApproval: false,
  note: 'Default strict mode.'
};

function readMode(): ReviewMode {
  try {
    const raw = localStorage.getItem(REVIEW_KEY);
    return raw ? { ...defaultMode, ...JSON.parse(raw) as Partial<ReviewMode> } : defaultMode;
  } catch {
    return defaultMode;
  }
}

function writeMode(next: ReviewMode) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(next));
}

export default function ReviewModeTab() {
  useFastReviewRouting();
  const [mode, setMode] = useState<ReviewMode>(() => readMode());

  const updateMode = (next: ReviewMode) => {
    setMode(next);
    writeMode(next);
  };

  const setReviewMode = (nextMode: ReviewMode['mode']) => {
    updateMode({
      ...mode,
      mode: nextMode,
      note: nextMode === 'Fast' || nextMode === 'fast_secure'
        ? 'Fast review mode enabled. Keep approval gates visible for risky actions.'
        : 'Strict review mode enabled. Approval gates remain required before risky actions.'
    });
  };

  return (
    <section className="rounded-3xl border border-amber-400/35 bg-amber-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Review mode</p>
      <h3 className="mt-1 text-xl font-black text-white">Review Mode</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Tab này dùng lại key localStorage cũ và hook routing cũ để giữ cấu hình, thao tác Review Mode và luồng sandbox patch sau khi gom vào AgentOpsHub.</p>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-sm font-black text-white">Mode: {mode.mode}</p>
        <p className="mt-2 text-xs font-semibold text-slate-300">Single gate: {mode.singleReviewDeskApproval ? 'On' : 'Off'}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{mode.note}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setReviewMode('Strict')} className="rounded-full border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-200 hover:border-amber-300">Strict</button>
          <button onClick={() => setReviewMode('Fast')} className="rounded-full border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-200 hover:border-amber-300">Fast</button>
          <button onClick={() => updateMode({ ...mode, singleReviewDeskApproval: !mode.singleReviewDeskApproval })} className="rounded-full border border-amber-400/50 px-3 py-2 text-[11px] font-black text-amber-200 hover:bg-amber-400/10">
            Toggle single gate
          </button>
        </div>
      </div>
    </section>
  );
}
