import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  replicateAutonomousNodePackage,
  getNodeReplicationTopology,
} from './glaciaNodeReplicationEngine.ts';

describe('Glacia Neural Node Self-Replication & Distributed Deployment (Epoch 12)', () => {
  it('replicates a lightweight WASM bundle node (<5MB) with cryptographic signature', () => {
    const node = replicateAutonomousNodePackage('edge_raspberry_pi', 'Warehouse Edge Pi 5');

    assert.ok(node.nodeId.startsWith('node-'));
    assert.equal(node.targetEnvironment, 'edge_raspberry_pi');
    assert.ok(node.bundleSizeBytes < 5000000); // Under 5MB
    assert.equal(node.cryptographicNodeSignature.length, 64);
    assert.ok(node.compiledSkillsCount >= 15);
  });

  it('returns full node replication swarm topology with latency metrics', () => {
    const topo = getNodeReplicationTopology();

    assert.ok(topo.totalNodes >= 2);
    assert.ok(topo.activeNodesCount >= 1);
    assert.ok(topo.totalBundledSkillsCount > 0);
  });
});
