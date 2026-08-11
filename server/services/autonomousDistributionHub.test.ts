import assert from 'node:assert/strict';
import test from 'node:test';
import {
  publishDistributionCampaign,
  generateLeadDemoScenario,
  listDistributionCampaigns,
} from './autonomousDistributionHub.ts';

test('publishDistributionCampaign creates multi-channel campaign report', async () => {
  const report = await publishDistributionCampaign({
    releaseVersion: 'v1.60.0',
    campaignTitle: 'Autonomous Level 5 Release',
    channels: ['telegram_channel', 'tech_blog'],
  });

  assert.ok(report.id.startsWith('camp_'));
  assert.equal(report.releaseVersion, 'v1.60.0');
  assert.equal(report.channels.length, 2);
  assert.equal(report.channels[0].status, 'sent');

  const list = listDistributionCampaigns(5);
  assert.ok(list.length >= 1);
});

test('generateLeadDemoScenario generates personalized demo walkthrough', () => {
  const scenario = generateLeadDemoScenario({
    leadName: 'Phạm Minh Tuấn',
    company: 'Fintech Vietnam Inc',
    industry: 'Financial Technology',
  });

  assert.ok(scenario.id.startsWith('demo_'));
  assert.equal(scenario.leadName, 'Phạm Minh Tuấn');
  assert.ok(scenario.recommendedModules.length >= 3);
  assert.ok(scenario.demoWalkthroughSteps.length >= 3);
});
