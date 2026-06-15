import React, { Suspense, useMemo, useState } from 'react';

const tabs = [
  { id: 'games', label: 'Game Library', component: React.lazy(() => import('./tabs/GameLibraryTab')) },
  { id: 'ml', label: 'ML Applied', component: React.lazy(() => import('./tabs/MLAppliedTab')) },
  { id: 'finance', label: 'Finance Lab', component: React.lazy(() => import('./tabs/FinanceLabTab')) },
  { id: 'simulation', label: 'Simulation', component: React.lazy(() => import('./tabs/SimulationTab')) },
  { id: 'datascience', label: 'Data Science', component: React.lazy(() => import('./tabs/DataScienceTab')) },
  { id: 'python', label: 'Python Sandbox', component: React.lazy(() => import('./tabs/PythonSandboxTab')) },
] as const;

type TabId = (typeof tabs)[number]['id'];

function TabFallback() {
  return <div className="h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-900/70" />;
}

export default function AnalyticsSandboxHub() {
  const [activeTab, setActiveTab] = useState<TabId>('games');
  const ActiveTab = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.component, [activeTab]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">Analytics, Models & Sandbox</p>
        <h2 className="mt-1 text-2xl font-black text-white">Experiment with data, simulations, models, and games</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
          A restrained sandbox shell for charts, model experiments, scenario labs, and learning games.
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
