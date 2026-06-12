export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type WorkStatus = 'Inbox' | 'Planning' | 'Waiting Approval' | 'Ready' | 'Done';
export type WorkKind = 'Q&A' | 'Code' | 'Design' | 'Data' | 'Marketing' | 'Integration' | 'CI Fix';
export type StepStatus = 'Todo' | 'Running' | 'Waiting Approval' | 'Done' | 'Blocked';

export type SessionStep = {
  id: string;
  title: string;
  owner: string;
  tool: string;
  status: StepStatus;
  note: string;
};

export type WorkCard = {
  id: string;
  title: string;
  kind: WorkKind;
  owner: string;
  status: WorkStatus;
  risk: RiskLevel;
  request: string;
  plan: string[];
  tools: string[];
  approval: string;
  steps?: SessionStep[];
  sourceSessionId?: string;
  aiStaff?: string;
  acceptanceCriteria?: string;
  founderReview?: string;
  deadline?: string;
};

export type AgentSkill = {
  id: string;
  name: string;
  category: string;
  owner: string;
  status: string;
  risk: RiskLevel;
  purpose: string;
  systemPrompt: string;
  checklist: string[];
  allowedTools: string[];
  blockedTools: string[];
  outputFormat: string;
  updatedAt: string;
};

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired';
export type ApprovalRequest = {
  id: string;
  title: string;
  source: string;
  risk: RiskLevel;
  action: string;
  details: string;
  createdAt: string;
  expiresAt: string;
  status: ApprovalStatus;
  approvedBy?: string;
  decidedAt?: string;
};

export type ConnectorDefinition = {
  id: string;
  name: string;
  category: string;
  status: string;
  mode: string;
  risk: string;
  purpose: string;
  allowedActions: string[];
  blockedActions: string[];
  inputSchema: string;
  outputSchema: string;
  approvalRequired: boolean;
  auditRequired: boolean;
};

export type PatchItem = {
  id: string;
  title: string;
  path?: string;
  filePath?: string;
  summary?: string;
  status?: string;
  risk?: string;
  route?: string;
};

export type ReviewMode = {
  mode: 'Fast' | 'Strict';
  singleReviewDeskApproval: boolean;
  note: string;
};
