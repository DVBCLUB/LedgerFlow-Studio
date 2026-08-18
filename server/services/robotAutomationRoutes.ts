/**
 * robotAutomationRoutes.ts
 * ============================================================
 * Domain Sub-Router for Robotics, Digital Twin Simulation,
 * Self-Healing Patches, and Autonomous Flywheel.
 */

import type { Express, Request, Response } from 'express';
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] ?? '' : value;

import { runBusinessDigitalTwinSimulation, getDigitalTwinSimulation, listDigitalTwinSimulations } from './businessDigitalTwinSimulator.ts';
import { executeSoftwareRobotWorkflow, getSoftwareRobotWorkflow, listSoftwareRobotWorkflows } from './softwareRobotOrchestrator.ts';
import { dispatchMultiPlatformRobotMission, getMultiPlatformRobotMission, listMultiPlatformRobotMissions } from './multiPlatformRobotSwarm.ts';
import { healRobotActionSelector } from './robotVisionHealer.ts';
import { registerRobotCronJob, listRobotCronJobs, triggerRobotCronJobNow } from './robotCronScheduler.ts';
import { synthesizeRobotWorkflowFromGoal } from './robotWorkflowSynthesizer.ts';
import { runDigitalTwinRobotSandboxSimulation } from './robotDigitalTwinSandbox.ts';
import { executeEdgeRobotActionFast } from './edgeRobotExecutionNode.ts';
import { dispatchRobotOutputToEmployee, listDispatchedRobotTasks } from './robotToEmployeeDispatcher.ts';
import { parseAndExecuteVoiceCommand } from './voiceCommanderEngine.ts';
import { listPublishSchedules, createPublishSchedule, ingestInboundLead } from './viralLeadGrowthEngine.ts';
import { runAiGamePlaytestSimulation } from './aiGamePlaytestSimulator.ts';
import { generatePackagingManifest } from './multiPlatformPackager.ts';
import { generateSelfHealingPatch, listSelfHealingPatches, updatePatchStatus } from './selfHealingPatchEngine.ts';

