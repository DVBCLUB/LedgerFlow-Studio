import { describe, it, expect } from 'vitest';
import {
  constructSandboxedHTML,
  createLivePreviewSession,
  updateLivePreviewSession,
  getLivePreviewSession,
} from './livePreviewSandbox.ts';

describe('livePreviewSandbox', () => {
  it('constructs sandboxed HTML page with Tailwind & Inter font', () => {
    const html = constructSandboxedHTML({
      title: 'Test App',
      htmlContent: '<button class="bg-blue-500 text-white p-2">Click Me</button>',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('cdn.tailwindcss.com');
    expect(html).toContain('Click Me');
  });

  it('creates and updates live preview session', () => {
    const session = createLivePreviewSession({
      title: 'Financial Dashboard Mockup',
      htmlContent: '<div>Dashboard Content</div>',
    });

    expect(session.id).toBeDefined();
    expect(getLivePreviewSession(session.id)?.title).toBe('Financial Dashboard Mockup');

    const updated = updateLivePreviewSession(session.id, {
      htmlContent: '<div>Updated Dashboard Content</div>',
    });

    expect(updated?.fullRenderedHTML).toContain('Updated Dashboard Content');
  });
});
