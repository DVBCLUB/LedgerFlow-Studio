import type { ReactNode } from 'react';
import { ArrowRight, BarChart3, CheckCircle2, ClipboardList, Gauge, ShieldCheck, WalletCards } from 'lucide-react';
import {
  COMMAND_CENTER_V2_ACCEPTANCE,
  COMMAND_CENTER_V2_DAILY_BRIEF,
  COMMAND_CENTER_REVENUE_TRACKER,
  COMMAND_CENTER_STATIC_RECOMMENDATIONS,
  type CommandBriefStatus
} from '../data/commandCenterV2DailyBrief';

const statusStyle: Record<CommandBriefStatus, string> = {
  on_track: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200',
  watch: 'border-amber-500/20 bg-amber-500/5 text-amber-200',
  next: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-200'
};

const laneStyle: Record<string, string> = {
  Command: 'text-blue-200',
  Build: 'text-purple-200',
  Sell: 'text-emerald-200',
  Control: 'text-amber-200',
  Extend: 'text-cyan-200'
};

const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 ${className}`}>{children}</div>
);

const formatMetric = (value: number, unit: string) => {
  if (unit === 'VND') return `${new Intl.NumberFormat('vi-VN').format(value)}d`;
  if (unit === 'percent') return `${value}%`;
  return new Intl.NumberFormat('vi-VN').format(value);
};

export default function CommandCenterV2DailyBriefPanel() {
  return (
    <section className="space-y-4">
      <Card className="border-blue-500/20 bg-blue-500/5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-300">
              <Gauge className="h-3.5 w-3.5" /> CEO Daily Brief V2
            </div>
            <h2 className="text-xl font-black text-white">Company OS / Simulation Lab operating brief</h2>
            <p className="mt-3 max-w-3xl text-xs font-semibold leading-6 text-slate-300">
              Daily Brief nay chay bang static data de dung offline truoc. Moi card co lane, status, metric va next action de founder biet viec tiep theo trong ngay.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-bold leading-6 text-slate-300">
            Human review required before changing production workflows.
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COMMAND_CENTER_V2_DAILY_BRIEF.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${laneStyle[item.lane]}`}>{item.lane}</p>
                <h3 className="mt-2 text-sm font-black text-white">{item.title}</h3>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusStyle[item.status]}`}>
                {item.status.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-black text-slate-100">{item.metric}</p>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.summary}</p>
            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase text-cyan-300">
                <ArrowRight className="h-3.5 w-3.5" /> Next action
              </p>
              <p className="text-xs font-bold leading-6 text-cyan-100">{item.nextAction}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <WalletCards className="h-4 w-4 text-emerald-300" /> Revenue tracker mock
          </h3>
          <div className="space-y-3">
            {COMMAND_CENTER_REVENUE_TRACKER.map((item) => {
              const progress = item.targetValue > 0 ? Math.min(100, Math.round((item.currentValue / item.targetValue) * 100)) : 0;
              return (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">{item.lane}</p>
                      <h4 className="mt-1 text-sm font-black text-white">{item.label}</h4>
                    </div>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black uppercase text-slate-300">
                      {item.trend}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500">Current</p>
                      <p className="mt-1 text-sm font-black text-white">{formatMetric(item.currentValue, item.unit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500">Target</p>
                      <p className="mt-1 text-sm font-black text-white">{formatMetric(item.targetValue, item.unit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500">Progress</p>
                      <p className="mt-1 text-sm font-black text-emerald-200">{progress}%</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-3 text-xs font-bold leading-6 text-emerald-100">Next: {item.nextAction}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <BarChart3 className="h-4 w-4 text-cyan-300" /> Static recommendation rules
          </h3>
          <div className="space-y-3">
            {COMMAND_CENTER_STATIC_RECOMMENDATIONS.map((rule) => (
              <div key={rule.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h4 className="text-sm font-black text-white">{rule.recommendation}</h4>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 text-[10px] font-black uppercase text-cyan-200">
                    {rule.priority}
                  </span>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase text-amber-300">Trigger</p>
                <p className="text-xs font-semibold leading-6 text-amber-100">{rule.trigger}</p>
                <p className="mt-3 text-[10px] font-black uppercase text-cyan-300">Why</p>
                <p className="text-xs font-semibold leading-6 text-cyan-100">{rule.why}</p>
                <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">
                  Human review: {rule.humanReview}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
          <ClipboardList className="h-4 w-4 text-blue-300" /> Daily Brief acceptance
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {COMMAND_CENTER_V2_ACCEPTANCE.map((item) => (
            <div key={item} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-300" />
              <p className="text-xs font-bold leading-6 text-emerald-100">{item}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">
          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
          Boundary: du lieu mo phong, offline-first, khong thay the quyet dinh cua founder hoac nguoi duyet cuoi.
        </p>
      </Card>
    </section>
  );
}
