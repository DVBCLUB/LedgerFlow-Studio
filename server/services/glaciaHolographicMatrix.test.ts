import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  startHolographicStreamSession,
  generateFacialBlendShapeFrame,
  listHolographicSessions,
} from './glaciaHolographicMatrix.ts';

describe('Glacia Real-Time Holographic WebRTC Visual Streamer (Epoch 10)', () => {
  it('initializes a holographic WebRTC session with sub-50ms latency and 60 FPS target', () => {
    const session = startHolographicStreamSession('mobile_pwa');

    assert.ok(session.sessionId.startsWith('holo-'));
    assert.equal(session.streamStatus, 'active_streaming');
    assert.ok(session.averageLatencyMs <= 50);
    assert.equal(session.targetFps, 60);
  });

  it('generates facial blend shape frames with mouth viseme and blink parameters', () => {
    const frame = generateFacialBlendShapeFrame('cheerful_sparkle', 'aa');

    assert.ok(frame.jawOpen >= 0.5);
    assert.ok(frame.mouthSmile >= 0.7);
    assert.ok(frame.timestampMs > 0);
  });

  it('retrieves persistent holographic stream sessions cleanly', () => {
    const list = listHolographicSessions();
    assert.ok(list.length >= 1);
  });
});
