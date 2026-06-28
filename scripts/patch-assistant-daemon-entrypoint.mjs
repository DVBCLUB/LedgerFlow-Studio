import fs from 'node:fs';
import path from 'node:path';

const daemonPath = path.resolve('server/assistant-daemon.ts');

if (!fs.existsSync(daemonPath)) {
  throw new Error(`Missing assistant daemon source: ${daemonPath}`);
}

const source = fs.readFileSync(daemonPath, 'utf8');

if (!source.includes('assistant-daemon.cjs') && source.includes('endsWith("assistant-daemon.js");')) {
  console.log('Assistant daemon entrypoint patch already applied.');
  process.exit(0);
}

const lines = source.split('\n');
const cjsLineIndex = lines.findIndex((line) => line.includes('assistant-daemon.cjs'));

if (cjsLineIndex === -1) {
  throw new Error('Cannot patch assistant daemon entrypoint: assistant-daemon.cjs auto-start line was not found.');
}

if (cjsLineIndex === 0 || !lines[cjsLineIndex - 1].includes('assistant-daemon.js')) {
  throw new Error('Cannot patch assistant daemon entrypoint: assistant-daemon.js line before cjs auto-start was not found.');
}

lines.splice(cjsLineIndex, 1);
lines[cjsLineIndex - 1] = lines[cjsLineIndex - 1].replace(/\s*\|\|\s*$/, ';');

fs.writeFileSync(daemonPath, lines.join('\n'));
console.log('Assistant daemon entrypoint patched to avoid double-starting bundled desktop daemon.');
