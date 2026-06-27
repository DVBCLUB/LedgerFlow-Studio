import fs from 'node:fs';
import path from 'node:path';

const daemonPath = path.resolve('server/assistant-daemon.ts');

if (!fs.existsSync(daemonPath)) {
  throw new Error(`Missing assistant daemon source: ${daemonPath}`);
}

const source = fs.readFileSync(daemonPath, 'utf8');
const before = `const isEntryPoint = process.argv[1]?.replace(/\\/g, "/").endsWith("server/assistant-daemon.ts") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("assistant-daemon.js") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("assistant-daemon.cjs");`;
const after = `const isEntryPoint = process.argv[1]?.replace(/\\/g, "/").endsWith("server/assistant-daemon.ts") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("assistant-daemon.js");`;

if (source.includes(after)) {
  console.log('Assistant daemon entrypoint patch already applied.');
  process.exit(0);
}

if (!source.includes(before)) {
  throw new Error('Cannot patch assistant daemon entrypoint: expected auto-start anchor was not found.');
}

fs.writeFileSync(daemonPath, source.replace(before, after));
console.log('Assistant daemon entrypoint patched to avoid double-starting bundled desktop daemon.');
