import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGitHubSoftwareFactoryPRControlReport, fetchGitHubPullRequestControlInput } from './softwareFactoryGithubPrAdapter.ts';

function jsonResponse(value: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => value,
    text: async () => JSON.stringify(value),
  } as Response;
}

function mockFetch(routes: Record<string, unknown>) {
  return (async (url: string | URL | Request) => {
    const key = String(url);
    const match = Object.entries(routes).find(([route]) => key.startsWith(route));
    if (!match) return jsonResponse({ message: `missing route: ${key}` }, false, 404);
    return jsonResponse(match[1]);
  }) as typeof fetch;
}

test('GitHub PR adapter builds software factory input from PR files, reviews, checks and labels', async () => {
  const fetchImpl = mockFetch({
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/pulls/42/files': [
      { filename: 'server/services/authPolicy.ts', additions: 40, deletions: 2, status: 'modified' },
      { filename: 'src/modules/ai-hr/AIWorkforceRuntimePanel.tsx', additions: 25, deletions: 1, status: 'modified' },
    ],
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/pulls/42/reviews': [
      { user: { login: 'founder' }, state: 'APPROVED', submitted_at: '2026-01-01T00:00:00Z' },
      { user: { login: 'security-lead' }, state: 'APPROVED', submitted_at: '2026-01-01T00:01:00Z' },
    ],
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/commits/head-sha/check-runs': {
      check_runs: [
        { name: 'LedgerFlow Studio CI', status: 'completed', conclusion: 'success', html_url: 'https://checks.test/ci' },
        { name: 'Build Windows Desktop', status: 'completed', conclusion: 'success', html_url: 'https://checks.test/windows' },
      ],
    },
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/commits/head-sha/status': {
      statuses: [{ context: 'legacy/status', state: 'success', description: 'ok' }],
    },
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/pulls/42': {
      number: 42,
      title: 'Secure AI Workforce runtime',
      html_url: 'https://github.test/DVBCLUB/LedgerFlow-Studio/pull/42',
      body: 'Rollback plan: revert this PR and redeploy previous desktop package.',
      user: { login: 'diemmtk2' },
      base: { ref: 'main' },
      head: { ref: 'ai-workforce-implementation', sha: 'head-sha' },
      labels: [{ name: 'runtime' }, { name: 'security-approved' }],
      requested_reviewers: [{ login: 'founder' }],
    },
  });

  const input = await fetchGitHubPullRequestControlInput({ repoFullName: 'DVBCLUB/LedgerFlow-Studio', prNumber: 42, apiBaseUrl: 'https://api.test', fetchImpl });
  assert.equal(input.id, 'DVBCLUB/LedgerFlow-Studio#42');
  assert.equal(input.changedFiles.length, 2);
  assert.equal(input.checks.length, 3);
  assert.equal(input.hasRollbackPlan, true);
  assert.equal(input.hasHumanApproval, true);
  assert.equal(input.hasSecurityApproval, true);
  assert.equal(input.__adapter.approvals.approvedBy.includes('founder'), true);
  assert.equal(input.__adapter.evidence.checkRunsFetched, 2);

  const result = await buildGitHubSoftwareFactoryPRControlReport({ repoFullName: 'DVBCLUB/LedgerFlow-Studio', prNumber: 42, apiBaseUrl: 'https://api.test', fetchImpl });
  assert.equal(result.report.pr.id, 'DVBCLUB/LedgerFlow-Studio#42');
  assert.equal(result.adapter.headSha, 'head-sha');
  assert.ok(result.report.evidence.filesChanged >= 2);
  assert.ok(result.report.reviewerChecklist.length >= 3);
});

test('GitHub PR adapter blocks unresolved change requests and failed checks', async () => {
  const fetchImpl = mockFetch({
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/pulls/7/files': [
      { filename: 'server/services/tokenVault.ts', additions: 12, deletions: 0, status: 'modified' },
    ],
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/pulls/7/reviews': [
      { user: { login: 'reviewer' }, state: 'CHANGES_REQUESTED', submitted_at: '2026-01-01T00:00:00Z' },
    ],
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/commits/bad-sha/check-runs': {
      check_runs: [{ name: 'Unit tests', status: 'completed', conclusion: 'failure' }],
    },
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/commits/bad-sha/status': { statuses: [] },
    'https://api.test/repos/DVBCLUB/LedgerFlow-Studio/pulls/7': {
      number: 7,
      title: 'Risky token change',
      body: '',
      user: { login: 'bot' },
      base: { ref: 'main' },
      head: { ref: 'feature/token', sha: 'bad-sha' },
      labels: [],
      requested_reviewers: [],
    },
  });

  const result = await buildGitHubSoftwareFactoryPRControlReport({ repoFullName: 'DVBCLUB/LedgerFlow-Studio', prNumber: 7, apiBaseUrl: 'https://api.test', fetchImpl });
  assert.equal(result.input.hasHumanApproval, false);
  assert.equal(result.report.mergeGate.allowed, false);
  assert.equal(result.report.mergeGate.mode, 'blocked');
  assert.ok(result.report.mergeGate.reasons.some((reason) => /failed/i.test(reason)));
  assert.equal(result.adapter.approvals.changesRequestedBy.includes('reviewer'), true);
});
