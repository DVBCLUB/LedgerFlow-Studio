import { describe, it, expect } from 'vitest';
import {
  listCloudWebhookEvents,
  dispatchIncomingWebhook,
} from './cloudWebhookCallbackDispatcher.ts';

describe('cloudWebhookCallbackDispatcher', () => {
  it('loads preset cloud webhook events', async () => {
    const events = await listCloudWebhookEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it('dispatches incoming webhook event from specialized cloud API', async () => {
    const evt = await dispatchIncomingWebhook(
      'runway',
      'video_rendered',
      'TikTok AI Movie Trailer 4K',
      'https://cdn.runwayml.com/test_trailer.mp4'
    );

    expect(evt.id).toContain('wh_evt_');
    expect(evt.status).toBe('completed');

    const allEvents = await listCloudWebhookEvents();
    expect(allEvents.some((e) => e.id === evt.id)).toBe(true);
  });
});
