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
const hubDirectory = file('docs/INTEGRATED_HUB_DIRECTORY.md');
const hubTestPlan = file('docs/INTEGRATED_HUB_TEST_PLAN.md');
const hubReleaseNotes = file('docs/INTEGRATED_HUB_RELEASE_NOTES.md');
const hubMilestoneTracker = file('docs/INTEGRATED_HUB_MILESTONE_TRACKER.md');
const subNavigation = file('src/components/shared/WorkspaceSubNavigation.tsx');
const aiOps = file('src/modules/ai-hr/AIOperationsCenter.tsx');
const aiCommandHub = file('src/modules/ai-hr/AICommandCenterHubPanel.tsx');
const aiGovernance = file('src/modules/ai-hr/AIGovernanceQualityHubPanel.tsx');
const robotLab = file('src/modules/ai-hr/RobotLabPanel.tsx');
const automationPanel = file('src/modules/ai-hr/AutomationRulesPanel.tsx');
const automationHub = file('src/modules/ai-hr/AutomationRobotControlHubPanel.tsx');
const automationBridge = file('src/modules/ai-hr/AutomationBridgeHubPanel.tsx');
const memoryPanel = file('src/modules/ai-hr/AIMemoryRagPanel.tsx');
const knowledgeHub = file('src/modules/ai-hr/KnowledgeContentHubPanel.tsx');
const patchSafetyRunbook = file('src/modules/ai-hr/AIWorkforcePatchSafetyRunbook.tsx');
const skillDirectory = file('src/modules/ai-hr/AIWorkforceSkillDirectory.tsx');
const skillPlanner = file('src/modules/ai-hr/AIWorkforceSkillInvocationPlanner.tsx');
const robotAutomationBridge = file('src/modules/ai-hr/AIWorkforceRobotAutomationBridge.tsx');
const projectMemory = file('src/modules/analytics-sandbox/ProjectMemoryDecisionLog.tsx');
const gitPanel = file('src/modules/dev-ops/GitAssistantDaemonPanel.tsx');
const ciDoctor = file('src/modules/dev-ops/GitHubCIDoctorPanel.tsx');
const devOpsReleaseHub = file('src/modules/dev-ops/DevOpsReleaseHubPanel.tsx');
const developerIntelligence = file('src/modules/dev-ops/DeveloperIntelligenceHubPanel.tsx');
const releaseArtifact = file('src/modules/dev-ops/ReleaseArtifactCenter.tsx');
const securityHub = file('src/modules/dev-ops/SecuritySystemHubPanel.tsx');
const securityControl = file('src/modules/dev-ops/SecurityControlCenter.tsx');
const configHealth = file('src/modules/dev-ops/ConfigHealthMonitor.tsx');
const systemOverview = file('src/modules/dev-ops/SystemOverviewDaemonPanel.tsx');
const platformServices = file('src/modules/dev-ops/PlatformServicesHubPanel.tsx');
const apiMatrix = file('src/modules/system-settings/components/ApiConnectionHealthMatrix.tsx');

addCheck('React namespace import is present', app.includes("import React,"), 'src/App.tsx must import React namespace for ErrorBoundary.');
addCheck('Desktop daemon wrapper exists', desktopWrapper.includes('startAssistantDaemon'), 'server/assistant-daemon-desktop.ts should call startAssistantDaemon().');
addCheck('Build uses desktop daemon wrapper', pkg.includes('server/assistant-daemon-desktop.ts') && pkg.includes('dist/assistant-daemon.cjs'), 'package.json build should bundle the wrapper to dist/assistant-daemon.cjs.');
addCheck('Daemon exports start function', daemon.includes('export function startAssistantDaemon'), 'assistant-daemon.ts must export startAssistantDaemon().');
addCheck('Daemon has system overview route', daemon.includes('/api/system/overview'), 'assistant daemon should expose /api/system/overview.');

