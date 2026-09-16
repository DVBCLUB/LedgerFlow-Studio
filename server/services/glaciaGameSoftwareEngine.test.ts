import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePlayableGame,
  generateSoftwareBlueprint,
  GAME_PRESETS,
  SOFTWARE_PRESETS,
} from './glaciaGameSoftwareEngine.ts';

test('glaciaGameSoftwareEngine - presets are properly defined', () => {
  assert.ok(GAME_PRESETS.length >= 4);
  assert.ok(SOFTWARE_PRESETS.length >= 2);
});

test('glaciaGameSoftwareEngine - generatePlayableGame produces valid 60FPS standalone HTML5 bundle', async () => {
  const game = await generatePlayableGame({
    genre: 'space_shooter',
    title: 'Neon Odyssey 2026',
    themeDescription: 'Thử nghiệm game laze vũ trụ',
  });

  assert.ok(game.id.startsWith('game-'));
  assert.equal(game.genre, 'space_shooter');
  assert.equal(game.canvasWidth, 800);
  assert.equal(game.canvasHeight, 480);
  assert.ok(game.standaloneHtmlBundle.includes('<!DOCTYPE html>'));
  assert.ok(game.standaloneHtmlBundle.includes('gameCanvas'));
  assert.ok(game.standaloneHtmlBundle.includes('AudioContext'));
  assert.ok(game.features.length >= 4);
});

test('glaciaGameSoftwareEngine - generateSoftwareBlueprint produces valid fullstack component scaffolding', async () => {
  const app = await generateSoftwareBlueprint({
    appName: 'Glacia Analytics Portal',
    appType: 'saas_dashboard',
  });

  assert.ok(app.id.startsWith('app-'));
  assert.equal(app.appType, 'saas_dashboard');
  assert.ok(app.techStack.includes('React 19'));
  assert.ok(app.components.length > 0);
  assert.ok(app.apiEndpoints.length > 0);
});
