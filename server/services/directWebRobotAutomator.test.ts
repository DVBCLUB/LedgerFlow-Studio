import { describe, it, expect } from 'vitest';
import {
  listDirectWebRobots,
  runDirectWebRobotTask,
} from './directWebRobotAutomator.ts';

describe('directWebRobotAutomator', () => {
  it('loads preset web robot profiles and checks saved API dollars', async () => {
    const robots = await listDirectWebRobots();
    expect(robots.length).toBeGreaterThan(0);
    expect(robots[0].apiDollarsSavedUsd).toBeGreaterThan(0);
  });

  it('runs direct web robot action and updates savings metrics', async () => {
    const robots = await listDirectWebRobots();
    const target = robots[0];

    const res = await runDirectWebRobotTask(target.id, 'Tự động đăng TikTok Video trên Web Studio');
    expect(res.success).toBe(true);
    expect(res.dollarsSaved).toBeGreaterThan(0);
  });
});
