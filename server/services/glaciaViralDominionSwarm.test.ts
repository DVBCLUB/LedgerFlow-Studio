import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateViralCampaignDominion,
  listViralDominionCampaigns,
} from './glaciaViralDominionSwarm.ts';

describe('Glacia Autonomous Viral Content & Brand Dominion Swarm (Epoch 11)', () => {
  it('generates viral campaigns with K-factor > 2.0 and psychological retention hooks', () => {
    const res = generateViralCampaignDominion('LedgerFlow Studio MVP', 'tiktok');

    assert.ok(res.campaignId.startsWith('viral-'));
    assert.equal(res.targetPlatform, 'tiktok');
    assert.ok(res.viralityKFactor >= 2.0);
    assert.ok(res.projectedOrganicImpressions >= 100000);
    assert.ok(res.scripts.length >= 2);
    assert.equal(res.vietqrCallToActionActive, true);
  });

  it('retrieves persistent viral campaigns cleanly', () => {
    const list = listViralDominionCampaigns();
    assert.ok(list.length >= 1);
  });
});
