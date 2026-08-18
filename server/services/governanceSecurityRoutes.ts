/**
 * governanceSecurityRoutes.ts
 * ============================================================
 * Domain Sub-Router for SOP, Delegation, Approvals, Incidents,
 * Probation, Risk Matrix, Consensus, and Poison Shield.
 */

import type { Express, Request, Response } from 'express';
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] ?? '' : value;

import { assessActionRisk, getRiskMatrixRegistry } from './dynamicRiskMatrix.ts';
import { conductMultiAgentDebate } from './agentConsensusEngine.ts';
import { scanAndCleanseContextPrompt } from './zeroTrustPoisonShield.ts';
import { getEnterpriseGovernanceOverview, allocateResourceBudget, runComplianceDoctorAudit } from './enterpriseSelfGovernance.ts';
import { getSystemSOPRunbooks, calculateSOPComplianceScore, runAutomatedIncidentDrill } from './systemStandardOperatingRunbook.ts';
import {
  listAIRolePermissions,
  verifyAgentActionPermission,
  arbitrateMultiAgentConflict,
  restoreQuarantinedAgent,
  CONSTITUTIONAL_INVARIANTS,
  verifyConstitutionalInvariants,
  issueAgentSessionToken,
  verifyAgentSessionToken,
  getEnterpriseRaciMatrix,
  calculateAIWorkforceHealthScores,
  delegateTaskToDepartmentMember
} from './advancedDelegationConflictResolver.ts';
import { queryAIActionLedger, verifyLedgerChainIntegrity } from './aiActionLedger.ts';
import { submitHumanApprovalRequest, respondToApprovalRequest, listApprovalRequests, getHighRiskActionDefinitions } from './humanApprovalGateway.ts';
import { bridgePipelineCompletionToApproval } from './pipelineApprovalBridge.ts';
import { generateWeeklyGovernanceReport, listWeeklyGovernanceReports } from './aiGovernanceWeeklyReport.ts';
import { generatePostMortem, listPostMortemReports, getPostMortemById } from './aiIncidentPostMortem.ts';
import { startProbation, recordBenchmarkResult, evaluateProbation, listProbationRecords } from './aiEmployeeProbationEngine.ts';
import { routeTask, listRoutingPolicy } from './aiRoutingPolicy.ts';
import { getDynamicRouterReport } from './aiDynamicRouterEngine.ts';
import { WORKFLOW_TEMPLATES, startWorkflow, approveWorkflow, rejectWorkflow, listWorkflowRuns } from './automatedWorkflows.ts';
import { runEvalSuite, runLlmJudgeEvalSuite, listEvalSuites, listEvalRuns, getEvalStats } from './aiEvalHarness.ts';
import { getGovernanceStatus, setGovernorConfig } from './costGovernor.ts';

