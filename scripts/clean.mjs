import fs from 'fs';
import path from 'path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const cleanRuntime = args.has('--runtime');
const runtimeOnly = args.has('--runtime-only');

const generatedTargets = [
  'dist',
  'release',
  'release-clean',
  'release-erp',
  'release-final',
  'server.js'
];
const runtimeTargets = [
  '.chrome_profile',
  '.chrome_profiles',
  'browser_logs.txt',
  'browser_logs_utf8.txt',
  'company_os_control_plane.json',
  'web_ai_profiles.json'
];

const runtimeGlobs = [/^browser_logs.*\.txt$/];

function assertSafeChild(fullPath) {
  const relative = path.relative(root, fullPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to clean unsafe path: ${fullPath}`);
  }
  return relative;
}

function removeGenerated(target) {
  const fullPath = path.join(root, target);
  if (!fs.existsSync(fullPath)) return;

  const relative = assertSafeChild(fullPath);
  if (dryRun) {
    console.log(`[clean] Would remove ${relative}`);
    return;
  }

  fs.rmSync(fullPath, { recursive: true, force: true });
  console.log(`[clean] Removed ${relative}`);
}

function listRuntimeTargets() {
  const names = new Set(runtimeTargets);

  for (const entry of fs.readdirSync(root)) {
    if (runtimeGlobs.some((pattern) => pattern.test(entry))) {
      names.add(entry);
    }
  }

  return [...names].filter((name) => fs.existsSync(path.join(root, name)));
}

function archiveRuntimeFiles() {
  const targets = listRuntimeTargets();
  if (targets.length === 0) {
    console.log('[clean] No local runtime files to archive.');
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveDir = path.join(root, '.local-cleanup', stamp);
  const archiveRelative = assertSafeChild(archiveDir);

  if (dryRun) {
    for (const target of targets) {
      console.log(`[clean] Would archive ${target} -> ${archiveRelative}/${target}`);
    }
    return;
  }

  fs.mkdirSync(archiveDir, { recursive: true });

  for (const target of targets) {
    const source = path.join(root, target);
    const destination = path.join(archiveDir, target);
    assertSafeChild(source);
    assertSafeChild(destination);
    fs.renameSync(source, destination);
    console.log(`[clean] Archived ${target} -> ${path.relative(root, destination)}`);
  }
}

if (!runtimeOnly) {
  for (const target of generatedTargets) {
    removeGenerated(target);
  }
}

if (cleanRuntime || runtimeOnly) {
  archiveRuntimeFiles();
} else {
  console.log('[clean] Runtime files kept. Use npm run clean -- --runtime-only to archive local logs/profile state.');
}
