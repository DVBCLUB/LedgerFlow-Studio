import fs from 'node:fs';
import path from 'node:path';

function patchFile(filePath, patcher) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
  const source = fs.readFileSync(filePath, 'utf8');
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

const rendererPath = path.resolve('src/app/WorkspaceRenderer.tsx');
const daemonPath = path.resolve('server/assistant-daemon.ts');
const commandCenterPath = path.resolve('src/modules/ai-hr/AIWorkforceCommandCenter.tsx');

const rendererChanged = patchFile(rendererPath, (initialSource) => {
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

const commandCenterChanged = patchFile(commandCenterPath, (initialSource) => {
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

  source = replaceOnce(
    source,
    'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";',
    'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";\nimport { buildRuntimeGroundedContext, buildRuntimePRControlReport, getAIWorkforceRuntimeDashboard, previewRuntimeAutomation, scoreRuntimePRReadiness } from "./services/aiWorkforceRuntimeHub";',
    'AI Workforce Runtime Hub import',
  );

  source = replaceOnce(
    source,
    '// ---------------------------------------------------------------------------\n// Unified System Overview (cross-service data linker)\n// ---------------------------------------------------------------------------',
    `// ---------------------------------------------------------------------------
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
app.post("/api/ai-workforce/safety-preview", async (req: Request, res: Response) => {
  try {
    const decision = await previewRuntimeAutomation(req.body as any);
    res.json({ ok: true, decision });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/pr-readiness", async (req: Request, res: Response) => {
  try {
    const report = await scoreRuntimePRReadiness(req.body as any);
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/pr-control", async (req: Request, res: Response) => {
  try {
    const report = await buildRuntimePRControlReport(req.body as any);
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Unified System Overview (cross-service data linker)
// ---------------------------------------------------------------------------`,
    'AI Workforce Runtime Hub route block',
  );

  return source;
});

if (rendererChanged) console.log('AI Workforce Command Center patched into WorkspaceRenderer.');
else console.log('AI Workforce Command Center patch already applied.');

if (commandCenterChanged) console.log('AI Workforce Runtime Panel patched into Command Center.');
else console.log('AI Workforce Runtime Panel already applied.');

if (daemonChanged) console.log('AI Workforce Runtime Hub routes patched into assistant-daemon.');
else console.log('AI Workforce Runtime Hub routes already applied.');
