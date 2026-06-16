import React, { useMemo, useState } from 'react';
import { LayoutTemplate, Mail, Rocket, BarChart3 } from 'lucide-react';
import LandingPageCopyLab from './LandingPageCopyLab';
import EmailSequenceBuilder from './EmailSequenceBuilder';
import PLGConversionHub from './PLGConversionHub';
import MarketingCommandCenter from './MarketingCommandCenter';

type MarketingGrowthV2Tab = 'command' | 'landing' | 'email' | 'plg';

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
];

export default function MarketingGrowthV2Workspace() {
  const [activeTab, setActiveTab] = useState<MarketingGrowthV2Tab>('command');
  const activeMeta = useMemo(
    () => MARKETING_GROWTH_V2_TABS.find((tab) => tab.id === activeTab) ?? MARKETING_GROWTH_V2_TABS[0],
    [activeTab]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-400/30 bg-purple-400/10 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-200">
          Marketing Growth V2 · spec-driven workspace
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Marketing Growth V2 Workspace</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
          Màn hình tổng hợp bốn nâng cấp P2 theo spec Marketing Upgrade: landing page copy,
          email sequence, PLG conversion và marketing command center. Tất cả dữ liệu đang chạy
          offline-first từ <span className="font-black text-purple-200">src/data</span>, chưa cần backend hoặc paid API.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
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
      </div>
    </div>
  );
}
