/**
 * robotFreeTool.integration.test.ts
 * ============================================================
 * Integration tests for Free Tool Robot Bridge ($0 Operator)
 * endpoints — Blender, FFmpeg, Graphic Design, and Execute.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withTestServer } from './testAppHelper.ts';

describe('API Integration - Free Tool Robot ($0 Operator)', () => {
  // ── Blender ──
  test('POST /api/robot/free/blender/plan creates a Blender plan', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/blender/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: 'TestRobot',
          archetype: 'humanoid',
          height: 1.7,
          exportFormat: 'glb',
        }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.plan);
      assert.equal(data.plan.toolType, 'blender');
      assert.ok(data.plan.id);
      assert.ok(data.plan.scriptContent);
      assert.ok(data.plan.estimatedDurationSec);
    });
  });

  test('POST /api/robot/free/blender/preview returns a script', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/blender/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName: 'PreviewBot', archetype: 'chibi_mascot' }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.script);
      assert.ok(typeof data.script === 'string');
      assert.ok(data.script.includes('bpy'));
    });
  });
  // ── FFmpeg ──
  test('POST /api/robot/free/ffmpeg/plan creates an FFmpeg plan', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/ffmpeg/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputName: 'test_video', totalDurationSec: 30, scenesCount: 3 }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.plan);
      assert.equal(data.plan.toolType, 'ffmpeg');
      assert.ok(data.plan.id);
      assert.ok(data.plan.scriptContent);
    });
  });

  test('POST /api/robot/free/ffmpeg/plan returns 400 when outputName missing', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/ffmpeg/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });

  test('POST /api/robot/free/ffmpeg/preview returns scripts', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/ffmpeg/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputName: 'preview_video', totalDurationSec: 15 }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.scripts);
    });
  });

  // ── Graphic Design ──
  test('POST /api/robot/free/graphic/plan creates a graphic plan', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/graphic/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Banner', bgColor: '#000', textColor: '#fff' }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.plan);
      assert.equal(data.plan.toolType, 'canva');
      assert.ok(data.plan.id);
    });
  });

  test('POST /api/robot/free/graphic/plan returns 400 when title missing', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/graphic/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });

  test('POST /api/robot/free/graphic/preview returns a plan preview', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/graphic/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Preview Banner' }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.plan);
    });
  });

  // ── Execute ──
  test('POST /api/robot/free/execute executes a robot plan', async () => {
    await withTestServer(async (baseUrl) => {
      // First create a plan
      const planRes = await fetch(baseUrl + '/api/robot/free/blender/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName: 'ExecuteTest', archetype: 'humanoid' }),
      });
      const planData: any = await planRes.json();
      assert.ok(planData.plan);

      // Execute it
      const res = await fetch(baseUrl + '/api/robot/free/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planData.plan }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(typeof data.success, 'boolean');
      assert.ok(data.result);
      assert.equal(typeof data.result.success, 'boolean');
    });
  });

  test('POST /api/robot/free/execute returns 400 when plan incomplete', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/robot/free/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: { id: 'missing-tooltype' } }),
      });
      assert.equal(res.status, 400);
    });
  });
});

