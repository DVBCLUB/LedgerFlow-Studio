import { useEffect, useState } from 'react';
import WorkboardTab from './tabs/WorkboardTab';
import ProductFactoryTab from './tabs/ProductFactoryTab';
import PromptPackTab from './tabs/PromptPackTab';
import CompanyMemoryTab from './tabs/CompanyMemoryTab';
import KnowledgeBaseTab from './tabs/KnowledgeBaseTab';
import RAGSearchTab from './tabs/RAGSearchTab';
import MemoryVersionsTab from './tabs/MemoryVersionsTab';
import FounderOSTab from './tabs/FounderOSTab';
import IndustryTemplatesTab from './tabs/IndustryTemplatesTab';
import NavigationMapTab from './tabs/NavigationMapTab';
import GrowthStudioTab from './tabs/GrowthStudioTab';
import SalesCRMTab from './tabs/SalesCRMTab';
import DocumentsApprovalTab from './tabs/DocumentsApprovalTab';
import AnalyticsSandboxTab from './tabs/AnalyticsSandboxTab';
import LearningGamesTab from './tabs/LearningGamesTab';
import SecretsVaultTab from './tabs/SecretsVaultTab';
import QATestMatrixTab from './tabs/QATestMatrixTab';
import GitHubPRControlTab from './tabs/GitHubPRControlTab';
import ReleaseNotesTab from './tabs/ReleaseNotesTab';
import ClaudeBriefTrackerTab from './tabs/ClaudeBriefTrackerTab';
import TaskQueueTab from './tabs/TaskQueueTab';
import AICostTrackerTab from './tabs/AICostTrackerTab';
import FeedbackLoopTab from './tabs/FeedbackLoopTab';
import DailyStandupTab from './tabs/DailyStandupTab';
import ToolCardsTab from './tabs/ToolCardsTab';
import RunTab from './tabs/RunTab';
import SkillsTab from './tabs/SkillsTab';
import PeopleTab from './tabs/PeopleTab';
import GateTab from './tabs/GateTab';
import ConnectorsTab from './tabs/ConnectorsTab';
import ReviewModeTab from './tabs/ReviewModeTab';

export type AgentOpsHubTab = 'brief' | 'standup' | 'founder' | 'workboard' | 'tasks' | 'factory' | 'growth' | 'sales' | 'documents' | 'analytics' | 'games' | 'secrets' | 'qa' | 'githubPr' | 'release' | 'tools' | 'prompts' | 'memory' | 'knowledge' | 'rag' | 'memoryVersions' | 'industry' | 'navmap' | 'costs' | 'feedback' | 'runtime' | 'skills' | 'staff' | 'approvals' | 'connectors' | 'review';

type AgentOpsTabItem = { id: AgentOpsHubTab; label: string };
type AgentOpsTabGroup = { title: string; description: string; items: AgentOpsTabItem[] };

