import type { ReviewMode } from '../../../types/agentOps';

const REVIEW_KEY = 'ledgerflow_review_mode_v1';

function readMode(): ReviewMode {
  try {
    const raw = localStorage.getItem(REVIEW_KEY);
    return raw ? JSON.parse(raw) as ReviewMode : { mode: 'Strict', singleReviewDeskApproval: false, note: 'Default strict mode.' };
  } catch {
    return { mode: 'Strict', singleReviewDeskApproval: false, note: 'Default strict mode.' };
  }
}

export default function ReviewModeTab() {
  const mode = readMode();
  return (
    <section className="rounded-3xl border border-amber-400/35 bg-amber-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Review mode</p>
      <h3 className="mt-1 text-xl font-black text-white">Review Mode</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Tab này đọc cùng key localStorage cũ để giữ cấu hình người dùng.</p>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-sm font-black text-white">Mode: {mode.mode}</p>
        <p className="mt-2 text-xs font-semibold text-slate-300">Single gate: {mode.singleReviewDeskApproval ? 'On' : 'Off'}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{mode.note}</p>
      </div>
    </section>
  );
}
