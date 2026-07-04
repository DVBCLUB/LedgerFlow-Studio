import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(repoRoot, 'src');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function addResolutionCandidates(imports, fromFile, specifier) {
  if (!specifier.startsWith('.')) return;
  const base = path.resolve(path.dirname(fromFile), specifier);
  imports.add(base);
  imports.add(`${base}.ts`);
  imports.add(`${base}.tsx`);
  imports.add(path.join(base, 'index.ts'));
  imports.add(path.join(base, 'index.tsx'));
}

const files = walk(srcRoot);
const imported = new Set();
const staticImport = /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const exportFrom = /export\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)['"]([^'"]+)['"]/g;
const dynamicImport = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const regex of [staticImport, exportFrom, dynamicImport]) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      addResolutionCandidates(imported, file, match[1]);
    }
  }
}

const entryAllowlist = new Set([
  path.join(srcRoot, 'main.tsx'),
  path.join(srcRoot, 'App.tsx'),
  path.join(srcRoot, 'index.ts'),
  path.join(srcRoot, 'vite-env.d.ts'),
  path.join(srcRoot, 'app', 'companyNavigation.test.ts'),
]);

function isAllowedOrphan(file) {
  if (entryAllowlist.has(file)) return true;
  if (/\.test\.(ts|tsx)$/.test(file)) return true;
  if (file.includes(`${path.sep}types${path.sep}`)) return true;
  return false;
}

const orphans = files
  .filter((file) => !isAllowedOrphan(file))
  .filter((file) => !imported.has(file) && !imported.has(file.replace(/\.(ts|tsx)$/, '')))
  .map((file) => path.relative(repoRoot, file).replaceAll(path.sep, '/'))
  .sort();

console.log(`Found ${orphans.length} potentially unimported src files:`);
for (const file of orphans) console.log(file);
