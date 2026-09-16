import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCinemaProjects,
  generateCinemaProduction,
} from './glaciaMultiAgentCinemaStudioEngine.ts';

describe('glaciaMultiAgentCinemaStudioEngine - Level 5 Swarm Cinema & Storyboard Production', () => {
  it('loads existing cinema projects with multi-agent contributions', () => {
    const projects = loadCinemaProjects();
    assert.ok(projects.length >= 1);
    assert.ok(projects[0].agentsContribution.screenwriter);
    assert.ok(projects[0].agentsContribution.artDirector);
    assert.ok(projects[0].agentsContribution.voiceDirector);
    assert.ok(projects[0].storyboardScenes.length >= 2);
  });

  it('generates cinema production with 5-agent swarm collaboration and camera setups', () => {
    const project = generateCinemaProduction({
      genre: 'sci_fi_cyberpunk',
      targetPlatform: 'tiktok_shorts',
      title: 'Bí Ẩn Cội Nguồn Lượng Tử 2026',
    });

    assert.equal(project.genre, 'sci_fi_cyberpunk');
    assert.equal(project.aspectRatio, '9:16');
    assert.ok(project.viralityPredictionScore >= 90);
    assert.equal(project.storyboardScenes.length, 3);
    assert.ok(project.storyboardScenes[0].cameraSetup.movement);
    assert.ok(project.storyboardScenes[0].characterDialogue.visemeTimingCues.length >= 2);
    assert.ok(project.blenderSceneRenderScript.includes('Blender'));
    assert.ok(project.ffmpegMasterExportScript.includes('ffmpeg'));
  });
});
