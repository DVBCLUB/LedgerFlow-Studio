/**
 * prod-launcher.mjs
 * ============================================================
 * Launches both LedgerFlow production servers:
 *   - Main app server (port 3000): dist/server.cjs
 *   - AI Assistant daemon (port 3001): dist/assistant-daemon.cjs
 *
 * Usage: node scripts/prod-launcher.mjs
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Verify build artifacts exist
const serverPath = path.join(root, 'dist', 'server.cjs');
const daemonPath = path.join(root, 'dist', 'assistant-daemon.cjs');

if (!fs.existsSync(serverPath)) {
  console.error('❌ dist/server.cjs not found. Run: npm run build');
  process.exit(1);
}
if (!fs.existsSync(daemonPath)) {
  console.error('❌ dist/assistant-daemon.cjs not found. Run: npm run build');
  process.exit(1);
}

function startProcess(label, filePath) {
  const child = spawn('node', [filePath], {
    cwd: root,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  child.stdout.on('data', (data) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      console.log(`[${label}] ${line}`);
    }
  });

  child.stderr.on('data', (data) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      console.error(`[${label}] ${line}`);
    }
  });

  child.on('close', (code) => {
    console.log(`[${label}] Process exited with code ${code}`);
    // If one process dies, kill the other
    otherChild?.kill();
    process.exit(code ?? 1);
  });

  return child;
}

console.log('╔══════════════════════════════════════════════════╗');
console.log('║     LedgerFlow Studio — Production Mode          ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

let otherChild = null;

const mainServer = startProcess('APP:3000', serverPath);
const daemon = startProcess('DAEMON:3001', daemonPath);
otherChild = daemon;

// Forward termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  mainServer.kill('SIGINT');
  daemon.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  mainServer.kill('SIGTERM');
  daemon.kill('SIGTERM');
  process.exit(0);
});

process.stdin.resume();