const requiredRoutes = [
  '/api/status',
  '/api/roles',
  '/api/ai-fabric/health',
  '/api/control-plane/runs',
  '/api/agent-runtime/metrics',
  '/api/agent-runtime/runs',
  '/api/agent-runtime/emergency-stop',
  '/api/robot-simulation/status',
  '/api/robot-simulation/command',
  '/api/robot-simulation/emergency-stop',
  '/api/automation-rules',
  '/api/automation-rules/logs',
  '/api/agent-workflows/templates',
  '/api/agent-workflows',
  '/api/streams/pipelines',
  '/api/streams/events',
  '/api/notify/templates',
  '/api/notify/events',
  '/api/webhooks/rules',
  '/api/webhooks/events',
  '/api/tools',
  '/api/swarm/agents',
  '/api/swarm/missions',
  '/api/telemetry/latest',
  '/api/telemetry/history',
  '/api/telemetry/metrics',
  '/api/intent/classify',
  '/api/validate',
  '/api/validate/rules',
  '/api/explain/traces',
  '/api/finetune/pairs',
  '/api/finetune/datasets',
  '/api/agent-memory/search',
  '/api/vectors/search',
  '/api/vectors/namespaces',
  '/api/document/structure',
  '/api/prompts/templates',
  '/api/prompts/runs',
  '/api/content/assets',
  '/api/kb/search',
  '/api/context/windows',
  '/api/jobs',
  '/api/openapi/routes',
  '/api/openapi/save',
  '/api/gateway/health',
  '/api/gateway/configs',
  '/api/timeline',
  '/api/timeline/generate',
  '/api/robot/generate',
  '/api/git/status',
  '/api/git/diff',
  '/api/git/commit-msg',
  '/api/ci-doctor/context',
  '/api/ci-doctor/analyze',
  '/api/deploy/configs',
  '/api/deploy/runs',
  '/api/snapshot',
  '/api/architecture/graphs',
  '/api/architecture/generate',
  '/api/testgen/suites',
  '/api/testgen/generate',
  '/api/docs',
  '/api/docs/generate',
  '/api/review/reviewers',
  '/api/review/runs',
  '/api/refactor/scan',
  '/api/plugins',
  '/api/drift/reports',
  '/api/deps/reports',
  '/api/sast/reports',
  '/api/logs/analyses',
  '/api/perf/profiles',
  '/api/openclaw-skills',
  '/api/robot-capabilities',
  '/api/automation-scheduler/status',
];

for (const route of requiredRoutes) {
  addCheck(`Daemon route exists: ${route}`, daemon.includes(route), `assistant-daemon.ts should include ${route}.`);
}

addCheck('assistantApi keeps daemonFetch export', assistantApi.includes('export async function daemonFetch'), 'daemonFetch must stay exported for daemon-backed panels.');
addCheck('assistantApi keeps legacy WebAIProfile export', assistantApi.includes('export interface WebAIProfile'), 'Legacy AI assistant tabs import WebAIProfile.');
addCheck('assistantApi keeps legacy executeWebAI export', assistantApi.includes('export async function executeWebAI'), 'Legacy AI assistant tabs import executeWebAI.');
addCheck('assistantApi keeps legacy agent runtime exports', assistantApi.includes('export async function fetchAgentRuns') && assistantApi.includes('export async function createAgentRun'), 'PeopleTab and sandbox import agent runtime helpers.');

