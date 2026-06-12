import { useEffect, useState } from 'react';

type ReviewMode = {
  mode: 'Fast' | 'Strict';
  singleReviewDeskApproval: boolean;
  note: string;
};

const KEY = 'ledgerflow_review_mode_v1';

const fastMode: ReviewMode = {
  mode: 'Fast',
  singleReviewDeskApproval: true,
  note: 'AI code flow keeps one founder approval at Review Desk. Other centers are scan, preview, audit, and recovery helpers.'
};

const strictMode: ReviewMode = {
  mode: 'Strict',
  singleReviewDeskApproval: false,
  note: 'AI code flow may require extra Approval Gate steps before Review Desk.'
};

function readMode(): ReviewMode {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fastMode, ...JSON.parse(raw) } as ReviewMode : fastMode;
  } catch {
    return fastMode;
  }
}

function saveMode(mode: ReviewMode) {
  localStorage.setItem(KEY, JSON.stringify(mode));
  window.dispatchEvent(new CustomEvent('ledgerflow-review-mode-updated', { detail: mode }));
}

export default function FastReviewModePanel() {
  const [mode, setMode] = useState<ReviewMode>(() => readMode());

  useEffect(() => {
    saveMode(mode);
  }, [mode]);

  const applyFast = () => setMode(fastMode);
  const applyStrict = () => setMode(strictMode);

  return (
    <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Convenience profile</p>
          <h4 className="mt-1 text-lg font-black text-white">AI tự code/push qua 1 lớp approve</h4>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Chế độ khuyến nghị: AI được tạo Draft PR sau một lần approve tại Review Desk. Các màn còn lại hỗ trợ scan, preview, audit, rollback.</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${mode.mode === 'Fast' ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-amber-300 bg-amber-400/10 text-amber-100'}`}>{mode.mode}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <button onClick={applyFast} className={`rounded-2xl border p-4 text-left ${mode.mode === 'Fast' ? 'border-emerald-300 bg-emerald-400/15' : 'border-slate-700 bg-slate-950/60 hover:border-emerald-300'}`}>
          <p className="text-sm font-black text-white">Fast Secure</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Một approve ở Review Desk. Phù hợp nhu cầu AI tự code và tạo Draft PR nhanh.</p>
        </button>
        <button onClick={applyStrict} className={`rounded-2xl border p-4 text-left ${mode.mode === 'Strict' ? 'border-amber-300 bg-amber-400/15' : 'border-slate-700 bg-slate-950/60 hover:border-amber-300'}`}>
          <p className="text-sm font-black text-white">Strict Review</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Nhiều cổng duyệt hơn trước Review Desk. Chậm hơn nhưng kiểm kỹ hơn.</p>
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current rule</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{mode.note}</p>
      </div>
    </div>
  );
}
