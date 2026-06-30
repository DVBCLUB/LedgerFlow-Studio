#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['npm', ['run', 'check:agent-tool-ids']],
  ['npm', ['run', 'check:telegram-missions']],
  ['npm', ['run', 'check:patch-review-sessions']],
  ['node', [path.join(root, 'scripts/check-openclaw-plus-package-scripts.mjs')]],
  ['node', [path.join(root, 'scripts/check-audit-contracts.mjs')]],
  ['node', [path.join(root, 'scripts/check-draft-patch-manifest.mjs')]],
  ['node', [path.join(root, 'scripts/check-patch-review-guard.mjs')]],
  ['node', [path.join(root, 'scripts/check-plugin-security-guard.mjs')]],
  ['node', [path.join(root, 'scripts/check-plugin-invocation-boundary.mjs')]],
  ['node', [path.join(root, 'scripts/check-plugin-runtime-boundary-patcher.mjs')]],
  ['node', [path.join(root, 'scripts/check-openclaw-skill-registry.mjs')]],
  ['node', [path.join(root, 'scripts/check-openclaw-skill-routes.mjs')]],
  ['node', [path.join(root, 'scripts/check-openclaw-skill-invocation-gateway.mjs')]],
  ['node', [path.join(root, 'scripts/check-openclaw-skill-invocation-routes.mjs')]],
  ['node', [path.join(root, 'scripts/check-openclaw-skill-directory-ui.mjs')]],
  ['node', [path.join(root, 'scripts/check-openclaw-skill-invocation-planner-ui.mjs')]],
  ['node', [path.join(root, 'scripts/check-robot-capability-registry.mjs')]],
  ['node', [path.join(root, 'scripts/check-automation-scheduler-loop.mjs')]],
  ['node', [path.join(root, 'scripts/check-robot-automation-daemon-routes.mjs')]],
  ['node', [path.join(root, 'scripts/check-robot-automation-ui-wiring.mjs')]],
  ['node', [path.join(root, 'scripts/check-ai-workforce-ui-wiring.mjs')]],
  ['node', [path.join(root, 'scripts/report-openclaw-plus-readiness.mjs')]],
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
