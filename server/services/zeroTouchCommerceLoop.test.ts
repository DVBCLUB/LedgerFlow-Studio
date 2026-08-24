import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeNextStage,
  startZeroTouchLoop,
  advanceLoopStage,
  recordLoopRevenue,
  getLoopRun,
  listLoopRuns,
  getLoopStats,
} from './zeroTouchCommerceLoop.ts';

test('computeNextStage - money transition requires approval', () => {
  const t = computeNextStage('sell', false);
  assert.equal(t.requiresApproval, true);
  assert.equal(t.advanced, false);

  const t2 = computeNextStage('sell', true);
  assert.equal(t2.advanced, true);
  assert.equal(t2.next, 'invoice');
});

test('computeNextStage - non-gated transition advances automatically', () => {
  const t = computeNextStage('build', false);
  assert.equal(t.advanced, true);
  assert.equal(t.next, 'market');
});

test('computeNextStage - done is terminal', () => {
  const t = computeNextStage('done', true);
  assert.equal(t.advanced, false);
  assert.equal(t.next, 'done');
});

test('zero-touch loop - runs full pipeline with approval gates', () => {
  const run = startZeroTouchLoop('prod_123');
  assert.equal(run.stage, 'signal');

  // Advance through signal→build→market→sell (all automatic)
  let r = run;
  for (const expected of ['build', 'market', 'sell']) {
    r = advanceLoopStage(r.id)!;
    assert.equal(r.stage, expected);
  }

  // sell → invoice is gated: without approval, stays and awaits
  r = advanceLoopStage(r.id, false)!;
  assert.equal(r.status, 'awaiting_approval');
  assert.equal(r.stage, 'sell');

  // With approval, moves to invoice
  r = advanceLoopStage(r.id, true)!;
  assert.equal(r.stage, 'invoice');

  recordLoopRevenue(r.id, 100_000_000, 30_000_000);
  const withRev = getLoopRun(r.id)!;
  assert.equal(withRev.marginVnd, 70_000_000);

  // invoice→reconcile automatic, reconcile→tax gated
  r = advanceLoopStage(r.id)!;
  assert.equal(r.stage, 'reconcile');
  r = advanceLoopStage(r.id, false)!;
  assert.equal(r.status, 'awaiting_approval');
  r = advanceLoopStage(r.id, true)!;
  assert.equal(r.stage, 'tax');
  r = advanceLoopStage(r.id)!;
  assert.equal(r.stage, 'done');
  assert.equal(r.status, 'completed');

  assert.equal(listLoopRuns().length, 1);
  assert.equal(getLoopStats().completed, 1);
});
