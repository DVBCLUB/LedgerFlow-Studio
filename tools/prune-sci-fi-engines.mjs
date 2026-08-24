import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeWiringGraph } from './wiring-graph.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routerPath = path.join(root, 'server/services/dormantServicesRouter.ts');
let src = fs.readFileSync(routerPath, 'utf8');
const dryRun = process.argv.includes('--dry-run');

// 15 sci-fi engines (clearly unnecessary for a company OS)
const TARGETS = new Set([
  'postQuantumVaultEngine', 'satelliteOfflineMeshEngine', 'spatialAccountingBoardroomEngine',
  'droneLidarInventoryEngine', 'sentientSingularityEngine', 'zeroKnowledgeAuditEngine',
  'smartContractEscrowEngine', 'overnightYieldSweepEngine', 'macroeconomicStressSimulatorEngine',
  'iotEdgeScaleSyncEngine', 'virtualDataRoomEngine', 'patentAutoDraftingEngine',
  'knowledgeGraphMeshEngine', 'sovereignTransferPricingEngine', 'esgImpactMarketplaceEngine',
]);

// 1. Frontend-called routes
const called = new Set();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'release'].includes(e.name)) continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      const c = fs.readFileSync(p, 'utf8');
      for (const m of c.matchAll(/['"`](\/api\/dormant\/[^'"`?$]+)/g)) called.add(m[1]);
    }
  }
}
walk(path.join(root, 'src'));

// 2. Route blocks
const routeMatches = [];
for (const m of src.matchAll(/app\.(?:get|post|put|patch|delete)\(\s*['"](\/api\/dormant\/[^'"?]+)['"]/g)) {
  routeMatches.push({ path: m[1], index: m.index });
}
function seg(p) { return p.replace(/^\/api\/dormant\//, '').split('/').filter(Boolean); }
function matches(route, concrete) {
  const rs = seg(route), cs = seg(concrete);
  if (rs.length !== cs.length) return false;
  for (let i = 0; i < rs.length; i++) if (!rs[i].startsWith(':') && rs[i] !== cs[i]) return false;
  return true;
}
const unusedIdx = new Set();
for (let i = 0; i < routeMatches.length; i++) {
  if (![...called].some((c) => matches(routeMatches[i].path, c))) unusedIdx.add(i);
}

// 3. Imports: symbol -> file basename
const imports = new Map();
for (const m of src.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g)) {
  const base = path.basename(m[2], '.ts');
  for (const n of m[1].split(',').map((s) => s.trim()).filter(Boolean)) imports.set(n, base);
}

// 4. Per-block symbol usage
const targetSymbols = new Set([...imports.entries()].filter(([, base]) => TARGETS.has(base)).map(([name]) => name));
const blocksToRemove = new Set();
for (let i = 0; i < routeMatches.length; i++) {
  if (!unusedIdx.has(i)) continue;
  const body = src.slice(routeMatches[i].index, i + 1 < routeMatches.length ? routeMatches[i + 1].index : src.length);
  let usesTarget = false;
  for (const sym of targetSymbols) {
    if (new RegExp(`\\b${sym}\\b`).test(body)) { usesTarget = true; break; }
  }
  if (usesTarget) blocksToRemove.add(i);
}

// 5. Safety: verify each target is dormant in wiring graph (not imported elsewhere)
const g = computeWiringGraph();
const notDormant = [...TARGETS].filter((t) => g.files[`server/services/${t}.ts`] !== 'dormant');
if (notDormant.length) {
  console.error('ABORT: these targets are NOT dormant (used elsewhere):', notDormant.join(', '));
  process.exit(1);
}

console.log('target engines:', TARGETS.size);
console.log('route blocks to remove:', blocksToRemove.size);
console.log('routes:');
for (const i of blocksToRemove) console.log('  ' + routeMatches[i].path);

if (dryRun) process.exit(0);

// 6. Remove route blocks (end to start)
const ranges = [...blocksToRemove]
  .map((i) => ({ s: routeMatches[i].index, e: i + 1 < routeMatches.length ? routeMatches[i + 1].index : src.length }))
  .sort((a, b) => b.s - a.s);
for (const r of ranges) src = src.slice(0, r.s) + src.slice(r.e);

// 7. Remove import lines for target files
for (const m of [...src.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g)].reverse()) {
  const base = path.basename(m[2], '.ts');
  if (!TARGETS.has(base)) continue;
  let start = m.index;
  let end = m.index + m[0].length;
  while (end < src.length && (src[end] === ' ' || src[end] === '\t')) end++;
  if (src[end] === '\r') end++;
  if (src[end] === '\n') end++;
  src = src.slice(0, start) + src.slice(end);
}

fs.writeFileSync(routerPath, src);
console.log('\nPruned. Now git rm these 15 files:');
console.log([...TARGETS].map((t) => `server/services/${t}.ts`).join('\n'));
