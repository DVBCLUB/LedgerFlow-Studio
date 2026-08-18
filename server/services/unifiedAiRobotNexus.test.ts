import test from 'node:test';
import assert from 'node:assert/strict';
import {
  exportIdeContext,
  generateCrossPlatformAppBlueprint,
  generatePcAndMobileGamePackage,
  generateAiEndToEndVideoSpec,
  getNexusSystemHealth,
} from './unifiedAiRobotNexus.ts';

test('unifiedAiRobotNexus - exportIdeContext produces valid configs for Cursor, Antigravity, VS Code, Claude Code', () => {
  const cursor = exportIdeContext('cursor');
  assert.equal(cursor.filename, '.cursorrules');
  assert.ok(cursor.content.includes('LedgerFlow Studio'));

  const antigravity = exportIdeContext('antigravity');
  assert.equal(antigravity.filename, 'antigravity.json');
  assert.ok(antigravity.content.includes('agentContext'));

  const claude = exportIdeContext('claude_code');
  assert.equal(claude.filename, 'CLAUDE.md');
  assert.ok(claude.content.includes('npm run dev'));

  const mcp = exportIdeContext('mcp_manifest');
  assert.equal(mcp.filename, 'mcp_server_manifest.json');
  assert.ok(mcp.content.includes('ledgerflow-studio-mcp'));
});

test('unifiedAiRobotNexus - generateCrossPlatformAppBlueprint creates PC & Mobile project scaffolding', () => {
  const blueprint = generateCrossPlatformAppBlueprint({
    appName: 'LedgerFlow CRM Lite',
    includeMobile: true,
  });

  assert.ok(blueprint.id);
  assert.equal(blueprint.appName, 'LedgerFlow CRM Lite');
  assert.ok(blueprint.platforms.includes('windows_pc'));
  assert.ok(blueprint.platforms.includes('android'));
  assert.ok(blueprint.mobileControlsConfig?.touchResponsive);
});

test('unifiedAiRobotNexus - generatePcAndMobileGamePackage creates controls for PC and Mobile touch joystick', async () => {
  const gamePkg = await generatePcAndMobileGamePackage({
    gameTitle: 'Cyber Ninja 2026',
    genre: '2d_platformer',
    themeDescription: 'Neon cyber city with touch controls',
    preferLocal: true,
  });

  assert.ok(gamePkg.id);
  assert.equal(gamePkg.gameTitle, 'Cyber Ninja 2026');
  assert.ok(gamePkg.controls.pcControls.movement.includes('WASD'));
  assert.ok(gamePkg.controls.mobileTouchControls.virtualJoystick);
  assert.ok(gamePkg.controls.mobileTouchControls.touchButtons.length >= 2);
  assert.ok(gamePkg.assetBundle.spriteSpec);
});

test('unifiedAiRobotNexus - generateAiEndToEndVideoSpec generates full 5-stage project & FFmpeg auto-concat', async () => {
  const videoSpec = await generateAiEndToEndVideoSpec({
    topic: 'Ra mắt tính năng Tự động gạch nợ VietQR',
    platform: 'tiktok',
    targetDurationSec: 45,
    preferLocal: true,
  });

  assert.ok(videoSpec.id);
  assert.ok(videoSpec.videoProject.scenes.length >= 1);
  assert.ok(videoSpec.ffmpegConcatScript.includes('ffmpeg'));
  assert.ok(videoSpec.audioNarrationSynthesis.ttsEngine);
});

test('unifiedAiRobotNexus - getNexusSystemHealth returns system status and memory metrics', () => {
  const health = getNexusSystemHealth();
  assert.ok(['optimal', 'warning', 'degraded'].includes(health.status));
  assert.ok(typeof health.memoryUsageMb === 'number');
  assert.equal(health.robotActuatorsReady, true);
  assert.equal(health.activeSpecialists, 25);
});
