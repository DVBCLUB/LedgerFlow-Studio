import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFaultTolerance,
  computeQuorum,
  runPBFTLite,
  detectConflictingVoters,
  applyReputationSlash,
  assembleDefaultReplicas,
  deriveDemoVotes,
} from './bftConsensus.ts';
import type { BftReplica, BftVote } from './bftConsensus.ts';

const REPLICAS: BftReplica[] = [
  { id: 'r0', role: 'finance', weight: 1 },
  { id: 'r1', role: 'security', weight: 1 },
  { id: 'r2', role: 'architecture', weight: 1 },
  { id: 'r3', role: 'planner', weight: 1 },
];

function vote(id: string, value: 'approve' | 'reject'): BftVote {
  return { replicaId: id, value, confidence: 1 };
}

test('computeFaultTolerance - n >= 3f+1', () => {
  assert.equal(computeFaultTolerance(4), 1);
  assert.equal(computeFaultTolerance(7), 2);
  assert.equal(computeFaultTolerance(1), 0);
});

test('computeQuorum - 2f+1', () => {
  assert.equal(computeQuorum(4), 3);
  assert.equal(computeQuorum(7), 5);
  assert.equal(computeQuorum(1), 1);
});

test('runPBFTLite - unanimous approval decides approve', () => {
  const votes = REPLICAS.map((r) => vote(r.id, 'approve'));
  const d = runPBFTLite(REPLICAS, votes, { proposalId: 'p1' });
  assert.equal(d.decided, true);
  assert.equal(d.value, 'approve');
  assert.equal(d.faultsTolerated, 1);
});

test('runPBFTLite - single Byzantine dissenter cannot break quorum', () => {
  const votes = [vote('r0', 'reject'), vote('r1', 'approve'), vote('r2', 'approve'), vote('r3', 'approve')];
  const d = runPBFTLite(REPLICAS, votes);
  assert.equal(d.decided, true);
  assert.equal(d.value, 'approve');
});

test('runPBFTLite - two dissenters block quorum (no_quorum)', () => {
  const votes = [vote('r0', 'reject'), vote('r1', 'reject'), vote('r2', 'approve'), vote('r3', 'approve')];
  const d = runPBFTLite(REPLICAS, votes);
  assert.equal(d.decided, false);
  assert.equal(d.value, 'no_quorum');
});

test('runPBFTLite - ignores votes from unknown replicas', () => {
  const votes = [vote('ghost', 'approve'), vote('r1', 'approve'), vote('r2', 'approve'), vote('r3', 'approve')];
  const d = runPBFTLite(REPLICAS, votes);
  // r0 abstained, only 3 known votes with 3 approve → quorum 3 met, weight 3 >= 2.67
  assert.equal(d.decided, true);
});

test('detectConflictingVoters - flags replicas that flip votes across rounds', () => {
  const round1 = [vote('r0', 'approve'), vote('r1', 'approve')];
  const round2 = [vote('r0', 'reject'), vote('r1', 'approve')];
  const conflicts = detectConflictingVoters([round1, round2]);
  assert.deepEqual([...conflicts], ['r0']);
});

test('applyReputationSlash - halves weight of conflicting voters', () => {
  const slashed = applyReputationSlash(REPLICAS, new Set(['r0']));
  assert.equal(slashed[0].weight, 0.5);
  assert.equal(slashed[1].weight, 1);
});

test('assembleDefaultReplicas + deriveDemoVotes - demo path still reaches quorum', () => {
  const replicas = assembleDefaultReplicas();
  const votes = deriveDemoVotes(replicas);
  const d = runPBFTLite(replicas, votes);
  assert.equal(d.decided, true);
  assert.equal(d.value, 'approve');
});
