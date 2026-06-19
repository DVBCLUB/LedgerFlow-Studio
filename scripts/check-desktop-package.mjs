import fs from 'fs';
import path from 'path';

const root = process.cwd();
const packagePath = path.join(root, 'package.json');
const desktopMainPath = path.join(root, 'desktop', 'main.cjs');
const desktopIconPath = path.join(root, 'build', 'icon.ico');
const errors = [];
const warnings = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`Cannot parse JSON file: ${filePath} - ${error.message}`);
    return null;
  }
}

if (!fs.existsSync(packagePath)) {
  errors.push('Missing package.json.');
}

if (!fs.existsSync(desktopMainPath)) {
  errors.push('Missing desktop/main.cjs.');
}

if (!fs.existsSync(desktopIconPath)) {
  errors.push('Missing build/icon.ico. Run npm run prepare:icons before desktop packaging.');
}

const pkg = fs.existsSync(packagePath) ? readJson(packagePath) : null;

if (pkg) {
  if (pkg.main !== 'desktop/main.cjs') {
    errors.push('package.json main must be desktop/main.cjs for Electron packaging.');
  }

  const build = pkg.build || {};
  if (build.appId !== 'com.ledgerflow.hub') {
    errors.push('build.appId must be com.ledgerflow.hub.');
  }

  if (build.productName !== 'LedgerFlow Hub') {
    errors.push('build.productName must be LedgerFlow Hub.');
  }

  if (build.artifactName !== 'LedgerFlow-Hub-${version}-${arch}.${ext}') {
    errors.push('build.artifactName must be LedgerFlow-Hub-${version}-${arch}.${ext}.');
  }

  const requiredFiles = ['dist/**/*', 'desktop/**/*', 'build/**/*', 'package.json'];
  const configuredFiles = Array.isArray(build.files) ? build.files : [];
  for (const requiredFile of requiredFiles) {
    if (!configuredFiles.includes(requiredFile)) {
      errors.push(`build.files is missing ${requiredFile}.`);
    }
  }
  if (configuredFiles.includes('node_modules/**/*')) {
    errors.push('build.files must not include node_modules/**/* because electron-builder already collects production dependencies and copying all modules makes the desktop release too large.');
  }

  if (!build.directories || build.directories.output !== 'release') {
    errors.push('build.directories.output must be release.');
  }

  if (!build.directories || build.directories.buildResources !== 'build') {
    errors.push('build.directories.buildResources must be build.');
  }

  if (!build.win || build.win.icon !== 'build/icon.ico') {
    errors.push('build.win.icon must be build/icon.ico.');
  }

  if (!build.win || !Array.isArray(build.win.target)) {
    errors.push('build.win.target must include nsis and portable.');
  } else {
    for (const target of ['nsis', 'portable']) {
      if (!build.win.target.includes(target)) {
        errors.push(`build.win.target is missing ${target}.`);
      }
    }
  }

  if (!build.nsis) {
    errors.push('build.nsis config is required for Windows shortcut creation.');
  } else {
    if (build.nsis.installerIcon !== 'build/icon.ico') {
      errors.push('build.nsis.installerIcon must be build/icon.ico.');
    }
    if (build.nsis.uninstallerIcon !== 'build/icon.ico') {
      errors.push('build.nsis.uninstallerIcon must be build/icon.ico.');
    }
    if (build.nsis.createDesktopShortcut !== 'always') {
      errors.push('build.nsis.createDesktopShortcut must be always.');
    }
    if (build.nsis.createStartMenuShortcut !== true) {
      errors.push('build.nsis.createStartMenuShortcut must be true.');
    }
    if (build.nsis.shortcutName !== 'LedgerFlow Hub') {
      errors.push('build.nsis.shortcutName must be LedgerFlow Hub.');
    }
  }

  if (!build.mac || build.mac.target !== 'dmg') {
    errors.push('build.mac.target must be dmg.');
  }

  if (!build.linux || build.linux.target !== 'AppImage') {
    errors.push('build.linux.target must be AppImage.');
  }

  const scripts = pkg.scripts || {};
  for (const scriptName of ['build', 'desktop:dev', 'desktop:pack', 'desktop:dist', 'check:simulations', 'check:build', 'check:desktop', 'check:desktop-release', 'check:desktop-release:full']) {
    if (!scripts[scriptName]) {
      errors.push(`package.json scripts is missing ${scriptName}.`);
    }
  }
}

if (fs.existsSync(desktopMainPath)) {
  const mainContent = fs.readFileSync(desktopMainPath, 'utf8');
  const requiredMarkers = [
    'requestSingleInstanceLock',
    'contextIsolation: true',
    'nodeIntegration: false',
    'sandbox: true',
    'webSecurity: true',
    'setWindowOpenHandler',
    'will-navigate',
    'Open local data folder',
    'dist/server.cjs',
    'db_storage.json',
    'getDesktopIconPath',
    'build',
    'icon.ico'
  ];

  for (const marker of requiredMarkers) {
    if (!mainContent.includes(marker)) {
      errors.push(`desktop/main.cjs is missing hardening/runtime marker: ${marker}`);
    }
  }

  if (mainContent.includes('nodeIntegration: true')) {
    errors.push('desktop/main.cjs must not enable nodeIntegration in renderer.');
  }
}

if (warnings.length > 0) {
  console.warn('\nLedgerFlow desktop package check warnings:\n');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\nLedgerFlow desktop package check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix desktop packaging configuration before shipping releases.\n');
  process.exit(1);
}

console.log('LedgerFlow desktop package check passed: Electron shell, shortcuts, icon assets, artifact naming and release targets verified.');
