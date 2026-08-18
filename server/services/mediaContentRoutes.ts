/**
 * mediaContentRoutes.ts
 * ============================================================
 * Domain Sub-Router for Media, Video, Gemini, TTS, Avatar & Studio Endpoints.
 */

import type { Express, Request, Response } from 'express';
import { generateProductReleaseMediaCampaign } from './mediaFactoryEngine.ts';
import { startGeminiLiveVoiceStreamSession } from './geminiLiveVoiceStream.ts';
import { streamGeminiReasoningThoughtTrajectory } from './geminiReasoningGateway.ts';
import { tuneGeminiSystemPrompt } from './geminiPromptTuner.ts';
import { generateNotebookLmSourcePack } from './notebookLmConnector.ts';
import { convertMarkdownToGammaSlideSpec } from './gammaSlideBridge.ts';
import { validateTextQuality } from './languageToolValidator.ts';
import { generateAvatarPresentationJob } from './aiAvatarConnector.ts';
import { synthesizeEdgeTtsJob, EDGE_TTS_VOICES } from './edgeTtsConnector.ts';
import { formatPromptForPlatform, exportCapCutDraft, exportRemotionVideoCode } from './aiVideoPlatformConnector.ts';
import { planScriptToVideo } from './scriptToVideo.ts';
import { archiveMediaToSupabase } from './supabaseClient.ts';
import { generateVideoProject, listVideoProjects, updateVideoProjectStatus } from './videoProductionPipeline.ts';
import { generateGameAssetBundle, listGameAssetBundles, updateGameAssetStatus } from './gameAssetPipeline.ts';
import { captureGoldenTrajectory, getDistillationStats, listGoldenTrajectories, exportDistillationDataset, clearDistillationDataset } from './aiApprenticeDistillationEngine.ts';
import { generateGoogleAiStudioPromptPack, getGoogleAiStudioQuotaStatus } from './googleAiStudioConnector.ts';

