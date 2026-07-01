#!/usr/bin/env node
import { execSync } from 'node:child_process';

function run(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function tryRun(command) {
  try {
    return run(command);
  } catch {
    return '';
  }
}

function resolveBaseRef() {
  const candidates = [];
  if (process.env.GITHUB_BASE_REF) candidates.push(`origin/${process.env.GITHUB_BASE_REF}`);
  if (process.env.CODEMAP_BASE_REF) candidates.push(process.env.CODEMAP_BASE_REF);
  candidates.push('origin/main', 'origin/master', 'HEAD~1');

  for (const ref of candidates) {
    const ok = tryRun(`git rev-parse --verify ${ref}`);
    if (ok) return ref;
  }
  return null;
}

const strict = process.env.CODEMAP_GUARD_STRICT === 'true';
const baseRef = resolveBaseRef();

if (!baseRef) {
  console.log('[codemap-guard] Skipped: no comparable base ref found.');
  process.exit(0);
}

const mergeBase = tryRun(`git merge-base HEAD ${baseRef}`);
if (!mergeBase) {
  console.log(`[codemap-guard] Skipped: cannot resolve merge-base with ${baseRef}.`);
  process.exit(0);
}

const committedChanged = tryRun(`git diff --name-only ${mergeBase}...HEAD`).split(/\r?\n/).filter(Boolean);
const stagedChanged = tryRun('git diff --name-only --cached').split(/\r?\n/).filter(Boolean);
const unstagedChanged = tryRun('git diff --name-only').split(/\r?\n/).filter(Boolean);
const untrackedChanged = tryRun('git ls-files --others --exclude-standard').split(/\r?\n/).filter(Boolean);

const changedFiles = [...new Set([...committedChanged, ...stagedChanged, ...unstagedChanged, ...untrackedChanged])];

if (!changedFiles.length) {
  console.log('[codemap-guard] No changed files.');
  process.exit(0);
}

const issues = [];
const warnings = [];

const hasServerTs = changedFiles.includes('server.ts');
const hasServerServices = changedFiles.some((file) => file.startsWith('server/services/'));

if (hasServerTs) {
  const numstat = committedChanged.includes('server.ts')
    ? tryRun(`git diff --numstat ${mergeBase}...HEAD -- server.ts`)
    : tryRun('git diff --numstat HEAD -- server.ts');
  const first = numstat.split(/\r?\n/).find(Boolean) || '';
  const [addedRaw, removedRaw] = first.split(/\s+/);
  const added = Number(addedRaw) || 0;
  const removed = Number(removedRaw) || 0;
  const churn = added + removed;

  if (churn >= 60 && !hasServerServices) {
    issues.push(`server.ts changed heavily (${churn} lines) but no file in server/services/ changed.`);
  } else if (churn >= 30 && !hasServerServices) {
    warnings.push(`server.ts changed (${churn} lines) without server/services/ changes. Consider moving logic into services.`);
  }
}

const rootTsAdds = tryRun(`git diff --name-only --diff-filter=A ${mergeBase}...HEAD`)
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
  .filter((file) => !file.includes('/') && !['server.ts', 'vite.config.ts'].includes(file));

if (rootTsAdds.length) {
  warnings.push(`New root TS files detected: ${rootTsAdds.join(', ')}. Prefer src/, server/services/, or scripts/.`);
}

if (issues.length) {
  for (const issue of issues) console.error(`[codemap-guard] ERROR: ${issue}`);
  for (const warning of warnings) console.warn(`[codemap-guard] WARN: ${warning}`);
  process.exit(1);
}

for (const warning of warnings) console.warn(`[codemap-guard] WARN: ${warning}`);
console.log(`[codemap-guard] Passed on ${changedFiles.length} changed files (strict=${strict}).`);

if (strict && warnings.length) {
  process.exit(1);
}
