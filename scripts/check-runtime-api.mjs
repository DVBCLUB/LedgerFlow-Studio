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

async function login() {
  const result = await fetchJson('/api/auth/local-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke@ledgerflow.local', password: 'runtime-smoke-password' })
  });
  if (!result.response.ok || result.json?.success !== true) {
    throw new Error(`Login failed with HTTP ${result.response.status}.`);
  }
  const cookie = result.response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('Login did not return an HttpOnly session cookie.');
  return cookie;
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
    NODE_ENV: 'production',
    LOCAL_AUTH_DEV_PASSWORD: 'runtime-smoke-password'
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

  const unauthorizedDbLoad = await fetchJson('/api/db/load');
  if (unauthorizedDbLoad.response.status !== 401) {
    throw new Error(`/api/db/load must reject unauthenticated requests; received ${unauthorizedDbLoad.response.status}.`);
  }

  const cookie = await login();
  const authenticated = { headers: { Cookie: cookie } };
  const dbLoad = await fetchJson('/api/db/load', authenticated);
  if (!dbLoad.response.ok || dbLoad.json?.success !== true) {
    throw new Error('/api/db/load did not return success true.');
  }

  const aiHealth = await fetchJson('/api/ai/health', authenticated);
  if (!aiHealth.response.ok || aiHealth.json?.success !== true) {
    throw new Error('/api/ai/health did not return success true.');
  }

  const preflight = await fetchJson('/api/ai/preflight', authenticated);
  if (!preflight.response.ok || !preflight.json?.report) {
    throw new Error('/api/ai/preflight did not return an AI Doctor report.');
  }

  const logout = await fetchJson('/api/auth/logout', { method: 'POST', headers: { Cookie: cookie } });
  if (!logout.response.ok || logout.json?.success !== true) {
    throw new Error('/api/auth/logout did not return success true.');
  }
  const afterLogout = await fetchJson('/api/db/load', authenticated);
  if (afterLogout.response.status !== 401) {
    throw new Error('Session remained authorized after logout.');
  }

  console.log('LedgerFlow runtime API smoke test passed: login, protected APIs, AI Doctor and logout were verified.');
} catch (error) {
  console.error('\nLedgerFlow runtime API smoke test failed:\n');
  console.error(error?.stack || error?.message || String(error));
  if (stdout) console.error(`\nServer stdout:\n${stdout}`);
  if (stderr) console.error(`\nServer stderr:\n${stderr}`);
  process.exitCode = 1;
} finally {
  stopServer(child);
}
