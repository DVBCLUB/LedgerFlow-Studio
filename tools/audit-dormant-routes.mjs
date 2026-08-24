import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const routerPath = path.join(root, 'server/services/dormantServicesRouter.ts');
const routerSrc = fs.readFileSync(routerPath, 'utf8');

// 1. Frontend-called paths
const called = new Set();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'release'].includes(e.name)) continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      const c = fs.readFileSync(p, 'utf8');
      // match both quoted strings AND template literals; stop at ?, ${, or closing delimiter
      for (const m of c.matchAll(/['"`](\/api\/dormant\/[^'"`?$]+)/g)) called.add(m[1]);
    }
  }
}
walk(path.join(root, 'src'));

// 2. Registered routes (with position)
const registered = [];
for (const m of routerSrc.matchAll(/app\.(?:get|post|put|patch|delete)\(\s*['"](\/api\/dormant\/[^'"?]+)['"]/g)) {
  registered.push({ path: m[1], index: m.index });
}

// 3. Structural matching: /x/:id vs /x/123
function segments(p) {
  return p.replace(/^\/api\/dormant\//, '').split('/').filter(Boolean);
}
function matches(route, concrete) {
  const rs = segments(route);
  const cs = segments(concrete);
  if (rs.length !== cs.length) return false;
  for (let i = 0; i < rs.length; i++) {
    if (rs[i].startsWith(':')) continue;
    if (rs[i] !== cs[i]) return false;
  }
  return true;
}

const unused = [];
for (const r of registered) {
  const used = [...called].some((c) => matches(r.path, c));
  if (!used) unused.push(r.path);
}

console.log('registered:', registered.length);
console.log('frontend-called:', called.size);
console.log('TRULY unused (after dynamic-param matching):', unused.length);
console.log('---');
console.log(unused.join('\n'));
