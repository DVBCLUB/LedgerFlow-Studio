import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distManifestPath = path.join(root, 'dist', 'ledgerflow-build-manifest.json');
const releaseDir = path.join(root, 'release');
const packagePath = path.join(root, 'package.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const pkg = readJson(packagePath);
const manifest = fs.existsSync(distManifestPath) ? readJson(distManifestPath) : null;
const simulations = manifest?.simulations?.modules || [];
const fullOffline = simulations.filter((item) => item.offlineMode === 'full');
const partialOffline = simulations.filter((item) => item.offlineMode === 'partial');
const onlineRequired = simulations.filter((item) => item.offlineMode === 'online-required');

const releaseFiles = fs.existsSync(releaseDir)
  ? fs.readdirSync(releaseDir).filter((file) => !file.startsWith('.')).sort()
  : [];

const lines = [];
lines.push(`# ${pkg.build?.productName || 'LedgerFlow Hub'} ${pkg.version}`);
lines.push('');
lines.push('## Build identity');
lines.push('');
lines.push(`- App ID: ${pkg.build?.appId || 'com.ledgerflow.hub'}`);
lines.push(`- Version: ${pkg.version}`);
lines.push(`- Generated at: ${manifest?.build?.generatedAt || new Date().toISOString()}`);
lines.push(`- Git SHA: ${manifest?.build?.gitSha || 'local-build'}`);
lines.push(`- Workflow: ${manifest?.build?.workflow || 'local'}`);
lines.push(`- Run ID: ${manifest?.build?.runId || 'local'}`);
lines.push('');
lines.push('## Desktop release targets');
lines.push('');
lines.push('- Windows: NSIS installer + portable EXE');
lines.push('- macOS: DMG');
lines.push('- Linux: AppImage');
lines.push('');
lines.push('## Simulation modules');
lines.push('');
lines.push(`- Total modules: ${simulations.length}`);
lines.push(`- Full offline modules: ${fullOffline.length}`);
lines.push(`- Partial offline modules: ${partialOffline.length}`);
lines.push(`- Online-required modules: ${onlineRequired.length}`);
lines.push('');
lines.push('### Full offline modules');
lines.push('');
for (const item of fullOffline) {
  lines.push(`- ${item.title || item.component} (${item.component})`);
}
lines.push('');
lines.push('### Partial offline modules');
lines.push('');
for (const item of partialOffline) {
  lines.push(`- ${item.title || item.component} (${item.component})`);
}
lines.push('');
lines.push('## Runtime notes');
lines.push('');
lines.push('- The desktop app starts an internal local server and opens the UI inside Electron.');
lines.push('- Local data is stored in the Electron userData folder as db_storage.json.');
lines.push('- UI, local data and full-offline modules should open without internet.');
lines.push('- Gemini, Supabase, live search and external integrations require internet and configured keys.');
lines.push('');
lines.push('## Verification commands');
lines.push('');
lines.push('```bash');
lines.push('npm install');
lines.push('npm run desktop:dist');
lines.push('npm run check:runtime');
lines.push('npm run check:release');
lines.push('npm run check:desktop-release');
lines.push('```');
lines.push('');
lines.push('## Release directory files');
lines.push('');
for (const file of releaseFiles) {
  lines.push(`- ${file}`);
}
lines.push('');
lines.push('## Manual install test');
lines.push('');
lines.push('1. Install or run the generated desktop artifact on a clean machine.');
lines.push('2. Open LedgerFlow Hub from Desktop or Start Menu shortcut.');
lines.push('3. Turn off internet and open the app again.');
lines.push('4. Open several simulation modules from different categories.');
lines.push('5. Confirm local data saves and reloads.');
lines.push('6. Re-enable internet and confirm Gemini/Supabase-dependent modules degrade or recover correctly.');
lines.push('');

const outputPath = path.join(releaseDir, 'RELEASE_NOTES.md');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`LedgerFlow release notes written: ${path.relative(root, outputPath)}`);
