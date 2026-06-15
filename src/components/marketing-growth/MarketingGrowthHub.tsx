import React, { Suspense, useMemo, useState } from 'react';

const tabs = [
  { id: 'suite', label: 'Growth Suite', component: React.lazy(() => import('./tabs/ContentCalendarTab')) },
  { id: 'seo', label: 'SEO Keywords', component: React.lazy(() => import('./tabs/SEOKeywordTab')) },
  { id: 'zalo', label: 'Zalo Marketing', component: React.lazy(() => import('./tabs/ZaloMarketingTab')) },
  { id: 'lead-scoring', label: 'Lead Scoring', component: React.lazy(() => import('./tabs/LeadScoringTab')) },
  { id: 'funnel', label: 'Funnel Lab', component: React.lazy(() => import('./tabs/FunnelLabTab')) },
  { id: 'affiliate', label: 'Affiliate', component: React.lazy(() => import('./tabs/AffiliateTab')) },
] as const;

type TabId = (typeof tabs)[number]['id'];

function TabFallback() {
  return <div className="h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-900/70" />;
}

export default function MarketingGrowthHub() {
  const [activeTab, setActiveTab] = useState<TabId>('suite');
  const ActiveTab = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.component, [activeTab]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">Marketing & Growth</p>
        <h2 className="mt-1 text-2xl font-black text-white">Plan, test, and scale growth channels</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
          A single workspace for positioning, campaigns, content, surveys, lead scoring, and conversion work.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition ${
              activeTab === tab.id ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Suspense fallback={<TabFallback />}>{ActiveTab && <ActiveTab />}</Suspense>
    </section>
  );
}
