import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const hits = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'release'].includes(e.name)) continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((ln, i) => {
        if (ln.includes('api/dormant') && !/(['"]\/api\/dormant)/.test(ln)) {
          hits.push(path.relative(root, p) + ':' + (i + 1) + ': ' + ln.trim().slice(0, 140));
        }
      });
    }
  }
}
walk(path.join(root, 'src'));
console.log('non-literal api/dormant usages:', hits.length);
console.log(hits.slice(0, 60).join('\n'));
