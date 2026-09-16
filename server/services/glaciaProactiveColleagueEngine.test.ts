import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMorningStandupBriefing,
  generateEveningDebrief,
  executeNightShiftJobs,
  getLatestNightShiftStatus,
  executeMorningPriority,
} from './glaciaProactiveColleagueEngine.ts';

test('glaciaProactiveColleagueEngine - generateMorningStandupBriefing returns executive brief with top 3 priorities', () => {
  const brief = generateMorningStandupBriefing();
  assert.ok(brief.id.startsWith('brief-'), 'id should start with brief-');
  assert.ok(brief.greeting.includes('Giám đốc'), 'greeting should mention Giám đốc');
  assert.equal(brief.top3Priorities.length, 3, 'should have exactly 3 top priorities');
  assert.ok(brief.spokenAudioText.length > 20, 'spokenAudioText should not be empty');
  assert.equal(brief.systemHealth.activeAiStaffCount, 5, 'activeAiStaffCount should be 5');
});

test('glaciaProactiveColleagueEngine - generateEveningDebrief produces valid night shift handover', () => {
  const debrief = generateEveningDebrief();
  assert.ok(debrief.id.startsWith('debrief-'), 'id should start with debrief-');
  assert.ok(debrief.nightShiftHandover.targetRobots.length >= 3, 'should target at least 3 robots');
  assert.ok(debrief.completedTasksCount > 0, 'completed tasks count should be > 0');
});

test('glaciaProactiveColleagueEngine - executeNightShiftJobs runs simulation and persists report', async () => {
  const report = await executeNightShiftJobs();
  assert.equal(report.success, true, 'night shift should succeed');
  assert.ok(report.jobsCompleted >= 2, 'should complete multiple jobs');
  assert.ok(Array.isArray(report.details), 'details should be array');

  const latest = getLatestNightShiftStatus();
  assert.ok(latest !== null, 'latest night shift status should be available');
  assert.equal(latest?.id, report.id, 'latest report ID should match');
});

test('glaciaProactiveColleagueEngine - executeMorningPriority dispatches recognized priorities', () => {
  const p1 = executeMorningPriority(1);
  assert.equal(p1.success, true);
  assert.equal(p1.actionTriggered, 'check_wiring');

  const p2 = executeMorningPriority(2);
  assert.equal(p2.success, true);
  assert.equal(p2.actionTriggered, 'financial_audit_dag');

  const p3 = executeMorningPriority(3);
  assert.equal(p3.success, true);
  assert.equal(p3.actionTriggered, 'desktop_package_prep');

  const p99 = executeMorningPriority(99);
  assert.equal(p99.success, false);
});
