import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeWiringGraph, getImportersOf } from './wiring-graph.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routerPath = path.join(root, 'server/services/dormantServicesRouter.ts');
const routerSrc = fs.readFileSync(routerPath, 'utf8');

// called routes
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

function seg(p) { return p.replace(/^\/api\/dormant\//, '').split('/').filter(Boolean); }
function matches(route, concrete) {
  const rs = seg(route), cs = seg(concrete);
  if (rs.length !== cs.length) return false;
  for (let i = 0; i < rs.length; i++) if (!rs[i].startsWith(':') && rs[i] !== cs[i]) return false;
  return true;
}

const routeMatches = [];
for (const m of routerSrc.matchAll(/app\.(?:get|post|put|patch|delete)\(\s*['"](\/api\/dormant\/[^'"?]+)['"]/g)) routeMatches.push({ path: m[1], index: m.index });
const unusedIdx = new Set();
for (let i = 0; i < routeMatches.length; i++) {
  if (![...called].some((c) => matches(routeMatches[i].path, c))) unusedIdx.add(i);
}

// imports
const imports = new Map();
for (const m of routerSrc.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g)) {
  const base = path.basename(m[2], '.ts');
  for (const n of m[1].split(',').map((s) => s.trim()).filter(Boolean)) imports.set(n, base);
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
  for (const name of imports.keys()) if (new RegExp(`\\b${name}\\b`).test(body)) (isCalled ? usedInCalled : usedInUnused).add(name);
}

const g = computeWiringGraph();
const dormant = Object.entries(g.files).filter(([, s]) => s === 'dormant').map(([f]) => f);

const rows = [];
for (const f of dormant) {
  const base = path.basename(f, '.ts');
  // collect symbols imported from this file
  const syms = [...imports.entries()].filter(([, b]) => b === base).map(([n]) => n);
  let calledRoutes = 0, unusedRoutes = 0;
  const routePaths = [];
  for (let i = 0; i < routeMatches.length; i++) {
    const body = blockBody(i);
    const used = syms.some((s) => new RegExp(`\\b${s}\\b`).test(body));
    if (!used) continue;
    routePaths.push(routeMatches[i].path);
    if (unusedIdx.has(i)) unusedRoutes++; else calledRoutes++;
  }
  const importers = getImportersOf(f).filter((i) => !i.endsWith('dormantServicesRouter.ts') && !/\.test\./.test(i) && i !== f);
  rows.push({
    file: base,
    calledRoutes,
    unusedRoutes,
    hasImporters: importers.length > 0,
    importers: importers.join(', '),
    routePaths,
  });
}

rows.sort((a, b) => b.unusedRoutes - a.unusedRoutes || b.calledRoutes - a.calledRoutes);
console.log('dormant files:', rows.length);
console.log('with CALLED routes (used by UI):', rows.filter((r) => r.calledRoutes > 0).length);
console.log('with ONLY unused routes:', rows.filter((r) => r.calledRoutes === 0 && r.unusedRoutes > 0).length);
console.log('with NO routes (shared dep):', rows.filter((r) => r.calledRoutes === 0 && r.unusedRoutes === 0).length);
console.log('imported by other non-dormant files:', rows.filter((r) => r.hasImporters).length);
console.log('');
console.log('file\tcalled\tunused\timportedByOthers');
for (const r of rows) console.log(`${r.file}\t${r.calledRoutes}\t${r.unusedRoutes}\t${r.hasImporters ? 'YES:' + r.importers.slice(0, 60) : 'no'}`);
