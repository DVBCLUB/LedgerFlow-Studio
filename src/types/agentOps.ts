export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ApprovalRisk = RiskLevel;
export type ConnectorRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
export type ConnectorMode = 'Read Only' | 'Draft Write' | 'Approval Required' | 'Blocked';
export type ConnectorStatus = 'Planned' | 'Prototype' | 'Active' | 'Disabled';
export type ConnectorCategory = 'Code' | 'Data' | 'Docs' | 'Finance' | 'Communication' | 'Deployment' | 'Local';
export type WorkStatus = 'Inbox' | 'Planning' | 'Waiting Approval' | 'Ready' | 'Done';
export type SessionStatus = 'Draft' | 'Queued' | 'Running' | 'Waiting Approval' | 'Blocked' | 'Done';
export type WorkKind = 'Q&A' | 'Code' | 'Design' | 'Data' | 'Marketing' | 'Integration' | 'CI Fix' | 'Audit' | 'Product' | 'Ops';
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
  role?: string;
  task?: string;
  input?: string;
  expectedOutput?: string;
  acceptanceCriteria?: string;
  founderReview?: string;
  deadline?: string;
};

export type AgentSkill = {
  id: string;
  name: string;
  category: WorkKind | string;
  owner: string;
  status: 'Draft' | 'Active' | 'Deprecated' | string;
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
  sourceId?: string;
  sourceSessionId?: string;
  risk: ApprovalRisk;
  action: string;
  details: string;
  conditions?: string;
  approvalPhrase?: string;
  createdAt: string;
  expiresAt: string;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  decidedAt?: string;
};

export type ConnectorDefinition = {
  id: string;
  name: string;
  category: ConnectorCategory | string;
  status: ConnectorStatus | string;
  mode: ConnectorMode | string;
  risk: ConnectorRisk | string;
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
  repo?: string;
  branchName?: string;
  path?: string;
  filePath?: string;
  fileContent?: string;
  summary?: string;
  status?: string;
  risk?: string;
  route?: string;
  findings?: string[];
};

export type ReviewMode = {
  mode: 'Fast' | 'Strict' | 'fast_secure' | 'strict_review';
  singleReviewDeskApproval: boolean;
  note: string;
};
