/**
 * assistant-daemon.ts
 * ============================================================
 * Standalone Express daemon for the AI Coding Assistant.
 *
 * Runs on port 3001 (separate from LedgerFlow main app on 3000).
 * Receives commands from Telegram webhook, CLI, or REST API calls.
 *
 * Endpoints:
 *   GET  /health                   â€” Health check + AI router status
 *   POST /api/ask                  â€” Ask AI without file context
 *   POST /api/read                 â€” Read a file and return its content
 *   POST /api/edit                 â€” Read file + ask AI to edit, return preview
 *   POST /api/apply                â€” Apply the last AI suggestion to a file
 *   POST /api/rollback             â€” Rollback a file to its last backup
 *   POST /api/create               â€” Create a new file with AI-generated content
 *   GET  /api/backups              â€” List backups for a file
 *   GET  /api/status               â€” AI router key status + diagnostics
 *   POST /webhook/telegram         â€” Telegram bot webhook receiver
 * ============================================================
 */

import express, { Request as ExpressRequest, Response, NextFunction } from "express";

type Request<P = Record<string, string>, ResBody = any, ReqBody = any, ReqQuery = any, Loc extends Record<string, any> = Record<string, any>> = ExpressRequest<P, ResBody, ReqBody, ReqQuery, Loc>;
import { auditOpenClawSkillInvocation } from './services/openClawSkillInvocationGateway';
import { getOpenClawSkill, getOpenClawSkillSummary, listOpenClawSkills } from './services/openClawSkillRegistry';
import { getAutomationSchedulerStatus, runAutomationSchedulerTick, startAutomationScheduler, stopAutomationScheduler } from './services/automationSchedulerLoop';
import { listRobotCapabilities, getRobotCapability, auditRobotCapabilityRequest } from './services/robotCapabilityRegistry';
import fs from "fs";
import path from "path";
import { callAI, streamAI } from "./services/aiClient";
import { diagnoseAIRouter } from "./services/aiRouter";
import {
  readFileForAI,
  readDirectoryForAI,
  backupAndWrite,
  createFile,
  rollbackFile,
  listBackups,
  getWorkspaceRoot,
  resolveAndValidate,
  backupAndWriteMultiple,
} from "./services/safeFileManager";
import {
  buildCodingPrompt,
  getCodingAIOptions,
  parseAICodeResponse,
  detectTaskFromInstruction,
  type CodingContextOptions,
} from "./services/codingContext";
import { createTelegramHandler, startTelegramPolling } from "./services/telegramBot";
import type { PendingSuggestion } from "./services/assistant-daemon.types";
import { buildSearchIndex, searchCodebase } from "./services/localSearchService";
import { runAutoRepairLoop, activeRepairProgress } from "./services/autoRepairEngine";
import { getAgentRole, listAgentRoles, updateAgentRolePrompt } from "./services/agentRoles";
import { executeWebAIAutomation, profileStatusForWebAIError, WebAIError, checkWebAISession, openWebAISessionForLogin } from "./services/webAiAutomator";
import { WebAiSessionManager } from "./services/webAiSessionManager";
import { WebAiTaskRouter } from "./services/webAiTaskRouter";
import { approveWebAIExecution, consumeWebAIExecution, createWebAIExecutionPreview } from "./services/webAiDataGuard";
import { appendAuditEvent, readAuditEvents, verifyAuditChain } from "./services/auditLog";
import { PlatformAccountBroker } from "./services/platformAccountBroker";
import { SessionLeaseManager } from "./services/sessionLeaseManager";
import { z } from "zod";
import { createDaemonLocalGuard } from "./services/daemonLocalGuard";
import { AGENT_TOOL_IDS } from './services/agentToolIds.ts';
import {
  advanceAgentRun,
  approveAgentRunStep,
  rejectAgentRunStep,
  createAgentRun,
  getAgentRun,
  getAgentRuntimeMetrics,
  listAgentRuns,
  setAgentRuntimeEmergencyStop,
  stopAgentRun
} from "./services/agentRuntime";
import { createPatchReviewSessionsFromRun, listPatchReviewSessions, updatePatchReviewSessionStatus } from "./services/patchReviewSessions";
import { applyReviewedPatchSession, rollbackReviewedPatchSession, PATCH_APPLY_PHRASE, PATCH_ROLLBACK_PHRASE } from "./services/patchReviewApply";
import {
  createAgentMemory,
  reviewAgentMemory,
  searchAgentMemory
} from "./services/agentMemoryStore";
import {
  getRobotSimulationState,
  setRobotEmergencyStop,
  simulateRobotCommand,
  previewRobotDigitalTwinPath
} from "./services/robotConnector";
import { listMissionTraces } from "./services/aiWorkforceMissionTraceLedger";
import { checkWorldClassReadiness } from "./services/aiWorkforceWorldClassReadiness";
import { listAllProfileHealth } from "./services/webAiReliability";
import { preflightRobotPlan, executeRobotPlan } from "./services/openClawWebRobotOperator";
import {
  createAutomationRule,
  deleteAutomationRule,
  getAutomationExecutionLog,
  listAutomationRules,
  toggleAutomationRule
} from "./services/automationRuleEngine";
import { dispatchTextThroughFabric, checkFabricHealth, type FabricRun } from "./services/aiFabric";
import { executeControlPlaneRun, getControlPlaneRun, listControlPlaneRuns, getControlPlaneMetrics, type AgentControlPlaneOptions } from "./services/agentControlPlane";
import { acceptRobotCommand, getAdapterState, getRunbook, replayRunbook, setEmergencyStop, updateEnvelope, type RobotCommand } from "./services/robotAdapterBoundary";
import { startBrowserSession, completeBrowserSession, getRunbookHistory, getBrowserRunbookSummary, addRunbookStep, type BrowserRunbookAction } from "./services/browserRunbookEngine";
import { runAgenticLoop, stopAgenticLoop, getAgenticLoopRun, listAgenticLoopRuns, getAgenticLoopMetrics, type AgenticLoopOptions } from "./services/agenticLoopEngine";
import { addSessionMemory, searchMemory, recordObservation, promoteToLongTerm, getStats as getCompoundMemoryStats, cleanExpiredShortTerm, createMemoryRecord, type MemoryRecord } from "./services/compoundMemory";
import { agenticRetrieve, dispatchWithRag, type AgenticRagResult } from "./services/agenticRagRouter";
import { analyzeAndOptimize, savePromptVersion, getLatestPromptVersion, listPromptVersions, type OptimizationSuggestion } from "./services/promptOptimizer";
import { orchestrateMultiAgent, getPlan, listPlans, getAgentSpecs, storePlan, type MultiAgentOptions } from "./services/multiAgentOrchestrator";
import { createSandboxSession, executeInSandbox, getSandboxSession, listSandboxSessions, completeSandboxSession, autoTestAndRepair, runDockerDoctor, type SandboxPolicy } from "./services/sandboxCodeExecutor";
import { createMission, runMission, getMission, listMissions, confirmMissionPush, rejectMission } from "./services/autonomousSweAgentLoop";
import { listTriggerRules, createTriggerRule, updateTriggerRule, deleteTriggerRule, fireTrigger, listTriggerEvents, getTriggerStats, simulateCiFailure, simulateFileChange, type TriggerType } from "./services/eventDrivenTrigger";
import { startObserver, stopObserver, runObserverCheck, getObserverConfig, getLatestReport, listRecentReports, getObserverHealth } from "./services/observerAgent";
import { recordUsage, getSnapshot as getCostSnapshot, getAgentBudget, setAgentBudget, getModelPricing, getRecords, getDailyCosts } from "./services/costObservability";
import { handoffTask, getActiveHandoff, listHandoffs, startGroupDiscussion, getDiscussion, listDiscussions, getAgentRegistry } from "./services/agentHandoffProtocol";
import { runCurator, startAutoCurator, stopAutoCurator, getLastCuratorRun, isCuratorRunning } from "./services/autoMemoryCurator";
import { searchEverything, searchWithRagContext } from "./services/unifiedSearchEngine";
import { getStats as getKnowledgeStats } from "./services/knowledgeGraph";
import { runABTest, getABTestRun, listABTestRuns, getDefaultConfig } from "./services/modelAbEvaluator";
import { submitFeedback, getFeedbackStats, listFeedback, generateImprovementSuggestions, resolveFeedback } from "./services/feedbackCollector";
import { scanTargets, generateSingleDoc, generateAllDocs, getLastDocRun, listGeneratedDocs } from "./services/autoDocGenerator";
import { generateAnalyticsReport } from "./services/agentAnalytics";
import { auditFile, auditMultipleFiles, auditWithSummary } from "./services/aiSecurityAuditor";
import { getStandardTasks, runBenchmark, getBenchmarkRuns, getBenchmarkRun } from "./services/modelBenchmark";
import { createThread, addTurn, getThread, listThreads, archiveThread, summarizeThread, continueThread, exportThread, findRelevantThreads, getThreadStats, threadToMemory } from "./services/conversationThreads";
import { reportHealth, triggerHealing, getComponentHealth, getAllHealth, getHealingLog, getHealingStats, startSelfHealing } from "./services/selfHealingInfra";
import { shareLearning, discoverInsights, generateLearningReport, listLearningEvents, recommendBestAgent } from "./services/crossAgentLearning";
import { registerSkill, getSkill, listSkills, recommendSkills, recordSkillUsage, rateSkill, getSkillStats, learnSkillFromMemory } from "./services/skillRegistry";
import { createChain, addNode, updateNode, deleteNode, addEdge, getChain, listChains, deleteChain, executeChain, getChainRun, listChainRuns } from "./services/promptChainComposer";
import { analyzeStrategy } from "./services/aiStrategyEngine";
import { createWorkflow, addStep, updateStep, deleteStep, getWorkflow, listWorkflows, deleteWorkflow, toggleWorkflow, executeWorkflow, getExecution, listExecutions, getWorkflowStats } from "./services/workflowScheduler";
import { getDefaultVoters, runVotingSession, getVotingSession, listVotingSessions } from "./services/agentVotingSystem";
import { analyzeFileForRefactoring, scanDirectoryForRefactoring } from "./services/codeRefactoringEngine";
import { receiveWebhook, createRule, updateRule, deleteRule as deleteWebhookRule, listRules, listEvents, getEvent as getWebhookEvent, getWebhookStats, simulateGitHubPR, simulateSlackCommand } from "./services/webhookIntegrationHub";
import { getToolDefinitions, executeWithTools } from "./services/toolUseRouter";
import { classifyIntent, classifyIntentSemantic, routeIntent } from "./services/semanticIntentClassifier";
import { getDefaultSwarm, launchSwarm, getSwarmMission, listSwarmMissions } from "./services/agentSwarmCoordinator";
import { validateAIOutput, sanitizeOutput, autoFix, validateFileOutput, getValidationRules } from "./services/aiOutputValidator";
import { startTrace, recordDecision, completeTrace, getTrace, listTraces, getDecisionStats, getTraceTree } from "./services/aiDecisionExplainability";
import { collectTrainingPair, collectFromFeedback, collectFromMemory, listPairs, createDataset, exportDataset, getDataset, listDatasets, getPairStats } from "./services/fineTuningDataCollector";
import { recordMetric, captureTelemetry, getLatestTelemetry, getTelemetryHistory, getMetricsBuffer, clearMetrics } from "./services/aiSystemTelemetry";
import { registerAttachment, extractContext, buildMultiModalContext, getContext, listAttachments, getSupportedFormats, scanDirectoryForAttachments } from "./services/multiModalContext";
import { createScript, addAction, getScript, listScripts as listRPAScripts, deleteScript, executeScript as executeRPAScript, getExecution as getRPAExecution, listExecutions as listRPAExecutions, getStats as getRPAStats } from "./services/rpaEngine";
import { autoRemediate, getRemediationRun, listRemediationRuns } from "./services/autoRemediationPipeline";
import { createWatchRule, getRule as getWatchRule, listRules as listWatchRules, deleteRule as deleteWatchRule2, toggleRule as toggleWatchRule, listEvents as listWatchEvents, getWatchStats, stopAllWatchers } from "./services/smartFileWatcher";
import { createSchedule as createReportSchedule, getSchedule as getReportSchedule, listSchedules as listReportSchedules, deleteSchedule as deleteReportSchedule, generateReport, listGeneratedReports, getGeneratedReport, getReportContent } from "./services/scheduledReportGenerator";
import { enqueue, getJob as getQueueJob, listJobs, getQueueStats, retryJob, purgeJob, retryDeadLetter } from "./services/backgroundJobQueue";
import { generateRobot } from "./services/robotScriptGenerator";
import { generateOpenApiSpec, generateSwaggerHtml, saveOpenApi, scanDaemonRoutes } from "./services/openApiGenerator";
import { createSnapshot, restoreSnapshot, listSnapshots, getSnapshot, deleteSnapshot, getSnapshotStats } from "./services/systemSnapshotRestore";
import { getGatewayStatsSnapshot, getProviderHealthSnapshot, routeThroughGateway, resetCircuitBreaker, resetAllCircuits, getProviderConfigs } from "./services/aiModelGateway";
import { generateTimeline, updateTaskProgress, getTimeline as getProjectTimeline, listTimelines, deleteTimeline } from "./services/projectTimelineAI";
import { createDeployConfig, getConfig as getDeployConfig, listConfigs as listDeployConfigs, runDeploy, getDeployRun, listDeployRuns } from "./services/deployManager";
import { analyzeDocument, detectFileStructure } from "./services/documentIntelligence";
import { profilePerformance, getProfile as getPerfProfile, listProfiles as listPerfProfiles } from "./services/performanceOptimizationProfiler";
import { createPipeline, getPipeline, listPipelines, deletePipeline, publishEvent, listEvents as listStreamEvents, getAggregatedBuckets, getStreamStats } from "./services/eventStreamProcessor";
import { getTemplates, getChannelConfigs, updateChannelConfig, createTemplate, deleteTemplate, sendNotification, listEvents as listNotifyEvents, getNotificationStats, clearEvents } from "./services/notificationEngine";
import { registerPlugin, unloadPlugin, reloadPlugin, getPlugin, listPlugins, discoverPlugins, installFromDiscovered, invokePlugin, getPluginStats } from "./services/pluginExtensionSystem";
import { captureBaseline, getBaseline, listBaselines, deleteBaseline, detectDrift, autoFixDrift, getDriftReport, listDriftReports, getDriftStats } from "./services/configDriftDetector";
import { scanDependencyHealth, getReport as getDepReport, listReports as listDepReports, getDepHealthStats } from "./services/dependencyHealthMonitor";
import { getBuiltinRules, createSastConfig, getConfig as getSastConfig, listConfigs as listSastConfigs, runSastScan, getReport as getSastReport, listReports as listSastReports, getSastStats } from "./services/sastSecurityHub";
import { createHelpSession, getSession as getHelpSession, getHelp, listRecentResponses as listHelpResponses, closeSession, getHelpStats } from "./services/aiContextualHelp";
import { createCompletionSession, getSession as getCompSession, getCompletions, acceptCompletion } from "./services/codeAutocompleteEngine";
import { parseSchema, diffSchemas, createMigration, getMigration, listMigrations, applyMigration, rollbackMigration } from "./services/dataMigrationAI";
import { generateArchitectureDiagram, toMermaid, toGraphviz, toHtmlSvg, getGraph, listGraphs, convertToFormat } from "./services/architectureVisualizer";
import { generateAPITestSuite, getSuite, listSuites, getTestStats } from "./services/apiTestGenerator";
import { generateDocumentation, getDoc, listDocs, getDocTypes } from "./services/contextualDocGenerator";
import { getReviewerProfiles, runCodeReview, getReview, listReviews, getReviewStats } from "./services/aiCodeReviewQueue";
import { analyzeLogs, getAnalysis, listAnalyses, getPatterns, getLogStats } from "./services/intelligentLogAnalyzer";
import { getTemplates as getPromptTemplates, getTemplate, searchTemplates, createTemplate as createPromptTemplate, deleteTemplate as deletePromptTemplate, renderPrompt, executePrompt, listRuns, getLibraryStats, getCategories as getPromptCategories } from "./services/aiPromptLibrary";
import { createNamespace, getNamespace, listNamespaces, deleteNamespace, insertDocument, searchSimilar, batchInsert, getVectorStats } from "./services/vectorEmbeddingStore";
import { generateContent, getAsset, listAssets, getContentTypes, getContentStats } from "./services/contentStudioAI";
import { getGitStatus, getGitDiff, getGitLog, generateCommitMessage, generatePRDescription } from "./services/gitAssistant";
import { createArticle, getArticle, searchArticles, listArticles, updateArticle, recordView, recordHelpful, getCategories, deleteArticle, getKBStats } from "./services/teamKnowledgeBase";
import { estimateTokens, createContextWindow, addSegment, addMemoryContext, addKnowledgeContext, pruneContextWindow, summarizeContext, getContextWindow, listContextWindows, deleteContextWindow } from "./services/contextWindowManager";
import { gatherSystemOverview } from "./services/crossServiceDataLinker";
import { startWorkflow as startAgentWorkflowEngine, approveWorkflowStep, stopWorkflow as stopAgentWorkflow, listWorkflows as listAgentWorkflows, getWorkflow as getAgentWorkflow, listWorkflowTemplates } from "./services/agentWorkflowEngine";
import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";
import { buildRuntimeReleaseGateExport } from "./services/aiWorkforceReleaseGateExportRuntime";
import { buildAIWorkforceReleaseGateExport } from "./services/aiWorkforceReleaseGateExport";
import { getAIWorkforceReleaseGateDashboard } from "./services/aiWorkforceReleaseGateDashboard";
import { buildRuntimeMissionReleaseGate } from "./services/aiWorkforceMissionReleaseGateRuntime";
import { buildMissionQueueSnapshotExport } from "./services/aiWorkforceMissionSnapshotExport";
import { listMissionExecutionQueues, requireMissionExecutionQueue } from "./services/aiWorkforceMissionExecutionQueueStore";
import { buildStoredMissionOperatorReviewDossier, getMissionOperatorReviewNoteStoreStats, listMissionOperatorReviewNotes, saveMissionOperatorReviewNote } from "./services/aiWorkforceMissionReviewNoteStore";
import { approveRuntimeMissionExecutionStep, buildRuntimeGitHubPRControlReport, buildRuntimeGroundedContext, buildRuntimeMissionExecutionQueue, buildRuntimeMissionPlan, buildRuntimePRControlReport, cancelRuntimeMissionExecutionQueue, completeRuntimeMissionExecutionStep, executeRuntimeMissionStepToolSimulation, executeRuntimeMissionStepToolConnector, getAIWorkforceRuntimeDashboard, listRuntimeMissionExecutionQueues, listRuntimeMissionQueueDrift, previewRuntimeAutomation, previewRuntimeMissionStepToolExecution, repairRuntimeMissionQueueDrift, resumeRuntimeMissionExecutionQueue, scoreRuntimePRReadiness, startRuntimeMissionExecutionStep } from "./services/aiWorkforceRuntimeHub";

// ---------------------------------------------------------------------------
// In-memory session store: last AI suggestion per file (for apply/rollback)
// PendingSuggestion type is defined in ./services/assistant-daemon.types.ts
// ---------------------------------------------------------------------------

const pendingSuggestions = new Map<string, PendingSuggestion>();

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

const app = express();
const PORT = parseInt(process.env.ASSISTANT_PORT ?? "3001", 10);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(createDaemonLocalGuard());
app.use("/artifacts", express.static(path.join(process.cwd(), "artifacts")));

