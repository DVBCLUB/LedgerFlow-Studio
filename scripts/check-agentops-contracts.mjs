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

const companyLaneFile = 'src/app/companyNavigation.ts';
[
  'command-center',
  'product-studio',
  'marketing-growth',
  'finance-accounting',
  'ai-workforce',
  'system-settings',
  'industry-templates',
].forEach((laneId) => assertContains(companyLaneFile, laneId, `Company OS lane ${laneId} must remain registered.`));

assertContains('src/modules/knowledge-library/KnowledgeBaseTab.tsx', 'Import document text', 'Knowledge Base must keep local document import.');
assertContains('src/modules/knowledge-library/KnowledgeBaseTab.tsx', 'Needs Review', 'Imported document chunks must require review before RAG use.');
assertContains('src/modules/knowledge-library/KnowledgeBaseTab.tsx', 'normalizeKnowledgeBody', 'Knowledge import must dedupe normalized chunks.');
assertContains('src/modules/knowledge-library/KnowledgeBaseTab.tsx', 'KNOWLEDGE_DOCUMENT_IMPORT_SKIPPED', 'Knowledge import must audit all-duplicate document imports.');

if (failures.length > 0) {
  console.error('\nAgentOps contract check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('AgentOps contract check passed.');
