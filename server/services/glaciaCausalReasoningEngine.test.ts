import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  runRootCause5WhysAnalysis,
  runCounterfactualSimulation,
  listCausalAnalyses,
} from './glaciaCausalReasoningEngine.ts';

describe('Glacia Causal & Counterfactual Reasoning Engine (Epoch 8)', () => {
  it('performs recursive 5-Whys root cause analysis for technical issues', () => {
    const res = runRootCause5WhysAnalysis('Lỗi tràn bộ đệm khi sinh file GLTF 3D');

    assert.equal(res.whysChain.length, 5);
    assert.ok(res.rootCause.length > 10);
    assert.ok(res.preventionStrategy.length > 10);
    assert.equal(res.whysChain[0].level, 1);
    assert.equal(res.whysChain[4].level, 5);
  });

  it('performs 5-Whys for business metric drops tracing to root causes', () => {
    const res = runRootCause5WhysAnalysis('Doanh thu tháng 8 sụt giảm 15%');

    assert.ok(res.rootCause.includes('B2B') || res.rootCause.includes('tiếp cận'));
    assert.ok(res.preventionStrategy.includes('Harvester') || res.preventionStrategy.includes('tự động'));
  });

  it('runs what-if counterfactual simulation estimating alternative metric trajectories', () => {
    const sim = runCounterfactualSimulation('Doanh Thu Tháng (VND)', 100000000, 'Nếu tăng gấp đôi tần suất B2B Outreach');

    assert.ok(sim.analysisId.startsWith('counterfactual-'));
    assert.ok(Number(sim.estimatedAlternativeOutcome.projectedValue) > 100000000);
    assert.ok(sim.estimatedAlternativeOutcome.deltaVsActual.includes('+'));
    assert.ok(sim.confidenceInterval[0] >= 80);
  });

  it('retrieves persistent causal analyses cleanly', () => {
    const list = listCausalAnalyses();
    assert.ok(list.length >= 1);
  });
});
