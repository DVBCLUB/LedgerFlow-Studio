import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAndExecuteVoiceCommand } from './voiceCommanderEngine.ts';
import {
  listPublishSchedules,
  createPublishSchedule,
  ingestInboundLead,
} from './viralLeadGrowthEngine.ts';
import { runAiGamePlaytestSimulation } from './aiGamePlaytestSimulator.ts';
import { generatePackagingManifest } from './multiPlatformPackager.ts';

test('voiceCommanderEngine - parses Vietnamese speech transcripts into actionable intent', () => {
  const financeCmd = parseAndExecuteVoiceCommand('Kiểm tra doanh thu và hóa đơn hôm nay');
  assert.equal(financeCmd.intent, 'query_revenue');
  assert.equal(financeCmd.targetModule, 'finance');
  assert.ok(financeCmd.executionStatus === 'executed' || financeCmd.executionStatus === 'ready');

  const videoCmd = parseAndExecuteVoiceCommand('Tạo video kịch bản tiktok về phần mềm quản trị');
  assert.equal(videoCmd.intent, 'generate_video');
  assert.equal(videoCmd.targetModule, 'video');

  const buildCmd = parseAndExecuteVoiceCommand('Build và deploy bản cài đặt phần mềm mới');
  assert.equal(buildCmd.intent, 'build_software');
  assert.equal(buildCmd.requiresCeoApproval, true);
  assert.equal(buildCmd.executionStatus, 'pending_approval');
});

test('viralLeadGrowthEngine - creates schedules and scores inbound leads into CRM', () => {
  const schedules = listPublishSchedules();
  assert.ok(schedules.length >= 1);

  const newSchedule = createPublishSchedule({
    title: 'Shorts: Cách xây dựng công ty phần mềm 1 người',
    channels: ['tiktok', 'youtube_shorts'],
    caption: 'Đội ngũ 25 AI staff tự động vận hành #solofounder',
    tags: ['ai', 'tech'],
    scheduledTime: new Date().toISOString(),
  });
  assert.ok(newSchedule.id);

  const hotLead = ingestInboundLead({
    fullName: 'Nguyễn Văn A',
    email: 'ceo@example.com',
    phone: '0987654321',
    companyName: 'Công ty Cổ Phần ABC',
    interestedProduct: 'software_os',
    monthlyBudgetVnd: 10000000,
    sourceChannel: 'tiktok',
  });
  assert.ok(hotLead.leadId);
  assert.equal(hotLead.qualification, 'HOT_LEAD');
  assert.ok(hotLead.score >= 80);
  assert.equal(hotLead.savedToCrm, true);
});

test('aiGamePlaytestSimulator - runs headless bot simulations and generates balance metrics', () => {
  const report = runAiGamePlaytestSimulation({
    gameTitle: 'Neon Cyber Platformer',
    genre: '2d_platformer',
    totalSimulatedRuns: 500,
  });

  assert.ok(report.testId);
  assert.equal(report.gameTitle, 'Neon Cyber Platformer');
  assert.ok(report.winRatePercent > 50 && report.winRatePercent < 90);
  assert.ok(report.fpsMetrics.averageFps >= 55);
  assert.ok(report.autoTuningSuggestions.length >= 1);
});

test('multiPlatformPackager - generates build manifests for Windows, Android, and Web', () => {
  const manifest = generatePackagingManifest({
    appName: 'LedgerFlow-Studio',
    version: '1.0.0',
    targets: ['windows_exe', 'android_apk', 'saas_web'],
  });

  assert.ok(manifest.buildId);
  assert.equal(manifest.appName, 'LedgerFlow-Studio');
  assert.equal(manifest.targets.length, 3);
  assert.ok(manifest.automatedBatchScript.includes('electron-builder'));
  assert.ok(manifest.automatedBatchScript.includes('cap sync'));
});
