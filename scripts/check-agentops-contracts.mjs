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
  'src/components/agent-ops/tabs/FinanceCoreTab.tsx',
  'src/components/agent-ops/tabs/ProjectsDeliveryCoreTab.tsx',
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
assertContains('src/components/agent-ops/tabs/GitHubPRControlTab.tsx', 'APPROVE AI GITHUB CLOSE', 'Closing a GitHub PR must require a separate founder phrase.');
assertContains('src/components/agent-ops/tabs/GitHubPRControlTab.tsx', 'requestCloseGitHubPullRequest', 'GitHub PR Control must expose request-close flow.');
assertContains('src/components/agent-ops/tabs/GitHubPRControlTab.tsx', 'Request close PR', 'GitHub PR Control must show the close request action.');
assertContains('src/components/agent-ops/tabs/GitHubPRControlTab.tsx', 'createApprovedGitHubChangeRequest', 'GitHub PR Control must call the approved-change API helper.');
assertContains('src/components/agent-ops/tabs/GitHubPRControlTab.tsx', 'ciStatus', 'GitHub PR Control must track CI status for PR plans.');
assertContains('src/utils/githubApprovedChangeApi.ts', '/api/integrations/github/approved-change-request', 'Approved GitHub API helper must use backend approved-change endpoint.');
assertContains('src/utils/githubApprovedChangeApi.ts', 'fetchGitHubWorkflowRunJobs', 'GitHub API helper must expose workflow job inspection.');
assertContains('src/utils/githubApprovedChangeApi.ts', '/api/integrations/github/runs/', 'GitHub workflow helper must call the backend workflow jobs endpoint.');
assertContains('src/utils/githubApprovedChangeApi.ts', 'requestCloseGitHubPullRequest', 'GitHub API helper must expose request-close helper.');
assertContains('src/utils/githubApprovedChangeApi.ts', '/api/integrations/github/prs/', 'GitHub close helper must call the PR route namespace.');
assertContains('src/utils/githubApprovedChangeApi.ts', '/request-close', 'GitHub close helper must call request-close endpoint.');
assertContains('server.ts', '/api/integrations/github/runs/:runId/jobs', 'Server must expose GitHub workflow jobs endpoint.');
assertContains('server.ts', '/api/integrations/github/prs/:pullNumber/request-close', 'Server must expose GitHub PR request-close endpoint.');
assertContains('server/services/githubConnector.ts', 'requestCloseGitHubPullRequest', 'GitHub connector service must implement PR close request.');
assertContains('server/services/githubConnector.ts', 'APPROVE AI GITHUB CLOSE', 'GitHub PR close service must require the close founder phrase.');
assertNotContains('server/services/githubConnector.ts', 'deleteRef', 'GitHub PR close service must not delete branches automatically.');
assertContains('src/utils/integrationHubApi.ts', '/api/integrations/local-tools/summary', 'Local tool summary must use the server summary endpoint.');
assertNotContains('src/utils/integrationHubApi.ts', '/api/integrations/local-tools/status', 'Old local tool status endpoint is not exposed by server.ts.');
assertRegex('src/components/agent-ops/tabs/GrowthStudioTab.tsx', /kind:\s*'Marketing'/, 'Growth work cards must use WorkKind Marketing.');
assertNotContains('src/components/agent-ops/tabs/GrowthStudioTab.tsx', "kind: 'Growth Experiment'", 'Invalid WorkKind Growth Experiment must not be used.');
assertRegex('src/components/agent-ops/tabs/WorkboardTab.tsx', /normalizeStoredCard/, 'Workboard must normalize legacy localStorage cards.');
assertContains('src/components/agent-ops/AgentOpsHub.tsx', 'agentOpsTabGroups', 'AgentOpsHub must render from the shared navigation registry.');
assertContains('src/components/agent-ops/agentOpsNavigation.ts', 'export const agentOpsTabGroups', 'AgentOps navigation registry must export tab groups.');
assertContains('src/components/agent-ops/agentOpsNavigation.ts', "id: 'rag'", 'RAG Search tab must remain registered in Knowledge navigation.');
assertContains('src/components/agent-ops/agentOpsNavigation.ts', "id: 'release'", 'Release tab must remain registered in Governance navigation.');
assertContains('src/components/agent-ops/agentOpsNavigation.ts', "id: 'finance'", 'Finance Core tab must remain registered.');
assertContains('src/components/agent-ops/agentOpsNavigation.ts', "id: 'projects'", 'Projects Core tab must remain registered.');
assertContains('src/components/agent-ops/AgentOpsHub.tsx', 'FinanceCoreTab', 'AgentOpsHub must render Finance Core.');
assertContains('src/components/agent-ops/AgentOpsHub.tsx', 'ProjectsDeliveryCoreTab', 'AgentOpsHub must render Projects Delivery Core.');
assertContains('src/components/agent-ops/tabs/FinanceCoreTab.tsx', 'FINANCE_APPROVAL_REQUESTED', 'Finance Core must route risky actions to Approval Gate.');
assertContains('src/components/agent-ops/tabs/ProjectsDeliveryCoreTab.tsx', 'PROJECT_APPROVAL_REQUESTED', 'Projects Core must route risky actions to Approval Gate.');
assertContains('src/components/agent-ops/tabs/DailyStandupTab.tsx', 'FINANCE_CORE_KEY', 'Daily Standup must read Finance Core items.');
assertContains('src/components/agent-ops/tabs/DailyStandupTab.tsx', 'PROJECTS_CORE_KEY', 'Daily Standup must read Projects Core items.');
assertContains('src/components/agent-ops/tabs/DailyStandupTab.tsx', 'Finance / Projects', 'Daily Standup must show Finance and Projects section.');
assertContains('src/components/agent-ops/tabs/FounderOSTab.tsx', 'FINANCE_CORE_KEY', 'Founder OS must read Finance Core items.');
assertContains('src/components/agent-ops/tabs/FounderOSTab.tsx', 'PROJECTS_CORE_KEY', 'Founder OS must read Projects Core items.');
assertContains('src/components/agent-ops/tabs/FounderOSTab.tsx', 'Finance cần xem', 'Founder OS dashboard must show Finance follow-up.');
assertContains('src/components/agent-ops/tabs/FounderOSTab.tsx', 'Projects cần xem', 'Founder OS dashboard must show Projects follow-up.');

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
assertContains('src/components/agent-ops/tabs/KnowledgeBaseTab.tsx', 'normalizeKnowledgeBody', 'Knowledge import must dedupe normalized chunks.');
assertContains('src/components/agent-ops/tabs/KnowledgeBaseTab.tsx', 'KNOWLEDGE_DOCUMENT_IMPORT_SKIPPED', 'Knowledge import must audit all-duplicate document imports.');
assertContains('src/components/agent-ops/tabs/RAGSearchTab.tsx', 'RAG_LOW_EVIDENCE_WARNING', 'RAG Search must warn when evidence is weak.');
assertContains('src/components/agent-ops/tabs/RAGSearchTab.tsx', 'eligibleSources', 'RAG context basket must not depend only on filtered search results.');

assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'RELEASE_GATE_BLOCKED', 'Release Notes must block release when release gate fails.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'releaseGateProblems', 'Release Notes must compute release gate blockers.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'ciBlockingPlans', 'Release gate must include PR CI status checks.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'financeProjectBlocking', 'Release gate must include Finance and Project blockers.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'financeBlocking > 0', 'Release gate must block finance blockers.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'projectBlocking > 0', 'Release gate must block project blockers.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'qaFail > 0', 'Release gate must include QA fail/blocked checks.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'openWork > 0', 'Release gate must include open Workboard checks.');
assertContains('src/components/agent-ops/tabs/ReleaseNotesTab.tsx', 'highRiskPlans > 0', 'Release gate must include high-risk PR plan checks.');

if (failures.length > 0) {
  console.error('\nAgentOps contract check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('AgentOps contract check passed.');
