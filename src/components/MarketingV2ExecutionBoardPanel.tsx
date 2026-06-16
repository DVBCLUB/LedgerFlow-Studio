import { CheckCircle2, Clock3, GitBranch, ShieldAlert } from 'lucide-react';
import {
  MARKETING_V2_EXECUTION_BOARD,
  MARKETING_V2_EXECUTION_SUMMARY,
  type MarketingV2ExecutionStatus,
} from '../data/marketingV2ExecutionBoard';

const statusStyles: Record<MarketingV2ExecutionStatus, string> = {
  done: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  wired: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200',
  pending: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
  blocked: 'border-rose-400/35 bg-rose-400/10 text-rose-200',
};

const statusIcon: Record<MarketingV2ExecutionStatus, JSX.Element> = {
  done: <CheckCircle2 size={16} />,
  wired: <GitBranch size={16} />,
  pending: <Clock3 size={16} />,
  blocked: <ShieldAlert size={16} />,
};

export default function MarketingV2ExecutionBoardPanel() {
  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
          Marketing V2 · execution board
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">Bảng tiến độ triển khai Marketing Upgrade</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
          Theo dõi từng phần của spec: module mới, nâng cấp module cũ, route/wiring, QA và launch playbook. Mục tiêu là founder nhìn vào biết ngay phần nào đã dùng được, phần nào cần Codex nối tiếp.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {[
          { label: 'Tổng', value: MARKETING_V2_EXECUTION_SUMMARY.total },
          { label: 'Done', value: MARKETING_V2_EXECUTION_SUMMARY.done },
          { label: 'Wired', value: MARKETING_V2_EXECUTION_SUMMARY.wired },
          { label: 'Pending', value: MARKETING_V2_EXECUTION_SUMMARY.pending },
          { label: 'Blocked', value: MARKETING_V2_EXECUTION_SUMMARY.blocked },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-center">
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {MARKETING_V2_EXECUTION_BOARD.map((item) => (
          <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.area}</p>
                <h4 className="mt-1 text-base font-black text-white">{item.title}</h4>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1 text-[10px] font-black uppercase ${statusStyles[item.status]}`}>
                {statusIcon[item.status]}
                {item.status}
              </span>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-slate-400">{item.whyItMatters}</p>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Next action</p>
              <p className="mt-1 text-sm font-bold leading-6 text-white">{item.nextAction}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-xl border border-slate-700 px-2 py-1 text-[10px] font-black uppercase text-slate-400">
                Owner: {item.owner}
              </span>
              {item.relatedFiles.map((file) => (
                <span key={file} className="rounded-xl border border-slate-800 bg-slate-900/60 px-2 py-1 text-[10px] font-semibold text-slate-400">
                  {file}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
