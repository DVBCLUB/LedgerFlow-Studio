import test from 'node:test';
import assert from 'node:assert/strict';
import { routeTaskSmart } from './robotCloudTaskRouter.ts';

test('robotCloudTaskRouter - routes non-urgent task to Web Robot to save 100% API cost', async () => {
  const decision = await routeTaskSmart('Tạo video TikTok 15s', 'video_gen', false);

  assert.equal(decision.selectedRoute, 'web_robot');
  assert.ok(decision.costSavedUsd > 0);
  assert.ok(decision.reason.includes('0% chi phí API'));
});

test('robotCloudTaskRouter - routes urgent task to Cloud API for fast rendering', async () => {
  const decision = await routeTaskSmart('Tạo video TikTok 15s Gấp', 'video_gen', true);

  assert.equal(decision.selectedRoute, 'cloud_api');
  assert.ok(decision.reason.includes('Tốc độ cao'));
});

