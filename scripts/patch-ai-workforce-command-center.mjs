import fs from 'node:fs';
import path from 'node:path';

function patchFile(filePath, patcher) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
  const source = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const next = patcher(source);
  if (next !== source) {
    fs.writeFileSync(filePath, next);
    return true;
  }
  return false;
}

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) {
    throw new Error(`Cannot patch AI Workforce: missing anchor ${label}`);
  }
  return source.replace(search, replacement);
}

function replaceBeforeFirstAvailable(source, anchors, insertion, label) {
  for (const anchor of anchors) {
    if (!source.includes(anchor)) continue;
    return source.replace(anchor, `${insertion}\n\n${anchor}`);
  }
  throw new Error(`Cannot patch AI Workforce: missing anchor ${label}`);
}

function ensureRuntimeHubImport(source) {
  const githubCiImport = 'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";';
  const currentImport = 'import { approveRuntimeMissionExecutionStep, buildRuntimeGitHubPRControlReport, buildRuntimeGroundedContext, buildRuntimeMissionExecutionQueue, buildRuntimeMissionPlan, buildRuntimePRControlReport, cancelRuntimeMissionExecutionQueue, completeRuntimeMissionExecutionStep, executeRuntimeMissionStepToolSimulation, executeRuntimeMissionStepToolConnector, getAIWorkforceRuntimeDashboard, listRuntimeMissionExecutionQueues, listRuntimeMissionQueueDrift, previewRuntimeAutomation, previewRuntimeMissionStepToolExecution, repairRuntimeMissionQueueDrift, resumeRuntimeMissionExecutionQueue, scoreRuntimePRReadiness, startRuntimeMissionExecutionStep } from "./services/aiWorkforceRuntimeHub";';
  const previousToolConnectorImport = 'import { approveRuntimeMissionExecutionStep, buildRuntimeGitHubPRControlReport, buildRuntimeGroundedContext, buildRuntimeMissionExecutionQueue, buildRuntimeMissionPlan, buildRuntimePRControlReport, cancelRuntimeMissionExecutionQueue, completeRuntimeMissionExecutionStep, executeRuntimeMissionStepToolSimulation, executeRuntimeMissionStepToolConnector, getAIWorkforceRuntimeDashboard, listRuntimeMissionExecutionQueues, previewRuntimeAutomation, previewRuntimeMissionStepToolExecution, resumeRuntimeMissionExecutionQueue, scoreRuntimePRReadiness, startRuntimeMissionExecutionStep } from "./services/aiWorkforceRuntimeHub";';
  const previousToolSimulationImport = 'import { approveRuntimeMissionExecutionStep, buildRuntimeGitHubPRControlReport, buildRuntimeGroundedContext, buildRuntimeMissionExecutionQueue, buildRuntimeMissionPlan, buildRuntimePRControlReport, cancelRuntimeMissionExecutionQueue, completeRuntimeMissionExecutionStep, executeRuntimeMissionStepToolSimulation, getAIWorkforceRuntimeDashboard, listRuntimeMissionExecutionQueues, previewRuntimeAutomation, previewRuntimeMissionStepToolExecution, resumeRuntimeMissionExecutionQueue, scoreRuntimePRReadiness, startRuntimeMissionExecutionStep } from "./services/aiWorkforceRuntimeHub";';
  const previousResumeImport = 'import { approveRuntimeMissionExecutionStep, buildRuntimeGitHubPRControlReport, buildRuntimeGroundedContext, buildRuntimeMissionExecutionQueue, buildRuntimeMissionPlan, buildRuntimePRControlReport, cancelRuntimeMissionExecutionQueue, completeRuntimeMissionExecutionStep, getAIWorkforceRuntimeDashboard, listRuntimeMissionExecutionQueues, previewRuntimeAutomation, resumeRuntimeMissionExecutionQueue, scoreRuntimePRReadiness, startRuntimeMissionExecutionStep } from "./services/aiWorkforceRuntimeHub";';
  const previousQueueImport = 'import { buildRuntimeGitHubPRControlReport, buildRuntimeGroundedContext, buildRuntimeMissionExecutionQueue, buildRuntimeMissionPlan, buildRuntimePRControlReport, getAIWorkforceRuntimeDashboard, previewRuntimeAutomation, scoreRuntimePRReadiness } from "./services/aiWorkforceRuntimeHub";';
  const previousMissionImport = 'import { buildRuntimeGitHubPRControlReport, buildRuntimeGroundedContext, buildRuntimeMissionPlan, buildRuntimePRControlReport, getAIWorkforceRuntimeDashboard, previewRuntimeAutomation, scoreRuntimePRReadiness } from "./services/aiWorkforceRuntimeHub";';
  const previousGitHubPrImport = 'import { buildRuntimeGitHubPRControlReport, buildRuntimeGroundedContext, buildRuntimePRControlReport, getAIWorkforceRuntimeDashboard, previewRuntimeAutomation, scoreRuntimePRReadiness } from "./services/aiWorkforceRuntimeHub";';
  const previousPrControlImport = 'import { buildRuntimeGroundedContext, buildRuntimePRControlReport, getAIWorkforceRuntimeDashboard, previewRuntimeAutomation, scoreRuntimePRReadiness } from "./services/aiWorkforceRuntimeHub";';
  const previousImport = 'import { buildRuntimeGroundedContext, getAIWorkforceRuntimeDashboard, previewRuntimeAutomation, scoreRuntimePRReadiness } from "./services/aiWorkforceRuntimeHub";';

  if (source.includes(currentImport)) return source;
  if (source.includes(previousToolConnectorImport)) return source.replace(previousToolConnectorImport, currentImport);
  if (source.includes(previousToolSimulationImport)) return source.replace(previousToolSimulationImport, currentImport);
  if (source.includes(previousResumeImport)) return source.replace(previousResumeImport, currentImport);
  if (source.includes(previousQueueImport)) return source.replace(previousQueueImport, currentImport);
  if (source.includes(previousMissionImport)) return source.replace(previousMissionImport, currentImport);
  if (source.includes(previousGitHubPrImport)) return source.replace(previousGitHubPrImport, currentImport);
  if (source.includes(previousPrControlImport)) return source.replace(previousPrControlImport, currentImport);
  if (source.includes(previousImport)) return source.replace(previousImport, currentImport);
  return replaceOnce(source, githubCiImport, `${githubCiImport}\n${currentImport}`, 'AI Workforce Runtime Hub import');
}