const tabGroups: AgentOpsTabGroup[] = [
  {
    title: 'Command',
    description: 'Founder view, daily ops, work queue',
    items: [
      { id: 'brief', label: 'Brief Tracker' },
      { id: 'standup', label: 'Daily Standup' },
      { id: 'founder', label: 'Founder OS' },
      { id: 'workboard', label: 'Workboard' },
      { id: 'tasks', label: 'Task Queue' }
    ]
  },
  {
    title: 'Build & Growth',
    description: 'Product, market, sales, documents, sandbox',
    items: [
      { id: 'factory', label: 'Product Factory' },
      { id: 'growth', label: 'Growth Studio' },
      { id: 'sales', label: 'Sales CRM' },
      { id: 'documents', label: 'Documents' },
      { id: 'analytics', label: 'Analytics Sandbox' },
      { id: 'games', label: 'Learning Games' }
    ]
  },
  {
    title: 'Governance',
    description: 'Security, QA, GitHub, release control',
    items: [
      { id: 'secrets', label: 'Secrets Vault' },
      { id: 'qa', label: 'QA Matrix' },
      { id: 'githubPr', label: 'GitHub PR' },
      { id: 'release', label: 'Release' },
      { id: 'approvals', label: 'Approvals' },
      { id: 'review', label: 'Review Mode' }
    ]
  },
  {
    title: 'Knowledge',
    description: 'Memory, prompts, tools, templates',
    items: [
      { id: 'tools', label: 'Tool Cards' },
      { id: 'prompts', label: 'Prompt Pack' },
      { id: 'memory', label: 'Company Memory' },
      { id: 'knowledge', label: 'Knowledge Base' },
      { id: 'rag', label: 'RAG Search' },
      { id: 'memoryVersions', label: 'Memory Versions' },
      { id: 'industry', label: 'Industry Templates' },
      { id: 'navmap', label: 'Navigation Map' }
    ]
  },
  {
    title: 'Runtime',
    description: 'Cost, feedback, skills, staff, connectors',
    items: [
      { id: 'costs', label: 'AI Cost' },
      { id: 'feedback', label: 'Feedback' },
      { id: 'runtime', label: 'Runtime' },
      { id: 'skills', label: 'Skills' },
      { id: 'staff', label: 'AI Staff' },
      { id: 'connectors', label: 'Connectors' }
    ]
  }
];

type Props = { initialTab?: AgentOpsHubTab; onClose: () => void };

function renderTab(tab: AgentOpsHubTab) {
  if (tab === 'brief') return <ClaudeBriefTrackerTab />;
  if (tab === 'standup') return <DailyStandupTab />;
  if (tab === 'founder') return <FounderOSTab />;
  if (tab === 'workboard') return <WorkboardTab />;
  if (tab === 'tasks') return <TaskQueueTab />;
  if (tab === 'factory') return <ProductFactoryTab />;
  if (tab === 'growth') return <GrowthStudioTab />;
  if (tab === 'sales') return <SalesCRMTab />;
  if (tab === 'documents') return <DocumentsApprovalTab />;
  if (tab === 'analytics') return <AnalyticsSandboxTab />;
  if (tab === 'games') return <LearningGamesTab />;
  if (tab === 'secrets') return <SecretsVaultTab />;
  if (tab === 'qa') return <QATestMatrixTab />;
  if (tab === 'githubPr') return <GitHubPRControlTab />;
  if (tab === 'release') return <ReleaseNotesTab />;
  if (tab === 'tools') return <ToolCardsTab />;
  if (tab === 'prompts') return <PromptPackTab />;
  if (tab === 'memory') return <CompanyMemoryTab />;
  if (tab === 'knowledge') return <KnowledgeBaseTab />;
  if (tab === 'rag') return <RAGSearchTab />;
  if (tab === 'memoryVersions') return <MemoryVersionsTab />;
  if (tab === 'industry') return <IndustryTemplatesTab />;
  if (tab === 'navmap') return <NavigationMapTab />;
  if (tab === 'costs') return <AICostTrackerTab />;
  if (tab === 'feedback') return <FeedbackLoopTab />;
  if (tab === 'runtime') return <RunTab />;
  if (tab === 'skills') return <SkillsTab />;
  if (tab === 'staff') return <PeopleTab />;
  if (tab === 'approvals') return <GateTab />;
  if (tab === 'connectors') return <ConnectorsTab />;
  return <ReviewModeTab />;
}

export default function AgentOpsHub({ initialTab = 'workboard', onClose }: Props) {
  const [tab, setTab] = useState<AgentOpsHubTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-4 backdrop-blur">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 rounded-3xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">AgentOpsHub</p>
              <h2 className="mt-1 text-xl font-black text-white">AI Ops / Agent / Approval Hub</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">Company OS control center: command, build, governance, knowledge and runtime grouped for founder-led execution.</p>
            </div>
            <button onClick={onClose} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300 hover:text-rose-200">Đóng</button>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            {tabGroups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-900/45 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">{group.title}</p>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{group.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${tab === item.id ? 'border-cyan-300 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-300 hover:border-cyan-300'}`}>{item.label}</button>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        {renderTab(tab)}
      </div>
    </div>
  );
}
