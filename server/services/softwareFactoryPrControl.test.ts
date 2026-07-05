import assert from 'node:assert/strict';
import test from 'node:test';
import { assertPRControlMergeAllowed, buildSoftwareFactoryPRControlReport } from './softwareFactoryPrControl.ts';

test('Software Factory PR Control allows a reviewed ready PR', () => {
  const report = buildSoftwareFactoryPRControlReport({
    id: '42',
    title: 'Runtime UI smoke',
    url: 'https://github.com/DVBCLUB/LedgerFlow-Studio/pull/42',
    author: 'DVBCLUB',
    baseBranch: 'main',
    headBranch: 'ai-workforce-implementation',
    changedFiles: [{ filename: 'src/modules/ai-hr/AIWorkforceRuntimePanel.tsx', additions: 80, deletions: 2 }],
    checks: [{ name: 'npm test', status: 'success' }, { name: 'contract check', status: 'success' }],
    ciLogSummary: 'All checks passed.',
    hasRollbackPlan: true,
    hasHumanApproval: true,
    requestedReviewers: ['founder'],
    labels: ['runtime'],
  }, '2026-01-01T00:00:00.000Z');

  assert.equal(report.readiness.verdict, 'ready');
  assert.equal(report.mergeGate.allowed, true);
  assert.equal(report.mergeGate.mode, 'auto_merge_ready');
  assert.ok(report.releaseNotesDraft.includes('Runtime UI smoke'));
  assert.ok(report.auditFingerprint.length >= 32);
  assert.equal(assertPRControlMergeAllowed(report), report);
});

test('Software Factory PR Control blocks risky PR without approvals', () => {
  const report = buildSoftwareFactoryPRControlReport({
    id: '99',
    title: 'Auth and database update',
    baseBranch: 'main',
    headBranch: 'risky-branch',
    changedFiles: [
      { filename: 'server/services/localAuth.ts', additions: 40, deletions: 10 },
      { filename: 'server/db/schema.ts', additions: 25, deletions: 5 },
    ],
    checks: [{ name: 'npm test', status: 'failure' }],
    hasRollbackPlan: false,
    requestedReviewers: [],
  });

  assert.equal(report.readiness.verdict, 'blocked');
  assert.equal(report.mergeGate.allowed, false);
  assert.equal(report.mergeGate.mode, 'blocked');
  assert.ok(report.mergeGate.reasons.length >= 1);
  assert.throws(() => assertPRControlMergeAllowed(report), /not allowed/);
});
