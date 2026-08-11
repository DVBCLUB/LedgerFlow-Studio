import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateProductReleaseMediaCampaign } from './mediaFactoryEngine.ts';

describe('Pillar 3: Autonomous Multi-Modal Media & Video Factory', () => {
  it('generates multi-platform video scripts, social post copy, and n8n webhook payload', async () => {
    const campaign = await generateProductReleaseMediaCampaign({
      featureTitle: 'Autonomous Compliance Doctor 24/7',
      targetAudience: 'Enterprise CFOs & Founders',
      platforms: ['linkedin', 'facebook', 'tiktok_shorts'],
    });

    assert.ok(campaign.id.startsWith('cmp_'));
    assert.equal(campaign.featureTitle, 'Autonomous Compliance Doctor 24/7');
    assert.ok(campaign.videoScript.includes('Hook'));
    assert.ok(campaign.socialMediaPost.includes('ROCKET LAUNCH'));
    assert.equal(campaign.platforms.length, 3);
    assert.ok(campaign.n8nWebhookPayload.campaignId);
  });
});
