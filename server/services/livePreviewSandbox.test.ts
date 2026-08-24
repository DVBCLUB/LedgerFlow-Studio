import test from 'node:test';
import assert from 'node:assert/strict';
import {
  constructSandboxedHTML,
  createLivePreviewSession,
  updateLivePreviewSession,
  getLivePreviewSession,
} from './livePreviewSandbox.ts';

test('livePreviewSandbox - constructs sandboxed HTML page with Tailwind & Inter font', () => {
  const html = constructSandboxedHTML({
    title: 'Test App',
    htmlContent: '<button class="bg-blue-500 text-white p-2">Click Me</button>',
  });

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('cdn.tailwindcss.com'));
  assert.ok(html.includes('Click Me'));
});

test('livePreviewSandbox - creates and updates live preview session', () => {
  const session = createLivePreviewSession({
    title: 'Financial Dashboard Mockup',
    htmlContent: '<div>Dashboard Content</div>',
  });

  assert.ok(session.id);
  assert.equal(getLivePreviewSession(session.id)?.title, 'Financial Dashboard Mockup');

  const updated = updateLivePreviewSession(session.id, {
    htmlContent: '<div>Updated Dashboard Content</div>',
  });

  assert.ok(updated?.fullRenderedHTML?.includes('Updated Dashboard Content'));
});

