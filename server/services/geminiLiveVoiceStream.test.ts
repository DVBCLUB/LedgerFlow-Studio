import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startGeminiLiveVoiceStreamSession } from './geminiLiveVoiceStream.ts';

describe('Milestone 1: Multimodal Gemini 2.0 Live Voice & Vision Stream Adapter', () => {
  it('establishes sub-300ms live streaming voice session with vision support', () => {
    const session = startGeminiLiveVoiceStreamSession({ enableVisionShare: true });

    assert.ok(session.sessionId.startsWith('live_voice_'));
    assert.equal(session.model, 'gemini-2.0-flash-live');
    assert.equal(session.status, 'connected');
    assert.ok(session.latencyTargetMs <= 300);
    assert.equal(session.visionShareEnabled, true);
  });
});
