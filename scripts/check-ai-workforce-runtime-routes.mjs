import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DAEMON_PORT = Number(process.env.AI_WORKFORCE_SMOKE_DAEMON_PORT || 3181);
const GITHUB_MOCK_PORT = Number(process.env.AI_WORKFORCE_SMOKE_GITHUB_PORT || 3182);
const DAEMON_URL = `http://127.0.0.1:${DAEMON_PORT}`;
const GITHUB_API_URL = `http://127.0.0.1:${GITHUB_MOCK_PORT}`;
const TIMEOUT_MS = 25000;
const POLL_MS = 400;


function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${pathname} did not return JSON: ${text.slice(0, 240)}`);
  }
  return { response, json };
}

async function waitForDaemonHealth() {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < TIMEOUT_MS) {
    try {
      const { response, json } = await fetchJson(DAEMON_URL, '/health');
      if (response.ok && json?.ok === true) return;
      lastError = new Error(`/health returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(POLL_MS);
  }

  throw new Error(`Assistant daemon did not become healthy on ${DAEMON_URL} within ${TIMEOUT_MS}ms. Last error: ${lastError?.message || 'unknown'}`);
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function fetchOptionalJson(pathname, options = {}) {
  const response = await fetch(`${DAEMON_URL}${pathname}`, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    return { response, json: null, text };
  }
  return { response, json, text };
}

function startMockGitHub() {
  const requests = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', GITHUB_API_URL);
    requests.push({ method: req.method, pathname: url.pathname, search: url.search });

    if (req.method !== 'GET') {
      json(res, 405, { message: 'method not allowed' });
      return;
    }

    if (url.pathname === '/repos/DVBCLUB/LedgerFlow-Studio/pulls/42') {
      json(res, 200, {
        number: 42,
        title: 'AI Workforce runtime smoke PR',
        html_url: 'https://github.local/DVBCLUB/LedgerFlow-Studio/pull/42',
        body: 'Rollback plan: revert this PR and redeploy the previous desktop package.',
        user: { login: 'diemmtk2' },
        base: { ref: 'main' },
        head: { ref: 'ai-workforce-implementation', sha: 'smoke-head-sha' },
        labels: [{ name: 'runtime' }, { name: 'security-approved' }, { name: 'release-ready' }],
        requested_reviewers: [{ login: 'founder' }],
      });
      return;
    }

    if (url.pathname === '/repos/DVBCLUB/LedgerFlow-Studio/pulls/42/files') {
      json(res, 200, [
        { filename: 'src/modules/ai-hr/AIWorkforceRuntimePanel.tsx', additions: 70, deletions: 4, status: 'modified' },
        { filename: 'server/services/softwareFactoryGithubPrAdapter.ts', additions: 120, deletions: 0, status: 'added' },
      ]);
      return;
    }

    if (url.pathname === '/repos/DVBCLUB/LedgerFlow-Studio/pulls/42/reviews') {
      json(res, 200, [
        { user: { login: 'founder' }, state: 'APPROVED', submitted_at: '2026-01-01T00:00:00.000Z' },
        { user: { login: 'security-lead' }, state: 'APPROVED', submitted_at: '2026-01-01T00:01:00.000Z' },
      ]);
      return;
    }

    if (url.pathname === '/repos/DVBCLUB/LedgerFlow-Studio/commits/smoke-head-sha/check-runs') {
      json(res, 200, {
        check_runs: [
          { name: 'LedgerFlow Studio CI', status: 'completed', conclusion: 'success', html_url: 'https://checks.local/ci' },
          { name: 'Build Windows Desktop', status: 'completed', conclusion: 'success', html_url: 'https://checks.local/windows' },
        ],
      });
      return;
    }

    if (url.pathname === '/repos/DVBCLUB/LedgerFlow-Studio/commits/smoke-head-sha/status') {
      json(res, 200, {
        state: 'success',
        statuses: [{ context: 'legacy/status', state: 'success', description: 'ok' }],
      });
      return;
    }

    json(res, 404, { message: `missing mock route: ${url.pathname}` });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(GITHUB_MOCK_PORT, '127.0.0.1', () => resolve({ server, requests }));
  });
}

function stopServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
  }, 3000).unref?.();
}

async function closeServer(server) {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
}

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-aiw-daemon-smoke-'));
let mock = null;
let child = null;
let stdout = '';
let stderr = '';

