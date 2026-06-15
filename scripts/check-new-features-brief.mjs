#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath, message) {
  if (!fs.existsSync(path.join(root, relativePath))) failures.push(message || `${relativePath} must exist.`);
}

function contains(relativePath, needle, message) {
  const content = read(relativePath);
  if (!content.includes(needle)) failures.push(`${relativePath}: ${message}`);
}

function notContains(relativePath, needle, message) {
  const content = read(relativePath);
  if (content.includes(needle)) failures.push(`${relativePath}: ${message}`);
}

function containsAll(relativePath, needles, label) {
  for (const needle of needles) contains(relativePath, needle, `${label} must include ${needle}`);
}

// Task A — Memory Bus
exists('src/utils/companyMemory.ts', 'Task A utility companyMemory.ts is missing.');
exists('src/components/agent-ops/tabs/CompanyMemoryV2Tab.tsx', 'Task A CompanyMemoryV2Tab is missing.');
contains('src/utils/companyMemory.ts', 'writeMemory', 'Memory utility must expose writeMemory.');
contains('src/utils/companyMemory.ts', 'readRecentMemory', 'Memory utility must expose readRecentMemory.');
contains('src/utils/companyMemory.ts', 'deactivateMemory', 'Memory utility must expose deactivateMemory.');
contains('server/services/pipelineOrchestrator.ts', 'COMPANY CONTEXT', 'Pipeline agent prompts must inject Company Memory context in this repo.');
contains('server/services/pipelineOrchestrator.ts', 'company_memory', 'Pipeline orchestrator must read company_memory.');

// Task B — AI roles
exists('server/services/agentRoles.ts', 'Task B agentRoles service is missing.');
contains('server/services/accountingRoutes.ts', '/api/agents/roles', 'Agent roles API route is missing.');
containsAll('server/services/agentRoles.ts', [
  'Chief of Staff', 'AI CFO', 'AI DevOps', 'AI Legal', 'AI Research', 'AI Game Dev', 'AI Onboarding', 'AI Analyst'
], 'Agent roles catalog');

// Task C — Pipeline Orchestrator
exists('server/services/pipelineOrchestrator.ts', 'Task C pipelineOrchestrator service is missing.');
containsAll('server/services/pipelineOrchestrator.ts', [
  'software_product', 'daily_content', 'game_dev', 'month_end', 'daily_brief', 'resumePipeline', 'waiting_approval'
], 'Pipeline orchestrator');
containsAll('server/services/accountingRoutes.ts', [
  '/api/pipelines/types', '/api/pipelines/start', '/api/pipelines/:id', '/api/pipelines/:id/approve'
], 'Pipeline API routes');

// Task D — VietQR Reconciliation
exists('server/services/vietqrReconciler.ts', 'Task D vietqrReconciler service is missing.');
exists('src/components/agent-ops/tabs/VietQRReconcilerTab.tsx', 'Task D VietQRReconcilerTab is missing.');
contains('server/services/accountingRoutes.ts', '/api/accounting/reconcile', 'VietQR reconcile API route is missing.');
contains('src/components/agent-ops/tabs/VietQRReconcilerTab.tsx', 'XLSX.writeFile', 'VietQR tab must export Excel with SheetJS.');

// Task E — Invoice OCR
exists('server/services/invoiceOCR.ts', 'Task E invoiceOCR service is missing.');
exists('src/components/agent-ops/tabs/InvoiceOCRTab.tsx', 'Task E InvoiceOCRTab is missing.');
contains('server/services/accountingRoutes.ts', '/api/accounting/invoice-ocr', 'Invoice OCR API route is missing.');
contains('server/services/invoiceOCR.ts', 'GEMINI_API_KEY', 'Invoice OCR must use server-side Gemini key.');

