import fs from 'fs';
import path from 'path';

const sourceFile = path.resolve('server/services/agentSystemRoutes.ts');

// We should read the original routes from git or backup if agentSystemRoutes was overwritten, or we can restore it from git if needed
// Let's check if we need to read from git
import { execSync } from 'child_process';
let sourceCode;
try {
  sourceCode = execSync('git show HEAD:server/services/agentSystemRoutes.ts', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
} catch {
  sourceCode = fs.readFileSync(sourceFile, 'utf8');
}

const splitMarker = 'export function registerAgentSystemRoutes(app: Express): void {';
const splitIndex = sourceCode.indexOf(splitMarker);
if (splitIndex === -1) {
  console.error('Could not find registerAgentSystemRoutes definition in original');
  process.exit(1);
}

const topMatter = sourceCode.slice(0, splitIndex);
const body = sourceCode.slice(splitIndex + splitMarker.length);
const lastConsoleIndex = body.lastIndexOf('console.log(');
const routesBody = lastConsoleIndex !== -1 ? body.slice(0, lastConsoleIndex) : body.slice(0, body.lastIndexOf('}'));

const domains = [
  {
    name: 'agentLoopRoutes',
    fn: 'registerAgentLoopRoutes',
    file: 'server/services/agentLoopRoutes.ts',
    patterns: [
      /^\/api\/agent\/loop\//,
      /^\/api\/ai\/circuit-breaker/,
      /^\/api\/agent\/performance/,
      /^\/api\/agent\/auto-repair\//,
      /^\/api\/agent\/swe\/auto-heal/
    ]
  },
  {
    name: 'governanceSecurityRoutes',
    fn: 'registerGovernanceSecurityRoutes',
    file: 'server/services/governanceSecurityRoutes.ts',
    patterns: [
      /^\/api\/agent\/risk\//,
      /^\/api\/agent\/consensus\//,
      /^\/api\/security\/poison-shield\//,
      /^\/api\/governance\//,
      /^\/api\/sop\//,
      /^\/api\/delegation\//,
      /^\/api\/incidents\//,
      /^\/api\/probation\//,
      /^\/api\/agent\/routing-policy/,
      /^\/api\/agent\/route/,
      /^\/api\/agent\/eval\//,
      /^\/api\/cost\/governance/,
      /^\/api\/agent\/workflows/
    ]
  },
  {
    name: 'robotAutomationRoutes',
    fn: 'registerRobotAutomationRoutes',
    file: 'server/services/robotAutomationRoutes.ts',
    patterns: [
      /^\/api\/simulation\/digital-twin\//,
      /^\/api\/robot\//,
      /^\/api\/flywheel\//,
      /^\/api\/self-healing\//
    ]
  },
  {
    name: 'aiWorkforceRoutes',
    fn: 'registerAiWorkforceRoutes',
    file: 'server/services/aiWorkforceRoutes.ts',
    patterns: [
      /^\/api\/agent\/cockpit\//,
      /^\/api\/release\/handoff\//,
      /^\/api\/agent\/swarm\//,
      /^\/api\/agent\/staff\//,
      /^\/api\/agent\/employees/,
      /^\/api\/agent\/a2a\//,
      /^\/api\/agent\/routing-table/,
      /^\/api\/agent\/dispatch/,
      /^\/api\/agent\/cli\//,
      /^\/api\/agent\/local\//,
      /^\/api\/shifts\//,
      /^\/api\/handoff\/chains\//,
      /^\/api\/kpi\/employees/,
      /^\/api\/workforce\/live-board/,
      /^\/api\/tasks\//,
      /^\/api\/capacity\/forecast/,
      /^\/api\/departments\/requests/
    ]
  },
  {
    name: 'connectorIntegrationRoutes',
    fn: 'registerConnectorIntegrationRoutes',
    file: 'server/services/connectorIntegrationRoutes.ts',
    patterns: [
      /^\/api\/system\/events\//,
      /^\/api\/system\/telemetry\//,
      /^\/api\/distribution\//,
      /^\/api\/mcp\//,
      /^\/api\/ai\/edge\//,
      /^\/api\/agent\/learning/,
      /^\/api\/nexus\//,
      /^\/api\/connectors\//,
      /^\/api\/crm\/ai-scout\//,
      /^\/api\/analytics\/ai-roi/
    ]
  },
  {
    name: 'mediaContentRoutes',
    fn: 'registerMediaContentRoutes',
    file: 'server/services/mediaContentRoutes.ts',
    patterns: [
      /^\/api\/media\/campaign\//,
      /^\/api\/media\/script-to-video\//,
      /^\/api\/media\/archive/,
      /^\/api\/video-production\//,
      /^\/api\/game-asset\//,
      /^\/api\/voice\//,
      /^\/api\/ai\/gemini\//,
      /^\/api\/ai\/apprentice\//
    ]
  },
  {
    name: 'revenueCommerceRoutes',
    fn: 'registerRevenueCommerceRoutes',
    file: 'server/services/revenueCommerceRoutes.ts',
    patterns: [
      /^\/api\/revenue\//,
      /^\/api\/simulation\/synthetic-feedback\//,
      /^\/api\/simulation\/boardroom\//
    ]
  },
  {
    name: 'privacyComplianceRoutes',
    fn: 'registerPrivacyComplianceRoutes',
    file: 'server/services/privacyComplianceRoutes.ts',
    patterns: [
      /^\/api\/privacy\//,
      /^\/api\/radar\//,
      /^\/api\/ollama\/local\//
    ]
  }
];

const allImportLines = topMatter.split('\n').filter(l => l.startsWith('import '));

const lines = routesBody.split('\n');
const routeBlocks = [];
let currentBlock = [];
let currentPath = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const routeMatch = line.match(/app\.(get|post|put|delete|patch)\('([^']+)'/);
  if (routeMatch) {
    if (currentBlock.length > 0 && currentPath) {
      routeBlocks.push({ path: currentPath, code: currentBlock.join('\n') });
      currentBlock = [];
    }
    currentPath = routeMatch[2];
  }
  currentBlock.push(line);
}
if (currentBlock.length > 0 && currentPath) {
  routeBlocks.push({ path: currentPath, code: currentBlock.join('\n') });
}

