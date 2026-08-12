import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css']);
const sourceRoots = ['src', 'server', 'docs'];
const issues = [];

function listFiles(directory) {
  const full = path.join(root, directory);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(full, entry.name);
    return entry.isDirectory() ? listFiles(path.relative(root, target)) : [target];
  });
}

for (const file of sourceRoots.flatMap(listFiles)) {
  if (!extensions.has(path.extname(file))) continue;
  const raw = fs.readFileSync(file);
  const content = raw.toString('utf8');
  if (content.includes('\uFFFD') || !Buffer.from(content, 'utf8').equals(raw)) {
    issues.push(path.relative(root, file).replaceAll(path.sep, '/'));
  }
}

if (issues.length) {
  console.error('UTF-8 text encoding check failed:');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('UTF-8 text encoding check passed: all scanned source files are valid UTF-8 without replacement characters.');
