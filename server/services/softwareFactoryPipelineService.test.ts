import assert from 'node:assert/strict';
import test from 'node:test';
import { executeSoftwareFactoryPipeline } from './softwareFactoryPipelineService.ts';

test('softwareFactoryPipelineService - executes end-to-end build successfully', async () => {
  const result = await executeSoftwareFactoryPipeline({
    goal: 'Tạo ứng dụng CLI Todo Task Manager có lưu trữ JSON local và unit tests',
    projectType: 'cli_tool',
    targetLanguage: 'typescript',
    requesterEmail: 'davidbao1704@gmail.com',
    autoSandboxTest: true,
    packageRelease: true,
  });

  assert.equal(result.ok, true);
  assert.ok(result.runId.startsWith('sfr-'));
  assert.ok(result.generatedFiles.length >= 2, 'Should generate at least code and test/readme files');
  assert.ok(result.evalScore.score > 0, 'Eval score should be positive');
  assert.ok(result.assets.length > 0, 'Should register generated files as assets');
  assert.ok(result.durationMs >= 0);

  // Check that the generated test file exists and contains assertions
  const testFile = result.generatedFiles.find((f) => f.path.includes('test'));
  assert.ok(testFile, 'Should have generated a test file');
  assert.ok(testFile.content.includes('assert'), 'Test file should contain assertions');
});
