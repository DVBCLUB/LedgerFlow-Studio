import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const errors = [];
const warnings = [];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return fullPath;
  });
}

const requiredFiles = [
  'dist/index.html',
  'dist/server.cjs',
  'dist/manifest.webmanifest',
  'dist/ledgerflow-build-manifest.json'
];

for (const file of requiredFiles) {
  if (!exists(file)) {
    errors.push(`Missing production build file: ${file}`);
  }
}

if (exists('dist/index.html')) {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  if (!html.includes('type="module"') && !html.includes("type='module'")) {
    errors.push('dist/index.html does not contain a module script entry.');
  }
  if (!html.includes('./') && !html.includes('/assets/')) {
    warnings.push('dist/index.html may not reference built assets as expected.');
  }
}

if (exists('dist/ledgerflow-build-manifest.json')) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'ledgerflow-build-manifest.json'), 'utf8'));
    if (manifest.app?.productName !== 'LedgerFlow Hub') {
      errors.push('Build manifest productName is not LedgerFlow Hub.');
    }
    if (!manifest.simulations || manifest.simulations.count < 20) {
      errors.push('Build manifest has too few simulation modules.');
    }
    if (!Array.isArray(manifest.simulations?.modules)) {
      errors.push('Build manifest simulations.modules is missing.');
    }
    if (manifest.hybrid?.desktopEntry !== 'desktop/main.cjs') {
      errors.push('Build manifest desktopEntry is not desktop/main.cjs.');
    }
  } catch (error) {
    errors.push(`Build manifest is not valid JSON: ${error.message}`);
  }
}

const allDistFiles = listFiles(distDir).map((file) => path.relative(distDir, file).replaceAll(path.sep, '/'));
const jsFiles = allDistFiles.filter((file) => file.endsWith('.js'));
const cssFiles = allDistFiles.filter((file) => file.endsWith('.css'));
const serviceWorkerFiles = allDistFiles.filter((file) => file === 'sw.js' || file.includes('workbox'));
const chartChunks = allDistFiles.filter((file) => file.includes('vendor-charts'));

if (jsFiles.length < 5) {
  errors.push(`Expected multiple JavaScript chunks for lazy-loaded simulations, found only ${jsFiles.length}.`);
}

if (cssFiles.length < 1) {
  errors.push('No CSS output detected in dist.');
}

if (serviceWorkerFiles.length < 1) {
  errors.push('PWA service worker/workbox output was not detected.');
}

if (chartChunks.length < 1) {
  warnings.push('No vendor-charts chunk detected. Recharts may have been bundled differently.');
}

if (exists('dist/server.cjs')) {
  const serverBundle = fs.readFileSync(path.join(root, 'dist', 'server.cjs'), 'utf8');
  const requiredApiMarkers = ['/api/health', '/api/db/load', '/api/db/save', '/api/gemini/generate'];
  for (const marker of requiredApiMarkers) {
    if (!serverBundle.includes(marker)) {
      errors.push(`Server bundle does not contain API route marker: ${marker}`);
    }
  }
}

if (warnings.length > 0) {
  console.warn('\nLedgerFlow build smoke check warnings:\n');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\nLedgerFlow build smoke check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix the production output before shipping desktop/web releases.\n');
  process.exit(1);
}

console.log(`LedgerFlow build smoke check passed: ${jsFiles.length} JS chunks, ${cssFiles.length} CSS files, ${serviceWorkerFiles.length} PWA files verified.`);