export function registerRobotAutomationRoutes(app: Express): void {
  // ── Digital Twin Simulation ──
  app.post('/api/simulation/digital-twin/run', async (req: Request, res: Response) => {
    const { scenarioName, initialCapital, monthlyBurn, targetGrowthRate, simulationMonths } = req.body || {};
    const simulation = await runBusinessDigitalTwinSimulation({
      currentCashUSD: Number(initialCapital) || 50000,
      monthlyBurnUSD: Number(monthlyBurn) || 8000,
      userGrowthMonthly: Number(targetGrowthRate) || 15,
      timeframeDays: Number(simulationMonths) || 12,
    });
    res.json({ success: true, simulation });
  });

  app.get('/api/simulation/digital-twin/:id', (req: Request, res: Response) => {
    const sim = getDigitalTwinSimulation(routeParam(req.params.id));
    if (!sim) return res.status(404).json({ success: false, error: 'Simulation not found' });
    res.json({ success: true, simulation: sim });
  });

  app.get('/api/simulation/digital-twin/list', (_req: Request, res: Response) => {
    res.json({ success: true, simulations: listDigitalTwinSimulations() });
  });

  // ── Software Robotics ──
  app.post('/api/robot/software/execute', async (req: Request, res: Response) => {
    const { robotType, targetSystem, actions, dryRun } = req.body || {};
    if (!robotType || !targetSystem) {
      return res.status(400).json({ success: false, error: 'robotType and targetSystem required' });
    }
    const workflow = await executeSoftwareRobotWorkflow({
      name: robotType,
      actions: actions || [],
      dryRun: Boolean(dryRun),
    });
    res.json({ success: true, workflow });
  });

  app.get('/api/robot/software/:id', (req: Request, res: Response) => {
    const wf = getSoftwareRobotWorkflow(routeParam(req.params.id));
    if (!wf) return res.status(404).json({ success: false, error: 'Workflow not found' });
    res.json({ success: true, workflow: wf });
  });

  app.get('/api/robot/software/list', (_req: Request, res: Response) => {
    res.json({ success: true, workflows: listSoftwareRobotWorkflows() });
  });

  // ── Multi-Platform Robot Missions ──
  app.post('/api/robot/multi-platform/mission', async (req: Request, res: Response) => {
    try {
      const { platform, goal, payload } = req.body || {};
      if (!platform || !goal) {
        return res.status(400).json({ success: false, error: 'platform and goal required' });
      }
      const mission = await dispatchMultiPlatformRobotMission({ title: goal, webTarget: platform });
      res.json({ success: true, mission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/robot/multi-platform/mission/:id', (req: Request, res: Response) => {
    const mission = getMultiPlatformRobotMission(routeParam(req.params.id));
    if (!mission) return res.status(404).json({ success: false, error: 'Mission not found' });
    res.json({ success: true, mission });
  });

  app.get('/api/robot/multi-platform/missions', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ success: true, missions: listMultiPlatformRobotMissions(limit) });
  });

  // ── Vision Healer & Cron & Level 6 Robot Synthesizer ──
  app.post('/api/robot/vision/heal', (req: Request, res: Response) => {
    const { selector, targetLabel, pageContentText } = req.body || {};
    if (!selector || !targetLabel) {
      return res.status(400).json({ success: false, error: 'selector and targetLabel required' });
    }
    const result = healRobotActionSelector({ selector, targetLabel, pageContentText });
    res.json({ success: true, result });
  });

  app.post('/api/robot/cron/register', (req: Request, res: Response) => {
    const { cronExpression, title, webTarget, desktopCommand, telegramChatId } = req.body || {};
    if (!title) return res.status(400).json({ success: false, error: 'title is required' });
    const job = registerRobotCronJob({ cronExpression, title, webTarget, desktopCommand, telegramChatId });
    res.json({ success: true, job });
  });

  app.get('/api/robot/cron/list', (_req: Request, res: Response) => {
    res.json({ success: true, jobs: listRobotCronJobs() });
  });

  app.post('/api/robot/cron/trigger/:id', async (req: Request, res: Response) => {
    try {
      const mission = await triggerRobotCronJobNow(routeParam(req.params.id));
      res.json({ success: true, mission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/robot/v6/synthesize', (req: Request, res: Response) => {
    const { goalPrompt } = req.body || {};
    if (!goalPrompt) return res.status(400).json({ success: false, error: 'goalPrompt is required' });
    const workflow = synthesizeRobotWorkflowFromGoal(goalPrompt);
    res.json({ success: true, workflow });
  });

  app.post('/api/robot/v6/simulate', (req: Request, res: Response) => {
    const { workflow, virtualIterations } = req.body || {};
    if (!workflow) return res.status(400).json({ success: false, error: 'workflow is required' });
    const simulation = runDigitalTwinRobotSandboxSimulation(workflow, Number(virtualIterations) || 1000);
    res.json({ success: true, simulation });
  });

  app.post('/api/robot/v6/execute-fast', async (req: Request, res: Response) => {
    try {
      const { step } = req.body || {};
      if (!step) return res.status(400).json({ success: false, error: 'step is required' });
      const result = await executeEdgeRobotActionFast(step);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/robot/dispatch', (req: Request, res: Response) => {
    const { robotType, outputData, targetRole, confidenceScore } = req.body || {};
    const task = dispatchRobotOutputToEmployee({
      sourceRobot: robotType as any,
      data: { output: outputData, targetRole: targetRole || 'role_chief_of_staff', confidenceScore },
    });
    res.json({ success: true, task });
  });

  app.get('/api/robot/dispatched/list', (_req: Request, res: Response) => {
    res.json({ success: true, tasks: listDispatchedRobotTasks() });
  });

  // ── Flywheel & Packaging ──
  app.post('/api/flywheel/voice/command', (req: Request, res: Response) => {
    const { rawSpeechText } = req.body || {};
    res.json({ success: true, command: parseAndExecuteVoiceCommand(rawSpeechText || '') });
  });

  app.get('/api/flywheel/publish/schedules', (_req: Request, res: Response) => {
    res.json({ success: true, schedules: listPublishSchedules() });
  });

  app.post('/api/flywheel/publish/schedule', (req: Request, res: Response) => {
    const { title, platform, scheduledTime, mediaUrl } = req.body || {};
    res.json({ success: true, schedule: createPublishSchedule({ title, channels: [platform], videoAssetUrl: mediaUrl, caption: title, tags: [], scheduledTime }) });
  });

  app.post('/api/flywheel/lead/ingest', (req: Request, res: Response) => {
    const { name, email, phone, source, intentScore } = req.body || {};
    res.json({ success: true, lead: ingestInboundLead({ fullName: name, email, phone, sourceChannel: source as any, interestedProduct: 'software_os', messageNote: String(intentScore) }) });
  });

  app.post('/api/flywheel/game/playtest', (req: Request, res: Response) => {
    const { gameTitle, simulationSteps, userPersona } = req.body || {};
    res.json({ success: true, report: runAiGamePlaytestSimulation({ gameTitle, genre: '2d_platformer', totalSimulatedRuns: Number(simulationSteps), botSkillProfile: userPersona as any }) });
  });

  app.post('/api/flywheel/package/manifest', (req: Request, res: Response) => {
    const { targetOs, appName, version } = req.body || {};
    res.json({ success: true, manifest: generatePackagingManifest({ appName, version, targets: [targetOs as any] }) });
  });

  // ── Self-Healing Patches ──
  app.post('/api/self-healing/propose', async (req: Request, res: Response) => {
    const { issueDescription, affectedFiles } = req.body || {};
    res.json({ success: true, patch: await generateSelfHealingPatch({ errorLog: issueDescription, sourceContext: (affectedFiles || []).join(', ') }) });
  });

  app.get('/api/self-healing/patches', (_req: Request, res: Response) => {
    res.json({ success: true, patches: listSelfHealingPatches() });
  });

  app.post('/api/self-healing/status', (req: Request, res: Response) => {
    const { id, status } = req.body || {};
    res.json({ success: true, patch: updatePatchStatus(id, status) });
  });
}
