import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const cleanRuntime = args.has('--runtime');
const runtimeOnly = args.has('--runtime-only');
const includeTrackedRuntime = args.has('--include-tracked-runtime');

const generatedTargets = [
  'dist',
  'release',
  'release-clean',
  'release-erp',
  'release-final',
  '.agent_sandbox',
  '.chrome_profiles',
  'artifacts',
  'exports',
  'server.js'
];
const runtimeTargets = [
  '.chrome_profile',
  'browser_logs.txt',
  'browser_logs_utf8.txt',
  'company_os_control_plane.json',
  '.ledgerflow_signing_secret',
  'agent_runtime.local.enc',
  'agent_runtime.local.enc.key',
  'ai_workforce_mission_queues.local.json',
  'ai_workforce_mission_review_notes.local.json',
  'ai_workforce_operational_ledger.local.json',
  'ai_workforce_runtime.local.json',
  'ai_workforce_run_metrics.local.json',
  'compound_memory_short_term.json',
  'web_ai_profiles.json',
  'data',
  'conversation_threads',
  'fine_tuning_data',
  'job_results',
  'knowledge_base',
  'reports',
  'snapshots',
  'vector_store'
];

const runtimeGlobs = [
  /^browser_logs.*\.txt$/,
  /^\.tmp-.*\.(err|out\.)?log$/,
  /^.*\.local\.json$/,
  /^.*\.log\.json$/
];

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

  try {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`[clean] Removed ${relative}`);
  } catch (err) {
    console.warn(`[clean] Warning: Could not fully remove ${relative}: ${err.message}`);
  }
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

function isGitTracked(relativePath) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', relativePath], {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function archiveRuntimeFiles() {
  const targets = listRuntimeTargets().filter((target) => {
    if (includeTrackedRuntime || !isGitTracked(target)) {
      return true;
    }
    console.log(`[clean] Kept tracked runtime file ${target}. Use --include-tracked-runtime to archive it.`);
    return false;
  });
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