const missionPlanRoute = `app.post("/api/ai-workforce/mission-plan", async (req: Request, res: Response) => {
  try {
    const plan = await buildRuntimeMissionPlan(req.body as any);
    res.json({ ok: true, plan });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

const missionExecutionQueueRoute = `app.post("/api/ai-workforce/mission-execution-queue", async (req: Request, res: Response) => {
  try {
    const result = await buildRuntimeMissionExecutionQueue(req.body as any);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

const missionQueueResumeRoutes = `app.get("/api/ai-workforce/mission-execution-queues", async (req: Request, res: Response) => {
  try {
    const result = await listRuntimeMissionExecutionQueues({ limit: Number(req.query.limit || 20), status: req.query.status as any });
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/resume", async (req: Request, res: Response) => {
  try {
    const queue = await resumeRuntimeMissionExecutionQueue(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/approve", async (req: Request, res: Response) => {
  try {
    const queue = await approveRuntimeMissionExecutionStep(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/start", async (req: Request, res: Response) => {
  try {
    const queue = await startRuntimeMissionExecutionStep(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/complete", async (req: Request, res: Response) => {
  try {
    const queue = await completeRuntimeMissionExecutionStep(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/tool-preview", async (req: Request, res: Response) => {
  try {
    const result = await previewRuntimeMissionStepToolExecution(req.body as any);
    res.json({ ok: true, result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/tool-execute", async (req: Request, res: Response) => {
  try {
    const result = await executeRuntimeMissionStepToolSimulation(req.body as any);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/cancel", async (req: Request, res: Response) => {
  try {
    const queue = await cancelRuntimeMissionExecutionQueue(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

const githubPrControlRoute = `app.post("/api/ai-workforce/github-pr-control", async (req: Request, res: Response) => {
  try {
    const result = await buildRuntimeGitHubPRControlReport(req.body as any);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

const prControlRoute = `app.post("/api/ai-workforce/pr-control", async (req: Request, res: Response) => {
  try {
    const report = await buildRuntimePRControlReport(req.body as any);
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

const prReadinessRoute = `app.post("/api/ai-workforce/pr-readiness", async (req: Request, res: Response) => {
  try {
    const report = await scoreRuntimePRReadiness(req.body as any);
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

const runtimeRouteBlock = `// ---------------------------------------------------------------------------
// AI Workforce Runtime Hub endpoints
// ---------------------------------------------------------------------------
app.get("/api/ai-workforce/runtime", async (_req: Request, res: Response) => {
  try {
    const dashboard = await getAIWorkforceRuntimeDashboard();
    res.json({ ok: true, dashboard });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/context-pack", async (req: Request, res: Response) => {
  try {
    const result = await buildRuntimeGroundedContext(req.body as any);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
${missionPlanRoute}
${missionExecutionQueueRoute}
${missionQueueResumeRoutes}
app.post("/api/ai-workforce/safety-preview", async (req: Request, res: Response) => {
  try {
    const decision = await previewRuntimeAutomation(req.body as any);
    res.json({ ok: true, decision });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
${prReadinessRoute}
${prControlRoute}
${githubPrControlRoute}`;

function ensureRuntimeHubRoutes(source) {
  const unifiedOverviewAnchor = '// ---------------------------------------------------------------------------\n// Unified System Overview (cross-service data linker)\n// ---------------------------------------------------------------------------';
  const fallbackAnchors = [
    unifiedOverviewAnchor,
    '// ---------------------------------------------------------------------------\n// Agent Control Plane endpoints\n// ---------------------------------------------------------------------------',
    '// ---------------------------------------------------------------------------\n// Robot Adapter Boundary endpoints (P2)\n// ---------------------------------------------------------------------------',
    '// ---------------------------------------------------------------------------\n// Browser Runbook endpoints (P2)\n// ---------------------------------------------------------------------------',
    'const PORT = Number(process.env.ASSISTANT_DAEMON_PORT ?? 3001);',
    'app.listen(PORT',
  ];

  if (source.includes('/api/ai-workforce/mission-execution-queue/tool-execute')) return source;
  if (source.includes('/api/ai-workforce/mission-execution-queue/approve')) {
    return replaceOnce(source, 'app.post("/api/ai-workforce/mission-execution-queue/cancel"', `app.post("/api/ai-workforce/mission-execution-queue/tool-preview", async (req: Request, res: Response) => {
  try {
    const result = await previewRuntimeMissionStepToolExecution(req.body as any);
    res.json({ ok: true, result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/tool-execute", async (req: Request, res: Response) => {
  try {
    const result = await executeRuntimeMissionStepToolSimulation(req.body as any);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/cancel"`, 'AI Workforce Mission Tool Execution route upgrade');
  }
  if (source.includes('/api/ai-workforce/mission-execution-queue')) {
    if (source.includes('app.post("/api/ai-workforce/safety-preview"')) {
      return replaceOnce(source, 'app.post("/api/ai-workforce/safety-preview"', `${missionQueueResumeRoutes}\napp.post("/api/ai-workforce/safety-preview"`, 'AI Workforce Mission Queue resume route upgrade');
    }
    return replaceBeforeFirstAvailable(source, fallbackAnchors, missionQueueResumeRoutes, 'AI Workforce Mission Queue fallback route anchor');
  }
  if (source.includes('/api/ai-workforce/mission-plan')) {
    if (source.includes('app.post("/api/ai-workforce/safety-preview"')) {
      return replaceOnce(source, 'app.post("/api/ai-workforce/safety-preview"', `${missionExecutionQueueRoute}\n${missionQueueResumeRoutes}\napp.post("/api/ai-workforce/safety-preview"`, 'AI Workforce Mission Execution Queue route upgrade');
    }
    return replaceBeforeFirstAvailable(source, fallbackAnchors, `${missionExecutionQueueRoute}\n${missionQueueResumeRoutes}`, 'AI Workforce Mission Execution Queue fallback route anchor');
  }
  if (source.includes('/api/ai-workforce/context-pack')) {
    if (source.includes('app.post("/api/ai-workforce/safety-preview"')) {
      return replaceOnce(source, 'app.post("/api/ai-workforce/safety-preview"', `${missionPlanRoute}\n${missionExecutionQueueRoute}\n${missionQueueResumeRoutes}\napp.post("/api/ai-workforce/safety-preview"`, 'AI Workforce Mission Planner route upgrade');
    }
    return replaceBeforeFirstAvailable(source, fallbackAnchors, `${missionPlanRoute}\n${missionExecutionQueueRoute}\n${missionQueueResumeRoutes}`, 'AI Workforce Mission Planner fallback route anchor');
  }
  if (source.includes('/api/ai-workforce/github-pr-control')) return source;
  if (source.includes('/api/ai-workforce/pr-control')) {
    return replaceOnce(source, prControlRoute, `${prControlRoute}\n${githubPrControlRoute}`, 'AI Workforce GitHub PR Control route upgrade');
  }
  if (source.includes('/api/ai-workforce/pr-readiness')) {
    return replaceOnce(source, prReadinessRoute, `${prReadinessRoute}\n${prControlRoute}\n${githubPrControlRoute}`, 'AI Workforce PR Control route upgrade');
  }
  return replaceBeforeFirstAvailable(source, fallbackAnchors, runtimeRouteBlock, 'AI Workforce Runtime Hub route block');
}

const rendererPath = path.resolve('src/app/WorkspaceRenderer.tsx');
const daemonPath = path.resolve('server/assistant-daemon.ts');
const commandCenterPath = path.resolve('src/modules/ai-hr/AIWorkforceCommandCenter.tsx');
const operationsCenterPath = path.resolve('src/modules/ai-hr/AIOperationsCenter.tsx');

const operationsCenterSource = fs.existsSync(operationsCenterPath) ? fs.readFileSync(operationsCenterPath, 'utf8') : '';
const hasDirectCommandCenter = operationsCenterSource.includes("import AIWorkforceCommandCenter from './AIWorkforceCommandCenter';") && operationsCenterSource.includes('<AIWorkforceCommandCenter />');
const hasDirectRuntimePanel = operationsCenterSource.includes("import AIWorkforceRuntimePanel from './AIWorkforceRuntimePanel';") && operationsCenterSource.includes('<AIWorkforceRuntimePanel />');

const rendererChanged = hasDirectCommandCenter ? false : patchFile(rendererPath, (initialSource) => {
  let source = initialSource;

  source = replaceOnce(
    source,
    "const AgentAssemblyBuilder     = React.lazy(() => import('../modules/ai-hr/AgentAssemblyBuilder'));",
    "const AgentAssemblyBuilder     = React.lazy(() => import('../modules/ai-hr/AgentAssemblyBuilder'));\nconst AIWorkforceCommandCenter = React.lazy(() => import('../modules/ai-hr/AIWorkforceCommandCenter'));",
    'AgentAssemblyBuilder lazy import',
  );

  source = replaceOnce(
    source,
    "            {currentSubTabId === 'overview' && (\n              <div className=\"space-y-6\">\n                <AIOperationsCenter />",
    "            {currentSubTabId === 'overview' && (\n              <div className=\"space-y-6\">\n                <AIWorkforceCommandCenter />\n                <AIOperationsCenter />",
    'AI Workforce overview slot',
  );

  source = replaceOnce(
    source,
    "            {currentSubTabId === 'agents' && (\n              <div className=\"space-y-6\">\n                <AgentAssemblyBuilder />",
    "            {currentSubTabId === 'agents' && (\n              <div className=\"space-y-6\">\n                <AIWorkforceCommandCenter />\n                <AgentAssemblyBuilder />",
    'AI Workforce agents slot',
  );

  source = replaceOnce(
    source,
    "            {currentSubTabId === 'labs' && (\n              <div className=\"space-y-6\">\n                <PythonSandbox />",
    "            {currentSubTabId === 'labs' && (\n              <div className=\"space-y-6\">\n                <AIWorkforceCommandCenter />\n                <PythonSandbox />",
    'AI Workforce labs slot',
  );

  return source;
});

const commandCenterChanged = hasDirectRuntimePanel ? false : patchFile(commandCenterPath, (initialSource) => {
  let source = initialSource;

  source = replaceOnce(
    source,
    "} from '../../data/aiWorkforceCommandCenter';",
    "} from '../../data/aiWorkforceCommandCenter';\nimport AIWorkforceRuntimePanel from './AIWorkforceRuntimePanel';",
    'AI Workforce Runtime Panel import',
  );

  source = replaceOnce(
    source,
    "      <ShellCard className=\"border-amber-500/20\">",
    "      <AIWorkforceRuntimePanel />\n\n      <ShellCard className=\"border-amber-500/20\">",
    'AI Workforce Runtime Panel slot',
  );

  return source;
});

const daemonChanged = patchFile(daemonPath, (initialSource) => {
  let source = initialSource;
  source = ensureRuntimeHubImport(source);
  source = ensureRuntimeHubRoutes(source);
  return source;
});

if (hasDirectCommandCenter) console.log('AI Workforce Command Center is directly mounted in AIOperationsCenter.');
else if (rendererChanged) console.log('AI Workforce Command Center patched into WorkspaceRenderer.');
else console.log('AI Workforce Command Center patch already applied.');

if (hasDirectRuntimePanel) console.log('AI Workforce Runtime Panel is directly mounted in AIOperationsCenter.');
else if (commandCenterChanged) console.log('AI Workforce Runtime Panel patched into Command Center.');
else console.log('AI Workforce Runtime Panel already applied.');

if (daemonChanged) console.log('AI Workforce Runtime Hub routes patched into assistant-daemon.');
else console.log('AI Workforce Runtime Hub routes already applied.');
