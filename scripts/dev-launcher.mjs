/**
 * dev-launcher.mjs
 * ============================================================
 * Launches both LedgerFlow servers concurrently:
 *   - Main app server (port 3000): tsx server.ts
 *   - AI Assistant daemon (port 3001): tsx server/assistant-daemon.ts
 *
 * Usage: node scripts/dev-launcher.mjs
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function startProcess(label, scriptPath) {
  const child = spawn('npx', ['tsx', scriptPath], {
    cwd: root,
    stdio: 'pipe',
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
  });

  return child;
}

console.log('╔══════════════════════════════════════════════════╗');
console.log('║     LedgerFlow Studio — Dev Mode                 ║');
console.log('║     Starting main app + AI assistant daemon...   ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

const mainServer = startProcess('APP:3000', 'server.ts');
const daemon = startProcess('DAEMON:3001', 'server/assistant-daemon.ts');

// Forward termination signals
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

// Keep process alive
process.stdin.resume();
