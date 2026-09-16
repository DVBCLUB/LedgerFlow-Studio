import test from 'node:test';
import assert from 'node:assert/strict';
import { scaffoldCompleteProject, listScaffoldedProjects } from './glaciaProjectScaffolder.ts';

test('glaciaProjectScaffolder - scaffolds complete Three.js 3D WebGL Game project', async () => {
  const result = await scaffoldCompleteProject({
    projectName: 'Cyberpunk Zombie Survival 3D',
    template: 'threejs_3d_game',
  });

  assert.ok(result.projectId.startsWith('PRJ-'));
  assert.equal(result.template, 'threejs_3d_game');
  assert.ok(result.totalFiles >= 5);
  assert.ok(result.filesGenerated.some((f) => f.relativePath === 'package.json'));
  assert.ok(result.filesGenerated.some((f) => f.relativePath === 'src/game/Player.ts'));
  assert.ok(result.filesGenerated.some((f) => f.relativePath === 'src/game/World.ts'));
});

test('glaciaProjectScaffolder - scaffolds Cinema Video Production package', async () => {
  const result = await scaffoldCompleteProject({
    projectName: 'Glacia Launch Teaser',
    template: 'video_production_cinema',
  });

  assert.equal(result.template, 'video_production_cinema');
  assert.ok(result.filesGenerated.some((f) => f.relativePath === 'storyboard_timeline.json'));
});

test('glaciaProjectScaffolder - lists scaffolded projects in runtime', () => {
  const list = listScaffoldedProjects();
  assert.ok(Array.isArray(list));
  assert.ok(list.length > 0);
});
