import React, { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ClipboardCheck, Clock3, Compass, LayoutList, LayoutTemplate, Mail, Rocket, Route, Wrench } from 'lucide-react';
import LandingPageCopyLab from './LandingPageCopyLab';
import EmailSequenceBuilder from './EmailSequenceBuilder';
import PLGConversionHub from './PLGConversionHub';
import MarketingCommandCenter from './MarketingCommandCenter';
import MarketingV2QAConsole from './MarketingV2QAConsole';
import MarketingV2LaunchPlaybookPanel from './MarketingV2LaunchPlaybookPanel';
import MarketingV2ExecutionBoardPanel from './MarketingV2ExecutionBoardPanel';
import MarketingV2AccessGuidePanel from './MarketingV2AccessGuidePanel';
import { MARKETING_V2_NEXT_CHECKS, MARKETING_V2_ROLLOUT_STATUS } from '../data/marketingV2RolloutStatus';

type MarketingGrowthV2Tab = 'command' | 'landing' | 'email' | 'plg' | 'launch' | 'execution' | 'access' | 'rollout' | 'qa';

const MARKETING_GROWTH_V2_TABS: Array<{
  id: MarketingGrowthV2Tab;
  label: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'command',
    label: 'Command Center',
    note: 'Tổng hợp kênh, scorecard và battle cards.',
    icon: BarChart3,
  },
  {
    id: 'landing',
    label: 'Landing Copy',
    note: 'AI prompt + công thức viết landing page tiếng Việt.',
    icon: LayoutTemplate,
  },
  {
    id: 'email',
    label: 'Email Sequence',
    note: 'Welcome, activation, churn, winback drip sequence.',
    icon: Mail,
  },
  {
    id: 'plg',
    label: 'PLG Hub',
    note: 'Aha moment, activation path, free-to-paid playbook.',
    icon: Rocket,
  },
  {
    id: 'launch',
    label: 'Launch Playbook',
    note: 'Thứ tự đưa Marketing V2 vào vận hành thật.',
    icon: Rocket,
  },
  {
    id: 'execution',
    label: 'Execution Board',
    note: 'Bảng tiến độ spec: done, wired, pending, owner.',
    icon: LayoutList,
  },
  {
    id: 'access',
    label: 'Access Guide',
    note: 'Cách nối workspace vào app mà không phá router.',
    icon: Compass,
  },
  {
    id: 'rollout',
    label: 'Rollout Status',
    note: 'Checklist triển khai V2 và các lệnh cần chạy.',
    icon: Route,
  },
  {
    id: 'qa',
    label: 'QA Console',
    note: 'Manual checks + lint/build commands sau khi nối UI.',
    icon: ClipboardCheck,
  },
];

const STATUS_META = {
  done: {
    label: 'Done',
    className: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
    icon: CheckCircle2,
  },
  wired: {
    label: 'Wired',
    className: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200',
    icon: Wrench,
  },
  pending: {
    label: 'Pending',
    className: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
    icon: Clock3,
  },
} as const;

export default function MarketingGrowthV2Workspace() {
  const [activeTab, setActiveTab] = useState<MarketingGrowthV2Tab>('command');
  const activeMeta = useMemo(
    () => MARKETING_GROWTH_V2_TABS.find((tab) => tab.id === activeTab) ?? MARKETING_GROWTH_V2_TABS[0],
    [activeTab]
  );

  const rolloutStats = useMemo(() => ({
    done: MARKETING_V2_ROLLOUT_STATUS.filter((item) => item.status === 'done').length,
    wired: MARKETING_V2_ROLLOUT_STATUS.filter((item) => item.status === 'wired').length,
    pending: MARKETING_V2_ROLLOUT_STATUS.filter((item) => item.status === 'pending').length,
  }), []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-400/30 bg-purple-400/10 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-200">
          Marketing Growth V2 · spec-driven workspace
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Marketing Growth V2 Workspace</h2>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
              Màn hình tổng hợp bốn nâng cấp theo spec Marketing Upgrade: landing page copy,
              email sequence, PLG conversion và marketing command center. Tất cả dữ liệu đang chạy
              offline-first từ <span className="font-black text-purple-200">src/data</span>, chưa cần backend hoặc paid API.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2">
              <p className="text-lg font-black text-emerald-200">{rolloutStats.done}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300/80">Done</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2">
              <p className="text-lg font-black text-cyan-200">{rolloutStats.wired}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-cyan-300/80">Wired</p>
            </div>
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-3 py-2">
              <p className="text-lg font-black text-amber-200">{rolloutStats.pending}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-300/80">Pending</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
        {MARKETING_GROWTH_V2_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-3xl border p-4 text-left transition-all ${
                active
                  ? 'border-purple-300 bg-purple-300 text-slate-950 shadow-lg shadow-purple-950/20'
                  : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-purple-400/50 hover:text-purple-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-slate-950' : 'text-purple-300'}`} />
              <p className="mt-3 text-sm font-black">{tab.label}</p>
              <p className={`mt-1 text-xs font-semibold leading-5 ${active ? 'text-slate-800' : 'text-slate-500'}`}>
                {tab.note}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Active tool</p>
            <h3 className="mt-1 text-lg font-black text-white">{activeMeta.label}</h3>
          </div>
          <span className="rounded-2xl border border-slate-700 px-3 py-1 text-[10px] font-black uppercase text-slate-400">
            Offline-first · Data-driven
          </span>
        </div>

        {activeTab === 'command' && <MarketingCommandCenter />}
        {activeTab === 'landing' && <LandingPageCopyLab />}
        {activeTab === 'email' && <EmailSequenceBuilder />}
        {activeTab === 'plg' && <PLGConversionHub />}
        {activeTab === 'launch' && <MarketingV2LaunchPlaybookPanel />}
        {activeTab === 'execution' && <MarketingV2ExecutionBoardPanel />}
        {activeTab === 'access' && <MarketingV2AccessGuidePanel />}
        {activeTab === 'rollout' && <RolloutStatusPanel />}
        {activeTab === 'qa' && <MarketingV2QAConsole />}
      </div>
    </div>
  );
}

function RolloutStatusPanel() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-2">
        {MARKETING_V2_ROLLOUT_STATUS.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{item.area}</p>
                  <h4 className="mt-1 text-base font-black text-white">{item.title}</h4>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-2xl border px-3 py-1 text-[10px] font-black uppercase ${meta.className}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">{item.summary}</p>
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Files</p>
                <div className="flex flex-wrap gap-2">
                  {item.filePaths.map((path) => (
                    <code key={path} className="rounded-xl border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-300">
                      {path}
                    </code>
                  ))}
                </div>
              </div>
              <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-xs font-bold leading-5 text-slate-300">
                Next: {item.nextAction}
              </p>
            </article>
          );
        })}
      </div>

      <section className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Checks to run after wiring</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MARKETING_V2_NEXT_CHECKS.map((command) => (
            <code key={command} className="rounded-2xl border border-cyan-300/30 bg-slate-950 px-3 py-2 text-xs font-black text-cyan-100">
              {command}
            </code>
          ))}
        </div>
      </section>
    </div>
  );
}
