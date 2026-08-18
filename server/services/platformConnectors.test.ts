import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGoogleAiStudioPromptPack,
  getGoogleAiStudioQuotaStatus,
} from './googleAiStudioConnector.ts';
import { synthesizeEdgeTtsJob, EDGE_TTS_VOICES } from './edgeTtsConnector.ts';
import {
  formatPromptForPlatform,
  exportCapCutDraft,
  exportRemotionVideoCode,
} from './aiVideoPlatformConnector.ts';

test('googleAiStudioConnector - generates prompt pack with cURL and Python SDK snippets', () => {
  const pack = generateGoogleAiStudioPromptPack({
    title: 'Audit Hệ thống Phân hệ',
    model: 'gemini-2.5-pro',
    taskType: 'architecture_audit',
    userPrompt: 'Phân tích tính mở rộng của LedgerFlow Studio OS',
    includeCodebaseContext: true,
  });

  assert.ok(pack.packId);
  assert.equal(pack.model, 'gemini-2.5-pro');
  assert.ok(pack.curlCommand.includes('generativelanguage.googleapis.com'));
  assert.ok(pack.pythonSnippet.includes('GenerativeModel'));
  assert.ok(pack.codebaseContextSummary?.filesList.length);

  const quota = getGoogleAiStudioQuotaStatus();
  assert.equal(quota.freeTierActive, true);
  assert.equal(quota.contextWindowTokens, 2000000);
});

test('edgeTtsConnector - synthesizes $0 Microsoft Edge TTS job and timed SRT subtitles', () => {
  const job = synthesizeEdgeTtsJob({
    text: 'Chào mừng bạn đến với hệ điều hành LedgerFlow Studio. Trợ lý AI và robot tự động hóa đã sẵn sàng.',
    voiceShortName: 'vi-VN-HoaiMyNeural',
  });

  assert.ok(job.jobId);
  assert.equal(job.voice.shortName, 'vi-VN-HoaiMyNeural');
  assert.ok(job.cliCommand.includes('edge-tts'));
  assert.ok(job.srtSubtitles.includes('00:00:'));
  assert.ok(job.vttSubtitles.includes('WEBVTT'));
  assert.ok(job.durationEstimateSec >= 2);
});

test('aiVideoPlatformConnector - optimizes prompts for Kling, Luma and exports CapCut & Remotion specs', () => {
  const klingSpec = formatPromptForPlatform({
    platformId: 'kling',
    sceneDescription: 'Robot AI lập trình phần mềm trong văn phòng tương lai',
    aspectRatio: '9:16',
    cameraMove: 'cinematic_dolly',
  });
  assert.equal(klingSpec.platformId, 'kling');
  assert.ok(klingSpec.optimizedPrompt.includes('cinematic lighting'));
  assert.ok(klingSpec.apiPayload.model_name);

  const lumaSpec = formatPromptForPlatform({
    platformId: 'luma',
    sceneDescription: 'Xe bay trong thành phố cyberpunk',
    cameraMove: 'orbit_left',
  });
  assert.equal(lumaSpec.platformId, 'luma');
  assert.ok(lumaSpec.optimizedPrompt.includes('Unreal Engine 5'));

  const capcut = exportCapCutDraft({
    projectName: 'Demo VietQR Auto Reconcile',
    scenes: [
      { sceneNumber: 1, text: 'Vấn đề: Kế toán đối soát thủ công mất 3 tiếng mỗi ngày', durationSec: 5 },
      { sceneNumber: 2, text: 'Giải pháp: Robot VietQR gạch nợ tự động trong 1 giây', durationSec: 6 },
    ],
  });
  assert.equal(capcut.draftVersion, 'capcut_draft_v1');
  assert.ok(capcut.tracks.videoTrack.length === 2);
  assert.ok(capcut.tracks.subtitleTrack.length === 2);
  assert.ok(capcut.draftContentJson.includes('capcut_draft_v1'));

  const remotion = exportRemotionVideoCode({
    componentName: 'VietQrPromoVideo',
    scenes: [
      { sceneNumber: 1, text: 'Tự động hóa đối soát kế toán VAS 200', durationSec: 4 },
      { sceneNumber: 2, text: 'Tích hợp liền mạch với LedgerFlow Studio', durationSec: 5 },
    ],
  });
  assert.equal(remotion.componentName, 'VietQrPromoVideo');
  assert.ok(remotion.reactSourceCode.includes('<Composition'));
  assert.ok(remotion.reactSourceCode.includes('<Sequence'));
});
