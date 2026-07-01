#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const runtimeDir = path.resolve(root, process.env.LEDGERFLOW_RUNTIME_DIR || 'runtime');

const knownRuntimeFiles = [
  'agent_events.local.json',
  'agent_jobs.local.json',
  'automation_rules.local.json',
  'agent_memory.local.json',
  'agent_pipelines.local.json',
  'patch_review_sessions.local.json',
  'ai_usage.log.json',
  'ai_observability.local.json',
  'integration_registry.json',
  'integration_events.log.json',
  'ledgerflow_audit.log.json',
  'platform_account_leases.json',
  'ai_prompt_registry.json',
  'ai_keys.vault.json',
  '.ai_vault_session.json',
  '.ledgerflow_secret',
];

fs.mkdirSync(runtimeDir, { recursive: true });

let moved = 0;
let skipped = 0;

for (const file of knownRuntimeFiles) {
  const src = path.resolve(root, file);
  const dst = path.resolve(runtimeDir, file);

  if (!fs.existsSync(src)) {
    continue;
  }
  if (fs.existsSync(dst)) {
    skipped += 1;
    continue;
  }

  fs.renameSync(src, dst);
  moved += 1;
  console.log(`moved: ${file} -> ${path.relative(root, dst)}`);
}

console.log(`runtime migration done (moved=${moved}, skipped=${skipped}).`);
