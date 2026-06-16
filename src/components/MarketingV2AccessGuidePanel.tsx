import { Compass, ShieldCheck, Terminal, TriangleAlert } from 'lucide-react';
import {
  MARKETING_V2_ACCESS_CHECKS,
  MARKETING_V2_ACCESS_OPTIONS,
  type MarketingV2AccessOptionStatus,
} from '../data/marketingV2AccessGuide';

const statusStyles: Record<MarketingV2AccessOptionStatus, string> = {
  recommended: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  optional: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200',
  not_recommended: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
};

const statusLabels: Record<MarketingV2AccessOptionStatus, string> = {
  recommended: 'Khuyến nghị',
  optional: 'Tuỳ chọn',
  not_recommended: 'Không nên',
};

export default function MarketingV2AccessGuidePanel() {
  return (
    <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/80 p-5 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            Marketing V2 · Access Guide
          </p>
          <h3 className="mt-1 text-xl font-black text-white">Cách mở Marketing V2 trong app</h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
            Workspace V2 đã có đủ command center, copy lab, email sequence, PLG, rollout, QA và launch playbook.
            Bước còn lại là nối vào route đang có mà không phá App.tsx.
          </p>
        </div>
        <Compass className="h-8 w-8 text-cyan-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {MARKETING_V2_ACCESS_OPTIONS.map((option) => (
          <article key={option.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusStyles[option.status]}`}>
                  {statusLabels[option.status]}
                </span>
                <h4 className="mt-3 text-sm font-black leading-5 text-white">{option.title}</h4>
              </div>
              {option.status === 'not_recommended' ? (
                <TriangleAlert className="h-5 w-5 shrink-0 text-amber-300" />
              ) : (
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
              )}
            </div>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-400">{option.summary}</p>
            <div className="mt-4 space-y-2">
              {option.steps.map((step, index) => (
                <div key={step} className="flex gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-slate-300">
                    {index + 1}
                  </span>
                  <p className="text-xs font-semibold leading-5 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-[11px] font-semibold leading-5 text-slate-500">
              Rủi ro: {option.risk}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-4">
        <div className="flex items-center gap-2 text-cyan-200">
          <Terminal className="h-4 w-4" />
          <p className="text-xs font-black uppercase tracking-[0.18em]">Checks sau khi nối UI</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {MARKETING_V2_ACCESS_CHECKS.map((command) => (
            <code key={command} className="rounded-2xl border border-cyan-400/20 bg-slate-950 px-3 py-2 text-xs font-bold text-cyan-100">
              {command}
            </code>
          ))}
        </div>
      </div>
    </section>
  );
}
