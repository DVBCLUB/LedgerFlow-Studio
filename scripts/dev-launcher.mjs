/**
 * dev-launcher.mjs
 * ============================================================
 * Launches both LedgerFlow servers concurrently:
 *   - Main app server (port 3000): server.ts
 *   - AI Assistant daemon (port 3001): server/assistant-daemon.ts
 *
 * Usage: node scripts/dev-launcher.mjs
 *
 * FIX (Windows): Uses `node --import tsx` instead of `npx tsx` or
 * .cmd wrappers to avoid ENOENT/EINVAL on Windows where npx/.cmd
 * files cannot be spawned directly without a shell.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/**
 * Spawn a TypeScript file using: node --import tsx <file>
 * This is fully cross-platform — works on Windows, macOS, and Linux
 * without relying on shell wrappers or npx.
 */
function startProcess(label, scriptPath, customEnv = {}) {
  const child = spawn('node', ['--import', 'tsx', scriptPath], {
    cwd: root,
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      FROM_DEV_LAUNCHER: 'true',
      ...customEnv
    },
    shell: false
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

  child.on('error', (err) => {
    console.error(`[${label}] Failed to start: ${err.message}`);
    console.error(`[${label}] Hint: Make sure tsx is installed (npm install)`);
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
console.log('  APP:    http://127.0.0.1:3005');
console.log('  DAEMON: http://127.0.0.1:3001');
console.log('');

const mainServer = startProcess('APP:3005', 'server.ts', { PORT: '3005' });

// Start daemon with esbuild __name polyfill loaded first (CJS require runs before ESM imports)
const polyfillCjsPath = path.resolve(__dirname, 'esbuild-name-polyfill.cjs');
const daemon = spawn('node', ['--require', polyfillCjsPath, '--import', 'tsx', 'server/assistant-daemon.ts'], {
  cwd: root,
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'development', FROM_DEV_LAUNCHER: 'true' },
  shell: false
});

daemon.stdout.on('data', (data) => {
  for (const line of data.toString().split('\n').filter(Boolean)) {
    console.log(`[DAEMON:3001] ${line}`);
  }
});

daemon.stderr.on('data', (data) => {
  for (const line of data.toString().split('\n').filter(Boolean)) {
    console.error(`[DAEMON:3001] ${line}`);
  }
});

daemon.on('error', (err) => {
  console.error(`[DAEMON:3001] Failed to start: ${err.message}`);
});

daemon.on('close', (code) => {
  console.log(`[DAEMON:3001] Process exited with code ${code}`);
});

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
