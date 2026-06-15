import React, { Suspense, useMemo, useState } from 'react';

const tabs = [
  { id: 'ideas', label: 'Idea Portfolio', component: React.lazy(() => import('./tabs/IdeaPortfolioTab')) },
  { id: 'business', label: 'Business Ideas', component: React.lazy(() => import('./tabs/BusinessIdeasTab')) },
  { id: 'deploy', label: 'Deploy', component: React.lazy(() => import('./tabs/DeployBusinessTab')) },
  { id: 'founder', label: 'Solo Founder', component: React.lazy(() => import('./tabs/SoloFounderTab')) },
  { id: 'advisory', label: 'Advisory Board', component: React.lazy(() => import('./tabs/AdvisoryBoardTab')) },
] as const;

type TabId = (typeof tabs)[number]['id'];

function TabFallback() {
  return <div className="h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-900/70" />;
}

export default function ProductStudioHub() {
  const [activeTab, setActiveTab] = useState<TabId>('ideas');
  const ActiveTab = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.component, [activeTab]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">Product Studio</p>
        <h2 className="mt-1 text-2xl font-black text-white">Build software, AI products, templates, and games</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
          A focused shell for product discovery, validation, launch planning, and founder review.
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
