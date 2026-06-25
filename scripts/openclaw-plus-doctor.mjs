#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const full = process.argv.includes('--full');
const skipPatch = process.argv.includes('--skip-patch');

const patchSteps = skipPatch ? [] : [
  ['patch local AI Workforce', process.execPath, ['scripts/patch-ai-workforce-local.mjs']],
  ['patch OpenClaw skill routes', process.execPath, ['scripts/patch-daemon-openclaw-skill-routes.mjs']],
  ['patch robot automation UI panel', process.execPath, ['scripts/patch-ai-ops-robot-automation-panel.mjs']],
  ['patch OpenClaw skill directory UI panel', process.execPath, ['scripts/patch-ai-ops-skill-directory-panel.mjs']],
];

const steps = [
  ...patchSteps,
  ['check AI Workforce contracts', process.execPath, ['scripts/check-ai-workforce-local.mjs']],
  ['check rejection governance', process.execPath, ['scripts/check-agent-runtime-rejection.mjs']],
  ['check OpenClaw plus parity', process.execPath, ['scripts/check-openclaw-plus-parity.mjs']],
  ['report OpenClaw plus readiness', process.execPath, ['scripts/report-openclaw-plus-readiness.mjs']],
  ...(full ? [
    ['lint project', 'npm', ['run', 'lint']],
    ['build project', 'npm', ['run', 'build']],
  ] : []),
];

for (const [label, command, args] of steps) {
  console.log(`\n▶ ${label}`);
  console.log(`  ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\n❌ OpenClaw+ doctor failed at: ${label}`);
    process.exit(result.status || 1);
  }
}

console.log('\n✅ OpenClaw+ doctor completed.');
if (!full) {
  console.log('Tip: run node scripts/openclaw-plus-doctor.mjs --full to include lint and build.');
}
