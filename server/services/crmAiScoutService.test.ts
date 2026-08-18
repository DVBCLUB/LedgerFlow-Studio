import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanLeadsAndProposeFollowups, type LeadProfile } from './crmAiScoutService.ts';

describe('crmAiScoutService - Autonomous Lead Scouting', () => {
  it('scans sample leads and ranks by priority accurately', () => {
    const result = scanLeadsAndProposeFollowups();

    assert.ok(result.totalScanned >= 4);
    assert.ok(result.highPriorityCount >= 2);
    assert.equal(result.suggestions[0].priority, 'CRITICAL');
    assert.ok(result.suggestions[0].conversionProbabilityPct >= 90);
    assert.ok(result.suggestions[0].recommendedAction.length > 10);
  });

  it('proposes custom pitch angles for specific industries', () => {
    const customLeads: LeadProfile[] = [
      {
        id: 'lead_test_saas',
        customerName: 'Trịnh Văn Long',
        companyName: 'SaaS Innovate Vietnam',
        industry: 'saas',
        dealValueVnd: 50000000,
        lastContactDaysAgo: 1,
        leadScore: 92,
        stage: 'negotiation',
      },
    ];

    const result = scanLeadsAndProposeFollowups(customLeads);
    assert.equal(result.suggestions.length, 1);
    assert.equal(result.suggestions[0].priority, 'CRITICAL');
    assert.ok(result.suggestions[0].pitchAngle.includes('Solo Founder'));
  });
});
