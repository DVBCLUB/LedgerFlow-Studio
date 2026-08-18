import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bridgePipelineCompletionToApproval } from './pipelineApprovalBridge.ts';
import { listApprovalRequests } from './humanApprovalGateway.ts';

describe('pipelineApprovalBridge - Auto Webhook Bridge', () => {
  it('bridges completed video production pipeline to approval gateway', () => {
    const res = bridgePipelineCompletionToApproval({
      pipelineType: 'video_production',
      itemId: 'vid_proj_viral_01',
      title: 'Shorts: 3 Sai Lầm Kế Toán Xây Dựng Thường Gặp',
      summary: '5 phân cảnh hoàn thiện, giọng đọc AI Edge TTS chuẩn, SRT đồng bộ.',
      metadata: { targetPlatforms: ['tiktok', 'youtube_shorts'] },
    });

    assert.equal(res.bridged, true);
    assert.ok(res.approvalRequest?.requestId.startsWith('apr_'));
    assert.equal(res.approvalRequest?.actionType, 'bulk_external_publish');
    assert.equal(res.approvalRequest?.status, 'PENDING');

    const pending = listApprovalRequests({ status: 'PENDING' });
    assert.ok(pending.some((p) => p.requestId === res.approvalRequest?.requestId));
  });

  it('bridges game asset bundle completion to production deploy gate', () => {
    const res = bridgePipelineCompletionToApproval({
      pipelineType: 'game_asset',
      itemId: 'game_bundle_hero_cyberpunk',
      title: 'Bundle 2D Pixel Hero Pack',
      summary: 'Sprite sheet 64x64, 4 animation states, hitbox metadata.',
    });

    assert.equal(res.bridged, true);
    assert.equal(res.approvalRequest?.actionType, 'deploy_production_build');
    assert.equal(res.approvalRequest?.riskLevel, 'CRITICAL');
  });
});
