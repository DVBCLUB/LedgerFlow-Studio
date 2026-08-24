import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listDirectWebRobots,
  runDirectWebRobotTask,
} from './directWebRobotAutomator.ts';

test('directWebRobotAutomator - loads preset web robot profiles and checks saved API dollars', async () => {
  const robots = await listDirectWebRobots();
  assert.ok(robots.length > 0);
  assert.ok(robots[0].apiDollarsSavedUsd > 0);
});

test('directWebRobotAutomator - runs direct web robot action and updates savings metrics', async () => {
  const robots = await listDirectWebRobots();
  const target = robots[0];

  const res = await runDirectWebRobotTask(target.id, 'Tự động đăng TikTok Video trên Web Studio');
  assert.equal(res.success, true);
  assert.ok(res.dollarsSaved > 0);
});

