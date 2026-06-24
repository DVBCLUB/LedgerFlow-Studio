import { CheckCircle2, ClipboardList, Rocket, ShieldCheck } from 'lucide-react';
import {
  MARKETING_V2_LAUNCH_CHECKS,
  MARKETING_V2_LAUNCH_PLAYBOOK,
  type MarketingV2LaunchStage,
} from '../../data/marketingV2LaunchPlaybook';

const STAGE_LABELS: Record<MarketingV2LaunchStage, string> = {
  setup: 'Setup',
  activate: 'Activate',
  convert: 'Convert',
  retain: 'Retain',
};

export default function MarketingV2LaunchPlaybookPanel() {
  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
              Marketing V2 · Launch playbook
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">Kế hoạch đưa Marketing Upgrade vào vận hành</h3>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
              Playbook này biến spec Marketing Upgrade thành thứ tự hành động thực tế: nối UI, tạo landing copy,
              kích hoạt email sequence, rồi đo PLG/retention. Tất cả đang ở chế độ offline-first, không thêm SDK tracking mới.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-300/30 bg-slate-950/70 px-4 py-3 text-center">
            <p className="text-2xl font-black text-white">{MARKETING_V2_LAUNCH_PLAYBOOK.length}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Launch steps</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {MARKETING_V2_LAUNCH_PLAYBOOK.map((step) => (
          <article key={step.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                  {STAGE_LABELS[step.stage]}
                </span>
                <h4 className="mt-3 text-base font-black text-white">{step.title}</h4>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{step.goal}</p>
              </div>
              <Rocket className="h-5 w-5 shrink-0 text-emerald-300" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <ClipboardList className="h-3.5 w-3.5" /> Actions
                </p>
                <ul className="space-y-2">
                  {step.actions.map((action) => (
                    <li key={action} className="text-xs font-semibold leading-5 text-slate-300">
                      • {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Evidence
                </p>
                <ul className="space-y-2">
                  {step.evidence.map((item) => (
                    <li key={item} className="text-xs font-semibold leading-5 text-slate-300">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs font-bold text-slate-400">
              Owner: <span className="text-white">{step.owner}</span> · Module: <span className="text-emerald-200">{step.relatedModule}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-sky-400/25 bg-sky-400/10 p-5">
        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">
          <ShieldCheck className="h-4 w-4" /> Launch checks
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {MARKETING_V2_LAUNCH_CHECKS.map((check) => (
            <div key={check} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold leading-5 text-slate-300">
              {check}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
