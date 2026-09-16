import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNightShiftMediaDispatch,
  getTelegramMediaStreamHistory,
} from './glaciaTelegramMediaStreamEngine.ts';

test('glaciaTelegramMediaStreamEngine - createNightShiftMediaDispatch generates video teaser package', () => {
  const dispatch = createNightShiftMediaDispatch('Valkyrie Chronicles 3D', 'video_teaser_mp4');
  assert.equal(dispatch.recipientEmail, 'davidbao1704@gmail.com');
  assert.equal(dispatch.mediaType, 'video_teaser_mp4');
  assert.ok(dispatch.title.includes('Valkyrie Chronicles 3D'));
  assert.ok(dispatch.caption.includes('0.00$'));
  assert.equal(dispatch.renderEngine, 'FFmpeg_Hardware_Accelerated');
});

test('glaciaTelegramMediaStreamEngine - getTelegramMediaStreamHistory returns dispatched list', () => {
  const history = getTelegramMediaStreamHistory();
  assert.ok(history.totalMediaDispatches >= 1);
  assert.ok(history.dispatches.length >= 1);
});
