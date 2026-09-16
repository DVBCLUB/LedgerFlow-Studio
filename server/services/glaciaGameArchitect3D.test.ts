import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateInteractive3DGame,
  listArchitectedGames,
} from './glaciaGameArchitect3D.ts';

describe('Glacia 3D Game Architect (Epoch 9)', () => {
  it('generates a full interactive 3D game scene with Three.js code and physics parameters', () => {
    const game = generateInteractive3DGame('cyberpunk_city', 'rpg', 'Neon Cyberpunk Ledger RPG');

    assert.ok(game.gameId.startsWith('game-'));
    assert.equal(game.theme, 'cyberpunk_city');
    assert.equal(game.genre, 'rpg');
    assert.ok(game.npcs.length >= 2);
    assert.ok(game.threeJsBootstrapCode.includes('THREE.Scene'));
    assert.ok(game.playerController.enablePhysicsAABB);
    assert.equal(game.fpsTarget, 60);
  });

  it('populates living NPCs with coordinate positions, dialogue and quest rewards', () => {
    const game = generateInteractive3DGame('crystal_island', 'simulator');
    const npc = game.npcs[0];

    assert.ok(npc.name.length > 0);
    assert.ok(npc.dialogueGreeting.length > 10);
    assert.equal(npc.coordinates.length, 3);
    assert.ok(npc.assignedQuest ? npc.assignedQuest.xpReward > 0 : true);
  });

  it('retrieves persistent architected games cleanly', () => {
    const list = listArchitectedGames();
    assert.ok(list.length >= 1);
  });
});
