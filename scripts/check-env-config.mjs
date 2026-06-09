import fs from 'fs';
import path from 'path';

const root = process.cwd();
const errors = [];
const warnings = [];

const requiredExampleKeys = [
  'GEMINI_API_KEY',
  'PMSTUDY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'APP_URL',
  'PORT'
];

const envExamplePath = path.join(root, '.env.example');

if (!fs.existsSync(envExamplePath)) {
  errors.push('Missing .env.example.');
} else {
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  for (const key of requiredExampleKeys) {
    if (!new RegExp(`^${key}=`, 'm').test(envExample)) {
      errors.push(`.env.example is missing key: ${key}`);
    }
  }

  if (/MY_GEMINI_API_KEY|MY_APP_URL|AIza[0-9A-Za-z_-]{20,}/.test(envExample)) {
    errors.push('.env.example contains placeholder or key-looking values that should not be shipped.');
  }
}

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

const scannedFiles = ['src', 'server.ts', 'desktop', 'scripts', 'vite.config.ts', 'package.json']
  .flatMap((entry) => {
    const fullPath = path.join(root, entry);
    if (!fs.existsSync(fullPath)) return [];
    if (fs.statSync(fullPath).isDirectory()) return listFiles(entry);
    return [fullPath];
  })
  .filter((file) => ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.json'].includes(path.extname(file)));

for (const file of scannedFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const content = fs.readFileSync(file, 'utf8');

  if (/AIza[0-9A-Za-z_-]{20,}/.test(content)) {
    errors.push(`${relative} appears to contain a Google API key.`);
  }

  if (/supabase\.co\/rest\/v1.*eyJ/.test(content)) {
    errors.push(`${relative} appears to contain an embedded Supabase token/url.`);
  }

  if (/GEMINI_API_KEY\s*=\s*["'][^"']+["']/.test(content)) {
    warnings.push(`${relative} assigns GEMINI_API_KEY directly. Confirm this is not a secret.`);
  }
}

if (warnings.length > 0) {
  console.warn('\nLedgerFlow environment config warnings:\n');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\nLedgerFlow environment config check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix environment documentation/secrets before shipping.\n');
  process.exit(1);
}

console.log(`LedgerFlow environment config check passed: ${requiredExampleKeys.length} example keys and ${scannedFiles.length} source files checked.`);
