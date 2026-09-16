import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  discoverVentureOpportunity,
  incubateVentureProject,
  listIncubatedVentures,
} from './glaciaVentureStudioEngine.ts';

describe('Glacia Autonomous Venture Studio & Launchpad (Epoch 10)', () => {
  it('discovers market opportunities with TAM/SAM/SOM and competitive moat analysis', () => {
    const opp = discoverVentureOpportunity('accounting_saas');

    assert.ok(opp.opportunityId.startsWith('opp-'));
    assert.equal(opp.sector, 'accounting_saas');
    assert.ok(opp.tamSamSomEstimate.tamUsd.includes('$'));
    assert.ok(opp.confidenceScore >= 0.85);
    assert.ok(opp.marketProblem.length > 20);
  });

  it('incubates venture projects with complete MVP spec, monetization tiers and VietQR', () => {
    const venture = incubateVentureProject('indie_game', 'Glacia Dragon Odyssey');

    assert.ok(venture.ventureId.startsWith('venture-'));
    assert.ok(venture.mvpSpecification.coreFeatures.length >= 3);
    assert.equal(venture.monetizationPlan.vietqrPaymentHookEnabled, true);
    assert.equal(venture.monetizationPlan.tiers.length, 3);
    assert.ok(venture.gtmStrategy.firstMonthTargetUsers > 0);
  });

  it('retrieves persistent incubated ventures list cleanly', () => {
    const list = listIncubatedVentures();
    assert.ok(list.length >= 1);
  });
});
