#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  {
    label: 'Agent runtime governance',
    file: 'server/services/agentRuntime.ts',
    tokens: ['approveAgentRunStep', 'rejectAgentRunStep', 'setAgentRuntimeEmergencyStop', 'appendAuditEvent'],
  },
  {
    label: 'Mobile mission commands',
    file: 'server/services/telegramMissionCommands.ts',
    tokens: ['/mission approve', '/mission reject', '/mission advance', '/ai emergency-stop'],
  },
  {
    label: 'Reviewed patch sessions',
    file: 'server/services/patchReviewSessions.ts',
    tokens: ['createPatchReviewSessionsFromRun', 'approved_to_apply', 'rolled_back', 'rollbackHint'],
  },
  {
    label: 'Patch apply guard',
    file: 'server/services/patchReviewApply.ts',
    tokens: ['PATCH_APPLY_PHRASE', 'PATCH_ROLLBACK_PHRASE', 'validateManifestFiles', 'workspacePath'],
  },
  {
    label: 'Plugin security policy',
    file: 'server/services/pluginSecurityPolicy.ts',
    tokens: ['assessPluginSecurity', 'allowedForHostInvocation', 'signature', 'sandbox'],
  },
  {
    label: 'Plugin invocation boundary',
    file: 'server/services/pluginInvocationBoundary.ts',
    tokens: ['decidePluginInvocation', 'auditPluginInvocationDecision', 'sandbox_required'],
  },
  {
    label: 'Local patch orchestration',
    file: 'scripts/patch-ai-workforce-local.mjs',
    tokens: ['patch-daemon-agent-reject-route.mjs', 'patch-plugin-runtime-boundary.mjs', 'patch-ai-ops-safety-runbook-panel.mjs'],
  },
  {
    label: 'AI Workforce UI',
    file: 'src/modules/ai-nhan-su/AIOperationsCenter.tsx',
    tokens: ['AIWorkforceMissionControl', 'AIWorkforcePatchReviewSessions', 'AIWorkforcePluginSecurityGuard'],
    warningOnly: true,
  },
];

let failed = false;
let passed = 0;
let total = 0;

for (const target of targets) {
  total += target.tokens.length;
  const abs = path.join(root, target.file);
  if (!fs.existsSync(abs)) {
    const message = `Missing ${target.label}: ${target.file}`;
    if (target.warningOnly) console.warn(`Warning: ${message}`);
    else { console.error(message); failed = true; }
    continue;
  }
  const source = fs.readFileSync(abs, 'utf8');
  for (const token of target.tokens) {
    if (source.includes(token)) passed += 1;
    else {
      const message = `${target.label} missing token: ${token}`;
      if (target.warningOnly) console.warn(`Warning: ${message}`);
      else { console.error(message); failed = true; }
    }
  }
}

const score = Math.round((passed / Math.max(1, total)) * 100);
console.log(`OpenClaw+ parity score: ${score}% (${passed}/${total} checks)`);
if (failed) process.exit(1);
