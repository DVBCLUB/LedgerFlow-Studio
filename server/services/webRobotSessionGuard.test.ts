import { describe, it, expect } from 'vitest';
import {
  listWebRobotSessions,
  refreshRobotSession,
} from './webRobotSessionGuard.ts';

describe('webRobotSessionGuard', () => {
  it('loads managed web robot session statuses', async () => {
    const sessions = await listWebRobotSessions();
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].sessionStatus).toBe('HEALTHY');
  });

  it('refreshes web robot session keep-alive status', async () => {
    const sessions = await listWebRobotSessions();
    const target = sessions[0];

    const refreshed = await refreshRobotSession(target.id);
    expect(refreshed?.lastKeepAliveAt).toBe('Vừa xong');
    expect(refreshed?.sessionStatus).toBe('HEALTHY');
  });
});
