import React, { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Megaphone, Target, TrendingUp } from 'lucide-react';
import {
  BATTLE_CARD_BRIEFS,
  CHANNEL_KPIS,
  MARKETING_DAILY_BRIEF_TEMPLATE,
  MARKETING_SCORECARD,
} from '../data/marketingCommandKnowledge';

type MarketingTab = 'daily' | 'channels' | 'scorecard' | 'battlecards';

const tabs: { id: MarketingTab; label: string }[] = [
  { id: 'daily', label: 'Daily Brief' },
  { id: 'channels', label: 'Channel KPIs' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'battlecards', label: 'Battle Cards' },
];

export default function MarketingCommandCenter() {
  const [activeTab, setActiveTab] = useState<MarketingTab>('daily');
  const dailySummary = useMemo(() => MARKETING_DAILY_BRIEF_TEMPLATE.slice(0, 5), []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-400/30 bg-sky-400/10 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">
          Marketing Command Center · unified view
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Marketing Command Center</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
          Tổng hợp kênh, scorecard, daily brief và battle card cho LedgerFlow. Đây là dashboard điều hành marketing offline-first,
          chưa thay thế analytics backend hoặc CRM thật.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Channels" value={CHANNEL_KPIS.length.toString()} icon={<Megaphone size={18} />} />
        <StatCard label="Daily prompts" value={MARKETING_DAILY_BRIEF_TEMPLATE.length.toString()} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Scorecards" value={MARKETING_SCORECARD.length.toString()} icon={<BarChart3 size={18} />} />
        <StatCard label="Battle cards" value={BATTLE_CARD_BRIEFS.length.toString()} icon={<Target size={18} />} />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl px-4 py-2 text-xs font-black transition-colors ${
              activeTab === tab.id
                ? 'bg-sky-300 text-slate-950'
                : 'border border-slate-800 text-slate-400 hover:border-sky-400/50 hover:text-sky-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && <DailyBrief items={dailySummary} />}
      {activeTab === 'channels' && <ChannelGrid />}
      {activeTab === 'scorecard' && <Scorecard />}
      {activeTab === 'battlecards' && <BattleCards />}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="flex items-center justify-between gap-3 text-sky-200">
        {icon}
        <span className="text-2xl font-black text-white">{value}</span>
      </div>
      <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function DailyBrief({ items }: { items: typeof MARKETING_DAILY_BRIEF_TEMPLATE }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article key={item.section} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">{item.owner}</p>
          <h3 className="mt-2 text-lg font-black text-white">{item.section}</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">{item.question}</p>
          <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-sky-200">Decision output</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{item.output}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ChannelGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {CHANNEL_KPIS.map((channel) => (
        <article key={channel.channel} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl">{channel.emoji}</p>
              <h3 className="mt-2 text-lg font-black text-white">{channel.channel}</h3>
            </div>
            <span className="rounded-2xl border border-sky-400/25 px-3 py-1 text-xs font-black text-sky-200">
              {channel.benchmarkGood}
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-sky-200">Primary: {channel.primaryMetric}</p>
          <ul className="mt-3 space-y-2">
            {channel.secondaryMetrics.map((metric) => (
              <li key={metric} className="flex gap-2 text-sm font-semibold text-slate-300">
                <TrendingUp size={14} className="mt-1 shrink-0 text-sky-300" /> {metric}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Cost: {channel.costStructure}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">VN: {channel.vietnamNote}</p>
        </article>
      ))}
    </div>
  );
}

function Scorecard() {
  return (
    <div className="space-y-3">
      {MARKETING_SCORECARD.map((item) => (
        <div key={item.metric} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_0.7fr_0.7fr]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.category}</p>
              <h3 className="mt-1 text-lg font-black text-white">{item.metric}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{item.whyItMatters}</p>
            </div>
            <InfoBox label="Target" value={item.target} />
            <InfoBox label="Action when low" value={item.actionWhenLow} warning />
          </div>
        </div>
      ))}
    </div>
  );
}

function BattleCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {BATTLE_CARD_BRIEFS.map((card) => (
        <article key={card.competitor} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Competitor battle card</p>
          <h3 className="mt-2 text-xl font-black text-white">{card.competitor}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoBox label="They win when" value={card.theyWinWhen} />
            <InfoBox label="We win when" value={card.weWinWhen} />
          </div>
          <div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-200">Talking point</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{card.talkingPoint}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function InfoBox({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${warning ? 'border-amber-400/25 bg-amber-400/10' : 'border-slate-800 bg-slate-950/70'}`}>
      <p className={`text-[10px] font-black uppercase tracking-wide ${warning ? 'text-amber-200' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{value}</p>
    </div>
  );
}