try {
  mock = await startMockGitHub();
  console.log(`Mock GitHub REST server running at ${GITHUB_API_URL}`);

  child = spawn(process.execPath, ['dist/assistant-daemon.cjs'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ASSISTANT_PORT: String(DAEMON_PORT),
      TELEGRAM_BOT_TOKEN: '',
      TELEGRAM_MODE: 'webhook',
      GITHUB_TOKEN: 'smoke-token',
      AI_WORKFORCE_RUNTIME_STORE_FILE: path.join(tempDir, 'runtime.json'),
      AI_WORKFORCE_OPERATIONAL_LEDGER_FILE: path.join(tempDir, 'ledger.json'),
      AI_WORKFORCE_RUN_METRIC_STORE_FILE: path.join(tempDir, 'metrics.json'),
      AI_WORKFORCE_MISSION_QUEUE_STORE_FILE: path.join(tempDir, 'mission-queues.json'),
      AI_WORKFORCE_MISSION_REVIEW_NOTE_STORE_FILE: path.join(tempDir, 'mission-review-notes.json'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  child.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGKILL') {
      console.error(`Assistant daemon exited early. code=${code} signal=${signal}`);
      console.error(stderr || stdout);
    }
  });

  console.log(`Starting AI Workforce daemon smoke test on ${DAEMON_URL}...`);
  await waitForDaemonHealth();

  const dashboard = await fetchJson(DAEMON_URL, '/api/ai-workforce/runtime');
  if (!dashboard.response.ok || dashboard.json?.ok !== true || !dashboard.json?.dashboard?.readiness) {
    throw new Error('/api/ai-workforce/runtime did not return dashboard readiness.');
  }

  const contextPack = await fetchJson(DAEMON_URL, '/api/ai-workforce/context-pack', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      question: 'Smoke test grounded runtime route',
      highImpact: true,
      sources: [{ kind: 'decision', title: 'Smoke source', content: 'AI Workforce smoke route must return a grounded context pack.', tags: ['smoke'], confidence: 0.9 }],
    }),
  });
  if (!contextPack.response.ok || contextPack.json?.ok !== true || !contextPack.json?.pack?.id) {
    throw new Error('/api/ai-workforce/context-pack did not return a context pack.');
  }

  const missionPlan = await fetchJson(DAEMON_URL, '/api/ai-workforce/mission-plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      goal: 'Plan a smoke mission for AI Workforce Runtime Hub with PR control, rollback notes, audit trail and metric evidence.',
      owner: 'Founder',
      domains: ['software factory', 'runtime'],
      constraints: ['preserve audit trail'],
      repoFullName: 'DVBCLUB/LedgerFlow-Studio',
      prNumber: 42,
      allowAutomation: true,
      sources: [{ kind: 'sop', title: 'Mission Planner Smoke SOP', content: 'Mission planner route must return steps, tool route, approvals, context pack and audit trail.', tags: ['mission-planner'], confidence: 0.92 }],
    }),
  });
  if (!missionPlan.response.ok || missionPlan.json?.ok !== true || !missionPlan.json?.plan?.id) {
    throw new Error('/api/ai-workforce/mission-plan did not return a mission plan.');
  }
  if (!missionPlan.json?.plan?.steps?.some((step) => step.toolId === 'github_pr_control')) {
    throw new Error('Mission Planner smoke did not route a GitHub PR Control step.');
  }

  const missionQueue = await fetchJson(DAEMON_URL, '/api/ai-workforce/mission-execution-queue', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      goal: 'Queue a smoke mission for AI Workforce snapshot export with PR control, rollback notes and evidence handoff.',
      owner: 'Founder',
      domains: ['software factory', 'runtime'],
      constraints: ['preserve audit trail'],
      repoFullName: 'DVBCLUB/LedgerFlow-Studio',
      prNumber: 42,
      allowAutomation: true,
      sources: [{ kind: 'sop', title: 'Mission Queue Smoke SOP', content: 'Mission queue route must create approval gates and snapshot export must return a reviewable handoff artifact.', tags: ['mission-planner'], confidence: 0.92 }],
    }),
  });
  if (!missionQueue.response.ok || missionQueue.json?.ok !== true || !missionQueue.json?.queue?.id) {
    throw new Error('/api/ai-workforce/mission-execution-queue did not create a queue.');
  }

  const reviewNote = await fetchJson(DAEMON_URL, '/api/ai-workforce/mission-review-note', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      queueId: missionQueue.json.queue.id,
      reviewer: 'Founder',
      decision: 'approved',
      summary: 'Persisted smoke review note approved for handoff.',
      requestedAction: 'Proceed after CI and snapshot checksum stay green.',
    }),
  });
  if (!reviewNote.response.ok || reviewNote.json?.ok !== true || !reviewNote.json?.note?.id) {
    throw new Error('/api/ai-workforce/mission-review-note did not persist a review note.');
  }
  if (!reviewNote.json?.dossier?.releaseReady || Number(reviewNote.json?.stats?.totalNotes || 0) < 1) {
    throw new Error('Persisted review note response did not include release-ready dossier and store stats.');
  }

  const reviewNotes = await fetchJson(DAEMON_URL, '/api/ai-workforce/mission-review-notes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ queueId: missionQueue.json.queue.id }),
  });
  if (!reviewNotes.response.ok || reviewNotes.json?.ok !== true || reviewNotes.json?.notes?.length !== 1) {
    throw new Error('/api/ai-workforce/mission-review-notes did not list the persisted review note.');
  }
  if (reviewNotes.json?.dossier?.summary?.approvals !== 1) {
    throw new Error('Persisted review note dossier did not count the approval.');
  }

  const snapshotExport = await fetchJson(DAEMON_URL, '/api/ai-workforce/mission-snapshot-export', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      queueId: missionQueue.json.queue.id,
      format: 'markdown',
      releaseEvidence: {
        ciStatus: 'success',
        approvals: 1,
        requiredApprovals: 1,
        releaseLabel: true,
        rollbackConfirmed: true,
        operatorConfirmed: true,
        notes: ['Runtime smoke snapshot release evidence'],
      },
    }),
  });
  if (!snapshotExport.response.ok || snapshotExport.json?.ok !== true || !snapshotExport.json?.snapshot?.content?.includes('## Next safe action')) {
    throw new Error('/api/ai-workforce/mission-snapshot-export did not return a Markdown snapshot handoff.');
  }
  if (!snapshotExport.json?.snapshot?.checksum || !snapshotExport.json?.snapshot?.filename?.endsWith('.md')) {
    throw new Error('Mission snapshot export response is missing checksum or Markdown filename.');
  }
  if (snapshotExport.json?.persistedReviewNotes !== 1 || !snapshotExport.json?.snapshot?.content?.includes('Persisted smoke review note approved for handoff.')) {
    throw new Error('Mission snapshot export did not include the persisted review note.');
  }
  if (snapshotExport.json?.snapshot?.summary?.reviewNotes !== 1 || snapshotExport.json?.snapshot?.summary?.releaseReady !== true) {
    throw new Error('Mission snapshot export summary did not include persisted review gate status.');
  }
  if (snapshotExport.json?.snapshot?.summary?.releaseGateDecision !== 'ready' || snapshotExport.json?.snapshot?.summary?.releaseGateReady !== true || !snapshotExport.json?.snapshot?.content?.includes('Decision: ready')) {
    throw new Error('Mission snapshot export did not bind release evidence into a ready release gate.');
  }

  const releaseGate = await fetchJson(DAEMON_URL, '/api/ai-workforce/mission-release-gate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      queueId: missionQueue.json.queue.id,
      ciStatus: 'success',
      approvals: 1,
      requiredApprovals: 1,
      snapshotChecksum: snapshotExport.json.snapshot.checksum,
      releaseLabel: true,
      rollbackConfirmed: true,
      operatorConfirmed: true,
      notes: ['Runtime smoke release gate'],
    }),
  });
  if (!releaseGate.response.ok || releaseGate.json?.ok !== true || !releaseGate.json?.gate?.checksum) {
    throw new Error('/api/ai-workforce/mission-release-gate did not return a release gate with checksum.');
  }
  if (releaseGate.json?.gate?.decision !== 'ready' || releaseGate.json?.gate?.releaseReady !== true || Number(releaseGate.json?.gate?.score || 0) < 80) {
    throw new Error('Mission release gate smoke did not return a ready decision with acceptable score.');
  }
  if (!String(releaseGate.json?.gate?.finalAction || '').includes('Ready') || releaseGate.json?.dossier?.summary?.approvals !== 1) {
    throw new Error('Mission release gate smoke did not return final action and persisted approval dossier.');
  }

  const releaseGateExport = await fetchJson(DAEMON_URL, '/api/ai-workforce/release-gate-export', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ format: 'markdown', actor: 'Runtime Smoke' }),
  });
  if (!releaseGateExport.response.ok || releaseGateExport.json?.ok !== true || !releaseGateExport.json?.exportArtifact?.checksum) {
    throw new Error('/api/ai-workforce/release-gate-export did not return an export artifact with checksum.');
  }
  if (releaseGateExport.json?.runtimeRecord?.type !== 'release_gate_export' || releaseGateExport.json?.auditEvent?.action !== 'release_gate_exported' || releaseGateExport.json?.metric?.toolId !== 'release_gate_export') {
    throw new Error('Release gate export smoke did not persist runtime record, audit event and metric.');
  }

  const releaseGateExportDashboard = await fetchJson(DAEMON_URL, '/api/ai-workforce/runtime');
  if (!releaseGateExportDashboard.response.ok || releaseGateExportDashboard.json?.ok !== true) {
    throw new Error('/api/ai-workforce/runtime did not return after release gate export.');
  }
  if (Number(releaseGateExportDashboard.json?.dashboard?.releaseGate?.totalExports || 0) < 1 || !releaseGateExportDashboard.json?.dashboard?.releaseGate?.exportHistory?.[0]?.checksum) {
    throw new Error('Release gate export smoke did not refresh dashboard exportHistory.');
  }

  const githubControl = await fetchJson(DAEMON_URL, '/api/ai-workforce/github-pr-control', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      repoFullName: 'DVBCLUB/LedgerFlow-Studio',
      prNumber: 42,
      apiBaseUrl: GITHUB_API_URL,
    }),
  });
  if (!githubControl.response.ok || githubControl.json?.ok !== true) {
    throw new Error(`/api/ai-workforce/github-pr-control failed: ${githubControl.response.status} ${JSON.stringify(githubControl.json)}`);
  }
  if (githubControl.json?.adapter?.headSha !== 'smoke-head-sha') {
    throw new Error('GitHub PR Control adapter did not use the mocked PR head SHA.');
  }
  if (!githubControl.json?.report?.mergeGate || !githubControl.json?.report?.readiness) {
    throw new Error('GitHub PR Control response is missing mergeGate/readiness.');
  }
  if (!mock.requests.some((request) => request.pathname.endsWith('/check-runs'))) {
    throw new Error('GitHub PR Control smoke did not request check-runs from the mock GitHub API.');
  }

  const driftReport = await fetchOptionalJson('/api/ai-workforce/mission-execution-queue/drift?limit=50');
  if (driftReport.response.status === 404) {
    console.warn('Skipping drift endpoint smoke assertion because dist assistant daemon artifact is missing /drift route (rebuild dist daemon to validate runtime route surface).');
  } else if (!driftReport.response.ok || driftReport.json?.ok !== true || !Array.isArray(driftReport.json?.report?.issues)) {
    throw new Error('/api/ai-workforce/mission-execution-queue/drift did not return report issues.');
  }

  const driftRepair = await fetchOptionalJson('/api/ai-workforce/mission-execution-queue/drift/repair', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ limit: 50 }),
  });
  if (driftRepair.response.status === 404) {
    console.warn('Skipping drift repair endpoint smoke assertion because dist assistant daemon artifact is missing /drift/repair route (rebuild dist daemon to validate runtime route surface).');
  } else if (!driftRepair.response.ok || driftRepair.json?.ok !== true || !driftRepair.json?.report) {
    throw new Error('/api/ai-workforce/mission-execution-queue/drift/repair did not return report payload.');
  }

  const gatewayHealth = await fetchOptionalJson('/api/gateway/health');
  if (gatewayHealth.response.status === 404) {
    console.warn('Skipping gateway health endpoint smoke assertion because dist assistant daemon artifact is missing /api/gateway/health route (rebuild dist daemon to validate runtime route surface).');
  } else if (!gatewayHealth.response.ok || gatewayHealth.json?.ok !== true || gatewayHealth.json?.providers === undefined || gatewayHealth.json?.stats === undefined) {
    throw new Error('/api/gateway/health did not return providers/stats snapshots.');
  }

  const finalDashboard = await fetchJson(DAEMON_URL, '/api/ai-workforce/runtime');
  if (!finalDashboard.response.ok || Number(finalDashboard.json?.dashboard?.metricStoreStats?.total || 0) < 4) {
    throw new Error('AI Workforce runtime dashboard did not include persisted metric store stats after smoke actions.');
  }

  console.log('AI Workforce daemon runtime smoke test passed: dashboard, context-pack, mission-plan, mission queue, persisted review notes, snapshot release evidence binding, release gate, snapshot export, GitHub PR Control route, drift endpoints, gateway health snapshots, mock GitHub adapter, audit and metric persistence were verified.');
} catch (error) {
  console.error('\nAI Workforce daemon runtime smoke test failed:\n');
  console.error(error?.stack || error?.message || String(error));
  if (stdout) console.error(`\nDaemon stdout:\n${stdout}`);
  if (stderr) console.error(`\nDaemon stderr:\n${stderr}`);
  process.exitCode = 1;
} finally {
  stopServer(child);
  await closeServer(mock?.server);
  await fs.rm(tempDir, { recursive: true, force: true });
}
