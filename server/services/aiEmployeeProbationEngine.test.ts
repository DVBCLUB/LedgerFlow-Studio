import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  startProbation,
  recordBenchmarkResult,
  evaluateProbation,
  listProbationRecords,
  STANDARD_PROBATION_BENCHMARKS,
  __resetProbationForTesting,
} from './aiEmployeeProbationEngine.ts';

describe('aiEmployeeProbationEngine - AI Model & Employee Benchmarking', () => {
  beforeEach(() => {
    __resetProbationForTesting();
  });

  it('starts probation record with 10 standard benchmarks', () => {
    const record = startProbation('role_ai_code_specialist', 'gemini-3-flash');

    assert.ok(record.probationId.startsWith('prb_'));
    assert.equal(record.status, 'IN_PROBATION');
    assert.equal(record.totalBenchmarksCount, 10);
    assert.equal(record.passedBenchmarksCount, 0);
  });

  it('evaluates graduation successfully when 10/10 benchmarks pass with high score', () => {
    const record = startProbation('role_ai_code_specialist', 'claude-3-5-sonnet');

    for (const b of STANDARD_PROBATION_BENCHMARKS) {
      recordBenchmarkResult(record.probationId, b.benchmarkId, 95, 'Pass');
    }

    const graduated = evaluateProbation(record.probationId);
    assert.equal(graduated.status, 'GRADUATED');
    assert.equal(graduated.passedBenchmarksCount, 10);
    assert.ok(graduated.overallScore >= 90);
    assert.ok(graduated.graduatedAt);
  });

  it('marks probation as FAILED when passing benchmarks are insufficient', () => {
    const record = startProbation('role_ai_market_scout', 'untested-model-7b');

    for (let i = 0; i < STANDARD_PROBATION_BENCHMARKS.length; i++) {
      const score = i < 4 ? 90 : 40; // Only 4 passed
      recordBenchmarkResult(record.probationId, STANDARD_PROBATION_BENCHMARKS[i].benchmarkId, score);
    }

    const failed = evaluateProbation(record.probationId);
    assert.equal(failed.status, 'FAILED');
    assert.equal(failed.passedBenchmarksCount, 4);
  });

  it('lists all probation records properly', () => {
    startProbation('role_ai_cfo_director', 'gemini-2.5-pro');
    const all = listProbationRecords();
    assert.ok(all.length >= 1);
  });
});
