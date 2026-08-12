import fs from 'fs';
import path from 'path';

const root = process.cwd();
const errors = [];
const warnings = [];
const releaseRisks = [];
const integrationReferences = [];

const sourceDirs = ['src', 'public'];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json', '.svg']);
const allowedExternalMarkers = [
  'w3.org/2000/svg',
  '127.0.0.1',
  'localhost',
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
  const isVendoredThirdParty = relative.startsWith('public/vendor/');

  if (!isVendoredThirdParty) {
    const externalMatches = [...content.matchAll(/https?:\/\/[^\s"'`)<>]+/g)].map((match) => match[0]);
    for (const url of externalMatches) {
      const isAllowed = allowedExternalMarkers.some((marker) => url.includes(marker));
      const isRuntimeAsset = /\.(?:mp4|mp3|webm|png|jpe?g|gif|svg|woff2?)(?:[?#]|$)/i.test(url) || /cdn\.|transparenttextures/i.test(url);
      if (!isAllowed && isRuntimeAsset) {
        warnings.push(`${relative} references external URL: ${url}`);
      } else if (!isAllowed) {
        integrationReferences.push(`${relative} references user-initiated external integration: ${url}`);
      }
    }
  }

  if (!isVendoredThirdParty && blockingRuntimePatterns.some((pattern) => pattern.test(content))) {
    releaseRisks.push(`${relative} references CDN/font dependency. Desktop build can still ship, but that feature may need internet unless converted to local assets.`);
  }
}

const requiredOfflineFiles = [
  'vite.config.ts',
  'public/favicon.svg',
  'src/data/simulationRegistry.ts'
];

for (const file of requiredOfflineFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing offline/PWA support file: ${file}`);
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
  console.error('\nLedgerFlow desktop offline readiness check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix missing desktop offline support files before shipping desktop builds.\n');
  process.exit(1);
}

if (integrationReferences.length > 0) {
  console.log(`Offline note: ${integrationReferences.length} user-initiated external integration references were found; they do not make local desktop assets remote-dependent.`);
}

console.log(`LedgerFlow desktop offline readiness check passed with warnings allowed: ${files.length} source/public files scanned.`);
