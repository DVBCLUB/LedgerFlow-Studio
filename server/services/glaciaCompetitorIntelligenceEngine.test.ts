import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listTrackedCompetitors,
  generateCompetitorWeeklyDigest,
  getLatestCompetitorDigest,
  saveCompetitorProfiles,
} from './glaciaCompetitorIntelligenceEngine.ts';

describe('Glacia Competitor Intelligence Engine (Frontier 6)', () => {
  it('loads default tracked competitors across ERP, Accounting and AI IDE categories', () => {
    const competitors = listTrackedCompetitors();
    assert.ok(competitors.length >= 3);

    const misa = competitors.find((c) => c.id === 'misa_amis');
    assert.ok(misa);
    assert.equal(misa.category, 'vietnam_erp_accounting');
    assert.ok(misa.pricingTiers.length > 0);
    assert.ok(misa.swotAnalysis.recommendedCounterStrategy.length > 10);
  });

  it('generates a comprehensive weekly digest with pricing deltas and strategic executive recommendations', () => {
    const digest = generateCompetitorWeeklyDigest();
    assert.ok(digest.id.startsWith('digest-week-'));
    assert.ok(digest.competitorsScanned >= 3);
    assert.ok(digest.pricingChangesDetected.length > 0);
    assert.ok(digest.notableFeatureReleases.length > 0);
    assert.ok(digest.recommendedExecutiveActions.length >= 2);
  });

  it('retrieves the latest persistent competitor digest accurately', () => {
    const latest = getLatestCompetitorDigest();
    assert.ok(latest);
    assert.equal(latest.year, 2026);
    assert.ok(Array.isArray(latest.strategicTakeaways));
  });

  it('persists and updates competitor profile alterations cleanly', () => {
    const list = listTrackedCompetitors();
    const misa = list.find((c) => c.id === 'misa_amis')!;
    const originalShare = misa.estimatedMarketShare;

    misa.estimatedMarketShare = 44;
    saveCompetitorProfiles(list);

    const reloaded = listTrackedCompetitors();
    const updatedMisa = reloaded.find((c) => c.id === 'misa_amis')!;
    assert.equal(updatedMisa.estimatedMarketShare, 44);

    // Restore
    updatedMisa.estimatedMarketShare = originalShare;
    saveCompetitorProfiles(reloaded);
  });
});