// CORS for local dev tools (VS Code extensions, Cursor, etc.)
app.use((_req: Request, res: Response, next: NextFunction) => {
  const origin = _req.headers.origin ?? "";
  // Allow all localhost origins (any port) for local dev tools
  if (!origin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** GET /health â€” Health check */
app.get("/health", async (_req: Request, res: Response) => {
  const diagnostics = await diagnoseAIRouter().catch(() => null);
  res.json({
    ok: true,
    service: "AI Coding Assistant Daemon",
    version: "1.0.0",
    workspaceRoot: getWorkspaceRoot(),
    aiRouter: diagnostics
      ? { ok: diagnostics.ok, enabledKeys: diagnostics.totalEnabledKeys }
      : { ok: false, enabledKeys: 0 },
    timestamp: new Date().toISOString(),
  });
});

/** GET /api/status â€” Detailed AI provider diagnostics */
app.get("/api/status", async (_req: Request, res: Response) => {
  try {
    const diagnostics = await diagnoseAIRouter();
    res.json({ ok: true, diagnostics });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/backups?file=<path> â€” List backups for a file */
app.get("/api/backups", async (req: Request, res: Response) => {
  const file = req.query.file as string;
  if (!file) return res.status(400).json({ ok: false, error: "Missing ?file= query param" });

  try {
    const backups = await listBackups(file);
    res.json({ ok: true, file, backups });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** POST /api/read â€” Read file(s) for inspection */
app.post("/api/read", async (req: Request, res: Response) => {
  const { file, directory, recursive, extensions } = req.body as {
    file?: string;
    directory?: string;
    recursive?: boolean;
    extensions?: string[];
  };

  try {
    if (file) {
      const ctx = await readFileForAI(file);
      return res.json({ ok: true, files: [ctx] });
    }
    if (directory) {
      const files = await readDirectoryForAI(directory, { recursive, extensions });
      return res.json({ ok: true, files });
    }
    res.status(400).json({ ok: false, error: "Provide either 'file' or 'directory' in request body." });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** POST /api/ask â€” Ask AI a question without file context */
app.post("/api/ask", async (req: Request, res: Response) => {
  const { question, task, model, stream: useStream } = req.body as {
    question: string;
    task?: string;
    model?: "ai-assistant" | "ai-assistant-pro";
    stream?: boolean;
  };

  if (!question?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'question' in request body." });
  }

  const messages = [{ role: "user" as const, content: question }];
  const options = { task: (task as any) ?? "general", model, temperature: 0.5 };

  if (useStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
      for await (const chunk of streamAI(messages, options)) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } else {
    try {
      const result = await callAI(messages, options);
      res.json({ ok: true, answer: result.content, modelUsed: result.modelUsed });
    } catch (err: any) {
      res.status(503).json({ ok: false, error: err.message });
    }
  }
});

/** POST /api/edit — Read file(s) + generate AI edit suggestion */
app.post("/api/edit", async (req: Request, res: Response) => {
  const { file, files, instruction, task, model, agentRole, knowledgeNotes } = req.body as {
    file?: string | string[];
    files?: string[];
    instruction: string;
    task?: string;
    model?: "ai-assistant" | "ai-assistant-pro";
    agentRole?: string;
    knowledgeNotes?: Array<{ title: string; body: string; tags?: string; source?: string }>;
  };

  const filePaths: string[] = [];
  if (files && Array.isArray(files)) {
    filePaths.push(...files);
  } else if (file) {
    if (Array.isArray(file)) {
      filePaths.push(...file);
    } else {
      filePaths.push(file);
    }
  }

  if (filePaths.length === 0) return res.status(400).json({ ok: false, error: "Missing 'file' or 'files' in request body." });
  if (!instruction?.trim()) return res.status(400).json({ ok: false, error: "Missing 'instruction' in request body." });

  try {
    // 1. Read files context
    const filesCtx = [];
    for (const fp of filePaths) {
      const ctx = await readFileForAI(fp);
      filesCtx.push(ctx);
    }

    // 2. Build system context from Agent Role if selected
    let roleContext = "";
    if (agentRole) {
      const roleDef = getAgentRole(agentRole);
      if (roleDef) {
        roleContext = `## Role Persona: ${roleDef.id}\n${roleDef.systemPrompt}\n\n`;
      }
    }

    // 3. Build AI prompt
    const detectedTask = (task as any) ?? detectTaskFromInstruction(instruction);
    const contextOpts: CodingContextOptions = {
      instruction,
      files: filesCtx,
      task: detectedTask,
      targetFile: filePaths[0], // primary target
      systemContext: roleContext || undefined,
      knowledgeNotes,
    };
    const messages = buildCodingPrompt(contextOpts);
    const aiOptions = { ...getCodingAIOptions(detectedTask), model: model ?? undefined };

    // 4. Call AI with fallback
    const result = await callAI(messages, aiOptions);

    // 5. Parse code blocks from response
    const parsed = parseAICodeResponse(result.content, filePaths[0]);

    // 6. Store suggestions in session for each parsed block matching target files
    for (const block of parsed.codeBlocks) {
      // Find matching relative path
      const matchedFilePath = filePaths.find(
        (fp) => block.targetFile?.includes(fp) || fp.endsWith(block.targetFile ?? "")
      ) ?? filePaths[0]; // fallback to first target file

      if (matchedFilePath) {
        const absolutePath = resolveAndValidate(matchedFilePath);
        try {
          const originalCtx = filesCtx.find(f => f.absolutePath === absolutePath) ?? await readFileForAI(matchedFilePath);
          pendingSuggestions.set(absolutePath, {
            filePath: absolutePath,
            originalContent: originalCtx.content,
            suggestedContent: block.code,
            explanation: parsed.explanation,
            modelUsed: result.modelUsed,
            createdAt: new Date().toISOString(),
          });
        } catch {
          // Ignore if file read fails
        }
      }
    }

    res.json({
      ok: true,
      files: filePaths,
      instruction,
      taskDetected: detectedTask,
      modelUsed: result.modelUsed,
      explanation: parsed.explanation,
      codeBlocks: parsed.codeBlocks,
      primaryCode: parsed.primaryCode,
      hasPendingSuggestion: parsed.codeBlocks.length > 0,
      rawResponse: result.content,
    });
  } catch (err: any) {
    res.status(err.message.includes("Access denied") ? 403 : 503).json({
      ok: false,
      error: err.message,
    });
  }
});

/** POST /api/apply — Apply reviewed pending suggestions to one or more files */
app.post("/api/apply", async (req: Request, res: Response) => {
  const { file, files, backupStrategy, autoRepair, originalPrompt } = req.body as {
    file?: string | string[];
    files?: string[];
    backupStrategy?: "auto" | "git-commit" | "file-copy";
    autoRepair?: boolean;
    originalPrompt?: string;
  };

  const targets: string[] = [];
  if (files && Array.isArray(files)) {
    targets.push(...files);
  } else if (file) {
    if (Array.isArray(file)) {
      targets.push(...file);
    } else {
      targets.push(file);
    }
  }

  if (targets.length === 0) {
    return res.status(400).json({ ok: false, error: "Missing 'file' or 'files' in request body." });
  }

  try {
    const existingJobs: { filePath: string; relativePath: string; newContent: string }[] = [];
    const newJobs: { filePath: string; relativePath: string; newContent: string }[] = [];

    for (const target of targets) {
      const absolutePath = resolveAndValidate(target);
      const pending = pendingSuggestions.get(absolutePath);
      if (!pending) {
        return res.status(404).json({
          ok: false,
          error: `No reviewed AI suggestion for "${target}". Create or edit a preview first.`,
        });
      }
      
      const job = {
        filePath: absolutePath,
        relativePath: target,
        newContent: pending.suggestedContent,
      };

      if (fs.existsSync(absolutePath)) {
        existingJobs.push(job);
      } else {
        newJobs.push(job);
      }
    }

    const writeResults: any[] = [];

    // Apply backups and write existing files transactionally
    if (existingJobs.length > 0) {
      const results = await backupAndWriteMultiple(
        existingJobs.map(job => ({ filePath: job.filePath, newContent: job.newContent })),
        backupStrategy ?? "auto"
      );
      writeResults.push(...results);
    }

    // Create new files directly
    for (const job of newJobs) {
      await createFile(job.relativePath, job.newContent);
      writeResults.push({
        ok: true,
        bytesWritten: Buffer.byteLength(job.newContent, "utf-8"),
        backup: {
          id: "new-file-creation",
          strategy: "file-creation",
          createdAt: new Date().toISOString(),
        }
      });
    }

    const allJobs = [...existingJobs, ...newJobs];

    // Clear pending suggestions
    for (const job of allJobs) {
      pendingSuggestions.delete(job.filePath);
    }

    // Auto-repair loop if enabled
    let repairStatus: any = null;
    if (autoRepair) {
      repairStatus = await runAutoRepairLoop(
        allJobs.map(job => ({ filePath: job.filePath, relativePath: job.relativePath })),
        originalPrompt ?? "Sửa đổi code theo yêu cầu",
        async (filePath, newContent) => {
          // Direct write during repair (backup is already done in write transaction)
          await fs.promises.writeFile(filePath, newContent, "utf-8");
        },
        async (filePath) => {
          return fs.promises.readFile(filePath, "utf-8");
        }
      );
    }

    res.json({
      ok: true,
      applied: allJobs.map(job => job.relativePath),
      results: writeResults.map(r => ({
        ok: r.ok,
        bytesWritten: r.bytesWritten,
        backup: {
          id: r.backup.id,
          strategy: r.backup.strategy,
          commitHash: r.backup.commitHash,
          backupCopyPath: r.backup.backupCopyPath,
          createdAt: r.backup.createdAt,
        }
      })),
      repairStatus,
      message: `✅ Applied changes to ${allJobs.length} file(s).` + (repairStatus ? ` Repair status: ${repairStatus.message}` : ""),
    });
  } catch (err: any) {
    res.status(err.message.includes("Access denied") ? 403 : 500).json({
      ok: false,
      error: err.message,
    });
  }
});

/** GET /api/apply/status — Get the active auto-repair compiler loop progress */
app.get("/api/apply/status", async (req: Request, res: Response) => {
  res.json({
    success: true,
    progress: activeRepairProgress,
  });
});

/** POST /api/search — Search codebase using TF-IDF */
app.post("/api/search", async (req: Request, res: Response) => {
  const { query, limit } = req.body as { query: string; limit?: number };
  if (!query?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'query' in request body." });
  }

  try {
    const results = await searchCodebase(query, limit);
    res.json({ ok: true, results });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/search/reindex — Rebuild search index */
app.post("/api/search/reindex", async (_req: Request, res: Response) => {
  try {
    const stats = await buildSearchIndex();
    res.json({ ok: true, message: "Reindexed successfully.", ...stats });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/ide/selection — Replace a specific selection/range in a file */
app.post("/api/ide/selection", async (req: Request, res: Response) => {
  const { file, selectedText, startLine, endLine, instruction, knowledgeNotes } = req.body as {
    file: string;
    selectedText: string;
    startLine: number;
    endLine: number;
    instruction: string;
    knowledgeNotes?: Array<{ title: string; body: string; tags?: string; source?: string }>;
  };

  if (!file?.trim()) return res.status(400).json({ ok: false, error: "Missing 'file' in request body." });
  if (startLine === undefined || endLine === undefined) {
    return res.status(400).json({ ok: false, error: "Missing 'startLine' or 'endLine' in request body." });
  }
  if (!instruction?.trim()) return res.status(400).json({ ok: false, error: "Missing 'instruction' in request body." });

  try {
    const fileCtx = await readFileForAI(file);
    const lines = fileCtx.content.split("\n");

    const beforeLines = lines.slice(0, startLine - 1);
    const afterLines = lines.slice(endLine);

    const messages = buildCodingPrompt({
      instruction: `Edit the following selected code block: "${instruction}"`,
      files: [{
        absolutePath: fileCtx.absolutePath,
        relativePath: fileCtx.relativePath,
        content: selectedText,
        language: fileCtx.language,
        sizeBytes: selectedText.length,
        modifiedAt: fileCtx.modifiedAt
      }],
      task: "refactor",
      knowledgeNotes,
    });

    const result = await callAI(messages, { task: "coding", model: "ai-assistant", temperature: 0.2 });
    const parsed = parseAICodeResponse(result.content);

    if (!parsed.primaryCode) {
      return res.status(422).json({ ok: false, error: "AI did not return replacement code." });
    }

    const newFileContent = [...beforeLines, parsed.primaryCode.code, ...afterLines].join("\n");
    pendingSuggestions.set(fileCtx.absolutePath, {
      filePath: fileCtx.absolutePath,
      originalContent: fileCtx.content,
      suggestedContent: newFileContent,
      explanation: parsed.explanation,
      modelUsed: result.modelUsed,
      createdAt: new Date().toISOString(),
    });

    res.json({
      ok: true,
      file,
      suggestedCode: parsed.primaryCode.code,
      explanation: parsed.explanation,
      hasPendingSuggestion: true,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/roles — List available AI agent roles */
app.get("/api/roles", (_req: Request, res: Response) => {
  res.json({ ok: true, roles: listAgentRoles() });
});

/** GET /api/roles/:id — Get one AI agent role including system prompt */
app.get("/api/roles/:id", (req: Request, res: Response) => {
  const role = getAgentRole(req.params.id);
  if (!role) {
    return res.status(404).json({ ok: false, error: "Agent role not found." });
  }
  res.json({ ok: true, role });
});

/** POST /api/roles/:id — Update system prompt of an AI agent role */
app.post("/api/roles/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { systemPrompt } = req.body as { systemPrompt?: string };
  if (systemPrompt === undefined) {
    return res.status(400).json({ ok: false, error: "Missing 'systemPrompt' in request body." });
  }
  try {
    const role = getAgentRole(id);
    if (!role) {
      return res.status(404).json({ ok: false, error: "Agent role not found." });
    }
    await updateAgentRolePrompt(id as any, systemPrompt);
    res.json({ ok: true, message: `Updated system prompt for agent role ${id}.` });
  } catch (err: any) {
    res.status(550).json({ ok: false, error: err.message });
  }
});

/** POST /api/rollback â€” Rollback a file to its last backup */
app.post("/api/rollback", async (req: Request, res: Response) => {
  const { file } = req.body as { file: string };

  if (!file?.trim()) return res.status(400).json({ ok: false, error: "Missing 'file' in request body." });

  try {
    const result = await rollbackFile(file);
    res.json({ ok: true, file, ...(result as any) });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** POST /api/create â€” Create a new file with AI-generated content */
app.post("/api/create", async (req: Request, res: Response) => {
  const { file, instruction, task, context: extraContext, knowledgeNotes } = req.body as {
    file: string;
    instruction: string;
    task?: string;
    context?: string;
    knowledgeNotes?: Array<{ title: string; body: string; tags?: string; source?: string }>;
  };

  if (!file?.trim()) return res.status(400).json({ ok: false, error: "Missing 'file' in request body." });
  if (!instruction?.trim()) return res.status(400).json({ ok: false, error: "Missing 'instruction' in request body." });

  try {
    const detectedTask = (task as any) ?? detectTaskFromInstruction(instruction);
    const messages = buildCodingPrompt({
      instruction: `Create the file "${file}" with the following requirement:\n\n${instruction}`,
      files: [],
      task: detectedTask,
      targetFile: file,
      systemContext: extraContext,
      knowledgeNotes,
    });

    const result = await callAI(messages, getCodingAIOptions(detectedTask));
    const parsed = parseAICodeResponse(result.content, file);

    if (!parsed.primaryCode) {
      return res.status(422).json({
        ok: false,
        error: "AI did not return a code block. Try a more specific instruction.",
        rawResponse: result.content,
      });
    }

    const absolutePath = resolveAndValidate(file);
    if (fs.existsSync(absolutePath)) {
      return res.status(409).json({ ok: false, error: `File already exists: ${file}. Use /api/edit instead.` });
    }
    pendingSuggestions.set(absolutePath, {
      filePath: absolutePath,
      originalContent: "",
      suggestedContent: parsed.primaryCode.code,
      explanation: parsed.explanation,
      modelUsed: result.modelUsed,
      createdAt: new Date().toISOString(),
    });

    res.json({
      ok: true,
      file,
      modelUsed: result.modelUsed,
      explanation: parsed.explanation,
      hasPendingSuggestion: true,
      message: `Prepared "${file}" for review. Apply the pending suggestion to create it.`,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/web-ai/profiles — List registered browser profiles */
app.get("/api/web-ai/profiles", async (_req: Request, res: Response) => {
  try {
    const profiles = await WebAiSessionManager.listProfiles();
    res.json({ ok: true, profiles });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** PATCH /api/web-ai/profiles/:id — Update browser profile metadata */
app.patch("/api/web-ai/profiles/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing profile 'id' path parameter." });
  }

  try {
    const profile = await WebAiSessionManager.updateProfile(id, req.body ?? {});
    res.json({ ok: true, profile });
  } catch (err: any) {
    res.status(err.message?.includes("not found") ? 404 : 400).json({ ok: false, error: err.message });
  }
});

/** POST /api/web-ai/profiles — Register a new browser profile */
app.post("/api/web-ai/profiles", async (req: Request, res: Response) => {
  const { name, platform, customPath } = req.body as { name: string; platform: string; customPath?: string };
  if (!name?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'name' in request body." });
  }
  if (!platform?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'platform' in request body." });
  }

  try {
    const newProfile = await WebAiSessionManager.createProfile(name.trim(), platform.trim(), customPath?.trim());
    res.json({ ok: true, profile: newProfile });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/platform-accounts/resources — Unified resource view for Web AI profiles + API keys */
app.get("/api/platform-accounts/resources", async (req: Request, res: Response) => {
  try {
    const platform = typeof req.query.platform === "string" ? req.query.platform : undefined;
    const snapshot = await PlatformAccountBroker.getSnapshot(platform);
    res.json({ ok: true, ...snapshot });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/platform-accounts/leases — List active + recent leases */
app.get("/api/platform-accounts/leases", async (_req: Request, res: Response) => {
  try {
    const leases = await SessionLeaseManager.listLeases();
    res.json({ ok: true, leases });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/platform-accounts/leases/claim — Claim a web profile lease */
app.post("/api/platform-accounts/leases/claim", async (req: Request, res: Response) => {
  const {
    platform,
    resourceId,
    leaseOwner,
    purpose,
    ttlMinutes,
  } = req.body as {
    platform?: string;
    resourceId?: string;
    leaseOwner?: string;
    purpose?: string;
    ttlMinutes?: number;
  };

  if (!platform?.trim()) {
    return res.status(400).json({ ok: false, error: "Platform is required." });
  }
  if (!leaseOwner?.trim()) {
    return res.status(400).json({ ok: false, error: "Lease owner is required." });
  }
  if (!purpose?.trim()) {
    return res.status(400).json({ ok: false, error: "Purpose is required." });
  }

  try {
    const result = await PlatformAccountBroker.claimBestAvailableWebProfile({
      platform: platform.trim().toLowerCase(),
      preferredResourceId: resourceId?.trim(),
      leaseOwner: leaseOwner.trim(),
      purpose: purpose.trim(),
      ttlMinutes,
    });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** POST /api/platform-accounts/leases/:id/release — Release a lease */
app.post("/api/platform-accounts/leases/:id/release", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { releasedBy } = req.body as { releasedBy?: string };
  if (!id) {
    return res.status(400).json({ ok: false, error: "Lease id is required." });
  }

  try {
    const lease = await SessionLeaseManager.releaseLease(id, releasedBy?.trim());
    res.json({ ok: true, lease });
  } catch (err: any) {
    res.status(err.message?.includes("not found") ? 404 : 400).json({ ok: false, error: err.message });
  }
});

/** POST /api/web-ai/route — Route and recommend platform/profile */
app.post("/api/web-ai/route", async (req: Request, res: Response) => {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt?.trim()) {
    return res.status(400).json({ ok: false, error: "Prompt is required." });
  }
  try {
    const routed = await WebAiTaskRouter.recommend(prompt);
    res.json({ ok: true, ...routed });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** DELETE /api/web-ai/profiles/:id — Delete a browser profile context */
app.delete("/api/web-ai/profiles/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing profile 'id' path parameter." });
  }

  try {
    const success = await WebAiSessionManager.deleteProfile(id);
    if (!success) {
      return res.status(404).json({ ok: false, error: "Profile not found." });
    }
    res.json({ ok: true, message: "Profile deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/web-ai/profiles/:id/check — Verify active browser session for Web AI */
app.post("/api/web-ai/profiles/:id/check", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { platform } = req.body as { platform?: string };
  if (!id || !platform) {
    return res.status(400).json({ ok: false, error: "Missing profile 'id' or 'platform' in request body." });
  }

  try {
    const checkResult = await checkWebAISession(platform, id);
    // Write result to persistence profiles list
    await WebAiSessionManager.recordProfileResult(id, {
      status: checkResult.status as any,
      error: checkResult.error,
    });
    res.json({ ok: true, ...(checkResult as any) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/web-ai/profiles/:id/login — Open browser window to login */
app.post("/api/web-ai/profiles/:id/login", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { platform } = req.body as { platform?: string };
  if (!id || !platform) {
    return res.status(400).json({ ok: false, error: "Missing profile 'id' or 'platform' in request body." });
  }

  try {
    const checkResult = await openWebAISessionForLogin(platform, id);
    // Write result to persistence profiles list
    await WebAiSessionManager.recordProfileResult(id, {
      status: checkResult.status as any,
      error: checkResult.error,
    });
    res.json({ ok: true, ...(checkResult as any) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/web-ai/execute — Execute prompt on a web AI platform via browser automation */
app.post("/api/web-ai/preview", async (req: Request, res: Response) => {
  const { prompt, platform, profileId } = req.body as { prompt?: string; platform?: string; profileId?: string };
  if (!prompt?.trim() || !platform?.trim()) return res.status(400).json({ ok: false, error: "Prompt and platform are required." });
  try {
    if (!WebAiSessionManager.isSupportedPlatform(platform)) return res.status(400).json({ ok: false, error: `Unsupported Web AI platform: ${platform}` });
    if (profileId) await WebAiSessionManager.getProfileForPlatform(profileId, platform);
    const preview = createWebAIExecutionPreview({ prompt, platform, profileId });
    await appendAuditEvent({
      actor: "founder",
      workspace: "AI Operations",
      action: "web_ai.preview",
      target: platform,
      risk: preview.risk,
      status: preview.blocked ? "rejected" : preview.requiresApproval ? "pending_approval" : "sandbox",
      summary: preview.blocked ? "Web AI transmission blocked by secret scanner." : "Web AI transmission preview created.",
      connectorId: "web-ai",
      evidence: { previewId: preview.id, fingerprint: preview.fingerprint, promptChars: preview.promptChars, findings: preview.findings },
    });
    res.json({ ok: true, preview });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post("/api/web-ai/approve", async (req: Request, res: Response) => {
  const { previewId, fingerprint, confirmed } = req.body as { previewId?: string; fingerprint?: string; confirmed?: boolean };
  if (!previewId || !fingerprint || confirmed !== true) return res.status(400).json({ ok: false, error: "Explicit approval confirmation is required." });
  try {
    const approval = approveWebAIExecution(previewId, fingerprint);
    await appendAuditEvent({
      actor: "founder", workspace: "AI Operations", action: "web_ai.approve", target: previewId,
      risk: "HIGH", status: "approved", summary: "Founder approved a sensitive Web AI transmission preview.",
      approvalId: previewId, connectorId: "web-ai", evidence: { fingerprint, expiresAt: approval.expiresAt },
    });
    res.json({ ok: true, ...approval });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post("/api/web-ai/execute", async (req: Request, res: Response) => {
  const { prompt, platform, file, profileId, headless, allowProfileFallback, previewId, approvalToken, captureScreenshot, screenshotPath, filesToUpload } = req.body as {
    prompt: string;
    platform: string;
    file?: string | string[];
    profileId?: string;
    headless?: boolean;
    allowProfileFallback?: boolean;
    previewId?: string;
    approvalToken?: string;
    captureScreenshot?: boolean;
    screenshotPath?: string;
    filesToUpload?: string[];
  };

  if (!prompt?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'prompt' in request body." });
  }
  if (!platform?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'platform' in request body." });
  }

  const filePaths: string[] = [];
  if (file) {
    if (Array.isArray(file)) {
      filePaths.push(...file);
    } else {
      filePaths.push(file);
    }
  }

  // Start browser runbook session for this execution
  const runbookSession = await startBrowserSession(platform, prompt, profileId).catch(() => null);
  try {
    const transmission = consumeWebAIExecution({
      previewId: previewId || "",
      prompt,
      platform,
      profileId,
      approvalToken,
    });
    const candidates = profileId
      ? (allowProfileFallback
          ? await WebAiSessionManager.listAvailableProfiles(platform, profileId)
          : [await WebAiSessionManager.getProfileForPlatform(profileId, platform)])
      : [];
    if (profileId && candidates.length === 0) {
      if (runbookSession) await completeBrowserSession(runbookSession.id, false, undefined, "No available profile").catch(() => undefined);
      throw new Error(`No available ${platform} profile. Review login or quota status first.`);
    }

    const attempts: Array<{ profileId?: string; status: string; error?: string }> = [];
    let result: Awaited<ReturnType<typeof executeWebAIAutomation>> | undefined;
    let profileUsed: string | undefined;
    const runCandidates = candidates.length > 0 ? candidates : [undefined];

    if (runbookSession) addRunbookStep(runbookSession.id, "navigate", true, `Starting ${platform} automation with ${runCandidates.length} candidate(s)`, undefined, 0);

    for (const candidate of runCandidates) {
      try {
        if (runbookSession) addRunbookStep(runbookSession.id, "type_prompt", true, `Dispatching prompt to ${candidate?.name || platform}`, { textPreview: prompt.slice(0, 200) }, 0);

        result = await executeWebAIAutomation(platform, prompt, filePaths[0], {
          profileId: candidate?.id,
          headless,
          captureScreenshot,
          screenshotPath,
          filesToUpload
        });
        profileUsed = candidate?.id;
        attempts.push({ profileId: candidate?.id, status: "ready" });
        if (candidate) await WebAiSessionManager.recordProfileResult(candidate.id, { status: "ready" });

        if (runbookSession) {
          addRunbookStep(runbookSession.id, "extract_text", true, `Response received (${result.text.length} chars)`, { textPreview: result.text.slice(0, 300) }, 0);
          if (result.screenshotPath) addRunbookStep(runbookSession.id, "capture_screenshot", true, "Screenshot captured", { screenshotPath: result.screenshotPath }, 0);
        }
        break;
      } catch (error: any) {
        const status = profileStatusForWebAIError(error);
        const quotaResetAt = error instanceof WebAIError ? error.quotaResetAt : undefined;
        attempts.push({ profileId: candidate?.id, status, error: error.message });
        if (candidate) await WebAiSessionManager.recordProfileResult(candidate.id, { status, error: error.message, quotaResetAt });

        if (runbookSession) {
          const stepAction: BrowserRunbookAction = status === "quota" ? "quota_detected" : status === "login_required" ? "session_expired" : "encounter_error";
          addRunbookStep(runbookSession.id, stepAction, false, `Candidate ${candidate?.name || "default"}: ${error.message?.slice(0, 200)}`, { errorMessage: error.message }, 0);
        }

        if (!(allowProfileFallback && error instanceof WebAIError && error.retryable)) throw error;
      }
    }
    if (!result) {
      if (runbookSession) await completeBrowserSession(runbookSession.id, false, undefined, "All profiles exhausted").catch(() => undefined);
      throw new Error(`All available ${platform} profiles failed.`);
    }

    // Complete runbook session with success
    if (runbookSession) {
      await completeBrowserSession(runbookSession.id, true, result.modelUsed || platform).catch(() => undefined);
    }

    // Store suggestions in session for each parsed block
    for (const block of result.codeBlocks) {
      const matchedFilePath = filePaths.find(
        (fp) => block.targetFile?.includes(fp) || fp.endsWith(block.targetFile ?? "")
      ) ?? filePaths[0];

      if (matchedFilePath) {
        const absolutePath = resolveAndValidate(matchedFilePath);
        let originalContent = "";
        try {
          const originalCtx = await readFileForAI(matchedFilePath);
          originalContent = originalCtx.content;
        } catch {
          // File might be new
        }

        pendingSuggestions.set(absolutePath, {
          filePath: absolutePath,
          originalContent,
          suggestedContent: block.code,
          explanation: result.text,
          modelUsed: result.modelUsed,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await appendAuditEvent({
      actor: "connector", workspace: "AI Operations", action: "web_ai.execute", target: platform,
      risk: transmission.risk, status: "executed", summary: "Web AI transmission completed.",
      approvalId: transmission.requiresApproval ? transmission.id : undefined, connectorId: "web-ai",
      evidence: { previewId: transmission.id, fingerprint: transmission.fingerprint, profileUsed, attempts, findings: transmission.findings },
    }).catch(() => undefined);

    res.json({
      ok: true,
      text: result.text,
      codeBlocks: result.codeBlocks,
      modelUsed: result.modelUsed,
      hasPendingSuggestion: result.codeBlocks.length > 0,
      profileUsed,
      attempts,
      screenshotPath: result.screenshotPath,
      runbookSessionId: runbookSession?.id,
    });
  } catch (err: any) {
    // Complete runbook session with failure if still active
    if (runbookSession) {
      await completeBrowserSession(runbookSession.id, false, undefined, err.message).catch(() => undefined);
    }
    await appendAuditEvent({
      actor: "connector", workspace: "AI Operations", action: "web_ai.execute", target: platform || "unknown",
      risk: "HIGH", status: "failed", summary: "Web AI transmission failed or was rejected.",
      connectorId: "web-ai", evidence: { previewId, error: err.message },
    }).catch(() => undefined);
    
    let fallbackProfile: any = null;
    if (err instanceof WebAIError && err.code === "quota" && profileId) {
      fallbackProfile = await WebAiTaskRouter.getFallbackProfile(profileId, platform);
    }
    
    res.status(500).json({ 
      ok: false, 
      error: err.message, 
      isQuotaError: err instanceof WebAIError && err.code === "quota",
      fallbackProfile
    });
  }
});

// Zod schemas for validation in daemon
const robotCommandSchema = z.object({
  command: z.enum(["inspect", "move", "stop", "home", "rotate", "grip", "release", "calibrate"]),
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    z: z.number().optional(),
    roll: z.number().optional(),
    pitch: z.number().optional(),
    yaw: z.number().optional()
  }).optional(),
  velocity: z.number().optional(),
  gripAngle: z.number().optional(),
  approvalPhrase: z.string().optional()
});

const automationRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  enabled: z.boolean().default(true),
  triggerEvent: z.string().min(1),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any().optional()
  })).default([]),
  conditionLogic: z.enum(["AND", "OR"]).default("AND"),
  actions: z.array(z.object({
    type: z.string(),
    params: z.record(z.string(), z.any()),
    requiresApproval: z.boolean().default(false)
  })).min(1)
});

const agentRunCreateSchema = z.object({
  goal: z.string().min(3).max(4000),
  requestedBy: z.string().max(100).optional(),
  requestedTools: z.array(z.enum(AGENT_TOOL_IDS)).max(8).optional(),
  toolInputs: z.record(z.string(), z.record(z.string(), z.any())).optional(),
  maxSteps: z.number().int().min(1).max(12).optional(),
  maxRuntimeMs: z.number().int().min(5000).max(600000).optional(),
  plannerMode: z.enum(["auto", "ai", "deterministic"]).optional()
});

const agentRunApprovalSchema = z.object({
  stepId: z.string().min(1),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  phrase: z.literal("APPROVE AGENT STEP")
});

const agentMemoryCreateSchema = z.object({
  kind: z.enum(["company", "session", "procedure", "observation", "feedback"]),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
  source: z.string().min(1).max(200),
  sourceRef: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sourceQuality: z.number().min(0).max(1).optional(),
  supersedesId: z.string().optional(),
  reviewed: z.boolean().optional(),
  expiresAt: z.string().datetime().optional()
});

// --- Agent Runtime ---
app.get("/api/agent-runtime/runs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string ?? "50", 10);
    const result = await listAgentRuns(limit);
    res.json({ success: true, ...result });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

app.get("/api/agent-runtime/metrics", async (_req: Request, res: Response) => {
  try {
    const metrics = await getAgentRuntimeMetrics();
    res.json({ success: true, metrics });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

app.post("/api/agent-runtime/runs", async (req: Request, res: Response) => {
  try {
    const parsed = agentRunCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const run = await createAgentRun(parsed.data);
    res.json({ success: true, run });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.get("/api/agent-runtime/runs/:id", async (req: Request, res: Response) => {
  try {
    const run = await getAgentRun(req.params.id);
    if (!run) return res.status(404).json({ success: false, error: "Agent run not found." });
    res.json({ success: true, run });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

app.post("/api/agent-runtime/runs/:id/advance", async (req: Request, res: Response) => {
  try {
    const run = await advanceAgentRun(req.params.id);
    res.json({ success: true, run });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/agent-runtime/runs/:id/approve", async (req: Request, res: Response) => {
  try {
    const parsed = agentRunApprovalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const run = await approveAgentRunStep(req.params.id, parsed.data);
    res.json({ success: true, run });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/agent-runtime/runs/:id/reject", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      stepId: z.string().min(1),
      fingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
      reason: z.string().min(3).max(500).optional()
    }).parse(req.body || {});
    const run = await rejectAgentRunStep(req.params.id, parsed);
    res.json({ success: true, ok: true, run });
  } catch (err: any) { res.status(400).json({ success: false, ok: false, error: err.message }); }
});

app.post("/api/agent-runtime/runs/:id/stop", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ reason: z.string().min(3).max(500).default("Founder requested stop.") }).safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const run = await stopAgentRun(req.params.id, parsed.data.reason);
    res.json({ success: true, run });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/agent-runtime/emergency-stop", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ active: z.boolean(), reason: z.string().max(500).optional() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const control = await setAgentRuntimeEmergencyStop(parsed.data.active, parsed.data.reason);
    res.json({ success: true, control });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// --- Patch Review Sessions ---
app.get("/api/patch-review-sessions", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string ?? "50", 10);
    const sessions = await listPatchReviewSessions(limit);
    res.json({ success: true, sessions });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

app.post("/api/patch-review-sessions/from-run/:runId", async (req: Request, res: Response) => {
  try {
    const sessions = await createPatchReviewSessionsFromRun(req.params.runId);
    res.json({ success: true, sessions });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.patch("/api/patch-review-sessions/:id/status", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ status: z.enum(["draft", "waiting_review", "approved_to_apply", "applied", "rolled_back", "rejected"]) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const session = await updatePatchReviewSessionStatus(req.params.id, parsed.data.status);
    res.json({ success: true, session });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/patch-review-sessions/:id/apply", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ phrase: z.literal(PATCH_APPLY_PHRASE) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: "Patch apply requires exact phrase confirmation." });
    const result = await applyReviewedPatchSession({ sessionId: req.params.id, phrase: parsed.data.phrase });
    res.json({ success: true, result });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/patch-review-sessions/:id/rollback", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ phrase: z.literal(PATCH_ROLLBACK_PHRASE) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: "Patch rollback requires exact phrase confirmation." });
    const result = await rollbackReviewedPatchSession({ sessionId: req.params.id, phrase: parsed.data.phrase });
    res.json({ success: true, result });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});


// --- Robot Capability Registry + Automation Scheduler ---
app.get('/api/robot-capabilities', async (req: Request, res: Response) => {
  const mode = typeof req.query.mode === 'string' ? req.query.mode : undefined;
  const includeBlocked = req.query.includeBlocked === 'true';
  res.json({ ok: true, capabilities: listRobotCapabilities({ mode: mode as never, includeBlocked }) });
});

app.get('/api/robot-capabilities/:id', async (req: Request, res: Response) => {
  const capability = getRobotCapability(req.params.id);
  if (!capability) return res.status(404).json({ ok: false, error: 'Robot capability not found.' });
  res.json({ ok: true, capability });
});

app.post('/api/robot-capabilities/:id/validate', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ approvalPhrase: z.string().optional(), mode: z.enum(['simulation', 'digital_twin', 'hardware']).optional() }).parse(req.body || {});
    const result = await auditRobotCapabilityRequest({ capabilityId: req.params.id, approvalPhrase: parsed.approvalPhrase, mode: parsed.mode, actor: 'founder' });
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: message });
  }
});

app.get('/api/automation-scheduler/status', async (_req: Request, res: Response) => {
  res.json({ ok: true, status: getAutomationSchedulerStatus() });
});

app.post('/api/automation-scheduler/tick', async (_req: Request, res: Response) => {
  const result = await runAutomationSchedulerTick();
  res.json({ ok: true, ...result });
});

app.post('/api/automation-scheduler/start', async (req: Request, res: Response) => {
  const parsed = z.object({ intervalMs: z.number().int().positive().optional() }).parse(req.body || {});
  res.json({ ok: true, status: startAutomationScheduler(parsed) });
});

app.post('/api/automation-scheduler/stop', async (_req: Request, res: Response) => {
  res.json({ ok: true, status: stopAutomationScheduler() });
});

app.get('/api/automation/rules', async (_req: Request, res: Response) => {
  res.json({ ok: true, rules: listAutomationRules() });
});

app.post('/api/automation/rules/:id/toggle', async (req: Request, res: Response) => {
  const parsed = z.object({ enabled: z.boolean() }).parse(req.body || {});
  const rule = toggleAutomationRule(req.params.id, parsed.enabled);
  res.json({ ok: true, rule });
});

app.get('/api/automation/execution-log', async (_req: Request, res: Response) => {
  res.json({ ok: true, logs: getAutomationExecutionLog(50) });
});

app.get('/api/gateway/health', async (_req: Request, res: Response) => {
  res.json({ ok: true, health: getProviderHealthSnapshot(), stats: getGatewayStatsSnapshot() });
});

app.post('/api/gateway/circuit/:provider/reset', async (req: Request, res: Response) => {
  resetCircuitBreaker(req.params.provider, req.body?.model || "default");
  res.json({ ok: true, provider: req.params.provider });
});

app.post('/api/gateway/circuit/reset-all', async (_req: Request, res: Response) => {
  resetAllCircuits();
  res.json({ ok: true });
});


// --- Unified OpenClaw Skill Registry ---
app.get('/api/openclaw-skills', async (req: Request, res: Response) => {
  const domain = typeof req.query.domain === 'string' ? req.query.domain : undefined;
  const includeBlocked = req.query.includeBlocked === 'true';
  res.json({ ok: true, summary: getOpenClawSkillSummary(), skills: listOpenClawSkills({ domain: domain as never, includeBlocked }) });
});

app.get('/api/openclaw-skills/:id', async (req: Request, res: Response) => {
  const skill = getOpenClawSkill(req.params.id);
  if (!skill) return res.status(404).json({ ok: false, error: 'OpenClaw skill not found.' });
  res.json({ ok: true, skill });
});


// --- OpenClaw Skill Invocation Gateway ---
app.post('/api/openclaw-skills/:id/plan-invocation', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      actor: z.enum(['founder', 'ai-agent', 'automation', 'system']).default('founder'),
      payload: z.record(z.string(), z.unknown()).optional(),
      reason: z.string().optional(),
    }).parse(req.body || {});
    const decision = await auditOpenClawSkillInvocation({ skillId: req.params.id, actor: parsed.actor, payload: parsed.payload, reason: parsed.reason });
    res.status(decision.mode === 'blocked' ? 403 : 200).json({ ok: decision.ok, decision });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: message });
  }
});

// --- Agent Memory ---
app.get("/api/agent-memory/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "");
    const limit = parseInt(req.query.limit as string ?? "8", 10);
    const includeDrafts = req.query.includeDrafts !== "false";
    const results = await searchAgentMemory(q, { limit, includeDrafts });
    res.json({ success: true, results });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/agent-memory", async (req: Request, res: Response) => {
  try {
    const parsed = agentMemoryCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const memory = await createAgentMemory(parsed.data);
    res.json({ success: true, memory });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.patch("/api/agent-memory/:id/review", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ status: z.enum(["reviewed", "rejected"]) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const memory = await reviewAgentMemory(req.params.id, parsed.data.status);
    res.json({ success: true, memory });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// --- Robot Simulation ---
app.get("/api/robot-simulation/status", (_req: Request, res: Response) => {
  try { res.json({ success: true, state: getRobotSimulationState() }); }
  catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

app.post("/api/robot-simulation/command", async (req: Request, res: Response) => {
  try {
    const parsed = robotCommandSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });

    // Run through robotAdapterBoundary safety check first
    const boundaryCommand: RobotCommand = {
      id: `cmd_${Date.now()}`,
      type: parsed.data.command as RobotCommand['type'],
      params: {
        position: parsed.data.position ? {
          x: parsed.data.position.x ?? 0,
          y: parsed.data.position.y ?? 0,
          z: parsed.data.position.z ?? 0,
          roll: parsed.data.position.roll,
          pitch: parsed.data.position.pitch,
          yaw: parsed.data.position.yaw,
        } : undefined,
        velocity: parsed.data.velocity,
        gripAngle: parsed.data.gripAngle,
      },
      approvalPhrase: parsed.data.approvalPhrase,
      issuedBy: 'founder',
      priority: 'normal',
    };

    const boundaryResult = acceptRobotCommand(boundaryCommand);
    if (!boundaryResult.accepted) {
      return res.status(403).json({ success: false, error: boundaryResult.reason || "Command rejected by safety boundary.", boundary: boundaryResult });
    }

    // Legacy simulation result for backward compat
    const result = simulateRobotCommand(parsed.data as any);
    res.json({ success: true, result, boundary: boundaryResult });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/robot-simulation/preview", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ position: z.object({ x: z.number(), y: z.number(), z: z.number(), roll: z.number().optional(), pitch: z.number().optional(), yaw: z.number().optional() }) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const preview = previewRobotDigitalTwinPath(parsed.data.position as any);
    res.json({ success: true, preview });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/robot-simulation/emergency-stop", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ active: z.boolean() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });
    const state = await setRobotEmergencyStop(parsed.data.active);
    res.json({ success: true, state });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// --- Automation Rules ---
app.get("/api/automation-rules", (_req: Request, res: Response) => {
  try { res.json(listAutomationRules()); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/automation-rules/logs", (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit || 50);
    res.json(getAutomationExecutionLog(limit));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- AI Workforce Mission Trace ---
app.get("/api/agent-runtime/runs/trace", (_req: Request, res: Response) => {
  try {
    const traces = listMissionTraces(50);
    res.json({ success: true, traces });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// --- Web AI Scheduler Health ---
app.get("/api/web-ai/scheduler/health", (_req: Request, res: Response) => {
  try {
    const profiles = listAllProfileHealth();
    res.json({ success: true, profiles });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// --- OpenClaw Web Robot ---
app.post("/api/openclaw/web-robot/preflight", async (req: Request, res: Response) => {
  try {
    const plan = await preflightRobotPlan(req.body);
    res.json({ success: true, plan });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/openclaw/web-robot/execute", async (req: Request, res: Response) => {
  try {
    const results = await executeRobotPlan(req.body.plan, req.body.approvalPhrase);
    res.json({ success: true, results });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// --- World Class Readiness ---
app.get("/api/ai-workforce/world-class-readiness", async (_req: Request, res: Response) => {
  try {
    const scorecard = await checkWorldClassReadiness();
    res.json({ success: true, scorecard });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

app.post("/api/automation-rules", (req: Request, res: Response) => {
  try {
    const parsed = automationRuleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    const rule = createAutomationRule(parsed.data as any);
    res.json(rule);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

app.patch("/api/automation-rules/:id/toggle", (req: Request, res: Response) => {
  try {
    const parsed = z.object({ enabled: z.boolean() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    const rule = toggleAutomationRule(req.params.id, parsed.data.enabled);
    res.json(rule);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

app.delete("/api/automation-rules/:id", (req: Request, res: Response) => {
  try {
    deleteAutomationRule(req.params.id);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

const SAFE_COMMANDS_WHITELIST = [
  "npm test",
  "npm run lint",
  "npm run check:simulations",
  "npm run check:founder-labs",
  "npm run check:new-features-brief",
  "tsc --noEmit",
  "git status"
];

/** POST /api/exec — Execute whitelisted safe shell commands */
app.post("/api/exec", async (req: Request, res: Response) => {
  const { command } = req.body as { command?: string };
  if (!command?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'command' in request body." });
  }

  const normalizedCmd = command.trim();
  const isSafe = SAFE_COMMANDS_WHITELIST.includes(normalizedCmd);
  if (!isSafe) {
    return res.status(403).json({
      ok: false,
      error: `Access Denied: Lệnh '${command}' không nằm trong danh sách trắng bảo mật.`
    });
  }

  console.log(`[Assistant Daemon] Executing safe command: ${normalizedCmd}`);
  const { exec } = await import("child_process");
  exec(normalizedCmd, { cwd: getWorkspaceRoot() }, (error, stdout, stderr) => {
    const output = `${stdout || ""}${stderr || ""}`.trim();
    res.json({
      ok: error ? false : true,
      exitCode: error?.code ?? 0,
      output: output || "Lệnh thực thi xong không có output."
    });
  });
});

/** GET /api/audit/logs — Read audit logs from server */
app.get("/api/audit/logs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string ?? "100", 10);
    const logs = await readAuditEvents(limit);
    res.json({ ok: true, logs });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/audit/verify — Cryptographically verify audit log chain integrity */
app.post("/api/audit/verify", async (_req: Request, res: Response) => {
  try {
    const verification = await verifyAuditChain();
    res.json({ ok: true, ...verification });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Telegram Webhook
// ---------------------------------------------------------------------------

/** POST /webhook/telegram â€” Receive updates from Telegram */
app.post("/webhook/telegram", async (req: Request, res: Response) => {
  // Respond immediately (Telegram requires 200 within 1s)
  res.sendStatus(200);

  try {
    const handler = createTelegramHandler({ pendingSuggestions });
    await handler(req.body);
  } catch (err: any) {
    console.error("[Telegram Webhook]", err.message);
  }
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Assistant Daemon Error]", err);
  res.status(500).json({ ok: false, error: err.message });
});

// ---------------------------------------------------------------------------
// AI Fabric endpoints
// ---------------------------------------------------------------------------
app.post("/api/ai-fabric/dispatch", async (req: Request, res: Response) => {
  const { text, systemInstruction, domain, webPlatform, profileId, localFallback, filePath, task, agentRole } = (req.body || {}) as {
    text?: string; systemInstruction?: string; domain?: string; webPlatform?: string;
    profileId?: string; localFallback?: boolean; filePath?: string; task?: string; agentRole?: string;
  };
  if (!text?.trim()) return res.status(400).json({ ok: false, error: "Missing 'text' in request body." });
  try {
    const run = await dispatchTextThroughFabric(text, systemInstruction, { domain: domain as any, webPlatform, profileId, localFallback, filePath, task, agentRole: agentRole as any });
    res.json({ ok: true, run });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/ai-fabric/health", async (_req: Request, res: Response) => {
  try {
    const health = await checkFabricHealth();
    res.json({ ok: true, health });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Agent Control Plane endpoints
// ---------------------------------------------------------------------------
app.post("/api/control-plane/run", async (req: Request, res: Response) => {
  const opts = (req.body || {}) as AgentControlPlaneOptions;
  if (!opts.goal?.trim()) return res.status(400).json({ ok: false, error: "Missing 'goal' in request body." });
  try {
    const run = await executeControlPlaneRun(opts);
    res.json({ ok: true, run });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/control-plane/runs", async (_req: Request, res: Response) => {
  try {
    res.json({ ok: true, runs: listControlPlaneRuns(), metrics: getControlPlaneMetrics() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/control-plane/runs/:id", async (req: Request, res: Response) => {
  try {
    const run = getControlPlaneRun(req.params.id);
    if (!run) return res.status(404).json({ ok: false, error: "Control plane run not found." });
    res.json({ ok: true, run });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Robot Adapter Boundary endpoints (P2)
// ---------------------------------------------------------------------------
app.get("/api/robot-adapter/state", async (_req: Request, res: Response) => {
  try {
    res.json({ ok: true, state: getAdapterState() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/robot-adapter/command", async (req: Request, res: Response) => {
  try {
    const command = req.body as RobotCommand;
    if (!command.id) command.id = `cmd_${Date.now()}`;
    command.priority = command.priority || 'normal';
    const result = acceptRobotCommand(command);
    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});
app.post("/api/robot-adapter/emergency-stop", async (req: Request, res: Response) => {
  const { active } = (req.body || {}) as { active?: boolean };
  try {
    const state = setEmergencyStop(active !== false);
    res.json({ ok: true, state });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});
app.get("/api/robot-adapter/runbook", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit ?? 50);
  try {
    const summary = replayRunbook(limit);
    res.json({ ok: true, ...summary });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Browser Runbook endpoints (P2)
// ---------------------------------------------------------------------------
app.post("/api/browser-runbook/session/start", async (req: Request, res: Response) => {
  const { platform, prompt, profileId, profileName } = (req.body || {}) as {
    platform?: string; prompt?: string; profileId?: string; profileName?: string;
  };
  if (!platform || !prompt) return res.status(400).json({ ok: false, error: "Missing platform or prompt" });
  try {
    const session = await startBrowserSession(platform, prompt, profileId, profileName);
    res.json({ ok: true, session });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/browser-runbook/session/:id/step", async (req: Request, res: Response) => {
  const { action, success, detail, evidence, durationMs } = (req.body || {}) as {
    action?: string; success?: boolean; detail?: string; evidence?: any; durationMs?: number;
  };
  if (!action) return res.status(400).json({ ok: false, error: "Missing 'action'" });
  try {
    const step = addRunbookStep(req.params.id, action as BrowserRunbookAction, success ?? true, detail || '', evidence, durationMs ?? 0);
    if (!step) return res.status(404).json({ ok: false, error: "Session not found" });
    res.json({ ok: true, step });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/browser-runbook/session/:id/complete", async (req: Request, res: Response) => {
  const { success, modelUsed, error } = (req.body || {}) as { success?: boolean; modelUsed?: string; error?: string };
  try {
    const session = await completeBrowserSession(req.params.id, success ?? true, modelUsed, error);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });
    res.json({ ok: true, session });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/browser-runbook/history", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit ?? 50);
  try {
    const history = await getRunbookHistory(limit);
    res.json({ ok: true, sessions: history });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/browser-runbook/summary", async (_req: Request, res: Response) => {
  try {
    const summary = await getBrowserRunbookSummary();
    res.json({ ok: true, summary });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Agentic Loop endpoints (Phase 3)
// ---------------------------------------------------------------------------
app.post("/api/agentic-loop/run", async (req: Request, res: Response) => {
  const opts = (req.body || {}) as AgenticLoopOptions;
  if (!opts.goal?.trim()) return res.status(400).json({ ok: false, error: "Missing 'goal'." });
  try {
    const run = await runAgenticLoop(opts);
    res.json({ ok: true, run });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/agentic-loop/stop", async (req: Request, res: Response) => {
  const { runId, reason } = (req.body || {}) as { runId?: string; reason?: string };
  if (!runId) return res.status(400).json({ ok: false, error: "Missing 'runId'." });
  const ok = stopAgenticLoop(runId, reason);
  res.json({ ok, stopped: ok });
});
app.get("/api/agentic-loop/runs", async (_req: Request, res: Response) => {
  try {
    res.json({ ok: true, runs: listAgenticLoopRuns(), metrics: getAgenticLoopMetrics() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/agentic-loop/runs/:id", async (req: Request, res: Response) => {
  const run = getAgenticLoopRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "Loop run not found." });
  res.json({ ok: true, run });
});

// ---------------------------------------------------------------------------
// Compound Memory endpoints (Phase 3)
// ---------------------------------------------------------------------------
app.post("/api/memory/observe", async (req: Request, res: Response) => {
  const { domain, title, content, confidence, source, success } = (req.body || {}) as {
    domain?: string; title?: string; content?: string; confidence?: number;
    source?: string; success?: boolean;
  };
  if (!domain || !title || !content) return res.status(400).json({ ok: false, error: "Missing domain/title/content." });
  try {
    const record = await recordObservation(domain, title, content, confidence ?? 0.7, source || 'api', success ?? true);
    res.json({ ok: true, record });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/memory/search", async (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  if (!q) return res.status(400).json({ ok: false, error: "Missing 'q' query param." });
  try {
    const results = await searchMemory(q, {
      domain: req.query.domain as string || undefined,
      tiers: req.query.tiers ? (String(req.query.tiers).split(',') as any) : undefined,
      limit: Number(req.query.limit ?? 10),
    });
    res.json({ ok: true, results });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/memory/promote", async (req: Request, res: Response) => {
  const { shortTermId, curatedTitle, curatedContent } = (req.body || {}) as {
    shortTermId?: string; curatedTitle?: string; curatedContent?: string;
  };
  if (!shortTermId) return res.status(400).json({ ok: false, error: "Missing 'shortTermId'." });
  try {
    const ok = await promoteToLongTerm(shortTermId, curatedTitle, curatedContent);
    res.json({ ok, promoted: ok });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/memory/stats", async (_req: Request, res: Response) => {
  try {
    res.json({ ok: true, stats: await getCompoundMemoryStats() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/memory/clean", async (_req: Request, res: Response) => {
  try {
    const cleaned = await cleanExpiredShortTerm();
    res.json({ ok: true, cleaned });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Agentic RAG endpoints (Phase 4)
// ---------------------------------------------------------------------------
app.post("/api/rag/retrieve", async (req: Request, res: Response) => {
  const { query, context, domain, maxCycles } = (req.body || {}) as {
    query?: string; context?: string; domain?: string; maxCycles?: number;
  };
  if (!query?.trim()) return res.status(400).json({ ok: false, error: "Missing 'query'." });
  try {
    const result = await agenticRetrieve(query, context || '', { domain, maxCycles });
    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/rag/dispatch", async (req: Request, res: Response) => {
  const { query, systemInstruction, domain, webPlatform, profileId } = (req.body || {}) as {
    query?: string; systemInstruction?: string; domain?: string; webPlatform?: string; profileId?: string;
  };
  if (!query?.trim()) return res.status(400).json({ ok: false, error: "Missing 'query'." });
  try {
    const result = await dispatchWithRag(query, systemInstruction, { domain, webPlatform, profileId });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Prompt Optimizer endpoints (Phase 4)
// ---------------------------------------------------------------------------
app.post("/api/prompts/optimize", async (req: Request, res: Response) => {
  const { roleId, domain, currentPrompt } = (req.body || {}) as {
    roleId?: string; domain?: string; currentPrompt?: string;
  };
  if (!roleId || !domain || !currentPrompt) return res.status(400).json({ ok: false, error: "Missing roleId/domain/currentPrompt." });
  try {
    const suggestion = await analyzeAndOptimize(roleId, domain, currentPrompt);
    res.json({ ok: true, suggestion });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/prompts/versions", async (req: Request, res: Response) => {
  const { roleId, domain, content, note, metrics, version } = (req.body || {}) as any;
  if (!roleId || !domain || !content) return res.status(400).json({ ok: false, error: "Missing roleId/domain/content." });
  try {
    const saved = await savePromptVersion({ roleId, domain, content, note: note || '', version: version || 1, optimizedAt: new Date().toISOString(), metrics: metrics || { successRate: 0, averageLatencyMs: 0, sampleSize: 0 } });
    res.json({ ok: true, version: saved });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/prompts/versions", async (req: Request, res: Response) => {
  try {
    const versions = await listPromptVersions(req.query.roleId as string || undefined);
    res.json({ ok: true, versions });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Multi-Agent Orchestrator endpoints (Phase 5)
// ---------------------------------------------------------------------------
app.post("/api/multi-agent/run", async (req: Request, res: Response) => {
  const opts = (req.body || {}) as MultiAgentOptions;
  if (!opts.goal?.trim()) return res.status(400).json({ ok: false, error: "Missing 'goal'." });
  try {
    const plan = await orchestrateMultiAgent(opts);
    storePlan(plan);
    res.json({ ok: true, plan });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/multi-agent/plans", async (_req: Request, res: Response) => {
  try {
    res.json({ ok: true, plans: listPlans() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/multi-agent/plans/:id", async (req: Request, res: Response) => {
  const plan = getPlan(req.params.id);
  if (!plan) return res.status(404).json({ ok: false, error: "Plan not found." });
  res.json({ ok: true, plan });
});
app.get("/api/multi-agent/specs", async (_req: Request, res: Response) => {
  res.json({ ok: true, specs: getAgentSpecs() });
});

// ---------------------------------------------------------------------------
// Sandbox Code Executor endpoints (Phase 6)
// ---------------------------------------------------------------------------
app.post("/api/sandbox/session", async (req: Request, res: Response) => {
  const policy = (req.body || {}) as Partial<SandboxPolicy>;
  try {
    const session = createSandboxSession(policy);
    res.json({ ok: true, session });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/sandbox/execute", async (req: Request, res: Response) => {
  const { sessionId, command, approvalPhrase, cwd, env } = (req.body || {}) as any;
  if (!sessionId || !command) return res.status(400).json({ ok: false, error: "Missing sessionId/command." });
  try {
    const result = await executeInSandbox(sessionId, command, { approvalPhrase, cwd, env });
    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/sandbox/session/:id/complete", async (req: Request, res: Response) => {
  const session = await completeSandboxSession(req.params.id);
  if (!session) return res.status(404).json({ ok: false, error: "Session not found." });
  res.json({ ok: true, session });
});
app.get("/api/sandbox/sessions", async (_req: Request, res: Response) => {
  res.json({ ok: true, sessions: listSandboxSessions() });
});
app.post("/api/sandbox/test-repair", async (req: Request, res: Response) => {
  const { sessionId, testCommand, repairPrompt, maxAttempts } = (req.body || {}) as any;
  if (!sessionId || !testCommand || !repairPrompt) return res.status(400).json({ ok: false, error: "Missing params." });
  try {
    const result = await autoTestAndRepair(sessionId, testCommand, repairPrompt, maxAttempts ?? 3);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/company-os/swe-agent/docker-doctor", async (_req: Request, res: Response) => {
  try {
    const doctor = await runDockerDoctor();
    res.json({ ok: true, doctor });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Autonomous SWE Agent Loop endpoints
// ---------------------------------------------------------------------------
const sweAgentMissionSchema = z.object({
  id: z.string().trim().optional(),
  goalPrompt: z.string().trim().min(1),
  platform: z.string().trim().min(1),
  profileId: z.string().trim().optional(),
  testCommand: z.string().trim().min(1),
  targetFiles: z.array(z.string().trim().min(1)).min(1).max(10),
  maxAttempts: z.number().int().min(1).max(8).optional(),
  repoBaseBranch: z.string().trim().optional(),
  requireHumanApprovalBeforePush: z.boolean().optional(),
});

app.post("/api/company-os/swe-agent/mission", async (req: Request, res: Response) => {
  try {
    const config = sweAgentMissionSchema.parse(req.body || {});
    const mission = createMission(config);
    const result = await runMission(mission.id);
    res.json({ ok: true, mission: result });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get("/api/company-os/swe-agent/missions", async (req: Request, res: Response) => {
  const parsedLimit = Number(req.query.limit);
  const limit = Number.isFinite(parsedLimit) ? parsedLimit : 25;
  res.json({ ok: true, missions: listMissions(limit) });
});

app.get("/api/company-os/swe-agent/mission/:id", async (req: Request, res: Response) => {
  const mission = getMission(req.params.id);
  if (!mission) return res.status(404).json({ ok: false, error: "Mission not found." });
  res.json({ ok: true, mission });
});

app.post("/api/company-os/swe-agent/mission/:id/approve-push", async (req: Request, res: Response) => {
  try {
    const mission = await confirmMissionPush(req.params.id);
    res.json({ ok: true, mission });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post("/api/company-os/swe-agent/mission/:id/reject", async (req: Request, res: Response) => {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;
    const mission = await rejectMission(req.params.id, reason);
    res.json({ ok: true, mission });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Event-Driven Trigger endpoints (Phase 6)
// ---------------------------------------------------------------------------
app.get("/api/triggers/rules", async (_req: Request, res: Response) => {
  res.json({ ok: true, rules: listTriggerRules(), stats: getTriggerStats() });
});
app.post("/api/triggers/rules", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name || !input.type || !input.agentGoal) return res.status(400).json({ ok: false, error: "Missing name/type/agentGoal." });
  try {
    const rule = await createTriggerRule(input);
    res.json({ ok: true, rule });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.patch("/api/triggers/rules/:id", async (req: Request, res: Response) => {
  const rule = await updateTriggerRule(req.params.id, req.body);
  if (!rule) return res.status(404).json({ ok: false, error: "Rule not found." });
  res.json({ ok: true, rule });
});
app.delete("/api/triggers/rules/:id", async (_req: Request, res: Response) => {
  const ok = await deleteTriggerRule(_req.params.id);
  res.json({ ok, deleted: ok });
});
app.post("/api/triggers/fire", async (req: Request, res: Response) => {
  const { type, payload } = (req.body || {}) as { type?: string; payload?: any };
  if (!type) return res.status(400).json({ ok: false, error: "Missing type." });
  try {
    const event = await fireTrigger(type as TriggerType, payload || {});
    res.json({ ok: true, event });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/triggers/events", async (req: Request, res: Response) => {
  res.json({ ok: true, events: listTriggerEvents(Number(req.query.limit ?? 50)) });
});
app.post("/api/triggers/simulate/ci-failure", async (req: Request, res: Response) => {
  const { repo, errorLog } = (req.body || {}) as any;
  const event = await simulateCiFailure(repo, errorLog);
  res.json({ ok: true, event });
});
app.post("/api/triggers/simulate/file-change", async (req: Request, res: Response) => {
  const { file } = (req.body || {}) as any;
  if (!file) return res.status(400).json({ ok: false, error: "Missing file." });
  const event = await simulateFileChange(file);
  res.json({ ok: true, event });
});

// ---------------------------------------------------------------------------
// Observer Agent endpoints
// ---------------------------------------------------------------------------
app.get("/api/observer/health", async (_req: Request, res: Response) => {
  res.json({ ok: true, health: getObserverHealth() });
});
app.get("/api/observer/config", async (_req: Request, res: Response) => {
  res.json({ ok: true, config: getObserverConfig() });
});
app.post("/api/observer/start", async (req: Request, res: Response) => {
  const cfg = (req.body || {}) as any;
  startObserver({ ...cfg, enabled: true });
  res.json({ ok: true, config: getObserverConfig() });
});
app.post("/api/observer/stop", async (_req: Request, res: Response) => {
  stopObserver();
  res.json({ ok: true, stopped: true });
});
app.post("/api/observer/check", async (_req: Request, res: Response) => {
  try {
    const report = await runObserverCheck();
    res.json({ ok: true, report });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/observer/reports", async (req: Request, res: Response) => {
  const latest = getLatestReport();
  const recent = listRecentReports(Number(req.query.limit ?? 10));
  res.json({ ok: true, latest, recent });
});

// ---------------------------------------------------------------------------
// Cost & Observability endpoints
// ---------------------------------------------------------------------------
app.post("/api/cost/record", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.agent || !input.model) return res.status(400).json({ ok: false, error: "Missing agent/model." });
  try {
    const record = recordUsage(input);
    res.json({ ok: true, record });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/cost/snapshot", async (req: Request, res: Response) => {
  res.json({ ok: true, snapshot: getCostSnapshot(Number(req.query.days ?? 30)) });
});
app.get("/api/cost/daily", async (req: Request, res: Response) => {
  res.json({ ok: true, daily: getDailyCosts(Number(req.query.days ?? 7)) });
});
app.get("/api/cost/records", async (req: Request, res: Response) => {
  res.json({ ok: true, records: getRecords(Number(req.query.limit ?? 50)) });
});
app.get("/api/cost/pricing", async (_req: Request, res: Response) => {
  res.json({ ok: true, pricing: getModelPricing() });
});
app.post("/api/cost/budgets", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.agent || input.monthlyLimitUsd == null) return res.status(400).json({ ok: false, error: "Missing agent/monthlyLimitUsd." });
  try {
    const budget = setAgentBudget(input);
    res.json({ ok: true, budget });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/cost/budgets", async (_req: Request, res: Response) => {
  const snapshot = getCostSnapshot(30);
  res.json({ ok: true, budgets: snapshot.budgets });
});

// ---------------------------------------------------------------------------
// Agent Handoff endpoints
// ---------------------------------------------------------------------------
app.post("/api/handoff/transfer", async (req: Request, res: Response) => {
  const { fromRole, toRole, task, originalGoal, previousResult, reason, priority } = (req.body || {}) as any;
  if (!fromRole || !toRole || !task) return res.status(400).json({ ok: false, error: "Missing fromRole/toRole/task." });
  try {
    const packet = await handoffTask(fromRole, toRole, task, { originalGoal, previousResult, reason, priority });
    res.json({ ok: true, packet });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/handoff/list", async (_req: Request, res: Response) => {
  res.json({ ok: true, handoffs: listHandoffs() });
});
app.get("/api/handoff/agents", async (_req: Request, res: Response) => {
  res.json({ ok: true, agents: getAgentRegistry() });
});
app.post("/api/handoff/discussion", async (req: Request, res: Response) => {
  const { topic, participants, maxRounds } = (req.body || {}) as any;
  if (!topic || !participants?.length) return res.status(400).json({ ok: false, error: "Missing topic/participants." });
  try {
    const discussion = await startGroupDiscussion(topic, participants, maxRounds ?? 3);
    res.json({ ok: true, discussion });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/handoff/discussions", async (_req: Request, res: Response) => {
  res.json({ ok: true, discussions: listDiscussions() });
});

// ---------------------------------------------------------------------------
// Auto Memory Curator endpoints
// ---------------------------------------------------------------------------
app.post("/api/curator/run", async (_req: Request, res: Response) => {
  try {
    const run = await runCurator();
    res.json({ ok: true, run });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/curator/start", async (req: Request, res: Response) => {
  const { intervalMinutes } = (req.body || {}) as any;
  startAutoCurator(intervalMinutes ?? 60);
  res.json({ ok: true, running: true });
});
app.post("/api/curator/stop", async (_req: Request, res: Response) => {
  stopAutoCurator();
  res.json({ ok: true, stopped: true });
});
app.get("/api/curator/status", async (_req: Request, res: Response) => {
  res.json({ ok: true, running: isCuratorRunning(), lastRun: getLastCuratorRun() });
});

// ---------------------------------------------------------------------------
// Unified Search & Knowledge Graph endpoints
// ---------------------------------------------------------------------------
app.post("/api/search/unified", async (req: Request, res: Response) => {
  const { query, domain, filePath, maxResults, sources } = (req.body || {}) as any;
  if (!query?.trim()) return res.status(400).json({ ok: false, error: "Missing query." });
  try {
    const result = await searchEverything({ query, domain, filePath, maxResults, sources });
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/search/rag-context", async (req: Request, res: Response) => {
  const { query, domain, filePath, maxResults } = (req.body || {}) as any;
  if (!query?.trim()) return res.status(400).json({ ok: false, error: "Missing query." });
  try {
    const ctx = await searchWithRagContext(query, { domain, filePath, maxResults });
    res.json({ ok: true, ...ctx });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/knowledge/stats", async (_req: Request, res: Response) => {
  res.json({ ok: true, stats: getKnowledgeStats() });
});
app.post("/api/knowledge/graph", async (req: Request, res: Response) => {
  const { searchKnowledgeGraph } = require("./services/knowledgeGraph");
  const { query, maxResults } = (req.body || {}) as any;
  if (!query?.trim()) return res.status(400).json({ ok: false, error: "Missing query." });
  res.json({ ok: true, results: searchKnowledgeGraph(query, { maxResults }) });
});

// ---------------------------------------------------------------------------
// Model A/B Test endpoints
// ---------------------------------------------------------------------------
app.post("/api/ab-test/run", async (req: Request, res: Response) => {
  const { prompt, name, domain, models, criteria, blindMode } = (req.body || {}) as any;
  if (!prompt?.trim()) return res.status(400).json({ ok: false, error: "Missing prompt." });
  try {
    const run = await runABTest(prompt, { name, domain, models, criteria, blindMode });
    res.json({ ok: true, run });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/ab-test/runs", async (_req: Request, res: Response) => {
  res.json({ ok: true, runs: listABTestRuns() });
});
app.get("/api/ab-test/runs/:id", async (req: Request, res: Response) => {
  const run = getABTestRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "Run not found." });
  res.json({ ok: true, run });
});
app.get("/api/ab-test/config", async (_req: Request, res: Response) => {
  res.json({ ok: true, ...getDefaultConfig() });
});

// ---------------------------------------------------------------------------
// Feedback endpoints
// ---------------------------------------------------------------------------
app.post("/api/feedback/submit", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.agent || !input.rating) return res.status(400).json({ ok: false, error: "Missing agent/rating." });
  try {
    const record = submitFeedback(input);
    res.json({ ok: true, record });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/feedback/stats", async (req: Request, res: Response) => {
  res.json({ ok: true, stats: getFeedbackStats(req.query.agent as string, Number(req.query.days ?? 30)) });
});
app.get("/api/feedback/list", async (req: Request, res: Response) => {
  res.json({ ok: true, records: listFeedback(Number(req.query.limit ?? 50)) });
});
app.get("/api/feedback/suggestions", async (req: Request, res: Response) => {
  const agent = req.query.agent as string || 'fabric';
  res.json({ ok: true, suggestions: generateImprovementSuggestions(agent) });
});
app.post("/api/feedback/resolve", async (req: Request, res: Response) => {
  const { id, action } = (req.body || {}) as any;
  if (!id || !action) return res.status(400).json({ ok: false, error: "Missing id/action." });
  const ok = resolveFeedback(id, action);
  res.json({ ok, resolved: ok });
});

// ---------------------------------------------------------------------------
// Auto Doc Generator endpoints
// ---------------------------------------------------------------------------
app.post("/api/docs/scan", async (req: Request, res: Response) => {
  const { pattern, maxFiles } = (req.body || {}) as any;
  try {
    const targets = await scanTargets({ pattern, maxFiles });
    res.json({ ok: true, targets });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/docs/generate", async (req: Request, res: Response) => {
  const { pattern, maxFiles, dryRun } = (req.body || {}) as any;
  try {
    const run = await generateAllDocs({ pattern, maxFiles, dryRun });
    res.json({ ok: true, run });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/docs/status", async (_req: Request, res: Response) => {
  res.json({ ok: true, lastRun: getLastDocRun(), generated: listGeneratedDocs() });
});

// ---------------------------------------------------------------------------
// Agent Analytics endpoints
// ---------------------------------------------------------------------------
app.get("/api/analytics/report", async (req: Request, res: Response) => {
  try {
    const report = await generateAnalyticsReport(Number(req.query.days ?? 30));
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// AI Security Auditor endpoints
// ---------------------------------------------------------------------------
app.post("/api/security/audit", async (req: Request, res: Response) => {
  const { filePath } = (req.body || {}) as any;
  if (!filePath) return res.status(400).json({ ok: false, error: "Missing filePath." });
  try {
    const { audit, summary } = await auditWithSummary(filePath);
    res.json({ ok: true, audit, summary });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/security/audit-batch", async (req: Request, res: Response) => {
  const { pattern, maxFiles } = (req.body || {}) as any;
  if (!pattern) return res.status(400).json({ ok: false, error: "Missing pattern." });
  try {
    const results = await auditMultipleFiles(pattern, maxFiles ?? 5);
    res.json({ ok: true, results });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Model Benchmark endpoints
// ---------------------------------------------------------------------------
app.get("/api/benchmark/tasks", async (_req: Request, res: Response) => {
  res.json({ ok: true, tasks: getStandardTasks() });
});
app.post("/api/benchmark/run", async (req: Request, res: Response) => {
  const { name, tasks, models, maxTasks, dryRun } = (req.body || {}) as any;
  try {
    const run = await runBenchmark({ name, tasks, models, maxTasks, dryRun });
    res.json({ ok: true, run });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/benchmark/runs", async (_req: Request, res: Response) => {
  res.json({ ok: true, runs: getBenchmarkRuns() });
});
app.get("/api/benchmark/runs/:id", async (req: Request, res: Response) => {
  const run = getBenchmarkRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "Run not found." });
  res.json({ ok: true, run });
});

// ---------------------------------------------------------------------------
// Conversation Threads endpoints
// ---------------------------------------------------------------------------
app.post("/api/threads", async (req: Request, res: Response) => {
  const { title, domain, agent, tags } = (req.body || {}) as any;
  if (!title) return res.status(400).json({ ok: false, error: "Missing title." });
  const thread = createThread(title, { domain, agent, tags });
  res.json({ ok: true, thread });
});
app.post("/api/threads/:id/turn", async (req: Request, res: Response) => {
  const { role, content, metadata } = (req.body || {}) as any;
  if (!role || !content) return res.status(400).json({ ok: false, error: "Missing role/content." });
  const turn = addTurn(req.params.id, role, content, metadata);
  if (!turn) return res.status(404).json({ ok: false, error: "Thread not found or archived." });
  res.json({ ok: true, turn });
});
app.get("/api/threads", async (req: Request, res: Response) => {
  res.json({ ok: true, threads: listThreads({ agent: req.query.agent as string, domain: req.query.domain as string, limit: Number(req.query.limit ?? 50) }), stats: getThreadStats() });
});
app.get("/api/threads/:id", async (req: Request, res: Response) => {
  const thread = getThread(req.params.id);
  if (!thread) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, thread });
});
app.post("/api/threads/:id/archive", async (req: Request, res: Response) => {
  const ok = archiveThread(req.params.id);
  res.json({ ok, archived: ok });
});
app.post("/api/threads/:id/summarize", async (req: Request, res: Response) => {
  const summary = await summarizeThread(req.params.id);
  res.json({ ok: true, summary });
});
app.post("/api/threads/:id/continue", async (req: Request, res: Response) => {
  const thread = continueThread(req.params.id);
  if (!thread) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, thread });
});
app.get("/api/threads/:id/export", async (req: Request, res: Response) => {
  const format = (req.query.format as 'json' | 'markdown' | 'text') || 'markdown';
  const exp = exportThread(req.params.id, format);
  if (!exp) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, ...exp });
});
app.get("/api/threads/search", async (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  res.json({ ok: true, threads: findRelevantThreads(q) });
});

// ---------------------------------------------------------------------------
// Self-Healing endpoints
// ---------------------------------------------------------------------------
app.get("/api/healing/health", async (_req: Request, res: Response) => {
  res.json({ ok: true, components: getAllHealth(), stats: getHealingStats() });
});
app.post("/api/healing/report", async (req: Request, res: Response) => {
  const { component, healthy, detail } = (req.body || {}) as any;
  if (!component) return res.status(400).json({ ok: false, error: "Missing component." });
  reportHealth(component, healthy, detail);
  res.json({ ok: true, health: getComponentHealth(component) });
});
app.post("/api/healing/trigger", async (req: Request, res: Response) => {
  const { component, reason } = (req.body || {}) as any;
  if (!component) return res.status(400).json({ ok: false, error: "Missing component." });
  const action = await triggerHealing(component, reason || 'Manual trigger');
  res.json({ ok: true, action });
});
app.get("/api/healing/log", async (req: Request, res: Response) => {
  res.json({ ok: true, log: getHealingLog(Number(req.query.limit ?? 50)) });
});

// ---------------------------------------------------------------------------
// Cross-Agent Learning endpoints
// ---------------------------------------------------------------------------
app.post("/api/learning/share", async (req: Request, res: Response) => {
  const { sourceAgent, domain, kind, title, content, confidence, tags } = (req.body || {}) as any;
  if (!sourceAgent || !domain || !title || !content) return res.status(400).json({ ok: false, error: "Missing fields." });
  try {
    const event = await shareLearning(sourceAgent, domain, kind || 'insight', title, content, confidence, tags);
    res.json({ ok: true, event });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/learning/report", async (req: Request, res: Response) => {
  const agents = (req.query.agents as string || 'fabric,agentic-loop,multi-agent').split(',');
  const report = await generateLearningReport(agents, req.query.domain as string);
  res.json({ ok: true, report });
});
app.get("/api/learning/events", async (_req: Request, res: Response) => {
  res.json({ ok: true, events: listLearningEvents() });
});
app.post("/api/learning/recommend-agent", async (req: Request, res: Response) => {
  const { task, domain, agents } = (req.body || {}) as any;
  if (!task || !domain) return res.status(400).json({ ok: false, error: "Missing task/domain." });
  const recommendation = await recommendBestAgent(task, domain, agents || ['code', 'test', 'review', 'general']);
  res.json({ ok: true, recommendation });
});

// ---------------------------------------------------------------------------
// Skill Registry endpoints
// ---------------------------------------------------------------------------
app.post("/api/skills", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name || !input.description || !input.prompt) return res.status(400).json({ ok: false, error: "Missing name/description/prompt." });
  const skill = registerSkill(input);
  res.json({ ok: true, skill });
});
app.get("/api/skills", async (req: Request, res: Response) => {
  res.json({ ok: true, skills: listSkills({ category: req.query.category as any, tags: req.query.tags ? (req.query.tags as string).split(',') : undefined }), stats: getSkillStats() });
});
app.get("/api/skills/:id", async (req: Request, res: Response) => {
  const skill = getSkill(req.params.id);
  if (!skill) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, skill });
});
app.post("/api/skills/recommend", async (req: Request, res: Response) => {
  const { task, domain } = (req.body || {}) as any;
  if (!task) return res.status(400).json({ ok: false, error: "Missing task." });
  res.json({ ok: true, recommendations: recommendSkills(task, domain || 'general') });
});
app.post("/api/skills/:id/use", async (req: Request, res: Response) => {
  const { success, latencyMs } = (req.body || {}) as any;
  recordSkillUsage(req.params.id, success ?? true, latencyMs ?? 0);
  res.json({ ok: true });
});
app.post("/api/skills/:id/rate", async (req: Request, res: Response) => {
  const { rating } = (req.body || {}) as any;
  const ok = rateSkill(req.params.id, rating);
  res.json({ ok, rated: ok });
});
app.post("/api/skills/learn", async (req: Request, res: Response) => {
  const { memoryId } = (req.body || {}) as any;
  if (!memoryId) return res.status(400).json({ ok: false, error: "Missing memoryId." });
  const skill = await learnSkillFromMemory(memoryId);
  res.json({ ok: true, skill });
});

// ---------------------------------------------------------------------------
// Prompt Chain Composer endpoints
// ---------------------------------------------------------------------------
app.post("/api/chains", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name) return res.status(400).json({ ok: false, error: "Missing name." });
  const chain = createChain(input);
  res.json({ ok: true, chain });
});
app.get("/api/chains", async (_req: Request, res: Response) => {
  res.json({ ok: true, chains: listChains() });
});
app.get("/api/chains/:id", async (req: Request, res: Response) => {
  const chain = getChain(req.params.id);
  if (!chain) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, chain });
});
app.delete("/api/chains/:id", async (_req: Request, res: Response) => {
  const ok = deleteChain(_req.params.id);
  res.json({ ok, deleted: ok });
});
app.post("/api/chains/:id/nodes", async (req: Request, res: Response) => {
  const node = addNode(req.params.id, req.body);
  if (!node) return res.status(404).json({ ok: false, error: "Chain not found." });
  res.json({ ok: true, node });
});
app.patch("/api/chains/:id/nodes/:nodeId", async (req: Request, res: Response) => {
  const ok = updateNode(req.params.id, req.params.nodeId, req.body);
  res.json({ ok, updated: ok });
});
app.delete("/api/chains/:id/nodes/:nodeId", async (_req: Request, res: Response) => {
  const ok = deleteNode(_req.params.id, _req.params.nodeId);
  res.json({ ok, deleted: ok });
});
app.post("/api/chains/:id/edges", async (req: Request, res: Response) => {
  const { from, to, label } = (req.body || {}) as any;
  if (!from || !to) return res.status(400).json({ ok: false, error: "Missing from/to." });
  const ok = addEdge(req.params.id, from, to, label);
  res.json({ ok, added: ok });
});
app.post("/api/chains/:id/execute", async (req: Request, res: Response) => {
  const { input } = (req.body || {}) as any;
  if (!input?.trim()) return res.status(400).json({ ok: false, error: "Missing input." });
  try {
    const run = await executeChain(req.params.id, input);
    res.json({ ok: true, run });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/chain-runs", async (_req: Request, res: Response) => {
  res.json({ ok: true, runs: listChainRuns() });
});
app.get("/api/chain-runs/:id", async (req: Request, res: Response) => {
  const run = getChainRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, run });
});

// ---------------------------------------------------------------------------
// AI Strategy Engine endpoints
// ---------------------------------------------------------------------------
app.post("/api/strategy/analyze", async (req: Request, res: Response) => {
  const { query } = (req.body || {}) as any;
  if (!query?.trim()) return res.status(400).json({ ok: false, error: "Missing query." });
  try {
    const analysis = await analyzeStrategy(query);
    res.json({ ok: true, analysis });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Workflow Scheduler endpoints
// ---------------------------------------------------------------------------
app.post("/api/workflows", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name) return res.status(400).json({ ok: false, error: "Missing name." });
  const wf = createWorkflow(input);
  res.json({ ok: true, workflow: wf });
});
app.get("/api/workflows", async (_req: Request, res: Response) => {
  res.json({ ok: true, workflows: listWorkflows(), stats: getWorkflowStats() });
});
app.get("/api/workflows/:id", async (req: Request, res: Response) => {
  const wf = getWorkflow(req.params.id);
  if (!wf) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, workflow: wf });
});
app.delete("/api/workflows/:id", async (_req: Request, res: Response) => {
  const ok = deleteWorkflow(_req.params.id);
  res.json({ ok, deleted: ok });
});
app.patch("/api/workflows/:id/toggle", async (req: Request, res: Response) => {
  const enabled = req.body?.enabled !== false;
  const ok = toggleWorkflow(req.params.id, enabled);
  res.json({ ok, toggled: ok });
});
app.post("/api/workflows/:id/steps", async (req: Request, res: Response) => {
  const step = addStep(req.params.id, req.body);
  if (!step) return res.status(404).json({ ok: false, error: "Workflow not found." });
  res.json({ ok: true, step });
});
app.patch("/api/workflows/:id/steps/:stepId", async (req: Request, res: Response) => {
  const ok = updateStep(req.params.id, req.params.stepId, req.body);
  res.json({ ok, updated: ok });
});
app.delete("/api/workflows/:id/steps/:stepId", async (_req: Request, res: Response) => {
  const ok = deleteStep(_req.params.id, _req.params.stepId);
  res.json({ ok, deleted: ok });
});
app.post("/api/workflows/:id/execute", async (req: Request, res: Response) => {
  try {
    const exec = await executeWorkflow(req.params.id, req.body?.trigger || 'manual');
    res.json({ ok: true, execution: exec });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/workflow-executions", async (req: Request, res: Response) => {
  res.json({ ok: true, executions: listExecutions(Number(req.query.limit ?? 30)) });
});
app.get("/api/workflow-executions/:id", async (req: Request, res: Response) => {
  const exec = getExecution(req.params.id);
  if (!exec) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, execution: exec });
});

// ---------------------------------------------------------------------------
// Agent Voting System endpoints
// ---------------------------------------------------------------------------
app.get("/api/voting/voters", async (_req: Request, res: Response) => {
  res.json({ ok: true, voters: getDefaultVoters() });
});
app.post("/api/voting/run", async (req: Request, res: Response) => {
  const { task, domain, voters, strategy } = (req.body || {}) as any;
  if (!task) return res.status(400).json({ ok: false, error: "Missing task." });
  try {
    const session = await runVotingSession(task, { domain, voters, strategy });
    res.json({ ok: true, session });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/voting/sessions", async (_req: Request, res: Response) => {
  res.json({ ok: true, sessions: listVotingSessions() });
});
app.get("/api/voting/sessions/:id", async (req: Request, res: Response) => {
  const session = getVotingSession(req.params.id);
  if (!session) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, session });
});

// ---------------------------------------------------------------------------
// Code Refactoring Engine endpoints
// ---------------------------------------------------------------------------
app.post("/api/refactor/analyze", async (req: Request, res: Response) => {
  const { filePath } = (req.body || {}) as any;
  if (!filePath) return res.status(400).json({ ok: false, error: "Missing filePath." });
  try {
    const report = await analyzeFileForRefactoring(filePath);
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/refactor/scan", async (req: Request, res: Response) => {
  const { pattern, maxFiles } = (req.body || {}) as any;
  try {
    const reports = await scanDirectoryForRefactoring(pattern || 'server/services/*.ts', maxFiles ?? 3);
    res.json({ ok: true, reports });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Webhook Integration Hub endpoints
// ---------------------------------------------------------------------------
app.post("/api/webhooks/receive", async (req: Request, res: Response) => {
  const { source, event, payload } = (req.body || {}) as any;
  if (!source || !event) return res.status(400).json({ ok: false, error: "Missing source/event." });
  try {
    const webhookEvent = await receiveWebhook(source, event, payload || {});
    res.json({ ok: true, event: webhookEvent });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/webhooks/rules", async (_req: Request, res: Response) => {
  res.json({ ok: true, rules: listRules(), stats: getWebhookStats() });
});
app.post("/api/webhooks/rules", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name || !input.source || !input.eventFilter || !input.goalTemplate) return res.status(400).json({ ok: false, error: "Missing fields." });
  try { res.json({ ok: true, rule: createRule(input) }); }
  catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.patch("/api/webhooks/rules/:id", async (req: Request, res: Response) => {
  const rule = updateRule(req.params.id, req.body);
  if (!rule) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, rule });
});
app.delete("/api/webhooks/rules/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteWebhookRule(_req.params.id) });
});
app.get("/api/webhooks/events", async (req: Request, res: Response) => {
  res.json({ ok: true, events: listEvents(Number(req.query.limit ?? 50)) });
});
app.post("/api/webhooks/simulate/github-pr", async (req: Request, res: Response) => {
  const { repo, pr, title } = (req.body || {}) as any;
  if (!repo || !pr || !title) return res.status(400).json({ ok: false, error: "Missing repo/pr/title." });
  try { const event = await simulateGitHubPR(repo, pr, title); res.json({ ok: true, event }); }
  catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/webhooks/simulate/slack", async (req: Request, res: Response) => {
  const { command, text } = (req.body || {}) as any;
  if (!command || !text) return res.status(400).json({ ok: false, error: "Missing command/text." });
  try { const event = await simulateSlackCommand(command, text); res.json({ ok: true, event }); }
  catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Tool-Use Router endpoints
// ---------------------------------------------------------------------------
app.get("/api/tools", async (_req: Request, res: Response) => {
  res.json({ ok: true, tools: getToolDefinitions().map(t => ({ name: t.name, description: t.description, category: t.category, parameters: t.parameters })) });
});
app.post("/api/tools/execute", async (req: Request, res: Response) => {
  const { task, domain, tools, maxToolCalls, requireConfirmFor } = (req.body || {}) as any;
  if (!task) return res.status(400).json({ ok: false, error: "Missing task." });
  try {
    const session = await executeWithTools(task, { domain, tools, maxToolCalls, requireConfirmFor });
    res.json({ ok: true, session });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Semantic Intent Classifier endpoints
// ---------------------------------------------------------------------------
app.post("/api/intent/classify", async (req: Request, res: Response) => {
  const { query, useAI } = (req.body || {}) as any;
  if (!query?.trim()) return res.status(400).json({ ok: false, error: "Missing query." });
  const intent = useAI === true ? await classifyIntentSemantic(query) : classifyIntent(query);
  const routing = routeIntent(intent);
  res.json({ ok: true, intent, routing });
});

// ---------------------------------------------------------------------------
// Agent Swarm endpoints
// ---------------------------------------------------------------------------
app.get("/api/swarm/agents", async (_req: Request, res: Response) => {
  res.json({ ok: true, agents: getDefaultSwarm() });
});
app.post("/api/swarm/launch", async (req: Request, res: Response) => {
  const { goal, domain, agents, maxAgents } = (req.body || {}) as any;
  if (!goal?.trim()) return res.status(400).json({ ok: false, error: "Missing goal." });
  try {
    const mission = await launchSwarm(goal, { domain, agents, maxAgents });
    res.json({ ok: true, mission });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/swarm/missions", async (_req: Request, res: Response) => {
  res.json({ ok: true, missions: listSwarmMissions() });
});
app.get("/api/swarm/missions/:id", async (req: Request, res: Response) => {
  const mission = getSwarmMission(req.params.id);
  if (!mission) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, mission });
});

// ---------------------------------------------------------------------------
// AI Output Validator endpoints
// ---------------------------------------------------------------------------
app.post("/api/validate", async (req: Request, res: Response) => {
  const { input, output, strictMode, filePath } = (req.body || {}) as any;
  if (!output?.trim() && !filePath) return res.status(400).json({ ok: false, error: "Missing output or filePath." });
  try {
    const result = filePath
      ? validateFileOutput(input || '', filePath, { strictMode })
      : validateAIOutput(input || '', output, { strictMode });
    res.json({ ok: true, result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/validate/sanitize", async (req: Request, res: Response) => {
  const { output } = (req.body || {}) as any;
  if (!output) return res.status(400).json({ ok: false, error: "Missing output." });
  res.json({ ok: true, sanitized: sanitizeOutput(output) });
});
app.post("/api/validate/autofix", async (req: Request, res: Response) => {
  const { output } = (req.body || {}) as any;
  if (!output) return res.status(400).json({ ok: false, error: "Missing output." });
  res.json({ ok: true, fixed: autoFix(output) });
});
app.get("/api/validate/rules", async (_req: Request, res: Response) => {
  res.json({ ok: true, rules: getValidationRules() });
});

// ---------------------------------------------------------------------------
// AI Decision Explainability endpoints
// ---------------------------------------------------------------------------
app.post("/api/explain/start", async (req: Request, res: Response) => {
  const { sessionId, task } = (req.body || {}) as any;
  if (!task) return res.status(400).json({ ok: false, error: "Missing task." });
  const trace = startTrace(sessionId, task);
  res.json({ ok: true, trace });
});
app.post("/api/explain/decision", async (req: Request, res: Response) => {
  const { sessionId, type, input, decision, rejected, evidence, parentId } = (req.body || {}) as any;
  if (!sessionId || !type || !decision) return res.status(400).json({ ok: false, error: "Missing fields." });
  const node = recordDecision(sessionId, type, input || {}, decision, rejected || [], evidence || {}, parentId);
  res.json({ ok: true, node });
});
app.post("/api/explain/complete", async (req: Request, res: Response) => {
  const { sessionId } = (req.body || {}) as any;
  if (!sessionId) return res.status(400).json({ ok: false, error: "Missing sessionId." });
  const trace = completeTrace(sessionId);
  if (!trace) return res.status(404).json({ ok: false, error: "Session not found." });
  res.json({ ok: true, trace });
});
app.get("/api/explain/traces", async (_req: Request, res: Response) => {
  res.json({ ok: true, traces: listTraces(), stats: getDecisionStats() });
});
app.get("/api/explain/traces/:id", async (req: Request, res: Response) => {
  const trace = getTrace(req.params.id);
  if (!trace) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, trace, tree: getTraceTree(req.params.id) });
});

// ---------------------------------------------------------------------------
// Fine-Tuning Data Collector endpoints
// ---------------------------------------------------------------------------
app.post("/api/finetune/collect", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.userPrompt || !input.assistantResponse) return res.status(400).json({ ok: false, error: "Missing userPrompt/assistantResponse." });
  const pair = collectTrainingPair(input);
  res.json({ ok: true, pair });
});
app.post("/api/finetune/collect-from-feedback", async (_req: Request, res: Response) => {
  const count = await collectFromFeedback('good');
  res.json({ ok: true, collected: count });
});
app.post("/api/finetune/collect-from-memory", async (req: Request, res: Response) => {
  const count = await collectFromMemory(req.body?.kind as any, req.body?.limit);
  res.json({ ok: true, collected: count });
});
app.get("/api/finetune/pairs", async (req: Request, res: Response) => {
  res.json({ ok: true, pairs: listPairs({ domain: req.query.domain as string, quality: req.query.quality as any }), stats: getPairStats() });
});
app.post("/api/finetune/datasets", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name) return res.status(400).json({ ok: false, error: "Missing name." });
  const dataset = createDataset(input.name, input);
  res.json({ ok: true, dataset });
});
app.get("/api/finetune/datasets", async (_req: Request, res: Response) => {
  res.json({ ok: true, datasets: listDatasets() });
});
app.get("/api/finetune/datasets/:id", async (req: Request, res: Response) => {
  const dataset = getDataset(req.params.id);
  if (!dataset) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, dataset });
});
app.get("/api/finetune/datasets/:id/export", async (req: Request, res: Response) => {
  const dataset = getDataset(req.params.id);
  if (!dataset) return res.status(404).json({ ok: false, error: "Not found." });
  const format = (req.query.format as any) || dataset.format;
  const exported = exportDataset(req.params.id, format);
  res.json({ ok: true, format, data: exported, totalLines: exported.split('\n').length });
});

// ---------------------------------------------------------------------------
// AI System Telemetry endpoints
// ---------------------------------------------------------------------------
app.post("/api/telemetry/record", async (req: Request, res: Response) => {
  const { latencyMs, component, success, tokens, errorType } = (req.body || {}) as any;
  recordMetric(latencyMs || 0, component || 'unknown', success !== false, tokens || 0, errorType);
  res.json({ ok: true });
});
app.post("/api/telemetry/capture", async (_req: Request, res: Response) => {
  try {
    const snapshot = await captureTelemetry();
    res.json({ ok: true, snapshot });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/telemetry/latest", async (_req: Request, res: Response) => {
  const snapshot = getLatestTelemetry();
  res.json({ ok: true, snapshot: snapshot || null });
});
app.get("/api/telemetry/history", async (req: Request, res: Response) => {
  res.json({ ok: true, snapshots: getTelemetryHistory(Number(req.query.limit ?? 20)) });
});
app.get("/api/telemetry/metrics", async (_req: Request, res: Response) => {
  res.json({ ok: true, metrics: getMetricsBuffer().slice(0, 100) });
});
app.post("/api/telemetry/clear", async (_req: Request, res: Response) => {
  clearMetrics();
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Multi-Modal Context endpoints
// ---------------------------------------------------------------------------
app.post("/api/multimodal/context", async (req: Request, res: Response) => {
  const { task, filePaths } = (req.body || {}) as any;
  if (!task || !filePaths?.length) return res.status(400).json({ ok: false, error: "Missing task/filePaths." });
  const ctx = buildMultiModalContext(task, filePaths);
  res.json({ ok: true, context: ctx });
});
app.get("/api/multimodal/context/:id", async (req: Request, res: Response) => {
  const ctx = getContext(req.params.id);
  if (!ctx) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, context: ctx });
});
app.get("/api/multimodal/formats", async (_req: Request, res: Response) => {
  res.json({ ok: true, formats: getSupportedFormats() });
});
app.post("/api/multimodal/scan", async (req: Request, res: Response) => {
  const { dirPath } = (req.body || {}) as any;
  if (!dirPath) return res.status(400).json({ ok: false, error: "Missing dirPath." });
  const attachments = scanDirectoryForAttachments(dirPath);
  res.json({ ok: true, attachments });
});
app.post("/api/multimodal/extract", async (req: Request, res: Response) => {
  const { filePath } = (req.body || {}) as any;
  if (!filePath) return res.status(400).json({ ok: false, error: "Missing filePath." });
  const att = registerAttachment(filePath);
  if (!att) return res.status(404).json({ ok: false, error: "File not found." });
  const extraction = extractContext(att);
  res.json({ ok: true, extraction });
});

// ---------------------------------------------------------------------------
// RPA Engine endpoints
// ---------------------------------------------------------------------------
app.post("/api/rpa/scripts", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name) return res.status(400).json({ ok: false, error: "Missing name." });
  const script = createScript(input);
  res.json({ ok: true, script });
});
app.get("/api/rpa/scripts", async (_req: Request, res: Response) => {
  res.json({ ok: true, scripts: listRPAScripts(), stats: getRPAStats() });
});
app.get("/api/rpa/scripts/:id", async (req: Request, res: Response) => {
  const script = getScript(req.params.id);
  if (!script) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, script });
});
app.delete("/api/rpa/scripts/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteScript(_req.params.id) });
});
app.post("/api/rpa/scripts/:id/actions", async (req: Request, res: Response) => {
  const action = addAction(req.params.id, req.body);
  if (!action) return res.status(404).json({ ok: false, error: "Script not found." });
  res.json({ ok: true, action });
});
app.post("/api/rpa/scripts/:id/execute", async (req: Request, res: Response) => {
  try {
    const exec = await executeRPAScript(req.params.id, req.body?.trigger || 'manual');
    res.json({ ok: true, execution: exec });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/rpa/executions", async (_req: Request, res: Response) => {
  res.json({ ok: true, executions: listRPAExecutions() });
});
app.get("/api/rpa/executions/:id", async (req: Request, res: Response) => {
  const exec = getRPAExecution(req.params.id);
  if (!exec) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, execution: exec });
});

// ---------------------------------------------------------------------------
// Auto-Remediation endpoints
// ---------------------------------------------------------------------------
app.post("/api/remediate", async (req: Request, res: Response) => {
  const { target, errorDescription, trigger, autoApply } = (req.body || {}) as any;
  if (!target || !errorDescription) return res.status(400).json({ ok: false, error: "Missing target/errorDescription." });
  try {
    const run = await autoRemediate(target, errorDescription, { trigger: trigger || 'manual', autoApply: autoApply !== false });
    res.json({ ok: true, run });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/remediate/runs", async (_req: Request, res: Response) => {
  res.json({ ok: true, runs: listRemediationRuns() });
});
app.get("/api/remediate/runs/:id", async (req: Request, res: Response) => {
  const run = getRemediationRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, run });
});

// ---------------------------------------------------------------------------
// Smart File Watcher endpoints
// ---------------------------------------------------------------------------
app.post("/api/watcher/rules", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name || !input.watchPath) return res.status(400).json({ ok: false, error: "Missing name/watchPath." });
  const rule = createWatchRule(input);
  res.json({ ok: true, rule });
});
app.get("/api/watcher/rules", async (_req: Request, res: Response) => {
  res.json({ ok: true, rules: listWatchRules(), stats: getWatchStats() });
});
app.get("/api/watcher/rules/:id", async (req: Request, res: Response) => {
  const rule = getWatchRule(req.params.id);
  if (!rule) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, rule });
});
app.delete("/api/watcher/rules/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteWatchRule2(_req.params.id) });
});
app.patch("/api/watcher/rules/:id/toggle", async (req: Request, res: Response) => {
  res.json({ ok: true, toggled: toggleWatchRule(req.params.id, req.body?.enabled !== false) });
});
app.get("/api/watcher/events", async (_req: Request, res: Response) => {
  res.json({ ok: true, events: listWatchEvents() });
});

// ---------------------------------------------------------------------------
// Scheduled Report Generator endpoints
// ---------------------------------------------------------------------------
app.post("/api/reports/schedules", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name) return res.status(400).json({ ok: false, error: "Missing name." });
  const schedule = createReportSchedule(input);
  res.json({ ok: true, schedule });
});
app.get("/api/reports/schedules", async (_req: Request, res: Response) => {
  res.json({ ok: true, schedules: listReportSchedules() });
});
app.get("/api/reports/schedules/:id", async (req: Request, res: Response) => {
  const schedule = getReportSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, schedule });
});
app.delete("/api/reports/schedules/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteReportSchedule(_req.params.id) });
});
app.post("/api/reports/schedules/:id/generate", async (req: Request, res: Response) => {
  try {
    const report = await generateReport(req.params.id);
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/reports/generated", async (_req: Request, res: Response) => {
  res.json({ ok: true, reports: listGeneratedReports() });
});
app.get("/api/reports/generated/:id", async (req: Request, res: Response) => {
  const report = getGeneratedReport(req.params.id);
  if (!report) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, report });
});
app.get("/api/reports/generated/:id/content", async (req: Request, res: Response) => {
  const content = getReportContent(req.params.id);
  if (!content) return res.status(404).json({ ok: false, error: "Not found." });
  res.type('text/markdown').send(content);
});

// ---------------------------------------------------------------------------
// Background Job Queue endpoints
// ---------------------------------------------------------------------------
app.post("/api/jobs", async (req: Request, res: Response) => {
  const { type, payload, priority, maxRetries } = (req.body || {}) as any;
  if (!type || !payload) return res.status(400).json({ ok: false, error: "Missing type/payload." });
  const job = enqueue(type, payload, { priority, maxRetries });
  res.json({ ok: true, job });
});
app.get("/api/jobs", async (req: Request, res: Response) => {
  res.json({ ok: true, jobs: listJobs({ status: req.query.status as any, type: req.query.type as any }), stats: getQueueStats() });
});
app.get("/api/jobs/:id", async (req: Request, res: Response) => {
  const job = getQueueJob(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, job });
});
app.post("/api/jobs/:id/retry", async (req: Request, res: Response) => {
  res.json({ ok: true, retried: retryJob(req.params.id) });
});
app.post("/api/jobs/:id/purge", async (_req: Request, res: Response) => {
  res.json({ ok: true, purged: purgeJob(_req.params.id) });
});
app.post("/api/jobs/dead-letter/retry-all", async (_req: Request, res: Response) => {
  const count = retryDeadLetter();
  res.json({ ok: true, retried: count });
});

// ---------------------------------------------------------------------------
// Robot Script Generator endpoints
// ---------------------------------------------------------------------------
app.post("/api/robot/generate", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.description) return res.status(400).json({ ok: false, error: "Missing description." });
  try {
    const robot = await generateRobot(input);
    res.json({ ok: true, robot });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// OpenAPI Generator endpoints
// ---------------------------------------------------------------------------
app.get("/api/openapi/routes", async (_req: Request, res: Response) => {
  const routes = scanDaemonRoutes(path.join(process.cwd(), 'server', 'assistant-daemon.ts'));
  res.json({ ok: true, routes, count: routes.length });
});
app.get("/api/openapi/spec", async (_req: Request, res: Response) => {
  const spec = generateOpenApiSpec(path.join(process.cwd(), 'server', 'assistant-daemon.ts'));
  res.json(spec);
});
app.get("/api/openapi/docs", async (_req: Request, res: Response) => {
  const spec = generateOpenApiSpec(path.join(process.cwd(), 'server', 'assistant-daemon.ts'));
  res.type('text/html').send(generateSwaggerHtml(spec));
});
app.post("/api/openapi/save", async (_req: Request, res: Response) => {
  const outputDir = path.join(process.cwd(), 'docs', 'api');
  const result = saveOpenApi(outputDir, path.join(process.cwd(), 'server', 'assistant-daemon.ts'));
  res.json({ ok: true, ...result });
});

// ---------------------------------------------------------------------------
// System Snapshot & Restore endpoints
// ---------------------------------------------------------------------------
app.post("/api/snapshot/create", async (req: Request, res: Response) => {
  try {
    const snapshot = await createSnapshot(req.body?.name, req.body?.description);
    res.json({ ok: true, snapshot });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/snapshot", async (_req: Request, res: Response) => {
  res.json({ ok: true, snapshots: listSnapshots(), stats: getSnapshotStats() });
});
app.get("/api/snapshot/:id", async (req: Request, res: Response) => {
  const snapshot = getSnapshot(req.params.id);
  if (!snapshot) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, snapshot });
});
app.post("/api/snapshot/:id/restore", async (req: Request, res: Response) => {
  const result = await restoreSnapshot(req.params.id);
  res.json({ ok: true, ...result });
});
app.delete("/api/snapshot/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteSnapshot(_req.params.id) });
});

// ---------------------------------------------------------------------------
// AI Model Gateway endpoints
// ---------------------------------------------------------------------------
app.get("/api/gateway/health", async (_req: Request, res: Response) => {
  res.json({ ok: true, providers: await getProviderHealthSnapshot(), stats: await getGatewayStatsSnapshot() });
});
app.post("/api/gateway/route", async (req: Request, res: Response) => {
  const { prompt, domain, preferredProvider, preferredModel } = (req.body || {}) as any;
  if (!prompt) return res.status(400).json({ ok: false, error: "Missing prompt." });
  try {
    const response = await routeThroughGateway({ prompt, domain: domain || 'general', preferredProvider, preferredModel });
    res.json({ ok: true, response });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/gateway/circuit/reset", async (req: Request, res: Response) => {
  const { provider, model } = (req.body || {}) as any;
  const ok = provider && model ? resetCircuitBreaker(provider, model) : (resetAllCircuits() > 0);
  res.json({ ok: true, reset: ok });
});
app.get("/api/gateway/configs", async (_req: Request, res: Response) => {
  res.json({ ok: true, configs: getProviderConfigs() });
});

// ---------------------------------------------------------------------------
// Project Timeline AI endpoints
// ---------------------------------------------------------------------------
app.post("/api/timeline/generate", async (req: Request, res: Response) => {
  const { projectName, description } = (req.body || {}) as any;
  if (!projectName) return res.status(400).json({ ok: false, error: "Missing projectName." });
  try {
    const timeline = await generateTimeline(projectName, description || '');
    res.json({ ok: true, timeline });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/timeline", async (_req: Request, res: Response) => {
  res.json({ ok: true, timelines: listTimelines() });
});
app.get("/api/timeline/:id", async (req: Request, res: Response) => {
  const tl = getProjectTimeline(req.params.id);
  if (!tl) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, timeline: tl });
});
app.patch("/api/timeline/:id/tasks/:taskId", async (req: Request, res: Response) => {
  const { progress, status } = (req.body || {}) as any;
  const ok = updateTaskProgress(req.params.id, req.params.taskId, progress || 0, status);
  res.json({ ok, updated: ok });
});
app.delete("/api/timeline/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteTimeline(_req.params.id) });
});

// ---------------------------------------------------------------------------
// Deploy Manager endpoints
// ---------------------------------------------------------------------------
app.post("/api/deploy/configs", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name) return res.status(400).json({ ok: false, error: "Missing name." });
  res.json({ ok: true, config: createDeployConfig(input) });
});
app.get("/api/deploy/configs", async (_req: Request, res: Response) => {
  res.json({ ok: true, configs: listDeployConfigs() });
});
app.get("/api/deploy/configs/:id", async (req: Request, res: Response) => {
  const config = getDeployConfig(req.params.id);
  if (!config) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, config });
});
app.post("/api/deploy/configs/:id/run", async (req: Request, res: Response) => {
  try {
    const run = await runDeploy(req.params.id);
    res.json({ ok: true, run });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/deploy/runs", async (_req: Request, res: Response) => {
  res.json({ ok: true, runs: listDeployRuns() });
});
app.get("/api/deploy/runs/:id", async (req: Request, res: Response) => {
  const run = getDeployRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, run });
});

// ---------------------------------------------------------------------------
// Document Intelligence endpoints
// ---------------------------------------------------------------------------
app.post("/api/document/analyze", async (req: Request, res: Response) => {
  const { filePath } = (req.body || {}) as any;
  if (!filePath) return res.status(400).json({ ok: false, error: "Missing filePath." });
  try {
    const doc = await analyzeDocument(filePath);
    res.json({ ok: true, ...doc });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/document/structure", async (req: Request, res: Response) => {
  const { filePath } = (req.body || {}) as any;
  if (!filePath) return res.status(400).json({ ok: false, error: "Missing filePath." });
  res.json({ ok: true, structure: detectFileStructure(filePath) });
});

// ---------------------------------------------------------------------------
// Performance Optimization Profiler endpoints
// ---------------------------------------------------------------------------
app.post("/api/perf/profile", async (req: Request, res: Response) => {
  const { pattern, maxFiles } = (req.body || {}) as any;
  const target = pattern || 'server/services/*.ts';
  try {
    const profile = await profilePerformance(target, maxFiles || 5);
    res.json({ ok: true, profile });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/perf/profiles", async (_req: Request, res: Response) => {
  res.json({ ok: true, profiles: listPerfProfiles() });
});
app.get("/api/perf/profiles/:id", async (req: Request, res: Response) => {
  const profile = getPerfProfile(req.params.id);
  if (!profile) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, profile });
});

// ---------------------------------------------------------------------------
// Event Stream Processor endpoints
// ---------------------------------------------------------------------------
app.post("/api/streams/pipelines", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name) return res.status(400).json({ ok: false, error: "Missing name." });
  res.json({ ok: true, pipeline: createPipeline(input) });
});
app.get("/api/streams/pipelines", async (_req: Request, res: Response) => {
  res.json({ ok: true, pipelines: listPipelines(), stats: getStreamStats() });
});
app.delete("/api/streams/pipelines/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deletePipeline(_req.params.id) });
});
app.post("/api/streams/events", async (req: Request, res: Response) => {
  const { stream, type, payload, source } = (req.body || {}) as any;
  if (!stream || !type || !payload) return res.status(400).json({ ok: false, error: "Missing stream/type/payload." });
  const event = publishEvent(stream, type, payload, source);
  res.json({ ok: true, event });
});
app.get("/api/streams/events", async (req: Request, res: Response) => {
  res.json({ ok: true, events: listStreamEvents({ stream: req.query.stream as string, type: req.query.type as any }) });
});
app.get("/api/streams/buckets/:pipelineId", async (req: Request, res: Response) => {
  res.json({ ok: true, buckets: getAggregatedBuckets(req.params.pipelineId) });
});

// ---------------------------------------------------------------------------
// Notification Engine endpoints
// ---------------------------------------------------------------------------
app.post("/api/notify/send", async (req: Request, res: Response) => {
  const { template, variables, priority, channel } = (req.body || {}) as any;
  if (!template || !variables) return res.status(400).json({ ok: false, error: "Missing template/variables." });
  const event = await sendNotification(template, variables, { priority, channel });
  res.json({ ok: true, event });
});
app.get("/api/notify/templates", async (_req: Request, res: Response) => {
  res.json({ ok: true, templates: getTemplates(), channels: getChannelConfigs() });
});
app.post("/api/notify/templates", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name || !input.subject) return res.status(400).json({ ok: false, error: "Missing name/subject." });
  res.json({ ok: true, template: createTemplate(input) });
});
app.delete("/api/notify/templates/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteTemplate(_req.params.id) });
});
app.patch("/api/notify/channels/:channel", async (req: Request, res: Response) => {
  const ok = updateChannelConfig(req.params.channel as any, req.body);
  res.json({ ok, updated: ok });
});
app.get("/api/notify/events", async (_req: Request, res: Response) => {
  res.json({ ok: true, events: listNotifyEvents(), stats: getNotificationStats() });
});
app.post("/api/notify/clear", async (_req: Request, res: Response) => {
  clearEvents();
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Plugin Extension System endpoints
// ---------------------------------------------------------------------------
app.post("/api/plugins", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name || !input.type) return res.status(400).json({ ok: false, error: "Missing name/type." });
  const plugin = registerPlugin(input);
  res.json({ ok: true, plugin });
});
app.get("/api/plugins", async (req: Request, res: Response) => {
  res.json({ ok: true, plugins: listPlugins({ type: req.query.type as any, status: req.query.status as any }), stats: getPluginStats() });
});
app.get("/api/plugins/:id", async (req: Request, res: Response) => {
  const plugin = getPlugin(req.params.id);
  if (!plugin) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, plugin });
});
app.post("/api/plugins/:id/unload", async (req: Request, res: Response) => {
  res.json({ ok: true, unloaded: unloadPlugin(req.params.id) });
});
app.post("/api/plugins/:id/reload", async (req: Request, res: Response) => {
  const plugin = reloadPlugin(req.params.id);
  if (!plugin) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, plugin });
});
app.post("/api/plugins/:id/invoke", async (req: Request, res: Response) => {
  const { capability, params } = (req.body || {}) as any;
  if (!capability) return res.status(400).json({ ok: false, error: "Missing capability." });
  const result = await invokePlugin(req.params.id, capability, params || {});
  res.json({ ok: true, result });
});
app.post("/api/plugins/discover", async (_req: Request, res: Response) => {
  const discovered = discoverPlugins();
  res.json({ ok: true, discovered });
});
app.post("/api/plugins/install-discovered", async (_req: Request, res: Response) => {
  res.json({ ok: true, installed: installFromDiscovered() });
});

// ---------------------------------------------------------------------------
// Config Drift Detector endpoints
// ---------------------------------------------------------------------------
app.post("/api/drift/baselines", async (req: Request, res: Response) => {
  const { name, filePath, description } = (req.body || {}) as any;
  if (!name || !filePath) return res.status(400).json({ ok: false, error: "Missing name/filePath." });
  const baseline = captureBaseline(name, filePath, description);
  if (!baseline) return res.status(404).json({ ok: false, error: "File not found." });
  res.json({ ok: true, baseline });
});
app.get("/api/drift/baselines", async (_req: Request, res: Response) => {
  res.json({ ok: true, baselines: listBaselines() });
});
app.delete("/api/drift/baselines/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteBaseline(_req.params.id) });
});
app.post("/api/drift/scan", async (req: Request, res: Response) => {
  try {
    const report = await detectDrift(req.body?.targetPath);
    res.json({ ok: true, report, stats: getDriftStats() });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/drift/autofix", async (req: Request, res: Response) => {
  const { driftId } = (req.body || {}) as any;
  res.json({ ok: true, fixed: autoFixDrift(driftId) });
});
app.get("/api/drift/reports", async (_req: Request, res: Response) => {
  res.json({ ok: true, reports: listDriftReports(), stats: getDriftStats() });
});
app.get("/api/drift/reports/:id", async (req: Request, res: Response) => {
  const report = getDriftReport(req.params.id);
  if (!report) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, report });
});

// ---------------------------------------------------------------------------
// Dependency Health Monitor endpoints
// ---------------------------------------------------------------------------
app.post("/api/deps/scan", async (req: Request, res: Response) => {
  try {
    const report = await scanDependencyHealth(req.body?.projectPath);
    res.json({ ok: true, report, stats: getDepHealthStats() });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/deps/reports", async (_req: Request, res: Response) => {
  res.json({ ok: true, reports: listDepReports(), stats: getDepHealthStats() });
});
app.get("/api/deps/reports/:id", async (req: Request, res: Response) => {
  const report = getDepReport(req.params.id);
  if (!report) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, report });
});

// ---------------------------------------------------------------------------
// SAST Security Hub endpoints
// ---------------------------------------------------------------------------
app.get("/api/sast/rules", async (_req: Request, res: Response) => {
  res.json({ ok: true, rules: getBuiltinRules() });
});
app.post("/api/sast/configs", async (req: Request, res: Response) => {
  const { name, autoFixEnabled, targetPatterns } = (req.body || {}) as any;
  if (!name) return res.status(400).json({ ok: false, error: "Missing name." });
  res.json({ ok: true, config: createSastConfig(name, { autoFixEnabled, targetPatterns }) });
});
app.get("/api/sast/configs", async (_req: Request, res: Response) => {
  res.json({ ok: true, configs: listSastConfigs() });
});
app.post("/api/sast/scan", async (req: Request, res: Response) => {
  try {
    const report = await runSastScan(req.body?.pattern || 'server/**/*.ts', req.body?.maxFiles || 10);
    res.json({ ok: true, report, stats: getSastStats() });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/sast/reports", async (_req: Request, res: Response) => {
  res.json({ ok: true, reports: listSastReports(), stats: getSastStats() });
});
app.get("/api/sast/reports/:id", async (req: Request, res: Response) => {
  const report = getSastReport(req.params.id);
  if (!report) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, report });
});

// ---------------------------------------------------------------------------
// AI Contextual Help endpoints
// ---------------------------------------------------------------------------
app.post("/api/help/session", async (req: Request, res: Response) => {
  const { filePath } = (req.body || {}) as any;
  if (!filePath) return res.status(400).json({ ok: false, error: "Missing filePath." });
  const session = createHelpSession(filePath);
  res.json({ ok: true, session });
});
app.post("/api/help/ask", async (req: Request, res: Response) => {
  const { query, mode, context, sessionId } = (req.body || {}) as any;
  if (!query || !mode || !context) return res.status(400).json({ ok: false, error: "Missing query/mode/context." });
  try {
    const response = await getHelp(query, mode, context, sessionId);
    res.json({ ok: true, response });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/help/sessions/:id", async (req: Request, res: Response) => {
  const session = getHelpSession(req.params.id);
  if (!session) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, session });
});
app.delete("/api/help/sessions/:id", async (req: Request, res: Response) => {
  res.json({ ok: true, closed: closeSession(req.params.id) });
});
app.get("/api/help/responses", async (_req: Request, res: Response) => {
  res.json({ ok: true, responses: listHelpResponses(), stats: getHelpStats() });
});

// ---------------------------------------------------------------------------
// Code Autocomplete endpoints
// ---------------------------------------------------------------------------
app.post("/api/autocomplete/session", async (req: Request, res: Response) => {
  const { filePath } = (req.body || {}) as any;
  if (!filePath) return res.status(400).json({ ok: false, error: "Missing filePath." });
  res.json({ ok: true, session: createCompletionSession(filePath) });
});
app.post("/api/autocomplete/get", async (req: Request, res: Response) => {
  const { context, sessionId } = (req.body || {}) as any;
  if (!context) return res.status(400).json({ ok: false, error: "Missing context." });
  try {
    const suggestions = await getCompletions(context, sessionId);
    res.json({ ok: true, suggestions });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/autocomplete/accept", async (req: Request, res: Response) => {
  const { sessionId, completionId } = (req.body || {}) as any;
  res.json({ ok: true, accepted: acceptCompletion(sessionId, completionId) });
});

// ---------------------------------------------------------------------------
// Data Migration AI endpoints
// ---------------------------------------------------------------------------
app.post("/api/migrations/create", async (req: Request, res: Response) => {
  const { name, beforeSchema, afterSchema, dialect, description } = (req.body || {}) as any;
  if (!name || !beforeSchema || !afterSchema) return res.status(400).json({ ok: false, error: "Missing name/beforeSchema/afterSchema." });
  try {
    const migration = await createMigration(name, beforeSchema, afterSchema, { dialect, description });
    res.json({ ok: true, migration });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/migrations", async (_req: Request, res: Response) => {
  res.json({ ok: true, migrations: listMigrations() });
});
app.get("/api/migrations/:id", async (req: Request, res: Response) => {
  const migration = getMigration(req.params.id);
  if (!migration) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, migration });
});
app.post("/api/migrations/:id/apply", async (req: Request, res: Response) => {
  res.json({ ok: true, applied: applyMigration(req.params.id) });
});
app.post("/api/migrations/:id/rollback", async (req: Request, res: Response) => {
  res.json({ ok: true, rolledBack: rollbackMigration(req.params.id) });
});

// ---------------------------------------------------------------------------
// Architecture Visualizer endpoints
// ---------------------------------------------------------------------------
app.post("/api/architecture/generate", async (req: Request, res: Response) => {
  const { targetDir, format, maxFiles } = (req.body || {}) as any;
  try {
    const result = await generateArchitectureDiagram(targetDir || 'server/services', format || 'mermaid', maxFiles);
    res.json({ ok: true, result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/architecture/graphs", async (_req: Request, res: Response) => {
  res.json({ ok: true, graphs: listGraphs() });
});
app.get("/api/architecture/graphs/:id", async (req: Request, res: Response) => {
  const graph = getGraph(req.params.id);
  if (!graph) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, graph });
});
app.get("/api/architecture/graphs/:id/format", async (req: Request, res: Response) => {
  const diagram = convertToFormat(req.params.id, (req.query.format as any) || 'mermaid');
  if (!diagram) return res.status(404).json({ ok: false, error: "Not found." });
  if (req.query.format === 'html_svg') res.type('text/html').send(diagram);
  else res.type('text/plain').send(diagram);
});

// ---------------------------------------------------------------------------
// API Test Generator endpoints
// ---------------------------------------------------------------------------
app.post("/api/testgen/generate", async (req: Request, res: Response) => {
  const { name, sourceFile, framework, maxRoutes } = (req.body || {}) as any;
  if (!name || !sourceFile) return res.status(400).json({ ok: false, error: "Missing name/sourceFile." });
  try {
    const suite = await generateAPITestSuite(name, sourceFile, { framework, maxRoutes });
    res.json({ ok: true, suite });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/testgen/suites", async (_req: Request, res: Response) => {
  res.json({ ok: true, suites: listSuites(), stats: getTestStats() });
});
app.get("/api/testgen/suites/:id", async (req: Request, res: Response) => {
  const suite = getSuite(req.params.id);
  if (!suite) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, suite });
});

// ---------------------------------------------------------------------------
// Contextual Doc Generator endpoints
// ---------------------------------------------------------------------------
app.post("/api/docs/generate", async (req: Request, res: Response) => {
  const { type, target, format } = (req.body || {}) as any;
  if (!type || !target) return res.status(400).json({ ok: false, error: "Missing type/target." });
  try {
    const doc = await generateDocumentation(type, target, { format });
    res.json({ ok: true, doc });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/docs", async (_req: Request, res: Response) => {
  res.json({ ok: true, docs: listDocs(), types: getDocTypes() });
});
app.get("/api/docs/:id", async (req: Request, res: Response) => {
  const doc = getDoc(req.params.id);
  if (!doc) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, doc });
});

// ---------------------------------------------------------------------------
// Code Review Queue endpoints
// ---------------------------------------------------------------------------
app.get("/api/review/reviewers", async (_req: Request, res: Response) => {
  res.json({ ok: true, reviewers: getReviewerProfiles() });
});
app.post("/api/review/run", async (req: Request, res: Response) => {
  const { title, files, reviewers } = (req.body || {}) as any;
  if (!title || !files?.length) return res.status(400).json({ ok: false, error: "Missing title/files." });
  try {
    const review = await runCodeReview(title, files, { reviewers });
    res.json({ ok: true, review });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/review/runs", async (_req: Request, res: Response) => {
  res.json({ ok: true, reviews: listReviews(), stats: getReviewStats() });
});
app.get("/api/review/runs/:id", async (req: Request, res: Response) => {
  const review = getReview(req.params.id);
  if (!review) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, review });
});

// ---------------------------------------------------------------------------
// Intelligent Log Analyzer endpoints
// ---------------------------------------------------------------------------
app.post("/api/logs/analyze", async (req: Request, res: Response) => {
  const { filePath, maxLines, useAI } = (req.body || {}) as any;
  if (!filePath) return res.status(400).json({ ok: false, error: "Missing filePath." });
  try {
    const analysis = await analyzeLogs(filePath, { maxLines, useAI });
    res.json({ ok: true, analysis });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/logs/analyses", async (_req: Request, res: Response) => {
  res.json({ ok: true, analyses: listAnalyses(), stats: getLogStats() });
});
app.get("/api/logs/patterns", async (_req: Request, res: Response) => {
  res.json({ ok: true, patterns: getPatterns().map(p => ({ name: p.name, severity: p.severity, description: p.description })) });
});

// ---------------------------------------------------------------------------
// AI Prompt Library endpoints
// ---------------------------------------------------------------------------
app.get("/api/prompts/templates", async (req: Request, res: Response) => {
  res.json({ ok: true, templates: getPromptTemplates({ category: req.query.category as string, tags: req.query.tags ? (req.query.tags as string).split(',') : undefined }), stats: getLibraryStats(), categories: getPromptCategories() });
});
app.get("/api/prompts/search", async (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  res.json({ ok: true, templates: searchTemplates(q) });
});
app.get("/api/prompts/templates/:id", async (req: Request, res: Response) => {
  const tpl = getTemplate(req.params.id);
  if (!tpl) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, template: tpl });
});
app.post("/api/prompts/templates", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.name || !input.userPromptTemplate) return res.status(400).json({ ok: false, error: "Missing name/userPromptTemplate." });
  res.json({ ok: true, template: createPromptTemplate(input) });
});
app.delete("/api/prompts/templates/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deletePromptTemplate(_req.params.id) });
});
app.post("/api/prompts/render", async (req: Request, res: Response) => {
  const { templateId, variables } = (req.body || {}) as any;
  const rendered = renderPrompt(templateId, variables || {});
  if (!rendered) return res.status(404).json({ ok: false, error: "Template not found." });
  res.json({ ok: true, rendered });
});
app.post("/api/prompts/execute", async (req: Request, res: Response) => {
  const { templateId, variables, rating } = (req.body || {}) as any;
  if (!templateId || !variables) return res.status(400).json({ ok: false, error: "Missing templateId/variables." });
  try {
    const run = await executePrompt(templateId, variables, { rating });
    res.json({ ok: true, run });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/prompts/runs", async (req: Request, res: Response) => {
  res.json({ ok: true, runs: listRuns(req.query.templateId as string) });
});

// ---------------------------------------------------------------------------
// Vector Embedding Store endpoints
// ---------------------------------------------------------------------------
app.post("/api/vectors/namespace", async (req: Request, res: Response) => {
  const { name } = (req.body || {}) as any;
  if (!name) return res.status(400).json({ ok: false, error: "Missing name." });
  res.json({ ok: true, namespace: createNamespace(name) });
});
app.get("/api/vectors/namespaces", async (_req: Request, res: Response) => {
  res.json({ ok: true, namespaces: listNamespaces(), stats: getVectorStats() });
});
app.delete("/api/vectors/namespace/:name", async (req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteNamespace(req.params.name) });
});
app.post("/api/vectors/insert", async (req: Request, res: Response) => {
  const { namespace, content, metadata } = (req.body || {}) as any;
  if (!namespace || !content) return res.status(400).json({ ok: false, error: "Missing namespace/content." });
  const doc = insertDocument(namespace, content, metadata);
  if (!doc) return res.status(404).json({ ok: false, error: "Namespace not found." });
  res.json({ ok: true, document: { id: doc.id, content: doc.content.slice(0, 200) } });
});
app.post("/api/vectors/search", async (req: Request, res: Response) => {
  const { namespace, query, topK, minSimilarity } = (req.body || {}) as any;
  if (!namespace || !query) return res.status(400).json({ ok: false, error: "Missing namespace/query." });
  const results = searchSimilar(namespace, query, topK || 10, minSimilarity || 0.1);
  res.json({ ok: true, results: results.map(r => ({ similarity: r.similarity, id: r.document.id, content: r.document.content.slice(0, 200) })) });
});

// ---------------------------------------------------------------------------
// Content Studio AI endpoints
// ---------------------------------------------------------------------------
app.post("/api/content/generate", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.type || !input.topic) return res.status(400).json({ ok: false, error: "Missing type/topic." });
  try {
    const asset = await generateContent(input);
    res.json({ ok: true, asset });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/content/assets", async (req: Request, res: Response) => {
  res.json({ ok: true, assets: listAssets({ type: req.query.type as any }), stats: getContentStats(), types: getContentTypes() });
});
app.get("/api/content/assets/:id", async (req: Request, res: Response) => {
  const asset = getAsset(req.params.id);
  if (!asset) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, asset });
});

// ---------------------------------------------------------------------------
// Git Assistant endpoints
// ---------------------------------------------------------------------------
app.get("/api/git/status", async (_req: Request, res: Response) => {
  try { const s = await getGitStatus(); res.json({ ok: true, status: s }); }
  catch { res.json({ ok: true, status: { staged: [], modified: [], untracked: [], deleted: [] } }); }
});
app.get("/api/git/diff", async (_req: Request, res: Response) => {
  try { const d = await getGitDiff(); res.json({ ok: true, diff: d }); }
  catch { res.json({ ok: true, diff: { filesChanged: 0 } }); }
});
app.get("/api/git/commit-msg", async (_req: Request, res: Response) => {
  try { const msg = await generateCommitMessage(); res.json({ ok: true, message: msg }); }
  catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/git/pr-desc", async (req: Request, res: Response) => {
  try { const pr = await generatePRDescription(String(req.query.base || 'main')); res.json({ ok: true, pr }); }
  catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Team Knowledge Base endpoints
// ---------------------------------------------------------------------------
app.post("/api/kb/articles", async (req: Request, res: Response) => {
  const input = req.body as any;
  if (!input.title || !input.content) return res.status(400).json({ ok: false, error: "Missing title/content." });
  try { const article = await createArticle(input); res.json({ ok: true, article }); }
  catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/kb/articles", async (req: Request, res: Response) => {
  res.json({ ok: true, articles: listArticles({ category: req.query.category as string, tag: req.query.tag as string }), stats: getKBStats(), categories: getCategories() });
});
app.get("/api/kb/search", async (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  res.json({ ok: true, articles: searchArticles(q) });
});
app.get("/api/kb/articles/:id", async (req: Request, res: Response) => {
  const article = getArticle(req.params.id);
  if (!article) return res.status(404).json({ ok: false, error: "Not found." });
  recordView(req.params.id);
  res.json({ ok: true, article });
});
app.patch("/api/kb/articles/:id", async (req: Request, res: Response) => {
  const article = updateArticle(req.params.id, req.body);
  if (!article) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, article });
});
app.post("/api/kb/articles/:id/helpful", async (_req: Request, res: Response) => {
  recordHelpful(_req.params.id);
  res.json({ ok: true });
});
app.delete("/api/kb/articles/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteArticle(_req.params.id) });
});

// ---------------------------------------------------------------------------
// Context Window Manager endpoints
// ---------------------------------------------------------------------------
app.post("/api/context/window", async (req: Request, res: Response) => {
  const { id, maxTokens, strategy } = (req.body || {}) as any;
  if (!id) return res.status(400).json({ ok: false, error: "Missing id." });
  const window = createContextWindow(id, { maxTokens, ...strategy });
  res.json({ ok: true, window });
});
app.get("/api/context/windows", async (_req: Request, res: Response) => {
  res.json({ ok: true, windows: listContextWindows() });
});
app.get("/api/context/windows/:id", async (req: Request, res: Response) => {
  const win = getContextWindow(req.params.id);
  if (!win) return res.status(404).json({ ok: false, error: "Not found." });
  res.json({ ok: true, window: win });
});
app.delete("/api/context/windows/:id", async (_req: Request, res: Response) => {
  res.json({ ok: true, deleted: deleteContextWindow(_req.params.id) });
});
app.post("/api/context/windows/:id/segment", async (req: Request, res: Response) => {
  const { type, content, priority } = (req.body || {}) as any;
  if (!content) return res.status(400).json({ ok: false, error: "Missing content." });
  addSegment(req.params.id, type || 'user', content, priority);
  res.json({ ok: true });
});
app.post("/api/context/windows/:id/memory", async (req: Request, res: Response) => {
  const { query, limit } = (req.body || {}) as any;
  const injected = await addMemoryContext(req.params.id, query, limit);
  res.json({ ok: true, injected });
});
app.post("/api/context/windows/:id/knowledge", async (req: Request, res: Response) => {
  const { query } = (req.body || {}) as any;
  const injected = addKnowledgeContext(req.params.id, query);
  res.json({ ok: true, injected });
});
app.post("/api/context/windows/:id/prune", async (req: Request, res: Response) => {
  const pruned = pruneContextWindow(req.params.id);
  res.json({ ok: true, pruned });
});
app.post("/api/context/windows/:id/summarize", async (req: Request, res: Response) => {
  const result = await summarizeContext(req.params.id);
  res.json({ ok: true, summary: result });
});
app.post("/api/context/estimate-tokens", async (req: Request, res: Response) => {
  const { text } = (req.body || {}) as any;
  res.json({ ok: true, tokens: estimateTokens(text || '') });
});

// ---------------------------------------------------------------------------
// Agent Workflow Engine endpoints
// ---------------------------------------------------------------------------
app.get("/api/agent-workflows/templates", async (_req: Request, res: Response) => {
  res.json({ ok: true, templates: listWorkflowTemplates() });
});
app.get("/api/agent-workflows", async (_req: Request, res: Response) => {
  res.json({ ok: true, workflows: listAgentWorkflows() });
});
app.get("/api/agent-workflows/:id", async (req: Request, res: Response) => {
  const wf = await getAgentWorkflow(req.params.id);
  if (!wf) return res.status(404).json({ ok: false, error: "Workflow not found." });
  res.json({ ok: true, workflow: wf });
});
app.post("/api/agent-workflows", async (req: Request, res: Response) => {
  try {
    const input = req.body as any;
    if (!input.templateId || !input.goal) return res.status(400).json({ ok: false, error: "Missing templateId/goal." });
    const wf = await startAgentWorkflowEngine(input.templateId, input.goal, input.context);
    res.json({ ok: true, workflow: wf });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/agent-workflows/:id/approve-step", async (req: Request, res: Response) => {
  const wf = await approveWorkflowStep(req.params.id, req.body?.stepIndex ?? 0);
  if (!wf) return res.status(404).json({ ok: false, error: "Workflow not found." });
  res.json({ ok: true, workflow: wf });
});
app.post("/api/agent-workflows/:id/stop", async (req: Request, res: Response) => {
  const wf = await stopAgentWorkflow(req.params.id, req.body?.reason || "User stopped");
  if (!wf) return res.status(404).json({ ok: false, error: "Workflow not found." });
  res.json({ ok: true, workflow: wf });
});

// ---------------------------------------------------------------------------
// GitHub CI Doctor endpoints
// ---------------------------------------------------------------------------
app.get("/api/ci-doctor/context", async (req: Request, res: Response) => {
  try {
    const repo = typeof req.query.repo === "string" ? req.query.repo : undefined;
    const runId = req.query.runId ? Number(req.query.runId) : undefined;
    const context = await getGitHubCIFailureContext(repo, runId);
    res.json({ ok: true, context });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/ci-doctor/analyze", async (req: Request, res: Response) => {
  try {
    const repo = typeof req.query.repo === "string" ? req.query.repo : undefined;
    const runId = req.query.runId ? Number(req.query.runId) : undefined;
    const result = await analyzeGitHubCIFailure(repo, runId);
    res.json({ ok: true, result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// AI Workforce Runtime Hub endpoints
// ---------------------------------------------------------------------------
app.get("/api/ai-workforce/runtime", async (_req: Request, res: Response) => {
  try {
    const dashboard = await getAIWorkforceRuntimeDashboard();
    const releaseGate = await getAIWorkforceReleaseGateDashboard();
    res.json({ ok: true, dashboard: { ...dashboard, releaseGate } });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/context-pack", async (req: Request, res: Response) => {
  try {
    const result = await buildRuntimeGroundedContext(req.body as any);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-plan", async (req: Request, res: Response) => {
  try {
    const plan = await buildRuntimeMissionPlan(req.body as any);
    res.json({ ok: true, plan });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue", async (req: Request, res: Response) => {
  try {
    const result = await buildRuntimeMissionExecutionQueue(req.body as any);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/ai-workforce/mission-execution-queues", async (req: Request, res: Response) => {
  try {
    const parsed = Number(req.query.limit);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 1000) : 20;
    const result = await listRuntimeMissionExecutionQueues({ limit, status: req.query.status as any });
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.get("/api/ai-workforce/mission-execution-queue/drift", async (req: Request, res: Response) => {
  try {
    const parsed = Number(req.query.limit);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 2000) : 200;
    const report = await listRuntimeMissionQueueDrift({ limit });
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/drift/repair", async (req: Request, res: Response) => {
  try {
    const parsed = Number(req.body?.limit);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 2000) : 200;
    const report = await repairRuntimeMissionQueueDrift({ limit });
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/resume", async (req: Request, res: Response) => {
  try {
    const queue = await resumeRuntimeMissionExecutionQueue(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/approve", async (req: Request, res: Response) => {
  try {
    const queue = await approveRuntimeMissionExecutionStep(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/start", async (req: Request, res: Response) => {
  try {
    const queue = await startRuntimeMissionExecutionStep(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/complete", async (req: Request, res: Response) => {
  try {
    const queue = await completeRuntimeMissionExecutionStep(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/tool-preview", async (req: Request, res: Response) => {
  try {
    const result = await previewRuntimeMissionStepToolExecution(req.body as any);
    res.json({ ok: true, result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/tool-execute", async (req: Request, res: Response) => {
  try {
    const payload = req.body as any;
    const result = payload.executionMode === 'connector'
      ? await executeRuntimeMissionStepToolConnector(payload)
      : await executeRuntimeMissionStepToolSimulation(payload);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/mission-execution-queue/cancel", async (req: Request, res: Response) => {
  try {
    const queue = await cancelRuntimeMissionExecutionQueue(req.body as any);
    res.json({ ok: true, queue });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/safety-preview", async (req: Request, res: Response) => {
  try {
    const decision = await previewRuntimeAutomation(req.body as any);
    res.json({ ok: true, decision });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/pr-readiness", async (req: Request, res: Response) => {
  try {
    const report = await scoreRuntimePRReadiness(req.body as any);
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/pr-control", async (req: Request, res: Response) => {
  try {
    const report = await buildRuntimePRControlReport(req.body as any);
    res.json({ ok: true, report });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/ai-workforce/github-pr-control", async (req: Request, res: Response) => {
  try {
    const result = await buildRuntimeGitHubPRControlReport(req.body as any);
    res.json({ ok: true, ...result });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// AI Workforce Mission Snapshot Export and Review Notes endpoints
// ---------------------------------------------------------------------------
app.post("/api/ai-workforce/mission-review-note", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const queue = await requireMissionExecutionQueue(String(body.queueId || ""));
    const note = await saveMissionOperatorReviewNote(queue, {
      reviewer: String(body.reviewer || "Mission Operator"),
      decision: body.decision === "approved" || body.decision === "needs_changes" || body.decision === "blocked" ? body.decision : "info",
      summary: String(body.summary || "Operator review note recorded."),
      requestedAction: body.requestedAction ? String(body.requestedAction) : undefined,
      stepId: body.stepId ? String(body.stepId) : undefined,
      evidence: Array.isArray(body.evidence) ? body.evidence : [],
    });
    const notes = await listMissionOperatorReviewNotes(queue.id);
    const dossier = await buildStoredMissionOperatorReviewDossier(queue);
    const stats = await getMissionOperatorReviewNoteStoreStats();
    res.json({ ok: true, note, notes, dossier, stats });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post("/api/ai-workforce/mission-review-notes", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const queues = body.queueId ? [] : await listMissionExecutionQueues({ limit: 1 });
    const queue = body.queueId ? await requireMissionExecutionQueue(String(body.queueId)) : queues[0];
    if (!queue) return res.status(404).json({ ok: false, error: "No mission execution queue is available for review notes." });
    const notes = await listMissionOperatorReviewNotes(queue.id);
    const dossier = await buildStoredMissionOperatorReviewDossier(queue);
    const stats = await getMissionOperatorReviewNoteStoreStats();
    res.json({ ok: true, queueId: queue.id, notes, dossier, stats });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post("/api/ai-workforce/mission-snapshot-export", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const format = body.format === "markdown" ? "markdown" : "json";
    const queues = body.queueId ? [] : await listMissionExecutionQueues({ limit: 1 });
    const queue = body.queueId ? await requireMissionExecutionQueue(String(body.queueId)) : queues[0];
    if (!queue) return res.status(404).json({ ok: false, error: "No mission execution queue is available for snapshot export." });
    const persistedNotes = await listMissionOperatorReviewNotes(queue.id);
    const requestNotes = Array.isArray(body.reviewNotes) ? body.reviewNotes : [];
    const snapshot = buildMissionQueueSnapshotExport(queue, {
      format,
      includeRawQueue: Boolean(body.includeRawQueue),
      reviewNotes: [...persistedNotes, ...requestNotes],
      releaseEvidence: body.releaseEvidence && typeof body.releaseEvidence === "object" ? body.releaseEvidence : {},
    });
    res.json({ ok: true, snapshot, persistedReviewNotes: persistedNotes.length });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// AI Workforce Mission Release Gate endpoint
// ---------------------------------------------------------------------------
app.post("/api/ai-workforce/mission-release-gate", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const result = await buildRuntimeMissionReleaseGate({
      queueId: String(body.queueId || ""),
      actor: String(body.actor || "Mission Operator"),
      evidence: {
        ciStatus: body.ciStatus === "success" || body.ciStatus === "pending" || body.ciStatus === "failed" ? body.ciStatus : "unknown",
        approvals: Number(body.approvals || 0),
        requiredApprovals: Number(body.requiredApprovals || 1),
        snapshotChecksum: body.snapshotChecksum ? String(body.snapshotChecksum) : "",
        releaseLabel: Boolean(body.releaseLabel),
        rollbackConfirmed: Boolean(body.rollbackConfirmed),
        operatorConfirmed: Boolean(body.operatorConfirmed),
        notes: Array.isArray(body.notes) ? body.notes : [],
      },
    });
    res.json({ ok: true, gate: result.gate, dossier: result.dossier, runtimeRecord: result.runtimeRecord, auditEvent: result.auditEvent, metric: result.metric });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// AI Workforce Release Gate Export endpoint
// ---------------------------------------------------------------------------
app.post("/api/ai-workforce/release-gate-export", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const format = body.format === "markdown" ? "markdown" : "json";
    const result = await buildRuntimeReleaseGateExport({ format, actor: String(body.actor || "Mission Operator") });
    res.json({ ok: true, exportArtifact: result.exportArtifact, dashboard: result.dashboard, runtimeRecord: result.runtimeRecord, auditEvent: result.auditEvent, metric: result.metric, retention: result.retention });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Unified System Overview (cross-service data linker)
// ---------------------------------------------------------------------------
app.get("/api/system/overview", async (_req: Request, res: Response) => {
  try {
    const overview = gatherSystemOverview();
    res.json({ ok: true, overview });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

export function startAssistantDaemon(): void {
  const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`\nđŸ¤– AI Coding Assistant Daemon running at http://127.0.0.1:${PORT}`);
    console.log(`   Workspace root: ${getWorkspaceRoot()}`);
    console.log(`   Endpoints:`);
    console.log(`     GET  http://127.0.0.1:${PORT}/health`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/ask`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/edit`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/apply`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/rollback`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/create`);
    console.log(`     GET  http://127.0.0.1:${PORT}/api/status`);
    console.log(`     POST http://127.0.0.1:${PORT}/webhook/telegram`);

    // Auto-start Observer Agent on daemon startup
     startObserver({ intervalMs: 30000, enabled: true, alertOnDegraded: true });
     console.log(`   Observer Agent: auto-started (30s interval)`);

     // Auto-start Self-Healing on daemon startup
     startSelfHealing(60000);
     console.log(`   Self-Healing: auto-started (60s interval)`);
   });

  // Auto-start Telegram polling if configured
  const telegramMode = process.env.TELEGRAM_MODE ?? "polling";
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (telegramToken && telegramMode === "polling") {
    console.log(`[Telegram] Starting polling mode...`);
    startTelegramPolling({ pendingSuggestions }).catch((err: Error) => {
      console.error(`[Telegram] Polling failed:`, err.message);
    });
  } else if (telegramToken && telegramMode === "webhook") {
    console.log(`[Telegram] Webhook mode â€” set your webhook URL to: <your-public-url>/webhook/telegram`);
  } else if (!telegramToken) {
    console.log(`[Telegram] TELEGRAM_BOT_TOKEN not set â€” bot disabled. Set it in .env to enable.`);
  }

  return server as any;
}

// Auto-start when run directly (tsx, node, or bundled CJS)
const isEntryPoint = process.argv[1]?.replace(/\\/g, "/").endsWith("server/assistant-daemon.ts") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("assistant-daemon.js");
if (isEntryPoint) {
  startAssistantDaemon();
}

export default app;
