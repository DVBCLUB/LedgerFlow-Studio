/**
 * aiWorkforceRoutes.ts
 * ============================================================
 * Domain Sub-Router for AI Staff, Workforce Cockpit, Shifts,
 * Task Queue, Live Board, A2A Mailbox, and Department Requests.
 */

import type { Express, Request, Response } from 'express';
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] ?? '' : value;

import { getAIWorkforceCockpitOverview } from './aiWorkforceCockpit.ts';
import { publishAutomatedReleaseHandoff, getReleaseHandoffPackage, listReleaseHandoffPackages } from './automatedHandoffPublisher.ts';
import { dispatchAgentSwarm, getSwarmExecution, listSwarmExecutions } from './swarmDynamicOrchestrator.ts';
import { listAIStaffWorkstations, assignTaskToAIStaff } from './aiStaffWorkstation.ts';
import { listAgentEmployees, getAgentEmployeeById, WEB_CHAT_POLICY, COST_LADDER, LOCAL_MODEL_RECOMMENDATIONS, OLLAMA_RUNTIME_CONFIG } from './agentEmployeeRegistry.ts';
import { executeEmployeeTask, pollEmployeeMailbox, runEmployeeShift } from './webAiEmployeeAdapter.ts';
import { approveA2AMessage, rejectA2AMessage, fetchAgentMailbox } from './agentCollaborationProtocol.ts';
import { dispatchTask, listRoutingTable } from './agentTaskDispatcher.ts';
import { runCliAgent, listAvailableCliAgents } from './aiCliExecutor.ts';
import { listAIShifts, getCurrentActiveShift, executeShiftRoutine } from './aiShiftScheduler.ts';
import { startSoftwareReleaseChain, advanceHandoffChain, listHandoffChains } from './aiHandoffChainEngine.ts';
import { getEmployeeKpiCard, listAllEmployeeKpiCards } from './aiEmployeePerformanceCard.ts';
import { getLiveBoardSnapshot } from './aiWorkforceLiveBoard.ts';
import { enqueueTask, dequeueNextTaskForRole, completeSmartTask, getQueueSnapshot } from './aiSmartTaskQueue.ts';
import { generateCapacityForecast } from './aiCapacityPlanner.ts';
import { submitCrossDeptRequest, respondToCrossDeptRequest, completeCrossDeptRequest, listCrossDeptRequests } from './crossDepartmentRequestBridge.ts';
import { delegateTaskToDepartmentMember } from './advancedDelegationConflictResolver.ts';