export function registerGovernanceSecurityRoutes(app: Express): void {
  // ── SOP & Runbooks ──
  app.get('/api/sop/runbooks', (_req: Request, res: Response) => {
    res.json({ success: true, runbooks: getSystemSOPRunbooks() });
  });

  app.get('/api/sop/compliance', (_req: Request, res: Response) => {
    res.json({ success: true, ...calculateSOPComplianceScore() });
  });

  app.post('/api/sop/drill/run', (req: Request, res: Response) => {
    const { scenarioId } = req.body || {};
    const result = runAutomatedIncidentDrill(scenarioId || 'incident_model_hallucination_loop');
    res.json({ success: true, result });
  });

  // ── Delegation & Permissions ──
  app.get('/api/delegation/rbac/matrix', (_req: Request, res: Response) => {
    res.json({ success: true, permissions: listAIRolePermissions() });
  });

  app.post('/api/delegation/permission/verify', (req: Request, res: Response) => {
    const { roleId, actionType } = req.body || {};
    if (!roleId || !actionType) return res.status(400).json({ success: false, error: 'roleId and actionType required' });
    const result = verifyAgentActionPermission(roleId, 'software_core' as any, actionType as any);
    res.json({ success: true, ...result });
  });

  app.post('/api/delegation/consensus/arbitrate', (req: Request, res: Response) => {
    const { disputingRoles, context } = req.body || {};
    const result = arbitrateMultiAgentConflict(disputingRoles || [], context || {});
    res.json({ success: true, result });
  });

  app.post('/api/delegation/quarantine/restore', (req: Request, res: Response) => {
    const { roleId } = req.body || {};
    if (!roleId) return res.status(400).json({ success: false, error: 'roleId required' });
    const result = restoreQuarantinedAgent(roleId);
    res.json({ success: true, ...result });
  });

  app.get('/api/delegation/constitutional/invariants', (_req: Request, res: Response) => {
    res.json({ success: true, invariants: CONSTITUTIONAL_INVARIANTS });
  });

  app.post('/api/delegation/constitutional/verify', (req: Request, res: Response) => {
    const { proposedAction } = req.body || {};
    if (!proposedAction) return res.status(400).json({ success: false, error: 'proposedAction required' });
    const result = verifyConstitutionalInvariants(proposedAction);
    res.json({ success: true, ...result });
  });

  app.post('/api/delegation/token/issue', (req: Request, res: Response) => {
    const { roleId, scope } = req.body || {};
    if (!roleId) return res.status(400).json({ success: false, error: 'roleId required' });
    const token = issueAgentSessionToken(roleId, scope || ['read', 'execute']);
    res.json({ success: true, token });
  });

  app.post('/api/delegation/token/verify', (req: Request, res: Response) => {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false, error: 'token required' });
    const result = verifyAgentSessionToken(token);
    res.json({ success: true, ...result });
  });

  app.get('/api/delegation/raci/matrix', (_req: Request, res: Response) => {
    res.json({ success: true, raci: getEnterpriseRaciMatrix() });
  });

  app.get('/api/delegation/health/scores', (_req: Request, res: Response) => {
    res.json({ success: true, healthScores: calculateAIWorkforceHealthScores() });
  });

  // ── Action Ledger & Audit Trail ──
  app.get('/api/delegation/action-ledger', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const roleId = req.query.roleId as string | undefined;
    const severity = req.query.severity as any;
    res.json({ success: true, ledger: queryAIActionLedger({ limit, roleId }) });
  });

  app.get('/api/delegation/action-ledger/integrity', (_req: Request, res: Response) => {
    res.json({ success: true, isValid: verifyLedgerChainIntegrity() });
  });

  // ── Human Approval Gateway ──
  app.get('/api/delegation/approvals', (req: Request, res: Response) => {
    const status = req.query.status as any;
    res.json({ success: true, requests: listApprovalRequests(status) });
  });

  app.get('/api/delegation/approvals/definitions', (_req: Request, res: Response) => {
    res.json({ success: true, definitions: getHighRiskActionDefinitions() });
  });

  app.post('/api/delegation/approval/request', (req: Request, res: Response) => {
    const { roleId, actionType, summary, payload, riskLevel } = req.body || {};
    if (!roleId || !actionType || !summary) {
      return res.status(400).json({ success: false, error: 'roleId, actionType, and summary required' });
    }
    const item = submitHumanApprovalRequest({
      requesterAgentId: 'system',
      requesterRoleId: roleId,
      domain: 'software_core' as any,
      actionType,
      title: summary,
      description: summary,
      proposedChanges: payload || {},
    });
    res.json({ success: true, request: item });
  });

  app.post('/api/delegation/approval/respond', (req: Request, res: Response) => {
    const { requestId, status, reviewerNote, signatureKey } = req.body || {};
    if (!requestId || !status) {
      return res.status(400).json({ success: false, error: 'requestId and status required' });
    }
    const result = respondToApprovalRequest(requestId, status, reviewerNote || '', signatureKey);
    res.json({ success: true, ...result });
  });

  app.post('/api/delegation/pipeline/bridge', (req: Request, res: Response) => {
    const { pipelineType, pipelineId, outputData, requestedBy } = req.body || {};
    const bridged = bridgePipelineCompletionToApproval({
      pipelineType: pipelineType as any,
      itemId: pipelineId,
      title: pipelineType,
      summary: JSON.stringify(outputData),
      authorAgentId: requestedBy,
    });
    res.json({ success: true, bridged });
  });

  // ── Weekly Governance Reports ──
  app.get('/api/delegation/reports/weekly', (_req: Request, res: Response) => {
    res.json({ success: true, reports: listWeeklyGovernanceReports() });
  });

  app.post('/api/delegation/reports/weekly/generate', (_req: Request, res: Response) => {
    const report = generateWeeklyGovernanceReport();
    res.json({ success: true, report });
  });

  // ── Incidents & Post-Mortems ──
  app.get('/api/incidents/post-mortems', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ success: true, postMortems: listPostMortemReports().slice(0, limit) });
  });

  app.get('/api/incidents/post-mortems/:id', (req: Request, res: Response) => {
    const report = getPostMortemById(routeParam(req.params.id));
    if (!report) return res.status(404).json({ success: false, error: 'Post-mortem not found' });
    res.json({ success: true, report });
  });

  app.post('/api/incidents/post-mortems/generate', (req: Request, res: Response) => {
    const { incidentTitle, failedAgentId, errorLogs, rootCause } = req.body || {};
    if (!incidentTitle || !failedAgentId) {
      return res.status(400).json({ success: false, error: 'incidentTitle and failedAgentId required' });
    }
    const report = generatePostMortem({
      incidentType: 'CHAIN_FAILURE' as any,
      affectedRoleId: failedAgentId,
      triggerReason: rootCause || 'Unknown error',
    });
    res.json({ success: true, report });
  });

  // ── AI Employee Probation ──
  app.post('/api/probation/start', (req: Request, res: Response) => {
    const { employeeId, candidateName, mentorRoleId } = req.body || {};
    if (!employeeId || !candidateName) {
      return res.status(400).json({ success: false, error: 'employeeId and candidateName required' });
    }
    const record = startProbation(employeeId, candidateName);
    res.json({ success: true, record });
  });

  app.post('/api/probation/:id/benchmark', (req: Request, res: Response) => {
    const { testName, score, maxScore, notes } = req.body || {};
    const updated = recordBenchmarkResult(routeParam(req.params.id), testName, Number(score) || 0, notes);
    res.json({ success: true, record: updated });
  });

  app.post('/api/probation/:id/evaluate', (req: Request, res: Response) => {
    const { reviewerNote } = req.body || {};
    const evalResult = evaluateProbation(routeParam(req.params.id));
    res.json({ success: true, ...evalResult });
  });

  app.get('/api/probation/list', (_req: Request, res: Response) => {
    res.json({ success: true, probations: listProbationRecords() });
  });

  // ── Risk Matrix & Consensus Engine ──
  app.get('/api/agent/risk/assess', (req: Request, res: Response) => {
    const action = req.query.action as string || 'default';
    const domain = req.query.domain as string || 'general';
    res.json({ success: true, risk: assessActionRisk({ actionId: action, domain }) });
  });

  app.get('/api/agent/risk/registry', (_req: Request, res: Response) => {
    res.json({ success: true, registry: getRiskMatrixRegistry() });
  });

  app.post('/api/agent/consensus/debate', async (req: Request, res: Response) => {
    const { topic, participatingAgents } = req.body || {};
    if (!topic) return res.status(400).json({ success: false, error: 'topic is required' });
    const result = await conductMultiAgentDebate({ topic, agentRoles: participatingAgents });
    res.json({ success: true, result });
  });

  app.post('/api/security/poison-shield/scan', (req: Request, res: Response) => {
    const { promptText } = req.body || {};
    if (!promptText) return res.status(400).json({ success: false, error: 'promptText is required' });
    const result = scanAndCleanseContextPrompt(promptText);
    res.json({ success: true, ...result });
  });

  // ── Enterprise Governance & Cost ──
  app.get('/api/governance/overview', (_req: Request, res: Response) => {
    res.json({ success: true, governance: getEnterpriseGovernanceOverview() });
  });

  app.post('/api/governance/budget', (req: Request, res: Response) => {
    const { domain, amountUSD } = req.body || {};
    if (!domain || amountUSD === undefined) {
      return res.status(400).json({ success: false, error: 'domain and amountUSD required' });
    }
    const result = allocateResourceBudget({ totalMonthlyBudgetUSD: Number(amountUSD), priorityDomain: domain as any });
    res.json({ success: true, ...result });
  });

  app.post('/api/governance/compliance/audit', (req: Request, res: Response) => {
    const { scanSecurity, scanAccountingVAS } = req.body || {};
    const report = runComplianceDoctorAudit({ scanSecurity, scanAccountingVAS });
    res.json({ success: true, report });
  });

  app.get('/api/agent/routing-policy', (_req: Request, res: Response) => {
    res.json({ success: true, policy: listRoutingPolicy() });
  });

  app.get('/api/agent/routing-policy/dynamic', (_req: Request, res: Response) => {
    res.json({ success: true, report: getDynamicRouterReport() });
  });

  app.post('/api/agent/route', async (req: Request, res: Response) => {
    const { taskType } = req.body || {};
    res.json({ success: true, route: await routeTask({ goal: taskType || 'general', taskType: taskType as any }) });
  });

  app.get('/api/agent/eval/suites', (_req: Request, res: Response) => {
    res.json({ success: true, suites: listEvalSuites() });
  });

  app.post('/api/agent/eval/run', async (req: Request, res: Response) => {
    const { suiteId } = req.body || {};
    const result = await runEvalSuite({ suiteId: suiteId || 'default' });
    res.json({ success: true, result });
  });

  app.post('/api/agent/eval/run-llm-judge', async (req: Request, res: Response) => {
    const { suiteId, judgeProvider, rubric } = req.body || {};
    const result = await runLlmJudgeEvalSuite({ suiteId: suiteId || 'default', rubric, preferLocalJudge: judgeProvider === 'local' });
    res.json({ success: true, result });
  });

  app.get('/api/agent/eval/runs', (_req: Request, res: Response) => {
    res.json({ success: true, runs: listEvalRuns() });
  });

  app.get('/api/agent/eval/stats', (_req: Request, res: Response) => {
    res.json({ success: true, stats: getEvalStats() });
  });

  app.get('/api/cost/governance', (_req: Request, res: Response) => {
    res.json({ success: true, governance: getGovernanceStatus() });
  });

  app.post('/api/cost/governance', (req: Request, res: Response) => {
    const updated = setGovernorConfig(req.body || {});
    res.json({ success: true, governance: updated });
  });

  app.get('/api/agent/workflows', (_req: Request, res: Response) => {
    res.json({ success: true, templates: WORKFLOW_TEMPLATES, runs: listWorkflowRuns() });
  });

  app.post('/api/agent/workflows/:id/run', async (req: Request, res: Response) => {
    try {
      const run = await startWorkflow(routeParam(req.params.id), req.body?.inputs || {});
      res.json({ success: true, run });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/agent/workflows/:runId/approve', async (req: Request, res: Response) => {
    const run = await approveWorkflow(routeParam(req.params.runId));
    res.json({ success: true, run });
  });

  app.post('/api/agent/workflows/:runId/reject', async (req: Request, res: Response) => {
    const run = await rejectWorkflow(routeParam(req.params.runId));
    res.json({ success: true, run });
  });
}
