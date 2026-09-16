import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseScreenElements,
  findUiAnchorCoordinates,
  listRecentVisionScans,
} from './glaciaScreenVisionPilot.ts';

describe('Glacia Screen Vision Pilot (Epoch 9)', () => {
  it('parses active software screen bounding boxes with high precision and low latency', () => {
    const res = parseScreenElements('photoshop', 'export');

    assert.ok(res.scanId.startsWith('vision-'));
    assert.equal(res.activeApp, 'photoshop');
    assert.ok(res.detectedElements.length >= 3);
    assert.ok(res.latencyMs <= 50);
    assert.ok(res.suggestedInteraction.targetCoordinates.x > 0);
  });

  it('accurately resolves semantic UI anchor coordinates for Blender and Excel', () => {
    const blenderCoord = findUiAnchorCoordinates('blender', 'render');
    assert.equal(blenderCoord.found, true);
    assert.ok(blenderCoord.x > 0);
    assert.ok(blenderCoord.y > 0);

    const excelCoord = findUiAnchorCoordinates('excel', 'formula');
    assert.equal(excelCoord.found, true);
  });

  it('retrieves recent vision scans cleanly', () => {
    const scans = listRecentVisionScans();
    assert.ok(scans.length >= 1);
  });
});
