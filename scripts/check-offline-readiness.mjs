import fs from 'fs';
import path from 'path';

const root = process.cwd();
const errors = [];
const warnings = [];
const releaseRisks = [];

const sourceDirs = ['src', 'public'];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json', '.svg']);
const allowedExternalMarkers = [
  'supabase.co',
  'generativelanguage.googleapis.com',
  'googleapis.com',
  'github.com',
  'run.app'
];

const blockingRuntimePatterns = [
  /unpkg\.com/,
  /cdn\.jsdelivr\.net/,
  /cdnjs\.cloudflare\.com/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

function listFiles(dir) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) return [];

  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(fullDir, entry.name);
    if (entry.isDirectory()) return listFiles(path.relative(root, fullPath));
    return fullPath;
  });
}

function isSourceFile(filePath) {
  return sourceExtensions.has(path.extname(filePath));
}

const files = sourceDirs.flatMap(listFiles).filter(isSourceFile);

for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const content = fs.readFileSync(file, 'utf8');

  const externalMatches = [...content.matchAll(/https?:\/\/[^\s"'`)<>]+/g)].map((match) => match[0]);
  for (const url of externalMatches) {
    const isAllowed = allowedExternalMarkers.some((marker) => url.includes(marker));
    if (!isAllowed) {
      warnings.push(`${relative} references external URL: ${url}`);
    }
  }

  if (blockingRuntimePatterns.some((pattern) => pattern.test(content))) {
    releaseRisks.push(`${relative} references CDN/font dependency. Desktop build can still ship, but that feature may need internet unless converted to local assets.`);
  }
}

const requiredOfflineFiles = [
  'vite.config.ts',
  'public/pwa-192x192.svg',
  'public/pwa-512x512.svg',
  'public/favicon.svg',
  'src/data/simulationRegistry.ts'
];

for (const file of requiredOfflineFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing offline/PWA support file: ${file}`);
  }
}

const viteConfigPath = path.join(root, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  if (!viteConfig.includes('VitePWA')) {
    errors.push('vite.config.ts does not include VitePWA.');
  }
  if (!viteConfig.includes('manifest')) {
    errors.push('vite.config.ts does not define a PWA manifest.');
  }
}

if (warnings.length > 0) {
  console.warn('\nLedgerFlow offline readiness warnings:\n');
  for (const warning of warnings.slice(0, 30)) {
    console.warn(`- ${warning}`);
  }
  if (warnings.length > 30) {
    console.warn(`- ...and ${warnings.length - 30} more warnings.`);
  }
}

if (releaseRisks.length > 0) {
  console.warn('\nLedgerFlow desktop offline release risks:\n');
  for (const risk of releaseRisks) {
    console.warn(`- ${risk}`);
  }
  console.warn('\nThese are warnings for staged desktop packaging, not hard blockers. Convert them to local assets before advertising the app as fully offline.\n');
}

if (errors.length > 0) {
  console.error('\nLedgerFlow offline readiness check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix missing offline/PWA support files before shipping desktop builds.\n');
  process.exit(1);
}

console.log(`LedgerFlow offline readiness check passed with warnings allowed: ${files.length} source/public files scanned.`);
