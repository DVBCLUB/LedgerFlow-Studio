/**
 * server/services/glaciaSweSoftwareBench.test.ts
 * Unit tests for Glacia Autonomous SWE-Bench Multi-Agent Software Engineer.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  diagnoseAndFixSoftwareIssue,
  getSweBenchHistory,
  rollbackSweSnapshot,
} from './glaciaSweSoftwareBench.ts';

describe('Glacia Autonomous SWE-Bench Engineer', () => {
  it('diagnoses software issues, generates reproduction test and AST patches', async () => {
    const result = await diagnoseAndFixSoftwareIssue({
      issueTitle: 'Lỗi TypeError: Cannot read property map of undefined in Dashboard',
      issueDescription: 'Khi dữ liệu rỗng, component ném unhandled exception',
      affectedFiles: ['src/components/Dashboard.tsx', 'src/utils/dataMapper.ts'],
      errorTrace: 'TypeError: Cannot read properties of undefined (reading "map")',
      applyPatchImmediately: true,
    });

    assert.ok(result.taskId.startsWith('swe_'));
    assert.equal(result.status, 'verified');
    assert.ok(result.reproductionTestCode.includes('SWE Reproduction'));
    assert.equal(result.patches.length, 2);
    assert.ok(result.patches[0].diffUnified.includes('--- a/src/components/Dashboard.tsx'));
    assert.ok(result.reliabilityScore >= 90);
    assert.ok(result.rollbackSnapshotId.startsWith('snap_'));

    const history = getSweBenchHistory();
    assert.ok(history.length > 0);
  });

  it('handles rollback snapshot execution cleanly', () => {
    const rollback = rollbackSweSnapshot('non_existent_snapshot');
    assert.equal(rollback.success, false);
  });
});
