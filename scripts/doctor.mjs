import fs from 'fs';
import path from 'path';
import os from 'os';

const root = process.cwd();
const report = [];

function line(text = '') {
  report.push(text);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
  } catch {
    return null;
  }
}

function list(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return [];
  return fs.readdirSync(fullPath).sort();
}

function parseSimulationCount() {
  const registryPath = path.join(root, 'src', 'data', 'simulationRegistry.ts');
  if (!fs.existsSync(registryPath)) return 0;
  const content = fs.readFileSync(registryPath, 'utf8');
  return [...content.matchAll(/component:\s*'([^']+)'/g)].length;
}

const pkg = readJson('package.json');

line('# LedgerFlow Hub Doctor Report');
line('');
line('## Machine');
line('');
line(`- Platform: ${process.platform}`);
line(`- Arch: ${process.arch}`);
line(`- OS: ${os.type()} ${os.release()}`);
line(`- Node: ${process.version}`);
line(`- Working directory: ${root}`);
line('');

line('## Package');
line('');
line(`- Name: ${pkg?.name || 'missing'}`);
line(`- Version: ${pkg?.version || 'missing'}`);
line(`- Main: ${pkg?.main || 'missing'}`);
line(`- Product name: ${pkg?.build?.productName || 'missing'}`);
line(`- App ID: ${pkg?.build?.appId || 'missing'}`);
line('');

line('## Important files');
line('');
for (const file of [
  'package.json',
  'package-lock.json',
  '.env.example',
  'server.ts',
  'vite.config.ts',
  'desktop/main.cjs',
  'src/App.tsx',
  'src/data/simulationRegistry.ts',
  'HYBRID_APP_STANDARD.md',
  'SIMULATION_MODEL_MAP.md',
  'CI_FAILURE_GUIDE.md'
]) {
  line(`- ${exists(file) ? 'OK' : 'MISSING'} ${file}`);
}
line('');

line('## Scripts');
line('');
for (const script of [
  'dev',
  'build',
  'desktop:dev',
  'desktop:pack',
  'desktop:dist',
  'check:env',
  'check:simulations',
  'check:desktop',
  'check:offline',
  'check:build',
  'check:runtime',
  'check:release',
  'check:hybrid',
  'release:notes'
]) {
  line(`- ${pkg?.scripts?.[script] ? 'OK' : 'MISSING'} ${script}`);
}
line('');

line('## Simulation registry');
line('');
line(`- Registered modules: ${parseSimulationCount()}`);
line('');

line('## Build output');
line('');
line(`- dist exists: ${exists('dist') ? 'yes' : 'no'}`);
line(`- dist/index.html: ${exists('dist/index.html') ? 'yes' : 'no'}`);
line(`- dist/server.cjs: ${exists('dist/server.cjs') ? 'yes' : 'no'}`);
line(`- dist/ledgerflow-build-manifest.json: ${exists('dist/ledgerflow-build-manifest.json') ? 'yes' : 'no'}`);
line('');

line('## Release output');
line('');
line(`- release exists: ${exists('release') ? 'yes' : 'no'}`);
for (const file of list('release')) {
  line(`- ${file}`);
}
line('');

line('## Next commands');
line('');
line('```bash');
line('npm install');
line('npm run desktop:dist');
line('npm run check:hybrid');
line('```');
line('');

const output = report.join('\n');
console.log(output);

if (process.argv.includes('--write')) {
  const outputPath = path.join(root, 'ledgerflow-doctor-report.md');
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`\nDoctor report written: ${path.relative(root, outputPath)}`);
}
