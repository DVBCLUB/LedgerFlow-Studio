import { useEffect, useState } from 'react';
import AgentOpsHub, { type AgentOpsHubTab } from './AgentOpsHub';

const routeToTab: Record<string, AgentOpsHubTab> = {
  '#/ai_ops': 'workboard',
  '#/ai-ops': 'workboard',
  '#/ai_nhan_su': 'workboard',
  '#/ai_pipelines': 'pipelines',
  '#/ai-pipelines': 'pipelines',
  '#/agent_pipelines': 'pipelines',
  '#/pipelines': 'pipelines',
  '#/memory': 'memory',
  '#/ai_memory': 'memory',
  '#/company_memory': 'memory',
  '#/agent_sessions': 'runtime',
  '#/agent_skills': 'skills',
  '#/ai_staff': 'staff',
  '#/approvals': 'approvals',
  '#/connectors': 'connectors',
  '#/fast_mode': 'review',
  '#/fast-review': 'review'
};

function tabForHash(): AgentOpsHubTab | null {
  return routeToTab[window.location.hash] ?? null;
}

export default function AgentOpsHubLauncher() {
  const [tab, setTab] = useState<AgentOpsHubTab | null>(() => tabForHash());
  useEffect(() => {
    const sync = () => setTab(tabForHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const open = () => {
    window.location.hash = '#/ai_ops';
    setTab('workboard');
  };
  const close = () => {
    if (tabForHash()) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setTab(null);
  };
  return (
    <>
      <button onClick={open} className="fixed bottom-56 right-5 z-40 rounded-2xl border border-cyan-400/40 bg-slate-950/95 px-4 py-3 text-left text-xs font-black text-cyan-100 shadow-2xl shadow-cyan-950/40 backdrop-blur transition hover:border-cyan-300 hover:bg-cyan-950/80" title="Open AgentOpsHub">
        <span className="block text-[10px] uppercase tracking-[0.18em] text-cyan-300">AgentOps</span>
        <span className="block">Hub</span>
      </button>
      {tab && <AgentOpsHub initialTab={tab} onClose={close} />}
    </>
  );
}
