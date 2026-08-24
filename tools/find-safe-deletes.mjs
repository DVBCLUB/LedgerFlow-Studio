import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeWiringGraph, getImportersOf } from './wiring-graph.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routerPath = path.join(root, 'server/services/dormantServicesRouter.ts');
const routerSrc = fs.readFileSync(routerPath, 'utf8');

// 1. Frontend-called routes (quoted + template literal, stop at ?/${)
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

// 2. Route blocks + imports
const routeMatches = [];
for (const m of routerSrc.matchAll(/app\.(?:get|post|put|patch|delete)\(\s*['"](\/api\/dormant\/[^'"?]+)['"]/g)) {
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

const imports = new Map();
for (const m of routerSrc.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g)) {
  for (const n of m[1].split(',').map((s) => s.trim()).filter(Boolean)) imports.set(n, m[2]);
}

function blockBody(i) {
  const s = routeMatches[i].index;
  const e = i + 1 < routeMatches.length ? routeMatches[i + 1].index : routerSrc.length;
  return routerSrc.slice(s, e);
}
const usedInCalled = new Set();
const usedInUnused = new Set();
for (let i = 0; i < routeMatches.length; i++) {
  const body = blockBody(i);
  const isCalled = !unusedIdx.has(i);
  for (const name of imports.keys()) {
    if (new RegExp(`\\b${name}\\b`).test(body)) (isCalled ? usedInCalled : usedInUnused).add(name);
  }
}

// 3. Dormant files from wiring graph
const g = computeWiringGraph();
const dormantFiles = Object.entries(g.files).filter(([, s]) => s === 'dormant').map(([f]) => f);
const dormantSet = new Set(dormantFiles.map((f) => f.replace(/\\/g, '/')));

// 4. Map imports to files; check leaf + routes-unused
const fileRouteUse = new Map(); // relFile -> { called: Set<name>, unused: Set<name> }
for (const [name, file] of imports) {
  const rel = file.replace(/^\.\//, 'server/services/').replace(/^\.\.\//, '');
  if (!fileRouteUse.has(rel)) fileRouteUse.set(rel, { called: new Set(), unused: new Set() });
  const f = fileRouteUse.get(rel);
  if (usedInCalled.has(name)) f.called.add(name);
  if (usedInUnused.has(name)) f.unused.add(name);
}

const safeDeletes = [];
const keepReasons = [];
for (const [rel, f] of fileRouteUse) {
  if (!dormantSet.has(rel)) continue; // not dormant → definitely used elsewhere
  if (f.called.size > 0) continue; // has called routes → keep
  // leaf check: importers excluding dormant router + tests + self
  const importers = getImportersOf(rel).filter(
    (i) => !i.endsWith('dormantServicesRouter.ts') && !/\.test\.(ts|tsx)$/.test(i) && i !== rel
  );
  if (importers.length > 0) {
    keepReasons.push(`${rel} ← imported by: ${importers.join(', ')}`);
    continue;
  }
  safeDeletes.push(rel);
}

console.log('SAFE-TO-DELETE (dormant + routes-unused + leaf):', safeDeletes.length);
console.log(safeDeletes.join('\n'));
console.log('\nKEEP (dormant but imported elsewhere or has called routes):', keepReasons.length);
console.log(keepReasons.join('\n'));
