import { describe, it, expect } from 'vitest';
import { routeTaskSmart } from './robotCloudTaskRouter.ts';

describe('robotCloudTaskRouter', () => {
  it('routes non-urgent task to Web Robot to save 100% API cost', async () => {
    const decision = await routeTaskSmart('Tạo video TikTok 15s', 'video_gen', false);

    expect(decision.selectedRoute).toBe('web_robot');
    expect(decision.costSavedUsd).toBeGreaterThan(0);
    expect(decision.reason).toContain('0% chi phí API');
  });

  it('routes urgent task to Cloud API for fast rendering', async () => {
    const decision = await routeTaskSmart('Tạo video TikTok 15s Gấp', 'video_gen', true);

    expect(decision.selectedRoute).toBe('cloud_api');
    expect(decision.reason).toContain('Tốc độ cao');
  });
});
