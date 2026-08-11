import assert from 'node:assert/strict';
import test from 'node:test';
import {
  publishSystemEvent,
  subscribeSystemEvent,
  getSystemEventHistory,
} from './crossSystemEventBus.ts';

test('publishSystemEvent publishes event and notifies subscribers', async () => {
  let received = false;

  const unsubscribe = subscribeSystemEvent('release.published', (evt) => {
    received = true;
    assert.equal(evt.source, 'automatedHandoffPublisher');
  });

  const event = await publishSystemEvent(
    'release.published',
    'automatedHandoffPublisher',
    'Release v1.50.0 published cleanly',
    { version: 'v1.50.0' }
  );

  assert.ok(event.id.startsWith('evt_'));
  assert.equal(event.type, 'release.published');

  // Allow setImmediate event loop cycle to process event handlers
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(received, true);
  unsubscribe();
});

test('getSystemEventHistory retrieves published system events', () => {
  const history = getSystemEventHistory(5);
  assert.ok(history.length >= 1);
});
