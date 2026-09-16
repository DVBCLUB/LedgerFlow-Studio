import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAiVideoProject,
  VIDEO_TOPIC_PRESETS,
} from './glaciaVideoProductionStudio.ts';

test('glaciaVideoProductionStudio - VIDEO_TOPIC_PRESETS contains valid configurations', () => {
  assert.ok(VIDEO_TOPIC_PRESETS.length >= 3);
  assert.ok(VIDEO_TOPIC_PRESETS[0].topic.length > 5);
});

test('glaciaVideoProductionStudio - createAiVideoProject generates 5-stage viral storyboard with FFmpeg script', async () => {
  const project = await createAiVideoProject({
    topic: 'Giới Thiệu Robot Glacia AI',
    aspectRatio: '9:16',
    targetAudience: 'tech_founders',
  });

  assert.ok(project.id.startsWith('vid-'));
  assert.equal(project.aspectRatio, '9:16');
  assert.equal(project.scenes.length, 5);
  assert.equal(project.scenes[0].stageName, 'Hook');
  assert.equal(project.scenes[4].stageName, 'Call to Action');
  assert.ok(project.ffmpegScript.bashScript.includes('ffmpeg'));
  assert.ok(project.ffmpegScript.powershellScript.includes('ffmpeg'));
  assert.ok(project.capCutTimelineJson.includes('version'));
  assert.ok(project.seoViralTags.length > 3);
});