addCheck('Integrated hub directory exists', hubDirectory.includes('LedgerFlow Integrated Hub Directory') && hubDirectory.includes('AI Command Center') && hubDirectory.includes('Automation & Robot Control') && hubDirectory.includes('Knowledge & Content Studio') && hubDirectory.includes('DevOps & Release Center') && hubDirectory.includes('Security & System Health'), 'docs/INTEGRATED_HUB_DIRECTORY.md should document the main integrated hubs and app locations.');
addCheck('Integrated hub test plan exists', hubTestPlan.includes('Integrated Hub Test Plan') && hubTestPlan.includes('AI Command Center') && hubTestPlan.includes('Automation & Robot Control') && hubTestPlan.includes('Knowledge & Content Studio') && hubTestPlan.includes('DevOps & Release Center') && hubTestPlan.includes('Release gate'), 'docs/INTEGRATED_HUB_TEST_PLAN.md should document smoke tests and release gates for integrated hubs.');
addCheck('Integrated hub release notes exist', hubReleaseNotes.includes('Integrated Hub Release Notes') && hubReleaseNotes.includes('New / consolidated hubs') && hubReleaseNotes.includes('Recommended local validation') && hubReleaseNotes.includes('Known limitations'), 'docs/INTEGRATED_HUB_RELEASE_NOTES.md should summarize the integrated hub milestone and validation steps.');
addCheck('Integrated hub milestone tracker exists', hubMilestoneTracker.includes('Integrated Hub Milestone Tracker') && hubMilestoneTracker.includes('Release gate') && hubMilestoneTracker.includes('Next local test pass notes'), 'docs/INTEGRATED_HUB_MILESTONE_TRACKER.md should track the final release validation checklist.');
addCheck('Hub labels are surfaced in subnavigation', subNavigation.includes('INTEGRATED_HUB_LABELS') && subNavigation.includes('AI Command Center') && subNavigation.includes('Automation & Robot Control') && subNavigation.includes('Knowledge & Content Studio') && subNavigation.includes('DevOps & Release Center') && subNavigation.includes('Security & System Health'), 'WorkspaceSubNavigation should show user-facing hub labels while keeping old route ids.');
addCheck('AI Command Center hub uses command routes', aiCommandHub.includes('/api/agent-runtime/metrics') && aiCommandHub.includes('/api/roles') && aiCommandHub.includes('/api/ai-fabric/health') && aiCommandHub.includes('/api/control-plane/runs'), 'AICommandCenterHubPanel should aggregate runtime, roles, fabric and control plane routes.');
addCheck('AI Governance hub uses quality routes', aiGovernance.includes('/api/intent/classify') && aiGovernance.includes('/api/validate') && aiGovernance.includes('/api/explain/traces') && aiGovernance.includes('/api/finetune/pairs') && aiGovernance.includes('/api/telemetry/metrics'), 'AIGovernanceQualityHubPanel should aggregate intent, validation, explainability, fine-tune and telemetry routes.');
addCheck('AI Operations renders command and governance hubs', aiOps.includes('AICommandCenterHubPanel') && aiOps.includes('AIGovernanceQualityHubPanel'), 'AIOperationsCenter should render both AI Command Center and Governance panels.');
addCheck('AI Operations renders OpenClaw panels', aiOps.includes('AIWorkforcePatchSafetyRunbook') && aiOps.includes('AIWorkforceSkillDirectory') && aiOps.includes('AIWorkforceSkillInvocationPlanner') && aiOps.includes('AIWorkforceRobotAutomationBridge'), 'AIOperationsCenter should render OpenClaw safety, skill and robot automation panels.');
addCheck('OpenClaw safety runbook is visible', patchSafetyRunbook.includes('Patch Safety Runbook') && patchSafetyRunbook.includes('Safety checklist'), 'AIWorkforcePatchSafetyRunbook should provide visible safety guidance.');
addCheck('OpenClaw skill directory uses daemon route', skillDirectory.includes('/api/openclaw-skills') && skillDirectory.includes('OpenClaw Skill Directory'), 'AIWorkforceSkillDirectory should call the daemon OpenClaw skill route.');
addCheck('OpenClaw skill planner uses daemon route', skillPlanner.includes('/api/openclaw-skills') && skillPlanner.includes('plan-invocation'), 'AIWorkforceSkillInvocationPlanner should call skill planning endpoints.');
addCheck('Robot automation bridge uses daemon routes', robotAutomationBridge.includes('/api/robot-capabilities') && robotAutomationBridge.includes('/api/automation-scheduler/status'), 'AIWorkforceRobotAutomationBridge should call robot capability and scheduler routes.');
addCheck('Robot Lab uses daemonFetch', robotLab.includes('daemonFetch') && robotLab.includes('/api/robot-simulation/status'), 'RobotLabPanel should call daemon-backed robot simulation routes.');
addCheck('Automation Robot hub uses control routes', automationHub.includes('/api/robot-simulation/status') && automationHub.includes('/api/automation-rules') && automationHub.includes('/api/agent-workflows') && automationHub.includes('/api/notify/events'), 'AutomationRobotControlHubPanel should aggregate robot, automation, workflow, stream and notification routes.');
addCheck('Automation Bridge hub uses bridge routes', automationBridge.includes('/api/webhooks/rules') && automationBridge.includes('/api/tools') && automationBridge.includes('/api/swarm/agents') && automationBridge.includes('/api/telemetry/latest'), 'AutomationBridgeHubPanel should aggregate webhook, tool router, swarm and telemetry routes.');
addCheck('Automation Rules renders automation and bridge hubs', automationPanel.includes('AutomationRobotControlHubPanel') && automationPanel.includes('AutomationBridgeHubPanel'), 'AutomationRulesPanel should render both automation control and bridge hub panels.');
addCheck('Memory/RAG panel uses daemon routes', memoryPanel.includes('/api/agent-memory/search') && memoryPanel.includes('/api/vectors/search'), 'AIMemoryRagPanel should use daemon memory/vector routes.');
addCheck('Knowledge Content hub uses knowledge routes', knowledgeHub.includes('/api/agent-memory/search') && knowledgeHub.includes('/api/prompts/templates') && knowledgeHub.includes('/api/content/assets') && knowledgeHub.includes('/api/context/windows'), 'KnowledgeContentHubPanel should aggregate memory, prompt, content and context routes.');
addCheck('Project Memory delegates to Knowledge Content hub', projectMemory.includes('KnowledgeContentHubPanel'), 'ProjectMemoryDecisionLog should delegate to the Knowledge Content hub.');
addCheck('Git Assistant uses daemon routes', gitPanel.includes('/api/git/status') && gitPanel.includes('/api/git/pr-desc'), 'GitAssistantDaemonPanel should use daemon git routes.');
addCheck('CI Doctor uses daemon routes', ciDoctor.includes('/api/ci-doctor/context') && ciDoctor.includes('/api/ci-doctor/analyze'), 'GitHubCIDoctorPanel should use daemon ci-doctor routes.');
addCheck('DevOps release hub uses release pipeline routes', devOpsReleaseHub.includes('/api/deploy/configs') && devOpsReleaseHub.includes('/api/snapshot') && devOpsReleaseHub.includes('/api/ci-doctor/context'), 'DevOpsReleaseHubPanel should aggregate Git, CI, deploy and snapshot routes.');
addCheck('Developer Intelligence hub uses dev support routes', developerIntelligence.includes('/api/architecture/graphs') && developerIntelligence.includes('/api/testgen/suites') && developerIntelligence.includes('/api/docs') && developerIntelligence.includes('/api/review/runs') && developerIntelligence.includes('/api/refactor/scan'), 'DeveloperIntelligenceHubPanel should aggregate architecture, tests, docs, review and refactor routes.');
addCheck('Release Artifacts renders DevOps and Developer Intelligence hubs', releaseArtifact.includes('DevOpsReleaseHubPanel') && releaseArtifact.includes('DeveloperIntelligenceHubPanel'), 'ReleaseArtifactCenter should render DevOps release and Developer Intelligence hub panels.');
addCheck('Security System hub uses risk/health routes', securityHub.includes('/api/plugins') && securityHub.includes('/api/sast/reports') && securityHub.includes('/api/logs/analyses') && securityHub.includes('/api/perf/profiles'), 'SecuritySystemHubPanel should aggregate plugin, SAST, logs and perf routes.');
addCheck('Security Control delegates to Security System hub', securityControl.includes('SecuritySystemHubPanel'), 'SecurityControlCenter should delegate to the Security System hub.');
addCheck('Config Health renders system overview and Platform Services hubs', configHealth.includes('SystemOverviewDaemonPanel') && configHealth.includes('PlatformServicesHubPanel'), 'ConfigHealthMonitor should render both system overview and platform services panels.');
addCheck('System Overview uses daemon route', systemOverview.includes('/api/system/overview'), 'SystemOverviewDaemonPanel should call /api/system/overview.');
addCheck('Platform Services hub uses platform routes', platformServices.includes('/api/jobs') && platformServices.includes('/api/openapi/routes') && platformServices.includes('/api/gateway/health') && platformServices.includes('/api/timeline') && platformServices.includes('/api/robot/generate'), 'PlatformServicesHubPanel should aggregate jobs, OpenAPI, gateway, timeline and robot generator routes.');
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
