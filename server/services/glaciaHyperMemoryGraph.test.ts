import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  queryAssociativeMemory,
  pruneAndReinforceSynapses,
  getHyperMemoryGraphTopology,
} from './glaciaHyperMemoryGraph.ts';

describe('Glacia Hyper-Dimensional Memory Graph (Epoch 10)', () => {
  it('performs spreading activation and associative traversal in <10ms', () => {
    const res = queryAssociativeMemory('VAS');

    assert.equal(res.querySeed, 'VAS');
    assert.ok(res.activatedNodes.length >= 1);
    assert.ok(res.discoveredSynapticPathways.length >= 1);
    assert.ok(res.queryLatencyMs <= 10);
    assert.ok(res.synthesisInsight.includes('Kích hoạt thành công'));
  });

  it('reinforces synaptic edge weights and updates consolidation timestamp', () => {
    const before = getHyperMemoryGraphTopology();
    const after = pruneAndReinforceSynapses();

    assert.ok(after.edges[0].weight >= before.edges[0].weight);
    assert.ok(after.lastConsolidatedAt.length > 0);
  });

  it('returns full graph topology with clustering coefficient and layer metrics', () => {
    const topology = getHyperMemoryGraphTopology();

    assert.ok(topology.totalNodes >= 5);
    assert.ok(topology.totalEdges >= 5);
    assert.ok(topology.clusteringCoefficient > 0);
  });
});
