/**
 * robotAutomationRoutes.ts
 * ============================================================
 * Domain Sub-Router for Robotics, Digital Twin Simulation,
 * Self-Healing Patches, and Autonomous Flywheel.
 */

import type { Express, Request, Response } from 'express';
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] ?? '' : value;

import {
  policyEngine,
  loadAutonomyState,
  saveAutonomyState,
  setAutonomyLevel,
  AUTONOMY_SPECS,
  type AutonomyLevel,
} from './policyEngine.ts';
import { toSafeErrorResponse, logGlaciaError } from './glaciaError.ts';

import { runBusinessDigitalTwinSimulation, getDigitalTwinSimulation, listDigitalTwinSimulations } from './businessDigitalTwinSimulator.ts';
import { executeSoftwareRobotWorkflow, getSoftwareRobotWorkflow, listSoftwareRobotWorkflows } from './softwareRobotOrchestrator.ts';
import { dispatchMultiPlatformRobotMission, getMultiPlatformRobotMission, listMultiPlatformRobotMissions } from './multiPlatformRobotSwarm.ts';
import { healRobotActionSelector } from './robotVisionHealer.ts';
import { registerRobotCronJob, listRobotCronJobs, triggerRobotCronJobNow } from './robotCronScheduler.ts';
import { synthesizeRobotWorkflowFromGoal } from './robotWorkflowSynthesizer.ts';
import { runDigitalTwinRobotSandboxSimulation } from './robotDigitalTwinSandbox.ts';
import { executeEdgeRobotActionFast } from './edgeRobotExecutionNode.ts';
import { dispatchRobotOutputToEmployee, listDispatchedRobotTasks } from './robotToEmployeeDispatcher.ts';
import { parseAndExecuteVoiceCommand } from './voiceCommanderEngine.ts';
import { listPublishSchedules, createPublishSchedule, ingestInboundLead } from './viralLeadGrowthEngine.ts';
import { runAiGamePlaytestSimulation } from './aiGamePlaytestSimulator.ts';
import { generatePackagingManifest } from './multiPlatformPackager.ts';
import { generateSelfHealingPatch, listSelfHealingPatches, updatePatchStatus } from './selfHealingPatchEngine.ts';
// ── Free Tool Robot Bridge ($0 Operator) ──
import {
  createBlenderRobotExecutionPlan,
  createFfmpegRobotExecutionPlan,
  createGraphicRobotExecutionPlan,
  executeRobotScript,
  generateBlenderPythonScript,
  generateFfmpegVideoScript,
  generateGraphicDesignAutomationPlan,
} from './freeToolRobotBridge.ts';
import {
  getExecutionHistory,
  appendExecutionHistory,
  clearExecutionHistory,
} from './robotExecutionHistory.ts';
import {
  runOfflineInference,
  getOfflineLlmEngineStatus,
  setOfflineLlmBackend,
} from './glaciaLocalOfflineLlmEngine.ts';
import {
  generateProceduralGameWorld,
  updateBossAiState,
} from './glaciaProceduralGameMatrixEngine.ts';
import {
  createNightShiftMediaDispatch,
  getTelegramMediaStreamHistory,
} from './glaciaTelegramMediaStreamEngine.ts';
import { generate3DCharacterModel } from './glacia3DCharacterStudioEngine.ts';
import { synthesizeCinemaProject } from './glaciaCinemaSynthesizerEngine.ts';
import { generateStandaloneHtmlGame } from './glaciaGameExportEngine.ts';
import { handleUserBargeIn } from './glaciaDuplexVoiceEngine.ts';
import { runRuntimeGarbageCollection } from './glaciaRuntimeGarbageCollector.ts';
import { analyzeWebpageWithGemini } from './glaciaGeminiDeepWebBridge.ts';
import { generateGroundedResponse } from './searchGroundingEngine.ts';
import {
  runAutonomousWebResearch,
  trackCompetitor,
  getWebResearchReports,
  getCompetitorAlerts,
} from './glaciaWebAgent.ts';
import {
  getOrRotateFingerprint,
  forceRotateNow,
  getRotationStats,
  detectPlatformFromUrl,
  PLATFORM_CADENCE_PROFILES,
} from './glaciaStealthFingerprintRotator.ts';
import { batchInspectUrls } from './glaciaBatchWebInspector.ts';
import {
  analyzeYouTubeVideoWithGemini,
  fetchYouTubeTranscript,
  isYouTubeUrl,
} from './glaciaYouTubeTranscriptBridge.ts';
import {
  createMonitorJob,
  listMonitorJobs,
  deleteMonitorJob,
  listMonitorAlerts,
  runWebMonitorTick,
} from './glaciaWebMonitorScheduler.ts';
import {
  fetchGlaciaSystemStatus,
  resolveFullAutonomousExecutionPlan,
} from './glaciaCrossSystemIntegrator.ts';
import { listGeminiLiveVoices } from './glaciaGeminiLiveApi.ts';
import { prepareStealthSessionForUrl } from './glaciaAdvancedStealthEngine.ts';
import { randomUUID } from 'node:crypto';

// Global in-memory cache for stealth cadence settings
let defaultStealthSettings = {
  interactionMode: 'stealth_human' as 'stealth_human' | 'voice_dictation' | 'fast_direct',
  baseWpm: 60,
  typoRate: 0.018,
  allowTypoCorrection: true,
  antiBotSafetyScore: 99.8,
};

