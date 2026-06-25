import fs from 'fs';
import path from 'path';

const root = process.cwd();
const componentDir = path.join(root, 'src', 'components');
const registryPath = path.join(root, 'src', 'data', 'simulationRegistry.ts');
const appPath = path.join(root, 'src', 'app', 'ErpApp.tsx');
const mainPath = path.join(root, 'src', 'main.tsx');
const dockPath = path.join(componentDir, 'shared', 'FounderLabsDock.tsx');
const workspaceRendererPath = path.join(root, 'src', 'app', 'WorkspaceRenderer.tsx');
const companyNavPath = path.join(root, 'src', 'app', 'companyNavigation.ts');
const searchDirs = [
  path.join(root, 'src', 'modules', 'product-studio'),
  path.join(root, 'src', 'modules', 'marketing-growth'),
  path.join(root, 'src', 'modules', 'sales-crm'),
  path.join(root, 'src', 'modules', 'ai-hr'),
  path.join(root, 'src', 'modules', 'analytics-sandbox'),
  path.join(root, 'src', 'modules', 'finance-accounting'),
  path.join(root, 'src', 'modules', 'dev-ops'),
  path.join(root, 'src', 'modules', 'command-center'),
  path.join(root, 'src', 'components'),
  path.join(root, 'src', 'components', 'agent-ops', 'tabs')
];

