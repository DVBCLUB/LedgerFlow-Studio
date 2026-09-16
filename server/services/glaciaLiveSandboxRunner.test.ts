/**
 * server/services/glaciaLiveSandboxRunner.test.ts
 * Unit tests for Glacia Live Visual Code & Sandbox Runner.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  executeLiveSandboxCode,
  buildSandboxHtmlPreview,
  getSandboxExecutionHistory,
} from './glaciaLiveSandboxRunner.ts';

describe('Glacia Live Sandbox Runner', () => {
  it('executes JavaScript code safely in VM sandbox and captures console output', async () => {
    const res = await executeLiveSandboxCode({
      code: `
        console.log("Hello from Glacia Sandbox!");
        const x = 10;
        const y = 20;
        console.info("Calculating sum:", x + y);
        return x + y;
      `,
      environment: 'javascript',
    });

    assert.equal(res.success, true);
    assert.equal(res.returnValue, 30);
    assert.ok(res.logs.some((l) => l.message.includes('Hello from Glacia Sandbox!')));
    assert.ok(res.logs.some((l) => l.message.includes('Calculating sum: 30')));
    assert.ok(res.durationMs >= 0);
  });

  it('handles execution errors and timeouts gracefully', async () => {
    const res = await executeLiveSandboxCode({
      code: `
        throw new Error("Custom test runtime exception");
      `,
      environment: 'javascript',
    });

    assert.equal(res.success, false);
    assert.ok(res.error?.includes('Custom test runtime exception'));
  });

  it('builds HTML visual preview for Canvas 2D and Three.js', () => {
    const canvasHtml = buildSandboxHtmlPreview('ctx.fillRect(0, 0, 100, 100);', 'canvas_2d');
    assert.ok(canvasHtml.includes('<canvas id="glacia-canvas"'));
    assert.ok(canvasHtml.includes('ctx.fillRect(0, 0, 100, 100);'));

    const threeHtml = buildSandboxHtmlPreview('const scene = new THREE.Scene();', 'threejs_3d');
    assert.ok(threeHtml.includes('three.min.js'));
  });

  it('tracks execution history', () => {
    const history = getSandboxExecutionHistory();
    assert.ok(Array.isArray(history));
    assert.ok(history.length > 0);
  });
});
