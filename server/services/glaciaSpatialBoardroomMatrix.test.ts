import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeSpatialBoardroomSession,
  listSpatialBoardrooms,
} from './glaciaSpatialBoardroomMatrix.ts';

describe('Glacia Holographic Spatial Telepresence & 3D Boardroom Matrix (Epoch 12)', () => {
  it('initializes a multi-user 3D spatial boardroom session with spatial audio and holographic widgets', () => {
    const session = initializeSpatialBoardroomSession('Họp Chiến Lược M&A và Mở Rộng Thị Trường');

    assert.ok(session.sessionId.startsWith('spatial-room-'));
    assert.equal(session.roomStatus, 'in_session');
    assert.equal(session.participants.length, 3);
    assert.ok(session.floatingHolographicWidgets.length >= 3);
    assert.equal(session.participants[0].name, 'CEO David Bao');
  });

  it('retrieves persistent spatial boardroom sessions cleanly', () => {
    const list = listSpatialBoardrooms();
    assert.ok(list.length >= 1);
  });
});