function findComponentFile(name) {
  for (const dir of searchDirs) {
    for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
      const fullPath = path.join(dir, name + ext);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  return null;
}

const analyticsWorkspacePath = findComponentFile('AnalyticsWorkspace') || path.join(componentDir, 'AnalyticsWorkspace.tsx');


function parseRegistryComponents() {
  if (!fs.existsSync(registryPath)) {
    return { components: [], ids: [], routes: [], errors: ['Missing simulation registry: src/data/simulationRegistry.ts'] };
  }

  const registryContent = fs.readFileSync(registryPath, 'utf8');
  const componentMatches = [...registryContent.matchAll(/component:\s*'([^']+)'/g)].map((match) => match[1]);
  const idMatches = [...registryContent.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
  const routeMatches = [...registryContent.matchAll(/route:\s*'([^']+)'/g)].map((match) => match[1]);
  const parseErrors = [];

  if (componentMatches.length === 0) {
    parseErrors.push('Simulation registry has no component entries.');
  }

  if (new Set(componentMatches).size !== componentMatches.length) {
    parseErrors.push('Simulation registry has duplicate component names.');
  }

  if (new Set(idMatches).size !== idMatches.length) {
    parseErrors.push('Simulation registry has duplicate ids.');
  }

  if (new Set(routeMatches).size !== routeMatches.length) {
    parseErrors.push('Simulation registry has duplicate routes.');
  }

  return { components: componentMatches, ids: idMatches, routes: routeMatches, errors: parseErrors };
}

const registry = parseRegistryComponents();
const criticalModules = registry.components;

const requiredRuntimeFiles = [
  'src/app/ErpApp.tsx',
  'src/app/WorkspaceRenderer.tsx',
  'src/app/companyNavigation.ts',
  'src/main.tsx',
  'src/store/useStore.ts',
  'src/utils/dbSync.ts',
  'src/utils/supabaseSync.ts',
  'src/data/simulationRegistry.ts',
  'server.ts',
  'desktop/main.cjs',
  'vite.config.ts',
  'package.json'
];

const errors = [...registry.errors];
const warnings = [];

for (const relativePath of requiredRuntimeFiles) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required runtime file: ${relativePath}`);
  }
}

for (const moduleName of criticalModules) {
  const existingPath = findComponentFile(moduleName);

  if (!existingPath) {
    errors.push(`Missing critical simulation component: ${moduleName}`);
    continue;
  }

  const content = fs.readFileSync(existingPath, 'utf8');
  if (!/export\s+default|export\s*\{/.test(content)) {
    errors.push(`Component may not export anything: ${path.relative(root, existingPath)}`);
  }
}

const appContent = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
const mainContent = fs.existsSync(mainPath) ? fs.readFileSync(mainPath, 'utf8') : '';
const dockContent = fs.existsSync(dockPath) ? fs.readFileSync(dockPath, 'utf8') : '';
const workspaceRendererContent = fs.existsSync(workspaceRendererPath) ? fs.readFileSync(workspaceRendererPath, 'utf8') : '';
const companyNavContent = fs.existsSync(companyNavPath) ? fs.readFileSync(companyNavPath, 'utf8') : '';
const analyticsWorkspaceContent = fs.existsSync(analyticsWorkspacePath) ? fs.readFileSync(analyticsWorkspacePath, 'utf8') : '';

const dockHostedRoutes = new Set([
  '/strategic_labs',
  '/finance_lab_mini',
  '/distribution_lead_board',
  '/persona_interview_lab',
  '/experiment_decision_log',
  '/experiment_dashboard'
]);

const dockHostedComponents = new Set([
  'StrategicLabsMini',
  'FinanceLabMini',
  'DistributionLeadBoard',
  'PersonaInterviewLab',
  'ExperimentDecisionLog',
  'ExperimentDashboard'
]);

const workspaceRendererEmbedsFounderLabsDock =
  workspaceRendererContent.includes('FounderLabsDock embedded') ||
  workspaceRendererContent.includes('<FounderLabsDock');

const rendersFounderLabsDock =
  appContent.includes('FounderLabsDock') ||
  mainContent.includes('FounderLabsDock') ||
  workspaceRendererEmbedsFounderLabsDock ||
  (workspaceRendererContent.includes('AnalyticsWorkspace') && analyticsWorkspaceContent.includes('FounderLabsDock'));

if (dockHostedComponents.size > 0 && !rendersFounderLabsDock) {
  errors.push('App/main runtime does not render FounderLabsDock. Dock-hosted simulation modules would be hidden from the app.');
}

if (mainContent.includes('FounderLabsDock') && !mainContent.includes("./components/FounderLabsDock")) {
  warnings.push('src/main.tsx mentions FounderLabsDock but may not import it from ./components/FounderLabsDock.tsx.');
}

for (const moduleName of criticalModules) {
  const existingPath = findComponentFile(moduleName);
  if (!existingPath) continue;

  const projectRelPath = path.relative(root, existingPath).replace(/\\/g, '/').replace(/\.tsx?$|\.jsx?$/, '');
  
  // Calculate relative paths from WorkspaceRenderer and FounderLabsDock
  const relFromRenderer = path.relative(path.join(root, 'src', 'app'), existingPath).replace(/\\/g, '/').replace(/\.tsx?$|\.jsx?$/, '');
  const relFromDock = path.relative(path.join(root, 'src', 'components', 'shared'), existingPath).replace(/\\/g, '/').replace(/\.tsx?$|\.jsx?$/, '');
  const relFromAnalytics = path.relative(path.dirname(analyticsWorkspacePath), existingPath).replace(/\\/g, '/').replace(/\.tsx?$|\.jsx?$/, '');

  const appOrRendererLoadsModule =
    appContent.includes(relFromRenderer) ||
    workspaceRendererContent.includes(relFromRenderer) ||
    analyticsWorkspaceContent.includes(relFromAnalytics) ||
    appContent.includes(projectRelPath) ||
    workspaceRendererContent.includes(projectRelPath);

  const dockLoadsModule = dockContent.includes(relFromDock);

  if (!appOrRendererLoadsModule && !dockLoadsModule) {
    errors.push(`Registry module is not lazy-loaded by the app runtime or FounderLabsDock.tsx: ${moduleName}`);
  }

  if (dockHostedComponents.has(moduleName) && !dockLoadsModule) {
    errors.push(`Dock-hosted registry module is missing from FounderLabsDock.tsx: ${moduleName}`);
  }

  if (!dockHostedComponents.has(moduleName) && !appOrRendererLoadsModule) {
    errors.push(`WorkspaceRenderer.tsx does not lazy-load routed registry module: ${moduleName}`);
  }
}

for (const route of registry.routes) {
  const routeKey = route.replace(/^\//, '');
  const appHasRoute =
    appContent.includes(`'${routeKey}'`) ||
    appContent.includes(`"${routeKey}"`) ||
    companyNavContent.includes(`'${routeKey}'`) ||
    companyNavContent.includes(`"${routeKey}"`);
  const isDockHosted = dockHostedRoutes.has(route);

  if (!appHasRoute && !isDockHosted) {
    errors.push(`Company navigation may not include route/tab key for registry route: ${route}`);
  }

  if (isDockHosted && !dockContent) {
    errors.push(`Registry route is dock-hosted but FounderLabsDock.tsx is missing: ${route}`);
  }
}

for (const route of dockHostedRoutes) {
  if (!registry.routes.includes(route)) {
    warnings.push(`Dock-hosted route is no longer in simulation registry: ${route}`);
  }
}

if (warnings.length > 0) {
  console.warn('\nLedgerFlow simulation integrity warnings:\n');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
  console.error('\nLedgerFlow simulation integrity check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix the missing or broken modules before building desktop releases.\n');
  process.exit(1);
}

console.log(`LedgerFlow simulation integrity check passed: ${criticalModules.length} registry modules verified.`);