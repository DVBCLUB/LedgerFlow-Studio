export type AgentOpsHubTab =
  | 'brief'
  | 'standup'
  | 'founder'
  | 'workboard'
  | 'tasks'
  | 'factory'
  | 'growth'
  | 'sales'
  | 'documents'
  | 'analytics'
  | 'games'
  | 'secrets'
  | 'qa'
  | 'githubPr'
  | 'release'
  | 'tools'
  | 'prompts'
  | 'memory'
  | 'knowledge'
  | 'rag'
  | 'memoryVersions'
  | 'industry'
  | 'navmap'
  | 'costs'
  | 'feedback'
  | 'runtime'
  | 'skills'
  | 'staff'
  | 'approvals'
  | 'connectors'
  | 'review';

export type AgentOpsTabItem = { id: AgentOpsHubTab; label: string };
export type AgentOpsTabGroup = { title: string; description: string; items: AgentOpsTabItem[] };

export const agentOpsTabGroups: AgentOpsTabGroup[] = [
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
