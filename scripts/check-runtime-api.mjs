import { spawn } from 'child_process';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TIMEOUT_MS = 20000;
const POLL_MS = 500;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${pathname} did not return JSON: ${text.slice(0, 200)}`);
  }
  return { response, json };
}

async function waitForHealth() {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < TIMEOUT_MS) {
    try {
      const { response, json } = await fetchJson('/api/health');
      if (response.ok && json?.status === 'ok') {
        return;
      }
      lastError = new Error(`/api/health returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(POLL_MS);
  }

  throw new Error(`Server did not become healthy on ${BASE_URL} within ${TIMEOUT_MS}ms. Last error: ${lastError?.message || 'unknown'}`);
}

function stopServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
  }, 3000).unref?.();
}

const child = spawn(process.execPath, ['dist/server.cjs'], {
  env: {
    ...process.env,
    NODE_ENV: 'production'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

child.stdout.on('data', (chunk) => {
  stdout += chunk.toString();
});

child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

child.on('exit', (code, signal) => {
  if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGKILL') {
    console.error(`LedgerFlow runtime server exited early. code=${code} signal=${signal}`);
    console.error(stderr || stdout);
  }
});

try {
  console.log(`Starting LedgerFlow production server smoke test on ${BASE_URL}...`);
  await waitForHealth();

  const health = await fetchJson('/api/health');
  if (!health.response.ok || health.json?.status !== 'ok') {
    throw new Error('/api/health did not return status ok.');
  }

  const dbLoad = await fetchJson('/api/db/load');
  if (!dbLoad.response.ok || dbLoad.json?.success !== true) {
    throw new Error('/api/db/load did not return success true.');
  }

  const geminiStatus = await fetchJson('/api/gemini/status');
  if (!geminiStatus.response.ok || geminiStatus.json?.success !== true) {
    throw new Error('/api/gemini/status did not return success true.');
  }

  console.log('LedgerFlow runtime API smoke test passed: health, local db and Gemini status endpoints responded.');
} catch (error) {
  console.error('\nLedgerFlow runtime API smoke test failed:\n');
  console.error(error?.stack || error?.message || String(error));
  if (stdout) console.error(`\nServer stdout:\n${stdout}`);
  if (stderr) console.error(`\nServer stderr:\n${stderr}`);
  process.exitCode = 1;
} finally {
  stopServer(child);
}
