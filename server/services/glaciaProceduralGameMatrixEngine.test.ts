import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateProceduralGameWorld,
  updateBossAiState,
  BossAiProfile,
} from './glaciaProceduralGameMatrixEngine.ts';

test('glaciaProceduralGameMatrixEngine - generateProceduralGameWorld generates 3D grid and Boss profile', () => {
  const world = generateProceduralGameWorld('cyberpunk_neon_dungeon', 101);
  assert.equal(world.biome, 'cyberpunk_neon_dungeon');
  assert.equal(world.seed, 101);
  assert.equal(world.tiles.length, 256); // 16x16
  assert.ok(world.tiles.some(t => t.tileType === 'spawn_point'));
  assert.ok(world.tiles.some(t => t.tileType === 'boss_portal'));
  assert.ok(world.boss.name.includes('Glacia-Prime') || world.boss.name.includes('Overlord'));
  assert.ok(world.threeJsSceneCode.includes('buildProceduralMap'));
});

test('glaciaProceduralGameMatrixEngine - updateBossAiState transitions to CHASE when player approaches', () => {
  const mockBoss: BossAiProfile = {
    id: 'boss_1',
    name: 'Glacia Titan',
    maxHealth: 1000,
    currentHealth: 1000,
    currentState: 'PATROL',
    speed: 4.5,
    attackPower: 50,
    aoeRadius: 5.0,
    patrolRoute: [],
    behaviorTreeDescription: 'FSM Test',
  };

  const tick1 = updateBossAiState(mockBoss, 6.0, false);
  assert.equal(tick1.nextState, 'CHASE');
  assert.ok(tick1.actionMessage.includes('CHASE'));
});

test('glaciaProceduralGameMatrixEngine - updateBossAiState triggers ULTIMATE_ATTACK when health < 40%', () => {
  const mockBoss: BossAiProfile = {
    id: 'boss_1',
    name: 'Glacia Titan',
    maxHealth: 1000,
    currentHealth: 350, // 35% health
    currentState: 'CHASE',
    speed: 4.5,
    attackPower: 50,
    aoeRadius: 5.0,
    patrolRoute: [],
    behaviorTreeDescription: 'FSM Test',
  };

  const tick2 = updateBossAiState(mockBoss, 5.0, false);
  assert.equal(tick2.nextState, 'ULTIMATE_ATTACK');
  assert.ok(tick2.actionMessage.includes('ULTIMATE_ATTACK'));
});
