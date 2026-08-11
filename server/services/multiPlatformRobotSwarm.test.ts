import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchMultiPlatformRobotMission,
  getMultiPlatformRobotMission,
  listMultiPlatformRobotMissions,
} from './multiPlatformRobotSwarm.ts';

describe('Horizon 3: Multi-Platform Software Robot Swarm', () => {
  it('dispatches a combined Web, Desktop, and Mobile Telegram RPA mission', async () => {
    const mission = await dispatchMultiPlatformRobotMission({
      title: 'Automated Invoice Processing & Mobile Notification',
      webTarget: 'https://sandbox.ledgerflow.io/invoices',
      desktopCommand: 'robot://windows/save-pdf',
      telegramChatId: 'telegram://channel/billing',
    });

    assert.ok(mission.id.startsWith('rpa_multi_'));
    assert.equal(mission.status, 'completed');
    assert.equal(mission.steps.length, 3);
    assert.equal(mission.steps[0].platform, 'web');
    assert.equal(mission.steps[1].platform, 'desktop');
    assert.equal(mission.steps[2].platform, 'mobile_telegram');

    const reloaded = getMultiPlatformRobotMission(mission.id);
    assert.ok(reloaded);
    assert.equal(reloaded?.id, mission.id);

    const list = listMultiPlatformRobotMissions();
    assert.ok(list.length >= 1);
  });
});
