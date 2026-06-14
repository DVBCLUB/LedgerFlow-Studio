#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertContains(file, needle, message) {
  const content = read(file);
  if (!content.includes(needle)) failures.push(`${file}: ${message}`);
}

function assertNotContains(file, needle, message) {
  const content = read(file);
  if (content.includes(needle)) failures.push(`${file}: ${message}`);
}

function assertRegex(file, pattern, message) {
  const content = read(file);
  if (!pattern.test(content)) failures.push(`${file}: ${message}`);
}

const approvalKey = 'ledgerflow_approval_gate_requests_v1';
const forbiddenApprovalKey = 'ledgerflow_aiops_approvals_v1';

[
  'src/components/agent-ops/tabs/ProductFactoryTab.tsx',
  'src/components/agent-ops/tabs/ToolCardsTab.tsx',
  'src/components/agent-ops/tabs/TaskQueueTab.tsx',
  'src/components/agent-ops/tabs/GitHubPRControlTab.tsx',
  'src/components/agent-ops/tabs/DocumentsApprovalTab.tsx',
  'src/components/agent-ops/tabs/AnalyticsSandboxTab.tsx',
  'src/components/agent-ops/tabs/SalesCRMTab.tsx',
].forEach((file) => assertContains(file, approvalKey, 'Approval-producing tab must use the canonical Approval Gate key.'));

[
  'src/components/agent-ops/tabs/ProductFactoryTab.tsx',
  'src/components/agent-ops/tabs/ToolCardsTab.tsx',
  'src/components/agent-ops/tabs/DailyStandupTab.tsx',
  'src/components/agent-ops/tabs/CompanyMemoryTab.tsx',
  'src/components/agent-ops/tabs/GitHubPRControlTab.tsx',
  'src/components/agent-ops/tabs/ReleaseNotesTab.tsx',
].forEach((file) => assertNotContains(file, forbiddenApprovalKey, 'Legacy approval key must not be used.'));

assertContains('src/components/agent-ops/tabs/GitHubPRControlTab.tsx', 'APPROVE AI GITHUB PUSH', 'Real GitHub write must require founder phrase.');
assertContains('src/components/agent-ops/tabs/GitHubPRControlTab.tsx', 'createApprovedGitHubChangeRequest', 'GitHub PR Control must call the approved-change API helper.');
assertContains('src/components/agent-ops/tabs/GitHubPRControlTab.tsx', 'ciStatus', 'GitHub PR Control must track CI status for PR plans.');
assertContains('src/utils/githubApprovedChangeApi.ts', '/api/integrations/github/approved-change-request', 'Approved GitHub API helper must use backend approved-change endpoint.');
assertContains('src/utils/integrationHubApi.ts', '/api/integrations/local-tools/summary', 'Local tool summary must use the server summary endpoint.');
assertNotContains('src/utils/integrationHubApi.ts', '/api/integrations/local-tools/status', 'Old local tool status endpoint is not exposed by server.ts.');
assertRegex('src/components/agent-ops/tabs/GrowthStudioTab.tsx', /kind:\s*'Marketing'/, 'Growth work cards must use WorkKind Marketing.');
assertNotContains('src/components/agent-ops/tabs/GrowthStudioTab.tsx', "kind: 'Growth Experiment'", 'Invalid WorkKind Growth Experiment must not be used.');
assertRegex('src/components/agent-ops/tabs/WorkboardTab.tsx', /normalizeStoredCard/, 'Workboard must normalize legacy localStorage cards.');
assertContains('src/components/agent-ops/AgentOpsHub.tsx', 'agentOpsTabGroups', 'AgentOpsHub must render from the shared navigation registry.');
assertContains('src/components/agent-ops/agentOpsNavigation.ts', 'export const agentOpsTabGroups', 'AgentOps navigation registry must export tab groups.');
assertContains('src/components/agent-ops/agentOpsNavigation.ts', "id: 'rag'", 'RAG Search tab must remain registered in Knowledge navigation.');
assertContains('src/components/agent-ops/agentOpsNavigation.ts', "id: 'release'", 'Release tab must remain registered in Governance navigation.');

const companyLaneFile = 'src/config/companyOSNavigation.ts';
[
  'command-center',
  'product-studio',
  'marketing-growth',
  'sales-crm',
  'finance-accounting',
  'projects-delivery',
  'ai-workforce',
  'documents-approval',
  'analytics-sandbox',
  'integration-hub',
  'system-settings',
  'industry-templates',
].forEach((laneId) => assertContains(companyLaneFile, laneId, `Company OS lane ${laneId} must remain registered.`));
assertContains('src/components/agent-ops/tabs/NavigationMapTab.tsx', 'companyOSLanes', 'Navigation Map must read from the Company OS lane registry.');

assertContains('src/components/agent-ops/tabs/KnowledgeBaseTab.tsx', 'Import document text', 'Knowledge Base must keep local document import.');
assertContains('src/components/agent-ops/tabs/KnowledgeBaseTab.tsx', 'Needs Review', 'Imported document chunks must require review before RAG use.');
assertContains('src/components/agent-ops/tabs/RAGSearchTab.tsx', 'RAG_LOW_EVIDENCE_WARNING', 'RAG Search must warn when evidence is weak.');
assertContains('src/components/agent-ops/tabs/RAGSearchTab.tsx', 'eligibleSources', 'RAG context basket must not depend only on filtered search results.');

assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'RELEASE_GATE_BLOCKED', 'Release Notes must block release when release gate fails.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'releaseGateProblems', 'Release Notes must compute release gate blockers.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'ciBlockingPlans', 'Release gate must include PR CI status checks.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'qaFail > 0', 'Release gate must include QA fail/blocked checks.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'openWork > 0', 'Release gate must include open Workboard checks.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'highRiskPlans > 0', 'Release gate must include high-risk PR plan checks.');

if (failures.length > 0) {
  console.error('\nAgentOps contract check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('AgentOps contract check passed.');
