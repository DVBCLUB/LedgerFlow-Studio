import { CheckCircle2, Clock3, ClipboardCheck } from 'lucide-react';
import { MARKETING_V2_APPROVAL_CHECKLIST, type MarketingV2ApprovalStatus } from '../../data/marketingV2ApprovalChecklist';

const STATUS_META: Record<MarketingV2ApprovalStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
  },
  ready: {
    label: 'Ready',
    className: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200',
  },
  done: {
    label: 'Done',
    className: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  },
};

export default function MarketingV2ApprovalChecklistPanel() {
  const openCount = MARKETING_V2_APPROVAL_CHECKLIST.filter((item) => item.status === 'open').length;
  const readyCount = MARKETING_V2_APPROVAL_CHECKLIST.filter((item) => item.status === 'ready').length;
  const doneCount = MARKETING_V2_APPROVAL_CHECKLIST.filter((item) => item.status === 'done').length;

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Marketing V2 · approval checklist</p>
        <h3 className="mt-2 text-xl font-black text-white">Founder Review Checklist</h3>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
          Danh sách kiểm tra trước khi dùng output Marketing V2 trong demo, landing page, email hoặc nội dung bán hàng.
          Mục tiêu là giữ nội dung an toàn, đúng kỳ vọng và không vượt quá bằng chứng hiện có.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Open', value: openCount, icon: Clock3 },
          { label: 'Ready', value: readyCount, icon: ClipboardCheck },
          { label: 'Done', value: doneCount, icon: CheckCircle2 },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-center">
              <Icon className="mx-auto h-5 w-5 text-cyan-300" />
              <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {MARKETING_V2_APPROVAL_CHECKLIST.map((item) => {
          const meta = STATUS_META[item.status];
          return (
            <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.area} · {item.owner}</p>
                  <h4 className="mt-1 text-base font-black text-white">{item.title}</h4>
                </div>
                <span className={`rounded-2xl border px-3 py-1 text-[10px] font-black uppercase ${meta.className}`}>
                  {meta.label}
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {item.checkPoints.map((point) => (
                  <li key={point} className="flex gap-2 text-sm font-semibold leading-6 text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    {point}
                  </li>
                ))}
              </ul>

              <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-xs font-bold leading-5 text-slate-300">
                Next: {item.nextAction}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
