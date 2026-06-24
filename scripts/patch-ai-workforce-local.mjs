#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const patchers = [
  'scripts/patch-agent-daemon-tool-schema.mjs',
  'scripts/patch-telegram-mission-commands.mjs',
  'scripts/patch-daemon-patch-review-routes.mjs',
  'scripts/patch-daemon-agent-reject-route.mjs',
  'scripts/patch-daemon-robot-automation-routes.mjs',
  'scripts/patch-plugin-runtime-boundary.mjs',
  'scripts/patch-ai-ops-safety-runbook-panel.mjs',
];

for (const patcher of patchers) {
  const abs = path.join(root, patcher);
  console.log(`\n▶ Running ${patcher}`);
  const result = spawnSync(process.execPath, [abs], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\n❌ Failed: ${patcher}`);
    process.exit(result.status || 1);
  }
}

console.log('\n✅ AI Workforce local daemon, robot, automation, plugin and UI patches completed.');
console.log('Next: node scripts/check-ai-workforce-local.mjs && node scripts/check-agent-runtime-rejection.mjs && npm run lint && npm run build');
