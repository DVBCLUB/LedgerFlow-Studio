import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listCloudWebhookEvents,
  dispatchIncomingWebhook,
} from './cloudWebhookCallbackDispatcher.ts';

test('cloudWebhookCallbackDispatcher - loads preset cloud webhook events', async () => {
  const events = await listCloudWebhookEvents();
  assert.ok(events.length > 0);
});

test('cloudWebhookCallbackDispatcher - dispatches incoming webhook event from specialized cloud API', async () => {
  const evt = await dispatchIncomingWebhook(
    'runway',
    'video_rendered',
    'TikTok AI Movie Trailer 4K',
    'https://cdn.runwayml.com/test_trailer.mp4'
  );

  assert.ok(evt.id.includes('wh_evt_'));
  assert.equal(evt.status, 'completed');

  const allEvents = await listCloudWebhookEvents();
  assert.equal(allEvents.some((e) => e.id === evt.id), true);
});