export function registerRobotAutomationRoutes(app: Express): void {
  // ── Digital Twin Simulation ──
  app.post('/api/simulation/digital-twin/run', async (req: Request, res: Response) => {
    const { scenarioName, initialCapital, monthlyBurn, targetGrowthRate, simulationMonths } = req.body || {};
    const simulation = await runBusinessDigitalTwinSimulation({
      currentCashUSD: Number(initialCapital) || 50000,
      monthlyBurnUSD: Number(monthlyBurn) || 8000,
      userGrowthMonthly: Number(targetGrowthRate) || 15,
      timeframeDays: Number(simulationMonths) || 12,
    });
    res.json({ success: true, simulation });
  });

  app.get('/api/simulation/digital-twin/:id', (req: Request, res: Response) => {
    const sim = getDigitalTwinSimulation(routeParam(req.params.id));
    if (!sim) return res.status(404).json({ success: false, error: 'Simulation not found' });
    res.json({ success: true, simulation: sim });
  });

  app.get('/api/simulation/digital-twin/list', (_req: Request, res: Response) => {
    res.json({ success: true, simulations: listDigitalTwinSimulations() });
  });

  // ── Glacia On-Device Offline LLM ($0 Token) ──
  app.get('/api/glacia/offline-llm/status', (_req: Request, res: Response) => {
    res.json({ success: true, status: getOfflineLlmEngineStatus() });
  });

  app.post('/api/glacia/offline-llm/infer', (req: Request, res: Response) => {
    const { prompt, taskType, preferredModel } = req.body || {};
    if (!prompt) return res.status(400).json({ success: false, error: 'prompt is required' });
    const result = runOfflineInference({
      prompt: String(prompt),
      taskType: taskType || 'fast_chat',
      preferredModel,
    });
    res.json({ success: true, result });
  });

  app.post('/api/glacia/offline-llm/backend', (req: Request, res: Response) => {
    const { backend } = req.body || {};
    if (!backend) return res.status(400).json({ success: false, error: 'backend is required' });
    const status = setOfflineLlmBackend(backend);
    res.json({ success: true, status });
  });

  // ── Glacia 3D Procedural Game & Boss AI Matrix ──
  app.post('/api/glacia/procedural-game/generate', (req: Request, res: Response) => {
    const { biome, seed } = req.body || {};
    const world = generateProceduralGameWorld(biome, Number(seed) || Date.now());
    res.json({ success: true, world });
  });

  app.post('/api/glacia/procedural-game/boss-fsm-tick', (req: Request, res: Response) => {
    const { boss, playerDistance, playerIsAttacking } = req.body || {};
    if (!boss) return res.status(400).json({ success: false, error: 'boss object is required' });
    const tickResult = updateBossAiState(boss, Number(playerDistance) || 10, Boolean(playerIsAttacking));
    res.json({ success: true, tickResult, updatedBoss: boss });
  });

  // ── Glacia Night Shift Telegram Media Stream ──
  app.post('/api/glacia/telegram-media/dispatch', (req: Request, res: Response) => {
    const { projectName, mediaType } = req.body || {};
    const dispatch = createNightShiftMediaDispatch(projectName || 'Valkyrie Chronicles 3D', mediaType);
    res.json({ success: true, dispatch });
  });

  app.get('/api/glacia/telegram-media/history', (_req: Request, res: Response) => {
    res.json({ success: true, history: getTelegramMediaStreamHistory() });
  });

  // ── Glacia 3D Avatar & Character Studio ──
  app.post('/api/glacia/3d-character/generate', (req: Request, res: Response) => {
    const character = generate3DCharacterModel(req.body);
    res.json({ success: true, character });
  });

  // ── Glacia One-Click Cinema Synthesizer ──
  app.post('/api/glacia/cinema/synthesize', (req: Request, res: Response) => {
    const { ideaPrompt, genreStyle, aspectRatio, voiceActorMood } = req.body || {};
    const project = synthesizeCinemaProject({
      ideaPrompt: String(ideaPrompt || ''),
      genreStyle,
      aspectRatio,
      voiceActorMood,
    });
    res.json({ success: true, project });
  });

  // ── Glacia Standalone HTML Game Exporter ──
  app.post('/api/glacia/game/export-standalone', (req: Request, res: Response) => {
    const { gameTitle, biome, bossName, playerSpeed } = req.body || {};
    const gameBundle = generateStandaloneHtmlGame({
      gameTitle: String(gameTitle || 'Glacia 3D Cyber Valkyrie'),
      biome: String(biome || 'cyberpunk_neon_dungeon'),
      bossName: String(bossName || 'Mecha Dragon Overlord'),
      playerSpeed: Number(playerSpeed) || 0.12,
    });
    res.json({ success: true, gameBundle });
  });

  // ── Glacia Duplex Realtime Voice Interaction ──
  app.post('/api/glacia/duplex-voice/interact', (req: Request, res: Response) => {
    const { sessionId, userQuery } = req.body || {};
    const result = handleUserBargeIn(sessionId || `duplex-${Date.now()}`, String(userQuery || ''));
    res.json({
      success: true,
      voiceSession: {
        sessionId: sessionId || `duplex-${Date.now()}`,
        state: 'speaking',
        language: 'vi-VN',
        voiceTone: 'warm_professional',
        averageLatencyMs: 145,
        activeContextSummary: result.recoveredContext,
        responseVoiceText: result.nextGlaciaResponse,
      },
    });
  });

  // ── Glacia Runtime Garbage Collector & RAM Optimizer ──
  app.post('/api/glacia/system/garbage-collect', (_req: Request, res: Response) => {
    const stats = runRuntimeGarbageCollection();
    res.json({ success: true, stats });
  });

  app.get('/api/glacia/system/gc-status', (_req: Request, res: Response) => {
    const mem = process.memoryUsage();
    res.json({
      success: true,
      memoryUsageMb: {
        heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
        heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
        rss: Math.round(mem.rss / (1024 * 1024)),
      },
      status: 'healthy',
      policy: 'auto_purge_on_cycle',
    });
  });

  // ── Glacia Gemini Deep Web & Universal Webpage Inspection ──
  app.post('/api/glacia/gemini/web-inspect', async (req: Request, res: Response) => {
    try {
      const { url, question, enableSearchGrounding, interactionMode, customInstructions } = req.body || {};
      if (!url || !question) {
        return res.status(400).json({ success: false, error: 'url và question là bắt buộc.' });
      }
      const result = await analyzeWebpageWithGemini({
        url,
        question,
        enableSearchGrounding: Boolean(enableSearchGrounding),
        interactionMode: interactionMode || defaultStealthSettings.interactionMode,
        customInstructions,
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/gemini/grounding-search', async (req: Request, res: Response) => {
    try {
      const { query, domain } = req.body || {};
      if (!query) {
        return res.status(400).json({ success: false, error: 'query là bắt buộc.' });
      }
      const result = await generateGroundedResponse(query, [], { domain });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Autonomous Web Agent & Competitor Spider ──
  app.post('/api/glacia/web-agent/research', async (req: Request, res: Response) => {
    try {
      const { topic, targetUrls, autoSaveToMemory } = req.body || {};
      if (!topic) {
        return res.status(400).json({ success: false, error: 'topic là bắt buộc.' });
      }
      const report = await runAutonomousWebResearch({ topic, targetUrls, autoSaveToMemory });
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/glacia/web-agent/reports', (_req: Request, res: Response) => {
    try {
      res.json({ success: true, reports: getWebResearchReports() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/glacia/web-agent/competitor-alerts', (_req: Request, res: Response) => {
    try {
      res.json({ success: true, alerts: getCompetitorAlerts() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/web-agent/track-competitor', async (req: Request, res: Response) => {
    try {
      const { competitorName, url, features, pricingSummary } = req.body || {};
      if (!competitorName || !url) {
        return res.status(400).json({ success: false, error: 'competitorName và url là bắt buộc.' });
      }
      const result = await trackCompetitor({ competitorName, url, features, pricingSummary });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Stealth Human Cadence & Anti-Ban Controls ──
  app.get('/api/glacia/stealth-cadence/settings', (_req: Request, res: Response) => {
    res.json({ success: true, settings: defaultStealthSettings });
  });

  app.post('/api/glacia/stealth-cadence/settings', (req: Request, res: Response) => {
    const { interactionMode, baseWpm, typoRate, allowTypoCorrection } = req.body || {};
    if (interactionMode) defaultStealthSettings.interactionMode = interactionMode;
    if (typeof baseWpm === 'number') defaultStealthSettings.baseWpm = Math.max(30, Math.min(120, baseWpm));
    if (typeof typoRate === 'number') defaultStealthSettings.typoRate = Math.max(0, Math.min(0.1, typoRate));
    if (typeof allowTypoCorrection === 'boolean') defaultStealthSettings.allowTypoCorrection = allowTypoCorrection;
    res.json({ success: true, settings: defaultStealthSettings });
  });

  // ── Software Robotics ──
  app.post('/api/robot/software/execute', async (req: Request, res: Response) => {
    const { robotType, targetSystem, actions, dryRun } = req.body || {};
    if (!robotType || !targetSystem) {
      return res.status(400).json({ success: false, error: 'robotType and targetSystem required' });
    }
    const workflow = await executeSoftwareRobotWorkflow({
      name: robotType,
      actions: actions || [],
      dryRun: Boolean(dryRun),
    });
    res.json({ success: true, workflow });
  });

  app.get('/api/robot/software/:id', (req: Request, res: Response) => {
    const wf = getSoftwareRobotWorkflow(routeParam(req.params.id));
    if (!wf) return res.status(404).json({ success: false, error: 'Workflow not found' });
    res.json({ success: true, workflow: wf });
  });

  app.get('/api/robot/software/list', (_req: Request, res: Response) => {
    res.json({ success: true, workflows: listSoftwareRobotWorkflows() });
  });

  // ── Multi-Platform Robot Missions ──
  app.post('/api/robot/multi-platform/mission', async (req: Request, res: Response) => {
    try {
      const { platform, goal, payload } = req.body || {};
      if (!platform || !goal) {
        return res.status(400).json({ success: false, error: 'platform and goal required' });
      }
      const mission = await dispatchMultiPlatformRobotMission({ title: goal, webTarget: platform });
      res.json({ success: true, mission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/robot/multi-platform/mission/:id', (req: Request, res: Response) => {
    const mission = getMultiPlatformRobotMission(routeParam(req.params.id));
    if (!mission) return res.status(404).json({ success: false, error: 'Mission not found' });
    res.json({ success: true, mission });
  });

  app.get('/api/robot/multi-platform/missions', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ success: true, missions: listMultiPlatformRobotMissions(limit) });
  });

  // ── Vision Healer & Cron & Level 6 Robot Synthesizer ──
  app.post('/api/robot/vision/heal', (req: Request, res: Response) => {
    const { selector, targetLabel, pageContentText } = req.body || {};
    if (!selector || !targetLabel) {
      return res.status(400).json({ success: false, error: 'selector and targetLabel required' });
    }
    const result = healRobotActionSelector({ selector, targetLabel, pageContentText });
    res.json({ success: true, result });
  });

  app.post('/api/robot/cron/register', (req: Request, res: Response) => {
    const { cronExpression, title, webTarget, desktopCommand, telegramChatId } = req.body || {};
    if (!title) return res.status(400).json({ success: false, error: 'title is required' });
    const job = registerRobotCronJob({ cronExpression, title, webTarget, desktopCommand, telegramChatId });
    res.json({ success: true, job });
  });

  app.get('/api/robot/cron/list', (_req: Request, res: Response) => {
    res.json({ success: true, jobs: listRobotCronJobs() });
  });

  app.post('/api/robot/cron/trigger/:id', async (req: Request, res: Response) => {
    try {
      const mission = await triggerRobotCronJobNow(routeParam(req.params.id));
      res.json({ success: true, mission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/robot/v6/synthesize', (req: Request, res: Response) => {
    const { goalPrompt } = req.body || {};
    if (!goalPrompt) return res.status(400).json({ success: false, error: 'goalPrompt is required' });
    const workflow = synthesizeRobotWorkflowFromGoal(goalPrompt);
    res.json({ success: true, workflow });
  });

  app.post('/api/robot/v6/simulate', (req: Request, res: Response) => {
    const { workflow, virtualIterations } = req.body || {};
    if (!workflow) return res.status(400).json({ success: false, error: 'workflow is required' });
    const simulation = runDigitalTwinRobotSandboxSimulation(workflow, Number(virtualIterations) || 1000);
    res.json({ success: true, simulation });
  });

  app.post('/api/robot/v6/execute-fast', async (req: Request, res: Response) => {
    try {
      const { step } = req.body || {};
      if (!step) return res.status(400).json({ success: false, error: 'step is required' });
      const result = await executeEdgeRobotActionFast(step);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/robot/dispatch', (req: Request, res: Response) => {
    const { robotType, outputData, targetRole, confidenceScore } = req.body || {};
    const task = dispatchRobotOutputToEmployee({
      sourceRobot: robotType as any,
      data: { output: outputData, targetRole: targetRole || 'role_chief_of_staff', confidenceScore },
    });
    res.json({ success: true, task });
  });

  app.get('/api/robot/dispatched/list', (_req: Request, res: Response) => {
    res.json({ success: true, tasks: listDispatchedRobotTasks() });
  });

  // ── Flywheel & Packaging ──
  app.post('/api/flywheel/voice/command', (req: Request, res: Response) => {
    const { rawSpeechText } = req.body || {};
    res.json({ success: true, command: parseAndExecuteVoiceCommand(rawSpeechText || '') });
  });

  app.get('/api/flywheel/publish/schedules', (_req: Request, res: Response) => {
    res.json({ success: true, schedules: listPublishSchedules() });
  });

  app.post('/api/flywheel/publish/schedule', (req: Request, res: Response) => {
    const { title, platform, scheduledTime, mediaUrl } = req.body || {};
    res.json({ success: true, schedule: createPublishSchedule({ title, channels: [platform], videoAssetUrl: mediaUrl, caption: title, tags: [], scheduledTime }) });
  });

  app.post('/api/flywheel/lead/ingest', (req: Request, res: Response) => {
    const { name, email, phone, source, intentScore } = req.body || {};
    res.json({ success: true, lead: ingestInboundLead({ fullName: name, email, phone, sourceChannel: source as any, interestedProduct: 'software_os', messageNote: String(intentScore) }) });
  });

  app.post('/api/flywheel/game/playtest', (req: Request, res: Response) => {
    const { gameTitle, simulationSteps, userPersona } = req.body || {};
    res.json({ success: true, report: runAiGamePlaytestSimulation({ gameTitle, genre: '2d_platformer', totalSimulatedRuns: Number(simulationSteps), botSkillProfile: userPersona as any }) });
  });

  app.post('/api/flywheel/package/manifest', (req: Request, res: Response) => {
    const { targetOs, appName, version } = req.body || {};
    res.json({ success: true, manifest: generatePackagingManifest({ appName, version, targets: [targetOs as any] }) });
  });

  // ── Self-Healing Patches ──
  app.post('/api/self-healing/propose', async (req: Request, res: Response) => {
    const { issueDescription, affectedFiles } = req.body || {};
    res.json({ success: true, patch: await generateSelfHealingPatch({ errorLog: issueDescription, sourceContext: (affectedFiles || []).join(', ') }) });
  });

  app.get('/api/self-healing/patches', (_req: Request, res: Response) => {
    res.json({ success: true, patches: listSelfHealingPatches() });
  });

  app.post('/api/self-healing/status', (req: Request, res: Response) => {
    const { id, status } = req.body || {};
    res.json({ success: true, patch: updatePatchStatus(id, status) });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Free Tool Robot Bridge ($0 Operators): Blender, FFmpeg, Canva
  // ═══════════════════════════════════════════════════════════════════

  // Blender 3D Character Generator
  app.post('/api/robot/free/blender/plan', (req: Request, res: Response) => {
    const spec = req.body as any;
    if (!spec?.characterName || !spec?.archetype) {
      return res.status(400).json({ success: false, error: 'characterName and archetype required' });
    }
    const plan = createBlenderRobotExecutionPlan({
      characterName: spec.characterName,
      archetype: spec.archetype || 'humanoid',
      meshDetails: {
        height: Number(spec.height) || 1.7,
        headScale: Number(spec.headScale) || 0.25,
        primaryColorHex: spec.primaryColor || '#2196F3',
        secondaryColorHex: spec.secondaryColor || '#FF5722',
        metallic: Number(spec.metallic) || 0.1,
        roughness: Number(spec.roughness) || 0.6,
      },
      exportFormat: spec.exportFormat || 'glb',
      outputFilename: spec.outputFilename || spec.characterName,
      includeArmatureRig: spec.includeRig !== false,
    });
    res.json({ success: true, plan });
  });

  // Blender Python script preview (no execution)
  app.post('/api/robot/free/blender/preview', (req: Request, res: Response) => {
    const spec = req.body as any;
    const script = generateBlenderPythonScript({
      characterName: spec?.characterName || 'preview',
      archetype: spec?.archetype || 'humanoid',
      meshDetails: {
        height: Number(spec?.height) || 1.7,
        headScale: Number(spec?.headScale) || 0.25,
        primaryColorHex: spec?.primaryColor || '#2196F3',
        secondaryColorHex: spec?.secondaryColor || '#FF5722',
        metallic: Number(spec?.metallic) || 0.1,
        roughness: Number(spec?.roughness) || 0.6,
      },
      exportFormat: spec?.exportFormat || 'glb',
      outputFilename: spec?.outputFilename || 'preview',
      includeArmatureRig: spec?.includeRig !== false,
    });
    res.json({ success: true, script });
  });

  // FFmpeg Video Render Script
  app.post('/api/robot/free/ffmpeg/plan', (req: Request, res: Response) => {
    const input = req.body as any;
    if (!input?.outputName) {
      return res.status(400).json({ success: false, error: 'outputName required' });
    }
    const plan = createFfmpegRobotExecutionPlan({
      outputName: input.outputName,
      totalDurationSec: Number(input.totalDurationSec) || 30,
      scenesCount: Number(input.scenesCount) || 1,
      hasVoiceNarration: Boolean(input.hasVoiceNarration),
    });
    res.json({ success: true, plan });
  });

  // FFmpeg script preview
  app.post('/api/robot/free/ffmpeg/preview', (req: Request, res: Response) => {
    const input = req.body as any;
    const scripts = generateFfmpegVideoScript({
      outputName: input?.outputName || 'output',
      totalDurationSec: Number(input?.totalDurationSec) || 30,
      scenesCount: Number(input?.scenesCount) || 1,
      hasVoiceNarration: Boolean(input?.hasVoiceNarration),
    });
    res.json({ success: true, scripts });
  });

  // Canva/Photopea Graphic Design Automation Plan
  app.post('/api/robot/free/graphic/plan', (req: Request, res: Response) => {
    const input = req.body as any;
    if (!input?.title) {
      return res.status(400).json({ success: false, error: 'title required' });
    }
    const plan = createGraphicRobotExecutionPlan({
      title: input.title,
      bgColor: input.bgColor || '#0f172a',
      textColor: input.textColor || '#38bdf8',
    });
    res.json({ success: true, plan });
  });

  // Graphic design plan preview
  app.post('/api/robot/free/graphic/preview', (req: Request, res: Response) => {
    const input = req.body as any;
    const plan = generateGraphicDesignAutomationPlan({
      title: input?.title || 'LedgerFlow Preview',
      theme: input?.theme || 'dark_cyber',
      dimensions: input?.dimensions,
    });
    res.json({ success: true, plan });
  });

  // Execute robot script (run on local machine)
  app.post('/api/robot/free/execute', (req: Request, res: Response) => {
    const { plan } = req.body as any;
    if (!plan?.id || !plan?.toolType) {
      return res.status(400).json({ success: false, error: 'plan with id and toolType required' });
    }
    const result = executeRobotScript(plan);
    // Record to persistent history
    try {
      appendExecutionHistory({
        id: randomUUID(),
        toolType: plan.toolType,
        summary: `Executed ${plan.toolType} plan ${plan.id.slice(0, 8)}`,
        success: result.success,
        output: result.output || '',
        error: result.error || undefined,
        executedAt: new Date().toISOString(),
      });
    } catch { /* best-effort */ }
    res.json({ success: result.success, result });
  });

  // ── Simulation Sandbox (dry-run) ──
  app.post('/api/robot/free/simulate', (req: Request, res: Response) => {
    try {
      const { plan } = req.body as any;
      if (!plan?.id || !plan?.toolType) {
        return res.status(400).json({ success: false, error: 'plan with id and toolType required' });
      }

      // Generate simulated output based on tool type
      const simulatedOutput = generateSimulatedOutput(plan);
      res.json({
        success: true,
        simulation: {
          planId: plan.id,
          toolType: plan.toolType,
          outputPreview: simulatedOutput.outputPreview,
          estimatedFileSize: simulatedOutput.estimatedFileSize,
          estimatedDurationSec: plan.estimatedDurationSec,
          rollbackPlan: `Rollback for ${plan.toolType}: Delete output files and restore original state.`,
          warnings: simulatedOutput.warnings,
          status: 'simulated',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Simulation failed' });
    }
  });

  // ── Execution History ──
  app.get('/api/robot/free/history', (req: Request, res: Response) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
      const history = getExecutionHistory(limit);
      res.json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to get execution history' });
    }
  });

  app.delete('/api/robot/free/history', (_req: Request, res: Response) => {
    try {
      clearExecutionHistory();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to clear execution history' });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // GLACIA LEVEL 5 AUTONOMOUS CREATIVE GOAL GENERATOR ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════
  app.get('/api/glacia/creative/goals/list', async (_req: Request, res: Response) => {
    try {
      const { loadAutonomousGoals } = await import('./glaciaAutonomousGoalGenerator.ts');
      const goals = loadAutonomousGoals();
      res.json({ success: true, goals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/goals/synthesize', async (req: Request, res: Response) => {
    try {
      const { synthesizeNewCreativeGoal } = await import('./glaciaAutonomousGoalGenerator.ts');
      const goal = await synthesizeNewCreativeGoal(req.body?.category);
      res.json({ success: true, goal });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/goals/execute', async (req: Request, res: Response) => {
    try {
      const { executeAutonomousGoal } = await import('./glaciaAutonomousGoalGenerator.ts');
      const goal = await executeAutonomousGoal(req.body?.goalId);
      res.json({ success: true, goal });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 Distribution Hub & Virtual Cast ──
  app.get('/api/glacia/creative/distribution/list', async (_req: Request, res: Response) => {
    try {
      const { loadDistributionPackages } = await import('./glaciaAutonomousGameDistributor.ts');
      const packages = loadDistributionPackages();
      res.json({ success: true, packages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/distribution/package', async (req: Request, res: Response) => {
    try {
      const { generateGameDistributionPackage } = await import('./glaciaAutonomousGameDistributor.ts');
      const pkg = generateGameDistributionPackage(req.body || {});
      res.json({ success: true, package: pkg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/glacia/creative/virtual-cast/roster', async (_req: Request, res: Response) => {
    try {
      const { getVirtualCastRoster } = await import('./glaciaAutonomousGameDistributor.ts');
      const roster = getVirtualCastRoster();
      res.json({ success: true, roster });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 Live Stream & AI Game Director ──
  app.get('/api/glacia/creative/stream/session', async (_req: Request, res: Response) => {
    try {
      const { loadStreamSession } = await import('./glaciaAiStreamDirectorEngine.ts');
      const session = loadStreamSession();
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/stream/event', async (req: Request, res: Response) => {
    try {
      const { triggerLiveStreamEvent } = await import('./glaciaAiStreamDirectorEngine.ts');
      const session = triggerLiveStreamEvent(req.body || {});
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 Open-Source & Forum MCP Mining Engine ──
  app.get('/api/glacia/mcp-mining/status', async (_req: Request, res: Response) => {
    try {
      const { loadMcpMiningState } = await import('./glaciaOpenSourceMcpMiningEngine.ts');
      const state = loadMcpMiningState();
      res.json({ success: true, state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/mcp-mining/harvest', async (req: Request, res: Response) => {
    try {
      const { harvestOpenSourceKnowledge } = await import('./glaciaOpenSourceMcpMiningEngine.ts');
      const result = await harvestOpenSourceKnowledge(req.body || {});
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 Procedural Audio & AI Playtest Benchmark ──
  app.get('/api/glacia/creative/audio/tracks', async (_req: Request, res: Response) => {
    try {
      const { loadAudioTracks } = await import('./glaciaProceduralAudioLab.ts');
      const tracks = loadAudioTracks();
      res.json({ success: true, tracks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/audio/generate-track', async (req: Request, res: Response) => {
    try {
      const { generateProceduralAudioTrack } = await import('./glaciaProceduralAudioLab.ts');
      const track = generateProceduralAudioTrack(req.body || {});
      res.json({ success: true, track });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/game/playtest-benchmark', async (req: Request, res: Response) => {
    try {
      const { runAiPlaytestBenchmark } = await import('./glaciaProceduralAudioLab.ts');
      const benchmark = runAiPlaytestBenchmark(req.body || {});
      res.json({ success: true, benchmark });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 Swarm Cinema & Storyboard Studio ──
  app.get('/api/glacia/creative/cinema/projects', async (_req: Request, res: Response) => {
    try {
      const { loadCinemaProjects } = await import('./glaciaMultiAgentCinemaStudioEngine.ts');
      const projects = loadCinemaProjects();
      res.json({ success: true, projects });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/cinema/generate-production', async (req: Request, res: Response) => {
    try {
      const { generateCinemaProduction } = await import('./glaciaMultiAgentCinemaStudioEngine.ts');
      const project = generateCinemaProduction(req.body || {});
      res.json({ success: true, project });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 "Standing on Shoulders of Giants" Ecosystem Federation ──
  app.get('/api/glacia/creative/giants/status', async (_req: Request, res: Response) => {
    try {
      const { loadGiantsEcosystem } = await import('./glaciaGiantsEcosystemEngine.ts');
      const giants = loadGiantsEcosystem();
      res.json({ success: true, giants });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/giants/invoke', async (req: Request, res: Response) => {
    try {
      const { invokeGiantCapability } = await import('./glaciaGiantsEcosystemEngine.ts');
      const result = invokeGiantCapability(req.body || {});
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 Best-of-Breed Giant Tools Pipeline Engine ──
  app.get('/api/glacia/creative/giant-pipelines/catalog', async (_req: Request, res: Response) => {
    try {
      const { loadGiantToolsCatalog } = await import('./glaciaGiantToolsPipelineEngine.ts');
      const catalog = loadGiantToolsCatalog();
      res.json({ success: true, catalog });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/giant-pipelines/execute', async (req: Request, res: Response) => {
    try {
      const { executeGiantProductionPipeline } = await import('./glaciaGiantToolsPipelineEngine.ts');
      const result = executeGiantProductionPipeline(req.body || {});
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 Master Infinite Autonomous Creative Loop ──
  app.get('/api/glacia/creative/autonomous-loop/status', async (_req: Request, res: Response) => {
    try {
      const { loadAutonomousLoopState } = await import('./glaciaInfiniteAutonomousLoopEngine.ts');
      const state = loadAutonomousLoopState();
      res.json({ success: true, state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/autonomous-loop/trigger-cycle', async (req: Request, res: Response) => {
    try {
      const { executeFullAutonomousCreativeCycle } = await import('./glaciaInfiniteAutonomousLoopEngine.ts');
      const result = executeFullAutonomousCreativeCycle(req.body || {});
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5 Telegram Creative Studio Mobile Dispatcher ──
  app.get('/api/glacia/creative/telegram-dispatcher/status', async (_req: Request, res: Response) => {
    try {
      const { loadTelegramDispatcherState } = await import('./glaciaTelegramCreativeDispatcher.ts');
      const state = loadTelegramDispatcherState();
      res.json({ success: true, state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/telegram-dispatcher/simulate-mobile-command', async (req: Request, res: Response) => {
    try {
      const { tryHandleGlaciaCreativeStudioCommand } = await import('./glaciaTelegramCreativeDispatcher.ts');
      const { text, chatId } = req.body || {};
      const sentMessages: string[] = [];
      const mockSendMessage = async (_cid: number, msgText: string) => {
        sentMessages.push(msgText);
        return { ok: true };
      };
      const handled = await tryHandleGlaciaCreativeStudioCommand(chatId || 1001, text || '/singularity', mockSendMessage);
      res.json({ success: true, handled, sentMessages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/telegram-dispatcher/trigger-morning-report', async (_req: Request, res: Response) => {
    try {
      const { generateMorningBriefingReport } = await import('./glaciaTelegramCreativeDispatcher.ts');
      const report = generateMorningBriefingReport();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 4: Swarm Blackboard & Consensus Engine ──
  app.get('/api/glacia/creative/swarm-blackboard/status', async (_req: Request, res: Response) => {
    try {
      const { loadSwarmBlackboardState } = await import('./glaciaSwarmBlackboardEngine.ts');
      const session = loadSwarmBlackboardState();
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/swarm-blackboard/execute-run', async (req: Request, res: Response) => {
    try {
      const { executeSwarmConsensusRun } = await import('./glaciaSwarmBlackboardEngine.ts');
      const session = executeSwarmConsensusRun(req.body || {});
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5: Evolutionary Genetic Code & Shader Breeding ──
  app.get('/api/glacia/creative/evolutionary-genetic/status', async (_req: Request, res: Response) => {
    try {
      const { loadEvolutionaryState } = await import('./glaciaEvolutionaryGeneticEngine.ts');
      const state = loadEvolutionaryState();
      res.json({ success: true, state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/evolutionary-genetic/breed-generation', async (req: Request, res: Response) => {
    try {
      const { breedNextGeneration } = await import('./glaciaEvolutionaryGeneticEngine.ts');
      const state = breedNextGeneration(req.body || {});
      res.json({ success: true, state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Level 5: Self-Directed Strategic Universe & Franchise Roadmap ──
  app.get('/api/glacia/creative/strategic-roadmap/status', async (_req: Request, res: Response) => {
    try {
      const { loadStrategicRoadmapState } = await import('./glaciaStrategicRoadmapEngine.ts');
      const roadmap = loadStrategicRoadmapState();
      res.json({ success: true, roadmap });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/glacia/creative/strategic-roadmap/advance-milestone', async (req: Request, res: Response) => {
    try {
      const { advanceRoadmapMilestone } = await import('./glaciaStrategicRoadmapEngine.ts');
      const roadmap = advanceRoadmapMilestone(req.body || { milestoneId: 'm-01' });
      res.json({ success: true, roadmap });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Glacia Autonomy & Unified Policy Engine Routes ──
  app.get('/api/glacia/autonomy/status', (_req: Request, res: Response) => {
    try {
      const state = loadAutonomyState();
      res.json({ success: true, state, specs: AUTONOMY_SPECS });
    } catch (err: any) {
      logGlaciaError(err, 'AutonomyRoutes', 'getStatus');
      res.status(500).json(toSafeErrorResponse(err));
    }
  });

  app.post('/api/glacia/autonomy/validate', (req: Request, res: Response) => {
    try {
      const { actionType, principal } = req.body || {};
      const result = policyEngine.evaluate({
        principal: principal || { id: 'glacia-client', role: 'ai_agent' },
        action: actionType || 'unknown_action',
        autonomyAction: actionType,
      });
      res.json({ success: true, validation: result });
    } catch (err: any) {
      logGlaciaError(err, 'AutonomyRoutes', 'validateAction');
      res.status(400).json(toSafeErrorResponse(err));
    }
  });

  app.post('/api/glacia/autonomy/set-level', (req: Request, res: Response) => {
    try {
      const { level } = req.body || {};
      if (typeof level !== 'number' || level < 0 || level > 4) {
        return res.status(400).json({ success: false, error: 'Cấp độ tự trị không hợp lệ (0-4).' });
      }
      const outcome = setAutonomyLevel(level as AutonomyLevel);
      res.json(outcome);
    } catch (err: any) {
      logGlaciaError(err, 'AutonomyRoutes', 'setLevel');
      res.status(500).json(toSafeErrorResponse(err));
    }
  });

  app.post('/api/glacia/policy/evaluate', (req: Request, res: Response) => {
    try {
      const evaluation = policyEngine.evaluate(
        req.body || { principal: { id: 'anonymous', role: 'viewer' }, action: 'view' }
      );
      res.json({ success: true, evaluation });
    } catch (err: any) {
      logGlaciaError(err, 'PolicyRoutes', 'evaluate');
      res.status(500).json(toSafeErrorResponse(err));
    }
  });

  app.post('/api/glacia/autonomy/emergency-lockout', (req: Request, res: Response) => {
    try {
      const { enabled } = req.body || {};
      const state = loadAutonomyState();
      state.emergencyLockout = Boolean(enabled);
      saveAutonomyState(state);
      res.json({
        success: true,
        state,
        message: state.emergencyLockout ? 'Đã kích hoạt Khóa Khẩn cấp.' : 'Đã mở khóa khẩn cấp.',
      });
    } catch (err: any) {
      logGlaciaError(err, 'AutonomyRoutes', 'emergencyLockout');
      res.status(500).json(toSafeErrorResponse(err));
    }
  });
}

// ── Simulation Helpers ──

function generateSimulatedOutput(plan: { toolType: string; outputPath?: string; scriptContent?: string }): {
  outputPreview: string;
  estimatedFileSize: string;
  warnings: string[];
} {
  const tool = plan.toolType;
  const outputPath = plan.outputPath || `/tmp/${tool}_output`;

  switch (tool) {
    case 'blender':
      return {
        outputPreview: `Blender 3D model generated successfully.
  - Output: ${outputPath}
  - Format: GLB (Binary glTF)
  - Poly count: ~15,000 vertices
  - Textures: 2K PBR (Base Color, Normal, Roughness, Metallic)
  - Animation: Idle loop (60 frames)
  - File size estimate: 8-12 MB`,
        estimatedFileSize: '8-12 MB',
        warnings: [
          'Requires Blender 4.0+ installed on local machine',
          'Rendering may take 2-5 minutes depending on complexity',
          'Ensure sufficient disk space for export',
        ],
      };

    case 'ffmpeg':
      return {
        outputPreview: `FFmpeg video composition generated successfully.
  - Output: ${outputPath}
  - Format: MP4 (H.264)
  - Resolution: 1920x1080 (Full HD)
  - Frame rate: 30fps
  - Duration: ~30 seconds
  - Audio: Stereo AAC 192kbps
  - Estimated scenes: 3 with crossfade transitions`,
        estimatedFileSize: '15-30 MB',
        warnings: [
          'Requires FFmpeg installed and available in PATH',
          'Ensure source media files exist at specified paths',
          'Large videos may take significant processing time',
        ],
      };

    case 'canva':
    case 'photopea':
    case 'graphic':
      return {
        outputPreview: `Graphic design asset generated successfully.
  - Output: ${outputPath}
  - Format: PNG (with transparency)
  - Resolution: 1920x1080px
  - Color profile: sRGB
  - Layers: 5 (background, shapes, text, effects, overlay)
  - Font: System default sans-serif`,
        estimatedFileSize: '500 KB - 2 MB',
        warnings: [
          'Photopea requires browser access (runs in-browser)',
          'Canva API requires authentication token',
          'Some fonts may fall back to defaults if not available',
        ],
      };

    case 'shell':
      return {
        outputPreview: `Shell script execution simulation.
  - Script: ${plan.scriptContent?.slice(0, 100) || 'N/A'}
  - Working directory: ${outputPath}
  - Exit code: 0 (simulated)
  - Output: Script completed successfully with no errors.`,
        estimatedFileSize: 'Variable',
        warnings: [
          'Shell commands run with current user permissions',
          'Ensure all dependencies are installed',
          'Review script before execution for safety',
        ],
      };

    default:
      return {
        outputPreview: `Simulation for ${tool} completed.
  - Tool type: ${tool}
  - Status: Dry run successful
  - No output preview available for this tool type.`,
        estimatedFileSize: 'Unknown',
        warnings: [`Tool type "${tool}" simulation is generic; actual results may vary.`],
      };
  }
}

// ============================================================================
// STEALTH FINGERPRINT ROTATION ROUTES
// ============================================================================
export function registerStealthIntelligenceRoutes(app: Express): void {
  // Cross-system dashboard: safe, read-only observability for every Glacia web
  // automation subsystem (accounts, HITL, monitors and batch research).
  app.get('/api/glacia/ecosystem/status', (_req: Request, res: Response) => {
    res.json({ success: true, status: fetchGlaciaSystemStatus(), liveVoices: listGeminiLiveVoices() });
  });

  // Founder-triggered planning only: this never opens a browser or sends a task.
  app.post('/api/glacia/ecosystem/plan', async (req: Request, res: Response) => {
    try {
      const { targetUrl, forceMode, preferVoiceDictation } = req.body || {};
      const plan = await resolveFullAutonomousExecutionPlan({
        targetUrl: typeof targetUrl === 'string' ? targetUrl : undefined,
        forceMode,
        preferVoiceDictation: Boolean(preferVoiceDictation),
      });
      res.json({ success: true, plan });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // Explicitly initiated by the founder. This allocates a safe account/fingerprint
  // profile but deliberately does not automate a third-party site.
  app.post('/api/glacia/ecosystem/prepare-stealth-session', async (req: Request, res: Response) => {
    try {
      const { url } = req.body || {};
      if (typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ success: false, error: 'url is required' });
      }
      const session = await prepareStealthSessionForUrl(url);
      res.json({
        success: true,
        session: {
          platformName: session.platformName,
          account: session.account && {
            id: session.account.id,
            label: session.account.label,
            platform: session.account.platform,
            status: session.account.status,
          },
          fingerprint: session.fingerprint,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // GET fingerprint rotation stats
  app.get('/api/glacia/stealth/fingerprint/stats', (_req: Request, res: Response) => {
    const stats = getRotationStats();
    const platformProfiles = Object.values(PLATFORM_CADENCE_PROFILES);
    res.json({ success: true, stats, platformProfiles });
  });

  // POST force rotate fingerprint immediately
  app.post('/api/glacia/stealth/fingerprint/rotate', (req: Request, res: Response) => {
    const { platform } = req.body || {};
    const platformName = detectPlatformFromUrl(platform || '') || platform || 'generic';
    const fingerprint = forceRotateNow(platformName as any);
    res.json({ success: true, fingerprint, message: 'Fingerprint rotated successfully' });
  });

  // GET detect platform from URL
  app.get('/api/glacia/stealth/detect-platform', (req: Request, res: Response) => {
    const url = String(req.query.url || '');
    const platform = detectPlatformFromUrl(url);
    const profile = PLATFORM_CADENCE_PROFILES[platform];
    res.json({ success: true, platform, profile });
  });

  // ============================================================================
  // BATCH URL INSPECTOR ROUTES
  // ============================================================================
  app.post('/api/glacia/batch-inspect', async (req: Request, res: Response) => {
    try {
      const { urls, question, maxConcurrent, includeComparison, outputFormat } = req.body || {};
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ success: false, error: 'urls array is required' });
      }
      if (!question) return res.status(400).json({ success: false, error: 'question is required' });
      const result = await batchInspectUrls({
        urls,
        question,
        maxConcurrent: Number(maxConcurrent) || 4,
        includeComparison: includeComparison !== false,
        outputFormat: outputFormat || 'markdown',
      });
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // ============================================================================
  // YOUTUBE TRANSCRIPT BRIDGE ROUTES
  // ============================================================================
  app.post('/api/glacia/youtube/analyze', async (req: Request, res: Response) => {
    try {
      const { url, question, customInstructions } = req.body || {};
      if (!url) return res.status(400).json({ success: false, error: 'url is required' });
      if (!isYouTubeUrl(url)) return res.status(400).json({ success: false, error: 'URL must be a YouTube link (youtube.com or youtu.be)' });
      if (!question) return res.status(400).json({ success: false, error: 'question is required' });
      const result = await analyzeYouTubeVideoWithGemini(url, question, customInstructions);
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  app.post('/api/glacia/youtube/transcript', async (req: Request, res: Response) => {
    try {
      const { url } = req.body || {};
      if (!url) return res.status(400).json({ success: false, error: 'url is required' });
      if (!isYouTubeUrl(url)) return res.status(400).json({ success: false, error: 'URL must be a YouTube link' });
      const meta = await fetchYouTubeTranscript(url);
      res.json({ success: true, meta });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // ============================================================================
  // WEB MONITOR SCHEDULER ROUTES
  // ============================================================================
  app.get('/api/glacia/web-monitor/jobs', (_req: Request, res: Response) => {
    res.json({ success: true, jobs: listMonitorJobs() });
  });

  app.post('/api/glacia/web-monitor/jobs', (req: Request, res: Response) => {
    const { url, label, question, frequency, isActive, telegramChatId } = req.body || {};
    if (!url || !question) return res.status(400).json({ success: false, error: 'url and question are required' });
    const job = createMonitorJob({
      url,
      label: label || url,
      question,
      frequency: frequency || 'daily',
      isActive: isActive !== false,
      telegramChatId,
    });
    res.json({ success: true, job });
  });

  app.delete('/api/glacia/web-monitor/jobs/:id', (req: Request, res: Response) => {
    const deleted = deleteMonitorJob(routeParam(req.params.id));
    res.json({ success: deleted, message: deleted ? 'Job deleted' : 'Job not found' });
  });

  app.get('/api/glacia/web-monitor/alerts', (_req: Request, res: Response) => {
    res.json({ success: true, alerts: listMonitorAlerts(50) });
  });

  app.post('/api/glacia/web-monitor/tick', async (_req: Request, res: Response) => {
    try {
      const results = await runWebMonitorTick();
      res.json({ success: true, results });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });
}
