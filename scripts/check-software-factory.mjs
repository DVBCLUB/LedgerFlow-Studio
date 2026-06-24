import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'server/software-factory-daemon.ts',
  'server/services/softwareFactoryService.ts',
  'server/services/softwareFactoryRoutes.ts',
  'server/services/softwareFactoryExecutionService.ts',
  'server/services/softwareFactoryProviderRuntime.ts',
  'server/services/softwareFactoryAssetService.ts',
  'server/services/softwareFactoryCommandRunner.ts',
  'server/services/softwareFactoryAuditLogService.ts',
  'server/services/softwareFactoryHealthService.ts',
  'src/modules/ai-hr/FactoryBackendRuntimePanel.tsx',
  'src/modules/ai-hr/FactoryExecutionDecisionPanel.tsx',
  'src/modules/ai-hr/FactoryCommandRunnerPanel.tsx',
  'src/modules/ai-hr/FactoryAuditLogPanel.tsx',
  'src/modules/ai-hr/FactoryHealthSummaryPanel.tsx',
  'src/modules/ai-hr/AutomationRulesPanel.tsx',
];

const requiredRouteMarkers = [
  'router.get("/health-summary"',
  'router.get("/runs"',
  'router.post("/runs/:id/executions"',
  'router.post("/executions/:id/provider-decision"',
  'router.get("/commands/catalog"',
  'router.post("/commands/run"',
  'router.post("/commands/:id/link"',
  'router.get("/audit"',
  'router.get("/assets"',
  'router.get("/release-kit"',
  'router.get("/git/status"',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length > 0) {
  console.error('Missing Software Factory files:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

const routes = read('server/services/softwareFactoryRoutes.ts');
const missingRoutes = requiredRouteMarkers.filter((marker) => !routes.includes(marker));
if (missingRoutes.length > 0) {
  console.error('Missing Software Factory route markers:');
  for (const item of missingRoutes) console.error(`- ${item}`);
  process.exit(1);
}

const automationPanel = read('src/modules/ai-hr/AutomationRulesPanel.tsx');
const requiredPanels = [
  '<FactoryHealthSummaryPanel />',
  '<FactoryBackendRuntimePanel />',
  '<FactoryExecutionDecisionPanel />',
  '<FactoryCommandRunnerPanel />',
  '<FactoryAuditLogPanel />',
];
const missingPanels = requiredPanels.filter((marker) => !automationPanel.includes(marker));
if (missingPanels.length > 0) {
  console.error('Missing Software Factory UI panel markers:');
  for (const item of missingPanels) console.error(`- ${item}`);
  process.exit(1);
}

console.log('Software Factory checks passed.');
console.log(`Validated ${requiredFiles.length} files, ${requiredRouteMarkers.length} routes and ${requiredPanels.length} UI panels.`);
