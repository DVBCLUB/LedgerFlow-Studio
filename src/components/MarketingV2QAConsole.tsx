import { CheckCircle2, Hammer, ListChecks, MonitorCheck, TerminalSquare } from 'lucide-react';
import { MARKETING_V2_QA_CHECKLIST, type MarketingV2QaStatus } from '../data/marketingV2QaChecklist';

const STATUS_META: Record<MarketingV2QaStatus, {
  label: string;
  icon: typeof CheckCircle2;
  className: string;
}> = {
  manual: {
    label: 'Manual QA',
    icon: MonitorCheck,
    className: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  },
  lint: {
    label: 'Lint',
    icon: TerminalSquare,
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  },
  'simulation-check': {
    label: 'Simulation check',
    icon: ListChecks,
    className: 'border-purple-400/30 bg-purple-400/10 text-purple-200',
  },
  build: {
    label: 'Build',
    icon: Hammer,
    className: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  },
};

export default function MarketingV2QAConsole() {
  const manualCount = MARKETING_V2_QA_CHECKLIST.filter((item) => item.status === 'manual').length;
  const commandCount = MARKETING_V2_QA_CHECKLIST.length - manualCount;

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
          Marketing V2 · QA console
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-white">Checklist kiểm thử sau khi nối UI</h3>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-400">
              Console này gom các bước kiểm thử cho Spec Marketing Upgrade: màn hình cần mở,
              kỳ vọng cần thấy và lệnh cần chạy. Dùng sau khi Codex/local nối tab V2 vào
              MarketingSuite hoặc route riêng.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-4 py-3">
              <p className="text-2xl font-black text-sky-200">{manualCount}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-sky-300/80">Manual</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3">
              <p className="text-2xl font-black text-emerald-200">{commandCount}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300/80">Commands</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {MARKETING_V2_QA_CHECKLIST.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                    {item.area}
                  </p>
                  <h4 className="mt-1 text-base font-black text-white">{item.check}</h4>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-2xl border px-3 py-1 text-[10px] font-black uppercase ${meta.className}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              </div>
              <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-sm font-semibold leading-6 text-slate-300">
                Expected: {item.expected}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
