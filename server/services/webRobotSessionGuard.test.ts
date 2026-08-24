import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listWebRobotSessions,
  refreshRobotSession,
} from './webRobotSessionGuard.ts';

test('webRobotSessionGuard - loads managed web robot session statuses', async () => {
  const sessions = await listWebRobotSessions();
  assert.ok(sessions.length > 0);
  assert.equal(sessions[0].sessionStatus, 'HEALTHY');
});

test('webRobotSessionGuard - refreshes web robot session keep-alive status', async () => {
  const sessions = await listWebRobotSessions();
  const target = sessions[0];

  const refreshed = await refreshRobotSession(target.id);
  assert.equal(refreshed?.lastKeepAliveAt, 'Vừa xong');
  assert.equal(refreshed?.sessionStatus, 'HEALTHY');
});

