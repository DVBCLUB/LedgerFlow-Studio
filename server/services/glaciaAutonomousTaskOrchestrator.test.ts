import test from 'node:test';
import assert from 'node:assert/strict';
import { executeAutonomousFullStackMission } from './glaciaAutonomousTaskOrchestrator.ts';

test('glaciaAutonomousTaskOrchestrator - executes full-stack software mission', async () => {
  const result = await executeAutonomousFullStackMission({
    goal: 'Lập trình module tính toán dòng tiền tự động bằng TypeScript',
    domain: 'software_development',
    targetIDE: 'vscode',
  });

  assert.ok(result.missionId.startsWith('MSN-'));
  assert.equal(result.domain, 'software_development');
  assert.ok(result.phases.length >= 5);
  assert.ok(result.plan.tasks.length > 0);
  assert.ok(result.researchInsights.sourcesCount >= 0);
  assert.ok(result.deliberation.confidence > 0);
  assert.ok(result.generatedArtifacts.codeSnippets.length > 0);
  assert.equal(result.generatedArtifacts.sandboxVerification.success, true);
  assert.ok(result.executiveSummary.includes(result.missionId));
});

test('glaciaAutonomousTaskOrchestrator - executes 3D game mission with Three.js', async () => {
  const result = await executeAutonomousFullStackMission({
    goal: 'Thiết kế thế giới 3D Cyberpunk Game WebGL',
    domain: 'game_3d_webgl',
  });

  assert.equal(result.domain, 'game_3d_webgl');
  assert.ok(result.generatedArtifacts.codeSnippets[0].includes('THREE.Scene'));
  assert.equal(result.suggestedAction.targetTab, 'analytics_models_sandbox');
});
