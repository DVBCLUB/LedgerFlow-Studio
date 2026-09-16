import test from 'node:test';
import assert from 'node:assert/strict';
import { executeDesktopAppWorkflow } from './glaciaDesktopAppController.ts';

test('glaciaDesktopAppController - scaffolds and prepares workspace for VS Code', async () => {
  const result = await executeDesktopAppWorkflow({
    app: 'vscode',
    action: 'scaffold_and_open',
    projectName: 'test_auto_game',
    scriptContent: 'console.log("Auto game ready");',
  });

  assert.equal(result.success, true);
  assert.equal(result.app, 'vscode');
  assert.ok(result.generatedFiles && result.generatedFiles.length > 0);
  assert.ok(result.logs.length > 0);
});

test('glaciaDesktopAppController - prepares Blender Python script', async () => {
  const result = await executeDesktopAppWorkflow({
    app: 'blender',
    action: 'run_script',
  });

  assert.equal(result.success, true);
  assert.equal(result.app, 'blender');
  assert.ok(result.generatedFiles && result.generatedFiles[0].includes('.py'));
});

test('glaciaDesktopAppController - prepares CapCut video draft project', async () => {
  const result = await executeDesktopAppWorkflow({
    app: 'capcut',
    action: 'render_media',
    projectName: 'cyber_intro_video',
  });

  assert.equal(result.success, true);
  assert.equal(result.app, 'capcut');
  assert.ok(result.generatedFiles && result.generatedFiles.length >= 2);
});