// Task F — DevRoom
exists('src/components/DevRoomHub.tsx', 'Task F DevRoomHub is missing.');
exists('src/components/dev-room/tabs/CodexPromptBuilderTab.tsx', 'Task F CodexPromptBuilderTab is missing.');
containsAll('src/components/DevRoomHub.tsx', ['Active Tasks', 'GitHub PRs', 'Codex Prompt', 'Products', 'Releases'], 'DevRoom tabs');
contains('server/services/accountingRoutes.ts', '/api/github/prs', 'DevRoom GitHub PR API route is missing.');

// Task G — Revenue Dashboard
exists('src/utils/revenueMetrics.ts', 'Task G revenueMetrics utility is missing.');
exists('src/components/RevenueDashboard.tsx', 'Task G RevenueDashboard is missing.');
containsAll('src/utils/revenueMetrics.ts', ['mrr', 'arr', 'activeCustomers', 'churnedThisMonth'], 'Revenue metrics');

// Task H — Domain knowledge
exists('src/data/taxKnowledgeVietnam.ts', 'Task H taxKnowledgeVietnam is missing.');
exists('src/data/ecommerceAccountingVietnam.ts', 'Task H ecommerceAccountingVietnam is missing.');
exists('src/data/payrollVietnam.ts', 'Task H payrollVietnam is missing.');
containsAll('src/data/taxKnowledgeVietnam.ts', ['TAX_RATES_VN', 'VAS_ACCOUNTS'], 'Vietnam tax/VAS knowledge');

// Brief 3 P0 — Activation layer, customized for this company workflow
exists('server/services/cronScheduler.ts', 'Brief 3 Task I cronScheduler is missing.');
containsAll('server/services/accountingRoutes.ts', ['/api/cron/status', '/api/cron/trigger'], 'Cron routes');
exists('src/utils/notificationService.ts', 'Brief 3 Task J notificationService is missing.');
exists('src/components/NotificationCenter.tsx', 'Brief 3 Task J NotificationCenter is missing.');
contains('server/services/accountingRoutes.ts', '/api/notifications/test', 'Notification test route is missing.');
exists('server/services/inputSanitizer.ts', 'Brief 3 Task P inputSanitizer is missing.');
containsAll('server/services/accountingRoutes.ts', ['helmet', 'rateLimit', '/api/agents/', '/api/pipelines/'], 'Security hardening');

// Company-specific workflow guardrails
notContains('src/components/agent-ops/agentOpsNavigation.ts', 'MISA Bridge', 'MISA Bridge must stay removed because this company does not use MISA.');
notContains('src/components/agent-ops/AgentOpsHub.tsx', 'MISABridgeTab', 'MISA Bridge UI must stay removed because this company does not use MISA.');
notContains('server/services/accountingRoutes.ts', 'misa-import', 'MISA import API must stay removed because this company does not use MISA.');

// Shared integration points
contains('src/components/agent-ops/AgentOpsHub.tsx', 'DevRoomHub', 'AgentOpsHub must render DevRoom.');
contains('src/components/agent-ops/AgentOpsHub.tsx', 'VietQRReconcilerTab', 'AgentOpsHub must render VietQR tab.');
contains('src/components/agent-ops/AgentOpsHub.tsx', 'InvoiceOCRTab', 'AgentOpsHub must render Invoice OCR tab.');
contains('src/components/agent-ops/AgentOpsHub.tsx', 'RevenueDashboard', 'AgentOpsHub must render Revenue Dashboard.');
contains('src/components/agent-ops/agentOpsNavigation.ts', 'VietQR Reconcile', 'Navigation must register VietQR Reconcile.');
contains('src/components/agent-ops/agentOpsNavigation.ts', 'Invoice OCR', 'Navigation must register Invoice OCR.');
contains('src/components/agent-ops/agentOpsNavigation.ts', 'devroom', 'Navigation must register DevRoom.');
contains('src/components/agent-ops/agentOpsNavigation.ts', 'revenue', 'Navigation must register Revenue.');

if (failures.length) {
  console.error('\nCODEX_LEDGERFLOW_NEW_FEATURES_BRIEF contract check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('CODEX_LEDGERFLOW_NEW_FEATURES_BRIEF contract check passed.');
