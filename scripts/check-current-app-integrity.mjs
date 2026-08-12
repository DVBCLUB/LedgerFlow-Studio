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

if (!registry) failures.push('Feature Registry is missing: src/app/featureRegistry.ts');

for (const panel of restoredPanels) {
  if (!renderer.includes(panel)) failures.push(`Restored panel is not wired into WorkspaceRenderer: ${panel}`);
}

for (const workspace of ['ai_factory', 'marketing_growth', 'analytics', 'product_studio', 'sales_crm']) {
  if (!navigation.includes(workspace)) failures.push(`Required company workspace is missing from navigation: ${workspace}`);
}

if (!renderer.includes('FounderLabsDock')) failures.push('FounderLabsDock is not reachable from the workspace renderer.');
if (!renderer.includes('Skeleton')) failures.push('Workspace lazy-loading fallback does not use the shared Skeleton component.');

for (const component of [...registry.matchAll(/component:\s*'([^']+)'/g)].map((match) => match[1]).filter((name) => !name.includes('*'))) {
  if (!renderer.includes(component)) failures.push(`Active registry component is not referenced by WorkspaceRenderer: ${component}`);
}

if (failures.length) {
  console.error('\nLedgerFlow current-app integrity check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('LedgerFlow current-app integrity check passed.');
