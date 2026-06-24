import fs from 'fs';
import path from 'path';
import os from 'os';

const root = process.cwd();
const releaseDir = path.join(root, 'release');
const packagePath = path.join(root, 'package.json');
const distManifestPath = path.join(root, 'dist', 'ledgerflow-build-manifest.json');

// Parse arguments
const args = process.argv.slice(2);
const notesOnly = args.includes('--notes-only');
const checkOnly = args.includes('--check-only');
const isFullPipeline = !notesOnly && !checkOnly;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertSafeReleaseChild(target) {
  const relative = path.relative(releaseDir, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove unsafe release path: ${target}`);
  }
}

// 1. Finalize step (clean intermediate files in release folder)
function runFinalize() {
  console.log('[release] Finalizing release directory...');
  if (!fs.existsSync(releaseDir)) {
    throw new Error('Missing release directory. Run electron-builder before finalizing.');
  }

  const unpackedExe = path.join(releaseDir, 'win-unpacked', 'LedgerFlow Hub.exe');
  if (!fs.existsSync(unpackedExe)) {
    throw new Error('Cannot finalize release: missing release/win-unpacked/LedgerFlow Hub.exe.');
  }

  for (const name of ['win-unpacked.tmp', 'builder-debug.yml']) {
    const target = path.join(releaseDir, name);
    if (!fs.existsSync(target)) continue;
    assertSafeReleaseChild(target);
    try {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`[release] Removed intermediate output: ${name}`);
    } catch (err) {
      console.warn(`[release] Warning: Could not remove intermediate output ${name}: ${err.message}`);
    }
  }

  console.log('LedgerFlow release finalized: single unpacked Windows app folder retained.');
}

// 2. Write Release Notes step
function runWriteReleaseNotes() {
  console.log('[release] Writing release notes...');
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
  lines.push('- Windows: unpacked app folder (`release/win-unpacked/LedgerFlow Hub.exe`)');
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
  lines.push('1. Copy the generated `release/win-unpacked` folder to a clean Windows machine.');
  lines.push('2. Open `LedgerFlow Hub.exe` directly from that folder.');
  lines.push('3. Turn off internet and open the app again.');
  lines.push('4. Open several simulation modules from different categories.');
  lines.push('5. Confirm local data saves and reloads.');
  lines.push('6. Re-enable internet and confirm Gemini/Supabase-dependent modules degrade or recover correctly.');
  lines.push('');

  const outputPath = path.join(releaseDir, 'RELEASE_NOTES.md');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`LedgerFlow release notes written: ${path.relative(root, outputPath)}`);
}

// 3. Check Release Artifacts step
function runCheckRelease() {
  console.log('[release] Validating release artifacts...');
  const platform = process.env.LEDGERFLOW_RELEASE_PLATFORM || os.platform();
  const errors = [];
  const warnings = [];

  function listFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(fullPath);
      return fullPath;
    });
  }

  if (!fs.existsSync(releaseDir)) {
    errors.push('Missing release directory. Electron Builder did not create release/.');
  } else {
    const files = listFiles(releaseDir).map((file) => path.relative(releaseDir, file).replaceAll(path.sep, '/'));
    const releaseArtifacts = files.filter((file) => !file.includes('/'));
    const unpackedExe = 'win-unpacked/LedgerFlow Hub.exe';

    if (fs.existsSync(path.join(releaseDir, 'win-unpacked.tmp'))) {
      errors.push('Temporary release/win-unpacked.tmp exists. Clean the release directory and rebuild before publishing.');
    }

    const expectations = {
      win32: {
        label: 'Windows',
        requiredExtensions: [],
        optionalExtensions: [],
        requiredNamePart: ''
      },
      darwin: {
        label: 'macOS',
        requiredExtensions: ['.dmg'],
        optionalExtensions: ['.blockmap'],
        requiredNamePart: 'LedgerFlow-Hub'
      },
      linux: {
        label: 'Linux',
        requiredExtensions: ['.AppImage'],
        optionalExtensions: ['.blockmap'],
        requiredNamePart: 'LedgerFlow-Hub'
      }
    };

    const expectation = expectations[platform] || expectations[os.platform()];

    if (!expectation) {
      warnings.push(`No release artifact expectation configured for platform: ${platform}`);
    } else {
      for (const extension of expectation.requiredExtensions) {
        const matches = releaseArtifacts.filter((file) => file.endsWith(extension));
        if (matches.length === 0) {
          errors.push(`Missing ${expectation.label} release artifact with extension ${extension}.`);
        }

        const namedMatches = matches.filter((file) => file.includes(expectation.requiredNamePart));
        if (matches.length > 0 && namedMatches.length === 0) {
          errors.push(`${expectation.label} release artifact exists but does not include ${expectation.requiredNamePart} in file name.`);
        }
      }

      if (platform === 'win32') {
        if (!files.includes(unpackedExe)) {
          errors.push('Windows unpacked executable is missing: release/win-unpacked/LedgerFlow Hub.exe.');
        }
        const extraWindowsArtifacts = releaseArtifacts.filter((file) => file.endsWith('.exe'));
        if (extraWindowsArtifacts.length > 0) {
          errors.push(`Release root must not contain extra Windows EXE artifacts: ${extraWindowsArtifacts.join(', ')}`);
        }
      }

      const optionalFound = expectation.optionalExtensions.length === 0 || expectation.optionalExtensions.some((extension) => releaseArtifacts.some((file) => file.endsWith(extension)));
      if (!optionalFound) {
        warnings.push(`${expectation.label} build did not produce optional update metadata/blockmap files.`);
      }
    }

    const oversizedFiles = files
      .map((file) => {
        const size = fs.statSync(path.join(releaseDir, file)).size;
        return { file, size };
      })
      .filter((entry) => entry.size > 800 * 1024 * 1024);

    for (const entry of oversizedFiles) {
      warnings.push(`${entry.file} is larger than 800MB. Check whether node_modules packaging is too heavy.`);
    }
  }

  if (warnings.length > 0) {
    console.warn('\nLedgerFlow release artifact warnings:\n');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error('\nLedgerFlow release artifact check failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    console.error('\nFix Electron Builder output before uploading release artifacts.\n');
    process.exit(1);
  }

  console.log(`LedgerFlow release artifact check passed: release files validated successfully.`);
}

// Execution flow
try {
  if (notesOnly) {
    runWriteReleaseNotes();
  } else if (checkOnly) {
    runCheckRelease();
  } else {
    // Full pipeline
    runFinalize();
    runWriteReleaseNotes();
    runCheckRelease();
  }
} catch (error) {
  console.error(`\n[release] Pipeline error: ${error.message}`);
  process.exit(1);
}
