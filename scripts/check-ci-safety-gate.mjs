#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'server/services/daemonLocalGuard.ts',
  'scripts/patch-agent-daemon-tool-schema.mjs',
  'scripts/patch-daemon-openclaw-hardening.mjs',
  'scripts/patch-telegram-mission-commands.mjs',
  'scripts/patch-daemon-patch-review-routes.mjs',
  'server/services/telegramMissionCommands.ts',
  'server/services/patchReviewSessions.ts',
  'server/services/patchReviewApply.ts',
  'docs/OPENCLAW_PARITY_HARDENING.md',
];

const requiredPackageScripts = [
  'ai:patch-daemon-tools',
  'ai:patch-daemon-hardening',
  'ai:patch-telegram-missions',
  'ai:patch-patch-review-routes',
  'check:agent-tool-ids',
  'check:telegram-missions',
  'check:patch-review-sessions',
  'check:openclaw-plus',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `Missing required OpenClaw parity file: ${file}`);
}

const pkg = JSON.parse(read('package.json'));
for (const script of requiredPackageScripts) {
  assert(pkg.scripts?.[script], `Missing package script: ${script}`);
}

for (const lifecycle of ['predev', 'prelint', 'prebuild']) {
  const value = String(pkg.scripts?.[lifecycle] || '');
  for (const patcher of ['ai:patch-daemon-tools', 'ai:patch-daemon-hardening', 'ai:patch-telegram-missions', 'ai:patch-patch-review-routes']) {
    assert(value.includes(patcher), `${lifecycle} must run ${patcher}`);
  }
}

const guard = read('server/services/daemonLocalGuard.ts');
for (const token of ['createDaemonLocalGuard', 'LEDGERFLOW_DAEMON_ALLOW_REMOTE', 'LEDGERFLOW_DAEMON_AUTH_REQUIRED', 'readRequestPrincipal']) {
  assert(guard.includes(token), `daemonLocalGuard.ts missing token: ${token}`);
}

const doc = read('docs/OPENCLAW_PARITY_HARDENING.md');
for (const token of ['Tool schema sync', 'Telegram / mobile parity', 'Plugin boundary', 'Reviewed patch sessions', 'Local daemon hardening']) {
  assert(doc.includes(token), `OpenClaw parity doc missing section: ${token}`);
}

console.log('CI safety gate passed for OpenClaw parity hardening contracts.');
