import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const packagePath = path.join(root, 'package.json');
const registryPath = path.join(root, 'src', 'data', 'simulationRegistry.ts');

function readPackageJson() {
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function parseRegistry() {
  if (!fs.existsSync(registryPath)) return [];
  const content = fs.readFileSync(registryPath, 'utf8');
  const itemBlocks = content.match(/\{ id: '[\s\S]*?\}/g) || [];

  return itemBlocks.map((block) => {
    const read = (key) => {
      const match = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
      return match?.[1] || '';
    };

    return {
      id: read('id'),
      title: read('title'),
      component: read('component'),
      category: read('category'),
      route: read('route'),
      offlineMode: read('offlineMode')
    };
  }).filter((item) => item.id && item.component);
}

function listDistFiles() {
  if (!fs.existsSync(distDir)) return [];

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      const relative = path.relative(distDir, fullPath).replaceAll(path.sep, '/');
      return {
        path: relative,
        size: fs.statSync(fullPath).size
      };
    });
  };

  return walk(distDir);
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const pkg = readPackageJson();
const simulations = parseRegistry();
const distFiles = listDistFiles();

const manifest = {
  app: {
    name: pkg.name,
    productName: pkg.build?.productName || 'LedgerFlow Hub',
    version: pkg.version,
    appId: pkg.build?.appId || 'com.ledgerflow.hub'
  },
  build: {
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    gitSha: process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || null,
    workflow: process.env.GITHUB_WORKFLOW || null,
    runId: process.env.GITHUB_RUN_ID || null
  },
  hybrid: {
    desktopEntry: pkg.main,
    releaseTargets: {
      windows: pkg.build?.win?.target || [],
      mac: pkg.build?.mac?.target || null,
      linux: pkg.build?.linux?.target || null
    },
    offlineStorage: 'Electron userData/db_storage.json',
    pwa: true
  },
  simulations: {
    count: simulations.length,
    fullOfflineCount: simulations.filter((item) => item.offlineMode === 'full').length,
    partialOfflineCount: simulations.filter((item) => item.offlineMode === 'partial').length,
    onlineRequiredCount: simulations.filter((item) => item.offlineMode === 'online-required').length,
    modules: simulations
  },
  dist: {
    fileCount: distFiles.length,
    totalBytes: distFiles.reduce((sum, file) => sum + file.size, 0),
    files: distFiles
      .filter((file) => file.path.endsWith('.html') || file.path.endsWith('.js') || file.path.endsWith('.css') || file.path.endsWith('.webmanifest') || file.path.endsWith('.cjs'))
      .slice(0, 200)
  }
};

const outputPath = path.join(distDir, 'ledgerflow-build-manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`LedgerFlow build manifest written: ${path.relative(root, outputPath)} (${simulations.length} simulation modules).`);