console.log('Total extracted route blocks:', routeBlocks.length);

const domainBlocks = {};
domains.forEach(d => { domainBlocks[d.name] = []; });
const unassigned = [];

routeBlocks.forEach(block => {
  let matched = false;
  for (const domain of domains) {
    if (domain.patterns.some(p => p.test(block.path))) {
      domainBlocks[domain.name].push(block);
      matched = true;
      break;
    }
  }
  if (!matched) {
    unassigned.push(block.path);
  }
});

if (unassigned.length > 0) {
  console.warn('❌ Still unassigned routes:', unassigned);
  process.exit(1);
} else {
  console.log('🎉 100% of 205 route blocks successfully assigned across 8 domains!');
}

domains.forEach(domain => {
  const blocks = domainBlocks[domain.name];
  const combinedCode = blocks.map(b => b.code).join('\n\n');
  
  const neededImports = allImportLines.filter(imp => {
    const match = imp.match(/import\s+\{([^}]+)\}/) || imp.match(/import\s+type\s+\{([^}]+)\}/) || imp.match(/import\s+(\w+)\s+from/);
    if (!match) return false;
    const symbols = match[1].split(',').map(s => s.trim().split(' as ')[0].trim()).filter(Boolean);
    return symbols.some(sym => sym.length > 0 && new RegExp(`\\b${sym}\\b`).test(combinedCode));
  });

  const headerImports = [
    "import type { Express, Request, Response } from 'express';",
    "import { z } from 'zod';",
    "const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] ?? '' : value;"
  ];

  const schemas = [];
  if (/enqueueLoopSchema/.test(combinedCode)) {
    schemas.push(`const enqueueLoopSchema = z.object({
  goal: z.string().min(3, 'goal is required'),
  domain: z.enum(['coding', 'finance', 'marketing', 'sales', 'analytics', 'general']).optional().default('coding'),
  maxLoops: z.number().int().min(1).max(10).optional().default(5),
  maxRepairAttempts: z.number().int().min(0).max(5).optional().default(3),
  autoRepair: z.boolean().optional().default(false),
  stopOnFirstError: z.boolean().optional().default(true),
  sandboxMode: z.enum(['dry_run', 'local', 'docker']).optional(),
  testCommand: z.string().optional(),
  systemInstruction: z.string().optional(),
  timeoutMs: z.number().int().min(30_000).max(60 * 60 * 1000).optional(),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional().default('normal'),
});`);
  }
  if (/getBestAgentSchema/.test(combinedCode)) {
    schemas.push(`const getBestAgentSchema = z.object({
  domain: z.string().min(1),
  candidates: z.array(z.string()).min(1).max(20),
});`);
  }

  const fileContent = `/**
 * ${domain.name}.ts
 * ============================================================
 * Domain Sub-Router for ${domain.name}.
 * Auto-decoupled from agentSystemRoutes orchestrator.
 */

${headerImports.join('\n')}
${Array.from(new Set(neededImports)).join('\n')}

${schemas.join('\n\n')}

export function ${domain.fn}(app: Express): void {
${combinedCode}
}
`;

  fs.writeFileSync(path.resolve(domain.file), fileContent, 'utf8');
  console.log(`✅ Written ${domain.file} (${blocks.length} endpoints)`);
});

const orchestratorCode = `/**
 * agentSystemRoutes.ts
 * ============================================================
 * Central Orchestrator for all Agent System Sub-Routers.
 * 
 * Clean Modular Monolith Structure (8 Domain Sub-Routers):
 *  - agentLoopRoutes.ts
 *  - governanceSecurityRoutes.ts
 *  - robotAutomationRoutes.ts
 *  - aiWorkforceRoutes.ts
 *  - connectorIntegrationRoutes.ts
 *  - mediaContentRoutes.ts
 *  - revenueCommerceRoutes.ts
 *  - privacyComplianceRoutes.ts
 */

import type { Express } from 'express';
import { registerAgentLoopRoutes } from './agentLoopRoutes.ts';
import { registerGovernanceSecurityRoutes } from './governanceSecurityRoutes.ts';
import { registerRobotAutomationRoutes } from './robotAutomationRoutes.ts';
import { registerAiWorkforceRoutes } from './aiWorkforceRoutes.ts';
import { registerConnectorIntegrationRoutes } from './connectorIntegrationRoutes.ts';
import { registerMediaContentRoutes } from './mediaContentRoutes.ts';
import { registerRevenueCommerceRoutes } from './revenueCommerceRoutes.ts';
import { registerPrivacyComplianceRoutes } from './privacyComplianceRoutes.ts';

export function registerAgentSystemRoutes(app: Express): void {
  registerAgentLoopRoutes(app);
  registerGovernanceSecurityRoutes(app);
  registerRobotAutomationRoutes(app);
  registerAiWorkforceRoutes(app);
  registerConnectorIntegrationRoutes(app);
  registerMediaContentRoutes(app);
  registerRevenueCommerceRoutes(app);
  registerPrivacyComplianceRoutes(app);

  console.log('✅ Agent system routes registered (8 decoupled domain sub-routers active)');
}
`;

fs.writeFileSync(sourceFile, orchestratorCode, 'utf8');
console.log('✅ Updated agentSystemRoutes.ts orchestrator successfully.');
