import fs from 'fs';
import path from 'path';

const root = process.cwd();
const targets = ['dist', 'release', 'server.js'];

for (const target of targets) {
  const fullPath = path.join(root, target);
  if (!fs.existsSync(fullPath)) continue;

  const relative = path.relative(root, fullPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to clean unsafe path: ${fullPath}`);
  }

  fs.rmSync(fullPath, { recursive: true, force: true });
  console.log(`[clean] Removed ${relative}`);
}
