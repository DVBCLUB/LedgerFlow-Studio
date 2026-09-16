import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  runDreamConsolidationCycle,
  listDreamReports,
} from './glaciaDreamConsolidationEngine.ts';

describe('Glacia Dream Consolidation & Memory Defragmentation Engine (Epoch 8)', () => {
  it('runs a complete REM dream consolidation cycle compacting memories and discovering hidden connections', () => {
    const report = runDreamConsolidationCycle('Phân tích hành vi chốt đơn khách hàng xây dựng');

    assert.ok(report.dreamSessionId.startsWith('dream-'));
    assert.ok(report.totalMemoriesCompacted >= 10);
    assert.ok(report.newCrossDomainSynapsesFormed >= 5);
    assert.equal(report.replayedEpisodes.length, 2);
    assert.ok(report.replayedEpisodes.some(e => e.replayedAtStage === 'REM_associative_dreaming'));
    assert.ok(report.replayedEpisodes.some(e => e.replayedAtStage === 'NREM_slow_wave'));
    assert.ok(report.executiveDreamInsightForCEO.length > 20);
    assert.ok(report.recommendedFocusForToday.length >= 2);
  });

  it('retrieves persistent morning dream reports cleanly', () => {
    const list = listDreamReports();
    assert.ok(list.length >= 1);
    assert.ok(list[0].executiveDreamInsightForCEO.length > 10);
  });
});
