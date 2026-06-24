import { readFileSync, existsSync } from 'fs';

const checks = [];
let failures = 0;

function addCheck(name, pass, detail) {
  checks.push({ name, pass, detail });
  if (!pass) failures += 1;
}

function file(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const pkg = file('package.json');
const assistantApi = file('src/utils/assistantApi.ts');
const desktopWrapper = file('server/assistant-daemon-desktop.ts');
const daemon = file('server/assistant-daemon.ts');
const app = file('src/App.tsx');
const aiOps = file('src/modules/ai-hr/AIOperationsCenter.tsx');
const robotLab = file('src/modules/ai-hr/RobotLabPanel.tsx');
const automationPanel = file('src/modules/ai-hr/AutomationRulesPanel.tsx');
const memoryPanel = file('src/modules/ai-hr/AIMemoryRagPanel.tsx');
const knowledgeHub = file('src/modules/ai-hr/KnowledgeContentHubPanel.tsx');
const projectMemory = file('src/modules/analytics-sandbox/ProjectMemoryDecisionLog.tsx');
const gitPanel = file('src/modules/dev-ops/GitAssistantDaemonPanel.tsx');
const ciDoctor = file('src/modules/dev-ops/GitHubCIDoctorPanel.tsx');
const devOpsReleaseHub = file('src/modules/dev-ops/DevOpsReleaseHubPanel.tsx');
const releaseArtifact = file('src/modules/dev-ops/ReleaseArtifactCenter.tsx');
const securityHub = file('src/modules/dev-ops/SecuritySystemHubPanel.tsx');
const securityControl = file('src/modules/dev-ops/SecurityControlCenter.tsx');
const configHealth = file('src/modules/dev-ops/ConfigHealthMonitor.tsx');
const systemOverview = file('src/modules/dev-ops/SystemOverviewDaemonPanel.tsx');
const apiMatrix = file('src/modules/system-settings/components/ApiConnectionHealthMatrix.tsx');

addCheck('React namespace import is present', app.includes("import React,"), 'src/App.tsx must import React namespace for ErrorBoundary.');
addCheck('Desktop daemon wrapper exists', desktopWrapper.includes('startAssistantDaemon'), 'server/assistant-daemon-desktop.ts should call startAssistantDaemon().');
addCheck('Build uses desktop daemon wrapper', pkg.includes('server/assistant-daemon-desktop.ts') && pkg.includes('dist/assistant-daemon.cjs'), 'package.json build should bundle the wrapper to dist/assistant-daemon.cjs.');
addCheck('Daemon exports start function', daemon.includes('export function startAssistantDaemon'), 'assistant-daemon.ts must export startAssistantDaemon().');
addCheck('Daemon has system overview route', daemon.includes('/api/system/overview'), 'assistant daemon should expose /api/system/overview.');

const requiredRoutes = [
  '/api/agent-runtime/metrics',
  '/api/agent-runtime/runs',
  '/api/agent-runtime/emergency-stop',
  '/api/robot-simulation/status',
  '/api/robot-simulation/command',
  '/api/automation-rules',
  '/api/automation-rules/logs',
  '/api/agent-memory/search',
  '/api/vectors/search',
  '/api/vectors/namespaces',
  '/api/document/structure',
  '/api/prompts/templates',
  '/api/prompts/runs',
  '/api/content/assets',
  '/api/kb/search',
  '/api/context/windows',
  '/api/git/status',
  '/api/git/diff',
  '/api/git/commit-msg',
  '/api/ci-doctor/context',
  '/api/ci-doctor/analyze',
  '/api/deploy/configs',
  '/api/deploy/runs',
  '/api/snapshot',
  '/api/plugins',
  '/api/drift/reports',
  '/api/deps/reports',
  '/api/sast/reports',
  '/api/logs/analyses',
  '/api/perf/profiles',
];

for (const route of requiredRoutes) {
  addCheck(`Daemon route exists: ${route}`, daemon.includes(route), `assistant-daemon.ts should include ${route}.`);
}

addCheck('assistantApi keeps daemonFetch export', assistantApi.includes('export async function daemonFetch'), 'daemonFetch must stay exported for daemon-backed panels.');
addCheck('assistantApi keeps legacy WebAIProfile export', assistantApi.includes('export interface WebAIProfile'), 'Legacy AI assistant tabs import WebAIProfile.');
addCheck('assistantApi keeps legacy executeWebAI export', assistantApi.includes('export async function executeWebAI'), 'Legacy AI assistant tabs import executeWebAI.');
addCheck('assistantApi keeps legacy agent runtime exports', assistantApi.includes('export async function fetchAgentRuns') && assistantApi.includes('export async function createAgentRun'), 'PeopleTab and sandbox import agent runtime helpers.');

addCheck('AI Operations uses daemon-backed panel', aiOps.includes('AIOperationsDaemonPanel'), 'AIOperationsCenter should delegate to daemon-backed panel.');
addCheck('Robot Lab uses daemonFetch', robotLab.includes('daemonFetch') && robotLab.includes('/api/robot-simulation/status'), 'RobotLabPanel should call daemon-backed robot simulation routes.');
addCheck('Automation Rules uses health panel', automationPanel.includes('AutomationRulesHealthPanel'), 'AutomationRulesPanel should delegate to daemon-backed health panel.');
addCheck('Memory/RAG panel uses daemon routes', memoryPanel.includes('/api/agent-memory/search') && memoryPanel.includes('/api/vectors/search'), 'AIMemoryRagPanel should use daemon memory/vector routes.');
addCheck('Knowledge Content hub uses knowledge routes', knowledgeHub.includes('/api/agent-memory/search') && knowledgeHub.includes('/api/prompts/templates') && knowledgeHub.includes('/api/content/assets') && knowledgeHub.includes('/api/context/windows'), 'KnowledgeContentHubPanel should aggregate memory, prompt, content and context routes.');
addCheck('Project Memory delegates to Knowledge Content hub', projectMemory.includes('KnowledgeContentHubPanel'), 'ProjectMemoryDecisionLog should delegate to the Knowledge Content hub.');
addCheck('Git Assistant uses daemon routes', gitPanel.includes('/api/git/status') && gitPanel.includes('/api/git/pr-desc'), 'GitAssistantDaemonPanel should use daemon git routes.');
addCheck('CI Doctor uses daemon routes', ciDoctor.includes('/api/ci-doctor/context') && ciDoctor.includes('/api/ci-doctor/analyze'), 'GitHubCIDoctorPanel should use daemon ci-doctor routes.');
addCheck('DevOps release hub uses release pipeline routes', devOpsReleaseHub.includes('/api/deploy/configs') && devOpsReleaseHub.includes('/api/snapshot') && devOpsReleaseHub.includes('/api/ci-doctor/context'), 'DevOpsReleaseHubPanel should aggregate Git, CI, deploy and snapshot routes.');
addCheck('Release Artifacts delegates to DevOps hub', releaseArtifact.includes('DevOpsReleaseHubPanel'), 'ReleaseArtifactCenter should delegate to the DevOps release hub.');
addCheck('Security System hub uses risk/health routes', securityHub.includes('/api/plugins') && securityHub.includes('/api/sast/reports') && securityHub.includes('/api/logs/analyses') && securityHub.includes('/api/perf/profiles'), 'SecuritySystemHubPanel should aggregate plugin, SAST, logs and perf routes.');
addCheck('Security Control delegates to Security System hub', securityControl.includes('SecuritySystemHubPanel'), 'SecurityControlCenter should delegate to the Security System hub.');
addCheck('Config Health delegates to system overview', configHealth.includes('SystemOverviewDaemonPanel'), 'ConfigHealthMonitor should use the daemon-backed system overview.');
addCheck('System Overview uses daemon route', systemOverview.includes('/api/system/overview'), 'SystemOverviewDaemonPanel should call /api/system/overview.');
addCheck('API health matrix checks assistant routes', apiMatrix.includes('/api/agent-runtime/metrics') && apiMatrix.includes('/api/robot-simulation/status'), 'APIConnectionHealthMatrix should check daemon-backed routes.');

console.log('\nAI desktop integration contract check');
console.log('====================================');
for (const check of checks) {
  console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
  if (!check.pass) console.log(`   ${check.detail}`);
}

if (failures > 0) {
  console.error(`\n${failures} integration contract check(s) failed.`);
  process.exit(1);
}

console.log('\nAll AI desktop integration contract checks passed.');