export function registerMediaContentRoutes(app: Express): void {
  // ── Product Media Campaign ──
  app.post('/api/media/campaign/generate', async (req: Request, res: Response) => {
    try {
      const { featureTitle, targetAudience, platforms } = req.body || {};
      if (!featureTitle || !targetAudience) {
        return res.status(400).json({ success: false, error: 'featureTitle and targetAudience are required' });
      }
      const campaign = await generateProductReleaseMediaCampaign({ featureTitle, targetAudience, platforms });
      res.json({ success: true, campaign });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Gemini Live Voice & Reasoning ──
  app.post('/api/ai/gemini/live-voice/start', (req: Request, res: Response) => {
    const { audioFormat, enableVisionShare } = req.body || {};
    const session = startGeminiLiveVoiceStreamSession({ audioFormat, enableVisionShare });
    res.json({ success: true, session });
  });

  app.post('/api/ai/gemini/reasoning/stream', (req: Request, res: Response) => {
    const { prompt, thinkingBudgetTokens } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }
    const trajectory = streamGeminiReasoningThoughtTrajectory({ prompt, thinkingBudgetTokens: Number(thinkingBudgetTokens) || 1024 });
    res.json({ success: true, trajectory });
  });

  app.post('/api/ai/gemini/prompt/tune', (req: Request, res: Response) => {
    const { roleName, basePrompt, strictSchema } = req.body || {};
    if (!roleName || !basePrompt) {
      return res.status(400).json({ success: false, error: 'roleName and basePrompt are required' });
    }
    const result = tuneGeminiSystemPrompt({ roleName, basePrompt, strictSchema });
    res.json({ success: true, result });
  });

  // ── AI Video & Presentation Connectors ──
  app.post('/api/connectors/notebooklm/source-pack', (req: Request, res: Response) => {
    const { topic, sourceNotes, targetFormat } = req.body || {};
    if (!topic) return res.status(400).json({ success: false, error: 'topic is required' });
    const pack = generateNotebookLmSourcePack({ title: topic, sourceType: (targetFormat as any) || 'PROJECT_SPEC', content: (sourceNotes || []).join('\n') });
    res.json({ success: true, pack });
  });

  app.post('/api/connectors/gamma/slides', (req: Request, res: Response) => {
    const { markdownContent, theme } = req.body || {};
    if (!markdownContent) return res.status(400).json({ success: false, error: 'markdownContent is required' });
    const slides = convertMarkdownToGammaSlideSpec({ title: markdownContent.slice(0, 60), content: markdownContent, theme });
    res.json({ success: true, slides });
  });

  app.post('/api/connectors/languagetool/check', (req: Request, res: Response) => {
    const { text, language } = req.body || {};
    if (!text) return res.status(400).json({ success: false, error: 'text is required' });
    const validation = validateTextQuality(text, language);
    res.json({ success: true, validation });
  });

  app.post('/api/connectors/avatar/generate', (req: Request, res: Response) => {
    const { scriptText, avatarId, voiceId, emotion } = req.body || {};
    if (!scriptText) return res.status(400).json({ success: false, error: 'scriptText is required' });
    const job = generateAvatarPresentationJob({ title: scriptText.slice(0, 60), scriptLines: scriptText.split('\n'), avatarEngine: avatarId as any, avatarPortraitUrl: voiceId });
    res.json({ success: true, job });
  });

  app.get('/api/connectors/edge-tts/voices', (_req: Request, res: Response) => {
    res.json({ success: true, voices: EDGE_TTS_VOICES });
  });

  app.post('/api/connectors/edge-tts/synthesize', async (req: Request, res: Response) => {
    try {
      const { text, voice, rate, pitch } = req.body || {};
      if (!text) return res.status(400).json({ success: false, error: 'text is required' });
      const job = await synthesizeEdgeTtsJob({ text, voiceShortName: voice, speed: rate, pitch });
      res.json({ success: true, job });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/connectors/ai-video/prompt', (req: Request, res: Response) => {
    const { platform, rawPrompt } = req.body || {};
    res.json({ success: true, prompt: formatPromptForPlatform({ platformId: (platform as any) || 'kling', sceneDescription: rawPrompt || '' }) });
  });

  app.post('/api/connectors/ai-video/capcut-export', (req: Request, res: Response) => {
    const { projectTitle, scenes } = req.body || {};
    res.json({ success: true, draft: exportCapCutDraft({ projectName: projectTitle, scenes: scenes || [] }) });
  });

  app.post('/api/connectors/ai-video/remotion-export', (req: Request, res: Response) => {
    const { compositionName, durationInFrames, fps, props } = req.body || {};
    res.json({ success: true, code: exportRemotionVideoCode({ componentName: compositionName, scenes: props?.scenes || [] }) });
  });

  app.get('/api/connectors/google-ai-studio/quota', (_req: Request, res: Response) => {
    res.json({ success: true, quota: getGoogleAiStudioQuotaStatus() });
  });

  app.post('/api/connectors/google-ai-studio/pack', (req: Request, res: Response) => {
    const { taskGoal, systemPrompt } = req.body || {};
    res.json({ success: true, pack: generateGoogleAiStudioPromptPack({ title: (taskGoal || '').slice(0, 60), taskType: 'code_review', systemInstruction: systemPrompt, userPrompt: taskGoal || '' }) });
  });

  // ── Script to Video & Pipelines ──
  app.post('/api/media/script-to-video/plan', async (req: Request, res: Response) => {
    try {
      const { script, style } = req.body || {};
      const plan = await planScriptToVideo({ topic: script, format: style });
      res.json({ success: true, plan });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/media/archive', async (req: Request, res: Response) => {
    try {
      const { bucket, path: filePath } = req.body || {};
      const result = await archiveMediaToSupabase(filePath, bucket);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/video-production/generate', async (req: Request, res: Response) => {
    const { title, script } = req.body || {};
    const project = await generateVideoProject({ title, topic: script });
    res.json({ success: true, project });
  });

  app.get('/api/video-production/projects', (_req: Request, res: Response) => {
    res.json({ success: true, projects: listVideoProjects() });
  });

  app.post('/api/video-production/status', (req: Request, res: Response) => {
    const { id, status } = req.body || {};
    const updated = updateVideoProjectStatus(id, status);
    res.json({ success: true, project: updated });
  });

  app.post('/api/game-asset/generate', async (req: Request, res: Response) => {
    const { theme, style, assetTypes } = req.body || {};
    const bundle = await generateGameAssetBundle({ assetName: theme, category: (assetTypes?.[0] as any) || 'character', style: style as any });
    res.json({ success: true, bundle });
  });

  app.get('/api/game-asset/bundles', (_req: Request, res: Response) => {
    res.json({ success: true, bundles: listGameAssetBundles() });
  });

  app.post('/api/game-asset/status', (req: Request, res: Response) => {
    const { id, status } = req.body || {};
    const updated = updateGameAssetStatus(id, status);
    res.json({ success: true, bundle: updated });
  });

  // ── AI Apprentice Distillation ──
  app.get('/api/ai/apprentice/stats', (_req: Request, res: Response) => {
    res.json({ success: true, stats: getDistillationStats() });
  });

  app.get('/api/ai/apprentice/trajectories', (_req: Request, res: Response) => {
    res.json({ success: true, trajectories: listGoldenTrajectories() });
  });

  app.get('/api/ai/apprentice/export', (_req: Request, res: Response) => {
    res.json({ success: true, dataset: exportDistillationDataset() });
  });

  app.post('/api/ai/apprentice/capture', (req: Request, res: Response) => {
    const { role, prompt, response, feedbackScore } = req.body || {};
    const traj = captureGoldenTrajectory({ domain: role as any, userPrompt: prompt, goldOutput: response, qualityScore: feedbackScore, providerUsed: 'gemini' });
    res.json({ success: true, trajectory: traj });
  });

  app.post('/api/ai/apprentice/clear', (_req: Request, res: Response) => {
    clearDistillationDataset();
    res.json({ success: true, message: 'Apprentice distillation dataset cleared' });
  });
}
