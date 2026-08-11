import { describe, it, expect } from 'vitest';
import {
  listPublisherConnectors,
  publishToPlatform,
} from './publisherConnectorEngine.ts';

describe('publisherConnectorEngine', () => {
  it('loads preset social media & affiliate connectors', async () => {
    const connectors = await listPublisherConnectors();
    expect(connectors.length).toBeGreaterThan(0);
  });

  it('publishes video to connected platform', async () => {
    const connectors = await listPublisherConnectors();
    const target = connectors[0];

    const res = await publishToPlatform(target.id, 'Test Review Video', 'https://shopee.vn/aff/test');
    expect(res.success).toBe(true);
    expect(res.publishUrl).toContain('http');
  });
});
