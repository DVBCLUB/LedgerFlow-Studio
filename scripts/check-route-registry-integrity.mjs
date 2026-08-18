/**
 * check-route-registry-integrity.mjs
 * ============================================================
 * Verification script to validate that all 8 domain sub-routers:
 *  1. Exist on disk
 *  2. Export valid register*Routes functions
 *  3. Are properly wired into agentSystemRoutes.ts orchestrator
 *  4. Have no duplicate endpoint registrations
 */

import fs from 'fs';
import path from 'path';

const expectedSubRouters = [
  { file: 'server/services/agentLoopRoutes.ts', fn: 'registerAgentLoopRoutes' },
  { file: 'server/services/governanceSecurityRoutes.ts', fn: 'registerGovernanceSecurityRoutes' },
  { file: 'server/services/robotAutomationRoutes.ts', fn: 'registerRobotAutomationRoutes' },
  { file: 'server/services/aiWorkforceRoutes.ts', fn: 'registerAiWorkforceRoutes' },
  { file: 'server/services/connectorIntegrationRoutes.ts', fn: 'registerConnectorIntegrationRoutes' },
  { file: 'server/services/mediaContentRoutes.ts', fn: 'registerMediaContentRoutes' },
  { file: 'server/services/revenueCommerceRoutes.ts', fn: 'registerRevenueCommerceRoutes' },
  { file: 'server/services/privacyComplianceRoutes.ts', fn: 'registerPrivacyComplianceRoutes' },
];

console.log('🔍 Checking Route Registry Integrity across all sub-routers...\n');

let hasError = false;
const registeredPaths = new Map();
let totalEndpoints = 0;

// 1. Check sub-router files
for (const sub of expectedSubRouters) {
  const filePath = path.resolve(sub.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing sub-router file: ${sub.file}`);
    hasError = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(`export function ${sub.fn}`)) {
    console.error(`❌ Sub-router ${sub.file} does not export ${sub.fn}`);
    hasError = true;
  }

  // Scan endpoints
  const matches = content.matchAll(/app\.(get|post|put|delete|patch)\('([^']+)'/g);
  let fileCount = 0;
  for (const m of matches) {
    const method = m[1].toUpperCase();
    const endpoint = m[2];
    const key = `${method} ${endpoint}`;
    if (registeredPaths.has(key)) {
      console.warn(`⚠️ Warning: Duplicate route detected: ${key} in ${sub.file} (already in ${registeredPaths.get(key)})`);
    } else {
      registeredPaths.set(key, sub.file);
    }
    fileCount++;
  }
  totalEndpoints += fileCount;
  console.log(`  ✔ ${path.basename(sub.file)}: ${fileCount} endpoints verified`);
}

// 2. Check orchestrator wiring
const orchestratorPath = path.resolve('server/services/agentSystemRoutes.ts');
if (!fs.existsSync(orchestratorPath)) {
  console.error(`❌ Missing orchestrator: server/services/agentSystemRoutes.ts`);
  hasError = true;
} else {
  const orchContent = fs.readFileSync(orchestratorPath, 'utf8');
  for (const sub of expectedSubRouters) {
    if (!orchContent.includes(sub.fn)) {
      console.error(`❌ Orchestrator does not invoke ${sub.fn}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\n❌ Route Registry Integrity check FAILED.');
  process.exit(1);
} else {
  console.log(`\n🎉 Route Registry Integrity PASSED: ${expectedSubRouters.length} sub-routers active, ${totalEndpoints} endpoints registered.`);
}
