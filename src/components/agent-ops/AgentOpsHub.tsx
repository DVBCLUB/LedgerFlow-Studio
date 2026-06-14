import { useEffect, useState } from 'react';
import WorkboardTab from './tabs/WorkboardTab';
import ProductFactoryTab from './tabs/ProductFactoryTab';
import PromptPackTab from './tabs/PromptPackTab';
import CompanyMemoryTab from './tabs/CompanyMemoryTab';
import KnowledgeBaseTab from './tabs/KnowledgeBaseTab';
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

export type AgentOpsHubTab = 'standup' | 'founder' | 'workboard' | 'tasks' | 'factory' | 'growth' | 'sales' | 'documents' | 'analytics' | 'games' | 'secrets' | 'qa' | 'githubPr' | 'release' | 'tools' | 'prompts' | 'memory' | 'knowledge' | 'memoryVersions' | 'industry' | 'navmap' | 'costs' | 'feedback' | 'runtime' | 'skills' | 'staff' | 'approvals' | 'connectors' | 'review';

const tabs: { id: AgentOpsHubTab; label: string }[] = [
  { id: 'standup', label: 'Daily Standup' },
  { id: 'founder', label: 'Founder OS' },
  { id: 'workboard', label: 'Workboard' },
  { id: 'tasks', label: 'Task Queue' },
  { id: 'factory', label: 'Product Factory' },
  { id: 'growth', label: 'Growth Studio' },
  { id: 'sales', label: 'Sales CRM' },
  { id: 'documents', label: 'Documents' },
  { id: 'analytics', label: 'Analytics Sandbox' },
  { id: 'games', label: 'Learning Games' },
  { id: 'secrets', label: 'Secrets Vault' },
  { id: 'qa', label: 'QA Matrix' },
  { id: 'githubPr', label: 'GitHub PR' },
  { id: 'release', label: 'Release' },
  { id: 'tools', label: 'Tool Cards' },
  { id: 'prompts', label: 'Prompt Pack' },
  { id: 'memory', label: 'Company Memory' },
  { id: 'knowledge', label: 'Knowledge Base' },
  { id: 'memoryVersions', label: 'Memory Versions' },
  { id: 'industry', label: 'Industry Templates' },
  { id: 'navmap', label: 'Navigation Map' },
  { id: 'costs', label: 'AI Cost' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'runtime', label: 'Runtime' },
  { id: 'skills', label: 'Skills' },
  { id: 'staff', label: 'AI Staff' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'review', label: 'Review Mode' }
];

type Props = { initialTab?: AgentOpsHubTab; onClose: () => void };

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
              <p className="mt-1 text-xs font-semibold text-slate-400">Hub gom Workboard, Runtime, Skills, AI Staff, Approvals, Connectors và Review Mode vào một mount point.</p>
            </div>
            <button onClick={onClose} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300 hover:text-rose-200">Đóng</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-2xl border px-4 py-2 text-xs font-black ${tab === item.id ? 'border-cyan-300 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-300 hover:border-cyan-300'}`}>{item.label}</button>)}
          </div>
        </div>
        {tab === 'standup' && <DailyStandupTab />}
        {tab === 'founder' && <FounderOSTab />}
        {tab === 'workboard' && <WorkboardTab />}
        {tab === 'tasks' && <TaskQueueTab />}
        {tab === 'factory' && <ProductFactoryTab />}
        {tab === 'growth' && <GrowthStudioTab />}
        {tab === 'sales' && <SalesCRMTab />}
        {tab === 'documents' && <DocumentsApprovalTab />}
        {tab === 'analytics' && <AnalyticsSandboxTab />}
        {tab === 'games' && <LearningGamesTab />}
        {tab === 'secrets' && <SecretsVaultTab />}
        {tab === 'qa' && <QATestMatrixTab />}
        {tab === 'githubPr' && <GitHubPRControlTab />}
        {tab === 'release' && <ReleaseNotesTab />}
        {tab === 'tools' && <ToolCardsTab />}
        {tab === 'prompts' && <PromptPackTab />}
        {tab === 'memory' && <CompanyMemoryTab />}
        {tab === 'knowledge' && <KnowledgeBaseTab />}
        {tab === 'memoryVersions' && <MemoryVersionsTab />}
        {tab === 'industry' && <IndustryTemplatesTab />}
        {tab === 'navmap' && <NavigationMapTab />}
        {tab === 'costs' && <AICostTrackerTab />}
        {tab === 'feedback' && <FeedbackLoopTab />}
        {tab === 'runtime' && <RunTab />}
        {tab === 'skills' && <SkillsTab />}
        {tab === 'staff' && <PeopleTab />}
        {tab === 'approvals' && <GateTab />}
        {tab === 'connectors' && <ConnectorsTab />}
        {tab === 'review' && <ReviewModeTab />}
      </div>
    </div>
  );
}
