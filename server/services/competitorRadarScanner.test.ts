import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scanCompetitorLandscape,
  generateCompetitiveBattleCard,
} from './competitorRadarScanner.ts';

describe('competitorRadarScanner - Market & Competitor Intelligence', () => {
  it('scans competitor matrix and computes market average price', () => {
    const scan = scanCompetitorLandscape();

    assert.ok(scan.competitorsCount >= 2);
    assert.ok(scan.marketAveragePriceVndMonth > 0);
    assert.ok(scan.competitors.some((c) => c.name.includes('MISA')));
  });

  it('generates a complete battle card with objection handling scripts', () => {
    const battleCard = generateCompetitiveBattleCard('comp_misa_sme');

    assert.ok(battleCard.cardId.startsWith('btc_'));
    assert.equal(battleCard.competitorName, 'MISA SME / AMIS');
    assert.ok(battleCard.objectionHandlingScripts.length >= 1);
  });
});
