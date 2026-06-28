import fs from 'node:fs';
import path from 'node:path';

const smokePath = path.resolve('scripts/check-ai-workforce-runtime-routes.mjs');

if (!fs.existsSync(smokePath)) {
  throw new Error(`AI Workforce runtime smoke source not found: ${smokePath}`);
}

let source = fs.readFileSync(smokePath, 'utf8');
let changed = false;

const token = '/api/ai-workforce/release-gate-export';
const anchor = `  if (!String(releaseGate.json?.gate?.finalAction || '').includes('Ready') || releaseGate.json?.dossier?.summary?.approvals !== 1) {
    throw new Error('Mission release gate smoke did not return final action and persisted approval dossier.');
  }

  const githubControl = await fetchJson(DAEMON_URL, '/api/ai-workforce/github-pr-control', {`;

const insertion = `  if (!String(releaseGate.json?.gate?.finalAction || '').includes('Ready') || releaseGate.json?.dossier?.summary?.approvals !== 1) {
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

  const githubControl = await fetchJson(DAEMON_URL, '/api/ai-workforce/github-pr-control', {`;

if (!source.includes(token)) {
  if (!source.includes(anchor)) throw new Error('Cannot patch release gate export smoke: release gate anchor not found.');
  source = source.replace(anchor, insertion);
  changed = true;
}

if (changed) {
  fs.writeFileSync(smokePath, source);
  console.log('AI Workforce release gate export runtime smoke patched.');
} else {
  console.log('AI Workforce release gate export runtime smoke already patched.');
}
