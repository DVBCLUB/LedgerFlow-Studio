import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadStrategicRoadmapState,
  advanceRoadmapMilestone,
  createDefaultFranchiseRoadmap,
} from './glaciaStrategicRoadmapEngine.ts';

describe('glaciaStrategicRoadmapEngine - Level 5 Franchise & Universe 90-Day Strategy', () => {
  it('loads default 90-day strategic roadmap with 3 phases', () => {
    const roadmap = loadStrategicRoadmapState();
    assert.equal(roadmap.milestones.length, 3);
    assert.ok(roadmap.projectedMetrics.cumulativeSavingsUsd > 10000);
    assert.equal(roadmap.projectedMetrics.targetCrashRate, '0.00%');
  });

  it('advances roadmap milestone status and completion rate', () => {
    createDefaultFranchiseRoadmap('Test Universe');
    const updated = advanceRoadmapMilestone({
      milestoneId: 'm-02',
      progressIncrement: 20,
      newStatus: 'in_progress',
    });
    const m2 = updated.milestones.find((m) => m.milestoneId === 'm-02');
    assert.ok(m2);
    assert.ok((m2?.completionRate ?? 0) >= 80);
  });
});
