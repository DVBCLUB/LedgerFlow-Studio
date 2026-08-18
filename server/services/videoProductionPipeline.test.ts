import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateVideoProject,
  listVideoProjects,
  updateVideoProjectStatus,
} from './videoProductionPipeline.ts';

test('videoProductionPipeline - generates 5-stage viral video workflow project', async () => {
  const project = await generateVideoProject({
    title: 'Cách Tự Động Hóa Kế Toán Doanh Nghiệp',
    topic: 'Tự động hóa báo cáo tài chính bằng AI',
    platform: 'tiktok',
    targetDurationSec: 45,
    pacing: 'fast_viral',
  });

  assert.ok(project.id.startsWith('vid_'));
  assert.equal(project.platform, 'tiktok');
  assert.ok(project.scenes.length >= 2);
  assert.ok(project.fullScriptText.length > 0);
  assert.ok(project.editBriefExport.timelineTracks.length > 0);
  assert.ok(project.thumbnailPackage.headlineOptions.length > 0);
  assert.ok(project.seoTags.length > 0);

  // List and check
  const list = listVideoProjects();
  const found = list.find((p) => p.id === project.id);
  assert.ok(found);

  // Update status
  const updated = updateVideoProjectStatus(project.id, 'completed');
  assert.ok(updated);
  assert.equal(updated?.status, 'completed');
});
