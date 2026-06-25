#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoots = ['src'];
const extensions = new Set(['.ts', '.tsx']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (extensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function normalizeLucideImports(source) {
  return source.replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/g, (_match, body) => {
    const uniqueNames = [];
    for (const rawName of body.split(',')) {
      const name = rawName.trim();
      if (name && !uniqueNames.includes(name)) uniqueNames.push(name);
    }
    return `import { ${uniqueNames.join(', ')} } from 'lucide-react';`;
  });
}

let changed = 0;
for (const sourceRoot of sourceRoots) {
  for (const file of walk(path.join(root, sourceRoot))) {
    const source = fs.readFileSync(file, 'utf8');
    let next = source
      .replace(/TerminalSquare/g, 'Terminal')
      .replace(/SquareTerminal/g, 'Terminal');
    next = normalizeLucideImports(next);

    if (next !== source) {
      fs.writeFileSync(file, next);
      changed += 1;
      console.log(`Patched lucide terminal icon usage: ${path.relative(root, file)}`);
    }
  }
}

console.log(`Lucide terminal icon compatibility patch complete. Files changed: ${changed}`);
