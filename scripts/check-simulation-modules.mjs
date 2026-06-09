import fs from 'fs';
import path from 'path';

const root = process.cwd();
const componentDir = path.join(root, 'src', 'components');
const registryPath = path.join(root, 'src', 'data', 'simulationRegistry.ts');

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
  'src/App.tsx',
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

for (const relativePath of requiredRuntimeFiles) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required runtime file: ${relativePath}`);
  }
}

for (const moduleName of criticalModules) {
  const tsxPath = path.join(componentDir, `${moduleName}.tsx`);
  const tsPath = path.join(componentDir, `${moduleName}.ts`);
  const jsxPath = path.join(componentDir, `${moduleName}.jsx`);
  const jsPath = path.join(componentDir, `${moduleName}.js`);

  const existingPath = [tsxPath, tsPath, jsxPath, jsPath].find((candidate) => fs.existsSync(candidate));

  if (!existingPath) {
    errors.push(`Missing critical simulation component: ${moduleName}`);
    continue;
  }

  const content = fs.readFileSync(existingPath, 'utf8');
  if (!/export\s+default|export\s*\{/.test(content)) {
    errors.push(`Component may not export anything: ${path.relative(root, existingPath)}`);
  }
}

const appContent = fs.existsSync(path.join(root, 'src', 'App.tsx'))
  ? fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8')
  : '';

for (const moduleName of criticalModules) {
  if (!appContent.includes(`./components/${moduleName}`)) {
    errors.push(`App.tsx does not lazy-load critical module: ${moduleName}`);
  }
}

for (const route of registry.routes) {
  const routeKey = route.replace(/^\//, '');
  if (!appContent.includes(`'${routeKey}'`) && !appContent.includes(`"${routeKey}"`)) {
    errors.push(`App.tsx may not include route/tab key for registry route: ${route}`);
  }
}

if (errors.length > 0) {
  console.error('\nLedgerFlow simulation integrity check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix the missing or broken modules before building desktop/web releases.\n');
  process.exit(1);
}

console.log(`LedgerFlow simulation integrity check passed: ${criticalModules.length} registry modules verified.`);
