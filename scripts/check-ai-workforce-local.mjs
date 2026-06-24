#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['npm', ['run', 'check:agent-tool-ids']],
  ['npm', ['run', 'check:telegram-missions']],
  ['npm', ['run', 'check:patch-review-sessions']],
  [process.execPath, [path.join(root, 'scripts/check-patch-review-guard.mjs')]],
  [process.execPath, [path.join(root, 'scripts/check-plugin-security-guard.mjs')]],
  [process.execPath, [path.join(root, 'scripts/check-plugin-invocation-boundary.mjs')]],
  [process.execPath, [path.join(root, 'scripts/check-ai-workforce-ui-wiring.mjs')]],
];

for (const [command, args] of checks) {
  console.log(`\n▶ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\n❌ AI Workforce check failed: ${command} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

console.log('\n✅ AI Workforce checks completed.');
