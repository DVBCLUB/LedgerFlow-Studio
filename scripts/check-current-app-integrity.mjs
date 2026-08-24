#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const rendererPath = path.join(root, 'src', 'app', 'WorkspaceRenderer.tsx');
const navigationPath = path.join(root, 'src', 'app', 'companyNavigation.ts');
const registryPath = path.join(root, 'src', 'app', 'featureRegistry.ts');
const requiredFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/app/ErpApp.tsx',
  'src/app/WorkspaceRenderer.tsx',
  'src/app/companyNavigation.ts',
  'src/data/simulationRegistry.ts',
  'src/components/shared/FounderLabsDock.tsx',
];
const restoredPanels = [
  'AIWorkforceMissionTemplates', 'AIWorkforceMobileCommandCenter', 'AIWorkforceNextBackendActions',
  'AIWorkforceToolCatalog', 'AutomationRulesHealthPanel', 'Level6RobotSynthesizerPanel',
  'MissionReviewNoteSavePanel', 'MultiPlatformRobotSwarmPanel', 'OpenClawWebRobotPanel',
  'RobotFleetAnalyticsPanel', 'RobotLabPanel', 'WorldClassReadinessPanel', 'SystemStatusPage',
  'WebAISchedulerPanel',
];
const failures = [];

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) failures.push(`Missing runtime file: ${relativePath}`);
}

const renderer = fs.existsSync(rendererPath) ? fs.readFileSync(rendererPath, 'utf8') : '';
const navigation = fs.existsSync(navigationPath) ? fs.readFileSync(navigationPath, 'utf8') : '';
const registry = fs.existsSync(registryPath) ? fs.readFileSync(registryPath, 'utf8') : '';
const registeredFeatures = [...registry.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?component:\s*'([^']+)'[\s\S]*?status:\s*'(active|internal|planned)'[\s\S]*?source:\s*'([^']+)'[\s\S]*?\}/g)]
  .map((match) => ({ id: match[1], component: match[2], status: match[3], source: match[4] }));

if (!registry) failures.push('Feature Registry is missing: src/app/featureRegistry.ts');
if (!registeredFeatures.length) failures.push('Feature Registry has no parseable registrations.');

for (const panel of restoredPanels) {
  if (!renderer.includes(panel)) failures.push(`Restored panel is not wired into WorkspaceRenderer: ${panel}`);
}

for (const workspace of ['ai_factory', 'marketing_growth', 'analytics', 'product_studio', 'sales_crm']) {
  if (!navigation.includes(workspace)) failures.push(`Required company workspace is missing from navigation: ${workspace}`);
}

if (!renderer.includes('FounderLabsDock')) failures.push('FounderLabsDock is not reachable from the workspace renderer.');
if (!renderer.includes('Skeleton')) failures.push('Workspace lazy-loading fallback does not use the shared Skeleton component.');

const duplicateIds = registeredFeatures.filter((feature, index) => registeredFeatures.findIndex((candidate) => candidate.id === feature.id) !== index);
for (const feature of duplicateIds) failures.push(`Feature Registry has duplicate id: ${feature.id}`);

for (const feature of registeredFeatures) {
  if (!feature.source.includes('*') && !fs.existsSync(path.join(root, feature.source.replaceAll('/', path.sep)))) {
    failures.push(`Feature Registry source file is missing: ${feature.source}`);
  }
  if (feature.status === 'active' && !feature.component.includes('*')) {
    const isLazyLoaded = renderer.includes(`const ${feature.component} = React.lazy(`)
      || renderer.includes(`  ${feature.component},`); // WS barrel destructure
    const isRendered = renderer.includes(`<${feature.component}`);
    if (!isLazyLoaded || !isRendered) failures.push(`Active registry component is not fully wired into WorkspaceRenderer: ${feature.component}`);
  }
}

if (failures.length) {
  console.error('\nLedgerFlow current-app integrity check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('LedgerFlow current-app integrity check passed.');
}
