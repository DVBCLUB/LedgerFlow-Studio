#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const groups = [
  ['Agent runtime governance', 'server/services/agentRuntime.ts', ['approveAgentRunStep', 'rejectAgentRunStep', 'setAgentRuntimeEmergencyStop', 'appendAuditEvent']],
  ['Mobile mission commands', 'server/services/telegramMissionCommands.ts', ['/mission approve', '/mission reject', '/mission advance', '/ai emergency-stop']],
  ['Patch review sessions', 'server/services/patchReviewSessions.ts', ['createPatchReviewSessionsFromRun', 'approved_to_apply', 'rolled_back', 'rollbackHint']],
  ['Draft patch manifest', 'server/services/sandboxToolExecutor.ts', ['review_only_patch_manifest', 'applyable: false', 'targetFiles', 'safeRelativeFile']],
  ['Patch apply guard', 'server/services/patchReviewApply.ts', ['PATCH_APPLY_PHRASE', 'PATCH_ROLLBACK_PHRASE', 'validateManifestFiles', 'workspacePath']],
  ['Plugin security policy', 'server/services/pluginSecurityPolicy.ts', ['assessPluginSecurity', 'allowedForHostInvocation', 'signature', 'sandbox']],
  ['Plugin invocation boundary', 'server/services/pluginInvocationBoundary.ts', ['decidePluginInvocation', 'auditPluginInvocationDecision', 'sandbox_required']],
  ['Plugin runtime patcher', 'scripts/patch-plugin-runtime-boundary.mjs', ['pluginInvocationBoundary', 'decidePluginInvocation', 'auditPluginInvocationDecision']],
  ['Robot capability registry', 'server/services/robotCapabilityRegistry.ts', ['listRobotCapabilities', 'validateRobotCapabilityRequest', 'simulation', 'hardware']],
  ['Robot adapter boundary', 'server/services/robotAdapterBoundary.ts', ['Robot Adapter Boundary', 'acceptRobotCommand', 'RobotSafetyEnvelope', 'replayRunbook']],
  ['Automation scheduler loop', 'server/services/automationSchedulerLoop.ts', ['runAutomationSchedulerTick', 'startAutomationScheduler', 'stopAutomationScheduler', 'getAutomationSchedulerStatus']],
  ['Automation rule engine', 'server/services/automationRuleEngine.ts', ['fireAutomationEvent', 'requiresApproval', 'executionLog', 'robot.emergency_stop']],
  ['Robot automation UI panel', 'src/modules/ai-hr/AIWorkforceRobotAutomationBridge.tsx', ['Robot + Automation Bridge', '/api/robot-capabilities', '/api/automation-scheduler/status', 'schedulerAction']],
  ['Local orchestration', 'scripts/patch-ai-workforce-local.mjs', ['patch-daemon-agent-reject-route.mjs', 'patch-plugin-runtime-boundary.mjs', 'patch-ai-ops-safety-runbook-panel.mjs']],
  ['AI Workforce UI shell', 'src/modules/ai-hr/AIOperationsCenter.tsx', ['AIWorkforceMissionControl', 'AIWorkforcePatchReviewSessions', 'AIWorkforcePluginSecurityGuard']],
];

let passed = 0;
let total = 0;
const rows = [];

for (const [label, relativeFile, tokens] of groups) {
  const abs = path.join(root, relativeFile);
  const source = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  const hits = tokens.filter((token) => source.includes(token)).length;
  passed += hits;
  total += tokens.length;
  rows.push({ label, hits, total: tokens.length, missing: tokens.filter((token) => !source.includes(token)), file: relativeFile });
}

const score = Math.round((passed / Math.max(1, total)) * 100);
console.log(`OpenClaw+ readiness: ${score}% (${passed}/${total})`);
for (const row of rows) {
  const pct = Math.round((row.hits / Math.max(1, row.total)) * 100);
  console.log(`${pct === 100 ? '✅' : '⚠️'} ${row.label}: ${pct}% (${row.hits}/${row.total})`);
  if (row.missing.length) console.log(`   missing in ${row.file}: ${row.missing.join(', ')}`);
}

if (score < 90) {
  console.log('\nRecommended next local commands:');
  console.log('node scripts/patch-ai-workforce-local.mjs');
  console.log('node scripts/check-ai-workforce-local.mjs');
  console.log('node scripts/check-agent-runtime-rejection.mjs');
  console.log('node scripts/check-openclaw-plus-parity.mjs');
}
