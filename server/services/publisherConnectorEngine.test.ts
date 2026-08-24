import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listPublisherConnectors,
  publishToPlatform,
} from './publisherConnectorEngine.ts';

test('publisherConnectorEngine - loads preset social media & affiliate connectors', async () => {
  const connectors = await listPublisherConnectors();
  assert.ok(connectors.length > 0);
});

test('publisherConnectorEngine - publishes video to connected platform', async () => {
  const connectors = await listPublisherConnectors();
  const target = connectors[0];

  const res = await publishToPlatform(target.id, 'Test Review Video', 'https://shopee.vn/aff/test');
  assert.equal(res.success, true);
  assert.ok(res.publishUrl.includes('http'));
});