export function registerAiWorkforceRoutes(app: Express): void {
  // ── AI Workforce Cockpit & Handoff ──
  app.get('/api/agent/cockpit/overview', (_req: Request, res: Response) => {
    res.json({ success: true, cockpit: getAIWorkforceCockpitOverview() });
  });

  app.post('/api/release/handoff/publish', async (req: Request, res: Response) => {
    const { releaseVersion, targetPlatform, changelog, artifacts } = req.body || {};
    if (!releaseVersion || !targetPlatform) {
      return res.status(400).json({ success: false, error: 'releaseVersion and targetPlatform required' });
    }
    const pkg = await publishAutomatedReleaseHandoff({
      version: releaseVersion,
      title: changelog || undefined,
    });
    res.json({ success: true, package: pkg });
  });

  app.get('/api/release/handoff/:id', (req: Request, res: Response) => {
    const pkg = getReleaseHandoffPackage(routeParam(req.params.id));
    if (!pkg) return res.status(404).json({ success: false, error: 'Package not found' });
    res.json({ success: true, package: pkg });
  });

  app.get('/api/release/handoff/list', (_req: Request, res: Response) => {
    res.json({ success: true, packages: listReleaseHandoffPackages() });
  });

  // ── Agent Swarm ──
  app.post('/api/agent/swarm/dispatch', async (req: Request, res: Response) => {
    try {
      const { swarmGoal, requiredRoles, strategy } = req.body || {};
      if (!swarmGoal) return res.status(400).json({ success: false, error: 'swarmGoal is required' });
      const execution = await dispatchAgentSwarm({
        goal: swarmGoal,
        agentRoles: requiredRoles || ['role_chief_of_staff', 'role_cfo'],
      });
      res.json({ success: true, execution });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/agent/swarm/:id', (req: Request, res: Response) => {
    const execution = getSwarmExecution(routeParam(req.params.id));
    if (!execution) return res.status(404).json({ success: false, error: 'Swarm execution not found' });
    res.json({ success: true, execution });
  });

  app.get('/api/agent/swarm/list', (_req: Request, res: Response) => {
    res.json({ success: true, executions: listSwarmExecutions() });
  });

  // ── Staff Workstations & Registry ──
  app.get('/api/agent/staff/workstations', (_req: Request, res: Response) => {
    res.json({ success: true, workstations: listAIStaffWorkstations() });
  });

  app.post('/api/agent/staff/assign', async (req: Request, res: Response) => {
    const { roleId, taskTitle, instructions } = req.body || {};
    if (!roleId || !taskTitle) {
      return res.status(400).json({ success: false, error: 'roleId and taskTitle required' });
    }
    const updated = await assignTaskToAIStaff({ role: roleId, taskTitle, payload: { instructions: instructions || '' } });
    res.json({ success: true, workstation: updated });
  });

  app.get('/api/agent/employees', (_req: Request, res: Response) => {
    res.json({
      success: true,
      employees: listAgentEmployees(),
      policy: WEB_CHAT_POLICY,
      costLadder: COST_LADDER,
      localRecommendations: LOCAL_MODEL_RECOMMENDATIONS,
      ollamaConfig: OLLAMA_RUNTIME_CONFIG,
    });
  });

  app.get('/api/agent/employees/:id', (req: Request, res: Response) => {
    const emp = getAgentEmployeeById(routeParam(req.params.id));
    if (!emp) return res.status(404).json({ success: false, error: 'Employee not found' });
    res.json({ success: true, employee: emp });
  });

  app.post('/api/agent/employees/:id/execute', async (req: Request, res: Response) => {
    try {
      const { taskPrompt, options } = req.body || {};
      const result = await executeEmployeeTask({
        employeeId: routeParam(req.params.id),
        prompt: taskPrompt || '',
        ...(options || {}),
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/agent/employees/:id/poll-mailbox', async (req: Request, res: Response) => {
    try {
      const messages = await pollEmployeeMailbox({ employeeId: routeParam(req.params.id) });
      res.json({ success: true, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/agent/employees/:id/shift', async (req: Request, res: Response) => {
    try {
      const shiftResult = await runEmployeeShift({ employeeId: routeParam(req.params.id) });
      res.json({ success: true, shiftResult });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/agent/a2a/:messageId/approve', (req: Request, res: Response) => {
    const ok = approveA2AMessage(routeParam(req.params.messageId), String(req.body?.role || req.query.role || ''));
    res.json({ success: ok });
  });

  app.get('/api/agent/a2a/mailbox/:role', (req: Request, res: Response) => {
    res.json({ success: true, messages: fetchAgentMailbox(routeParam(req.params.role)) });
  });

  app.get('/api/agent/routing-table', (_req: Request, res: Response) => {
    res.json({ success: true, routingTable: listRoutingTable() });
  });

  app.post('/api/agent/dispatch', async (req: Request, res: Response) => {
    const { taskGoal } = req.body || {};
    res.json({ success: true, dispatched: await dispatchTask({ goal: taskGoal || '' }) });
  });

  app.get('/api/agent/cli/available', (_req: Request, res: Response) => {
    res.json({ success: true, cliAgents: listAvailableCliAgents() });
  });

  app.post('/api/agent/cli/run', async (req: Request, res: Response) => {
    try {
      const { agentName, commandArgs } = req.body || {};
      const result = await runCliAgent({ cli: agentName as any, prompt: (commandArgs || []).join(' ') });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Shifts, Handoff Chains & KPI ──
  app.get('/api/shifts/list', (_req: Request, res: Response) => {
    res.json({ success: true, shifts: listAIShifts() });
  });

  app.get('/api/shifts/active', (_req: Request, res: Response) => {
    res.json({ success: true, activeShift: getCurrentActiveShift() });
  });

  app.post('/api/shifts/execute', async (req: Request, res: Response) => {
    try {
      const { shiftId } = req.body || {};
      const result = await executeShiftRoutine(shiftId || 'shift_morning_apac');
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/handoff/chains/start', (req: Request, res: Response) => {
    const { chainName, initialRole, targetRole, payload } = req.body || {};
    const chain = startSoftwareReleaseChain({ featureTitle: chainName, authorAgentId: initialRole });
    res.json({ success: true, chain });
  });

  app.post('/api/handoff/chains/advance', (req: Request, res: Response) => {
    const { chainId, stageOutput, nextRole } = req.body || {};
    const chain = advanceHandoffChain({ chainId, stepOutputSummary: stageOutput || '', isSuccess: true });
    res.json({ success: true, chain });
  });

  app.get('/api/handoff/chains/list', (_req: Request, res: Response) => {
    res.json({ success: true, chains: listHandoffChains() });
  });

  app.get('/api/kpi/employees', (_req: Request, res: Response) => {
    res.json({ success: true, kpis: listAllEmployeeKpiCards() });
  });

  app.get('/api/kpi/employees/:roleId', (req: Request, res: Response) => {
    res.json({ success: true, kpi: getEmployeeKpiCard(routeParam(req.params.roleId)) });
  });

  app.get('/api/workforce/live-board', (_req: Request, res: Response) => {
    res.json({ success: true, ...getLiveBoardSnapshot() });
  });

  app.post('/api/delegation/manager/delegate', (req: Request, res: Response) => {
    const { managerRoleId, memberRoleId, taskTitle, instructions } = req.body || {};
    if (!managerRoleId || !memberRoleId || !taskTitle) {
      return res.status(400).json({ success: false, error: 'managerRoleId, memberRoleId and taskTitle required' });
    }
    const result = delegateTaskToDepartmentMember({ managerRoleId, memberRoleId, taskTitle, domain: 'software_core' as any });
    res.json({ success: true, result });
  });

  // ── Smart Task Queue & Capacity Planner ──
  app.post('/api/tasks/enqueue', (req: Request, res: Response) => {
    const { title, requiredRole, priority, payload } = req.body || {};
    if (!title || !requiredRole) return res.status(400).json({ success: false, error: 'title and requiredRole required' });
    const task = enqueueTask({
      title,
      assignedRoleId: requiredRole,
      urgency: priority === 'urgent' ? 9 : priority === 'high' ? 7 : 3,
      businessImpact: 5,
      payload: payload || {},
    });
    res.json({ success: true, task });
  });

  app.post('/api/tasks/dequeue/:roleId', (req: Request, res: Response) => {
    const task = dequeueNextTaskForRole(routeParam(req.params.roleId));
    res.json({ success: true, task });
  });

  app.post('/api/tasks/:id/complete', (req: Request, res: Response) => {
    const { outputResult } = req.body || {};
    const task = completeSmartTask(routeParam(req.params.id), outputResult || {});
    res.json({ success: true, task });
  });

  app.get('/api/tasks/queue', (_req: Request, res: Response) => {
    res.json({ success: true, snapshot: getQueueSnapshot() });
  });

  app.get('/api/capacity/forecast', (_req: Request, res: Response) => {
    res.json({ success: true, forecast: generateCapacityForecast() });
  });

  // ── Cross-Department Request Bridge ──
  app.post('/api/departments/requests/submit', (req: Request, res: Response) => {
    const { fromDept, toDept, requestTitle, details, priority } = req.body || {};
    if (!fromDept || !toDept || !requestTitle) {
      return res.status(400).json({ success: false, error: 'fromDept, toDept and requestTitle required' });
    }
    const reqItem = submitCrossDeptRequest({
      fromDepartment: fromDept as any,
      fromRoleId: 'role_chief_of_staff',
      toDepartment: toDept as any,
      title: requestTitle,
      description: details || '',
      priority: (priority === 'urgent' || priority === 'high' ? 'HIGH' : 'MEDIUM') as any,
    });
    res.json({ success: true, request: reqItem });
  });

  app.post('/api/departments/requests/:id/respond', (req: Request, res: Response) => {
    const { responseNote, accepted } = req.body || {};
    const updated = respondToCrossDeptRequest({
      requestId: routeParam(req.params.id),
      decision: accepted ? 'ACCEPTED' : 'REJECTED',
      responseComment: responseNote || '',
    });
    res.json({ success: true, request: updated });
  });

  app.post('/api/departments/requests/:id/complete', (req: Request, res: Response) => {
    const { outputPayload } = req.body || {};
    const updated = completeCrossDeptRequest(routeParam(req.params.id), outputPayload || {});
    res.json({ success: true, request: updated });
  });

  app.get('/api/departments/requests', (_req: Request, res: Response) => {
    res.json({ success: true, requests: listCrossDeptRequests() });
  });
}
