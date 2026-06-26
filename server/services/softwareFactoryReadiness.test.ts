import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSoftwareFactoryReady, scoreSoftwareFactoryReadiness } from './softwareFactoryReadiness.ts';

test('software factory readiness marks safe PR handoff as ready', () => {
  const report = scoreSoftwareFactoryReadiness({
    title: 'Add AI dashboard copy update',
    changedFiles: [{ filename: 'src/modules/ai-hr/AIWorkforceCommandCenter.tsx', additions: 42, deletions: 3 }],
    checks: [
      { name: 'npm test', status: 'success' },
      { name: 'build', status: 'success' },
      { name: 'lint', status: 'success' },
    ],
    ciLogSummary: 'All checks passed.',
    hasRollbackPlan: true,
  });

  assert.equal(report.verdict, 'ready');
  assert.ok(report.score >= 75);
  assert.equal(assertSoftwareFactoryReady(report), true);
});

test('software factory readiness blocks risky PR without approval', () => {
  const report = scoreSoftwareFactoryReadiness({
    title: 'Change auth service and migration',
    changedFiles: [
      { filename: 'server/services/localAuth.ts', additions: 120, deletions: 35 },
      { filename: 'migrations/20260626_add_users.sql', additions: 25, deletions: 0 },
    ],
    checks: [
      { name: 'npm test', status: 'success' },
      { name: 'build', status: 'failure', details: 'Type error' },
    ],
    touchesSecurity: true,
    touchesDataModel: true,
    hasRollbackPlan: false,
  });

  assert.equal(report.verdict, 'blocked');
  assert.ok(report.requiredApprovals.includes('Security review'));
  assert.ok(report.requiredApprovals.includes('Data/model migration review'));
  assert.ok(report.blockers.some((blocker) => blocker.includes('Required check failed')));
  assert.throws(() => assertSoftwareFactoryReady(report), /not ready/);
});
