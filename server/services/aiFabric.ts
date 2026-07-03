/**
 * aiFabric.ts
 * ============================================================
 * AI Fabric — lớp dispatch thống nhất giữa API providers,
 * Web AI browser sessions và local LLM (Ollama).
 *
 * Quy tắc ưu tiên: API trước → Web sau → Local cuối
 * Mỗi bước dispatch đều ghi audit log để truy vết.
 */
import { callAIWithFallback } from "./aiRouter.ts";
import { executeWebAIAutomation, profileStatusForWebAIError, WebAIError } from "./webAiAutomator.ts";
import { WebAiSessionManager, type WebAIProfile } from "./webAiSessionManager.ts";
import { WebAiTaskRouter, type TaskDomain } from "./webAiTaskRouter.ts";
import { appendAuditEvent } from "./auditLog.ts";
import { recordUsage } from "./costObservability.ts";
import type { CallAIOptions, ChatMessage, NormalizedToolCall, ToolSpec } from "./aiClient.ts";

let routeAIThroughProvider = callAIWithFallback;

export function setAIFabricRouterForTest(router: typeof callAIWithFallback): () => void {
  routeAIThroughProvider = router;
  return () => {
    routeAIThroughProvider = callAIWithFallback;
  };
}

// ─── Types ──────────────────────────────────────────────────────────
export type FabricRoute = "api" | "web" | "local" | "bypass";
export type FabricRunStatus = "completed" | "api_failed" | "web_failed" | "local_failed" | "all_exhausted" | "bypassed";

export interface FabricStep {
  route: FabricRoute;
  provider?: string;
  profileId?: string;
  profileName?: string;
  status: "success" | "failed" | "skipped";
  error?: string;
  latencyMs: number;
  contentPreview?: string;
  toolCalls?: NormalizedToolCall[];
  evidence?: Record<string, unknown>;
}

export interface FabricRun {
  id: string;
  task: string;
  domain: TaskDomain;
  status: FabricRunStatus;
  startedAt: string;
  completedAt: string;
  steps: FabricStep[];
  winner?: FabricStep;
  modelUsed?: string;
  totalLatencyMs: number;
}

export interface AIFabricOptions {
  task?: string;           // VD: "coding"
  domain?: TaskDomain;     // VD: "finance"
  webPlatform?: string;    // Platform cụ thể cho Web AI
  profileId?: string;      // Profile ID cụ thể
  headless?: boolean;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolSpec[];
  toolChoice?: CallAIOptions["toolChoice"];
  captureScreenshot?: boolean;
  localFallback?: boolean; // Cho phép fallback sang Ollama local
  agentRole?: string;
  filePath?: string;       // File cần phân tích qua Web AI
}

// ─── Fabric dispatch ────────────────────────────────────────────────

export async function dispatchThroughFabric(
  messages: ChatMessage[],
  options: AIFabricOptions = {}
): Promise<FabricRun> {
  const runId = `fabric_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  const startedAt = new Date().toISOString();
  const started = Date.now();

  const run: FabricRun = {
    id: runId,
    task: options.task || "general",
    domain: (options.domain as TaskDomain) || "general",
    status: "all_exhausted",
    startedAt,
    completedAt: startedAt,
    steps: [],
    totalLatencyMs: 0,
  };

  const userText = messages.filter(m => m.role === "user").map(m => m.content).join("\n");

  // ── Step 1: API route ─────────────────────────────────────────────
  try {
    const stepStart = Date.now();
    const result = await routeAIThroughProvider(messages, {
      model: options.agentRole || "ai-assistant",
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      task: options.task,
      tools: options.tools,
      toolChoice: options.toolChoice,
    });

    run.steps.push({
      route: "api",
      provider: result.modelUsed,
      status: "success",
      latencyMs: Date.now() - stepStart,
      contentPreview: result.content.slice(0, 200),
      toolCalls: result.toolCalls || [],
    });

    run.status = "completed";
    run.winner = run.steps[run.steps.length - 1];
    run.modelUsed = result.modelUsed;
    run.completedAt = new Date().toISOString();
    run.totalLatencyMs = Date.now() - started;

    // Track cost
    recordUsage({
      agent: 'fabric',
      model: result.modelUsed || 'unknown',
      route: 'api',
      domain: (options?.domain as string) || 'general',
      completionText: result.content,
      latencyMs: run.totalLatencyMs,
      success: true,
      taskSummary: userText.slice(0, 150),
    });

    await appendAuditEvent({
      actor: "system",
      workspace: "AI Fabric",
      action: "ai_fabric.dispatch",
      target: options.task || "general",
      risk: "LOW",
      status: "executed",
      summary: `AI Fabric dispatched to API (${result.modelUsed}) in ${run.totalLatencyMs}ms.`,
      connectorId: "ai-fabric",
      evidence: { runId, route: "api", steps: 1 },
    }).catch(() => undefined);

    return run;
  } catch (apiErr: any) {
    run.steps.push({
      route: "api",
      status: "failed",
      error: apiErr.message?.slice(0, 200),
      latencyMs: 0,
    });
    console.warn(`[AI Fabric] API route failed: ${apiErr.message}`);
  }

  // ── Step 2: Web AI route ──────────────────────────────────────────
  try {
    const platform = options.webPlatform || "chatgpt";
    const domain = options.domain || "general";
    const stepStart = Date.now();

    // Route recommendation
    let recommend;
    try {
      recommend = await WebAiTaskRouter.recommend(userText);
    } catch {
      recommend = { platform, reasoning: "Default dispatch" };
    }

    const targetPlatform = (recommend?.platform as string) || platform;
    const profiles = await WebAiSessionManager.listAvailableProfiles(targetPlatform, options.profileId);
    const profile = profiles[0];

    if (!profile) {
      throw new WebAIError(
        "login_required",
        `No available ${targetPlatform} profile. Please check login status.`,
        targetPlatform
      );
    }

    const webResult = await executeWebAIAutomation(targetPlatform, userText, options.filePath, {
      profileId: profile.id,
      headless: options.headless ?? true,
      captureScreenshot: options.captureScreenshot,
    });

    await WebAiSessionManager.recordProfileResult(profile.id, { status: "ready" });

    run.steps.push({
      route: "web",
      provider: targetPlatform,
      profileId: profile.id,
      profileName: profile.name,
      status: "success",
      latencyMs: Date.now() - stepStart,
      contentPreview: webResult.text.slice(0, 200),
      evidence: { modelUsed: webResult.modelUsed, platform: targetPlatform },
    });

    run.status = "completed";
    run.winner = run.steps[run.steps.length - 1];
    run.modelUsed = `${targetPlatform}/${webResult.modelUsed || "web"}`;
    run.completedAt = new Date().toISOString();
    run.totalLatencyMs = Date.now() - started;

    await appendAuditEvent({
      actor: "system",
      workspace: "AI Fabric",
      action: "ai_fabric.dispatch",
      target: targetPlatform,
      risk: "MEDIUM",
      status: "executed",
      summary: `AI Fabric dispatched to Web (${targetPlatform}/${profile.name}) in ${run.totalLatencyMs}ms.`,
      connectorId: "ai-fabric",
      evidence: { runId, route: "web", profileUsed: profile.id },
    }).catch(() => undefined);

    return run;
  } catch (webErr: any) {
    const status = profileStatusForWebAIError(webErr);
    const quotaResetAt = webErr instanceof WebAIError ? webErr.quotaResetAt : undefined;
    run.steps.push({
      route: "web",
      status: "failed",
      error: webErr.message?.slice(0, 200),
      latencyMs: 0,
      evidence: { webStatus: status, quotaResetAt },
    });
    console.warn(`[AI Fabric] Web route failed: ${webErr.message}`);
  }

  // ── Step 3: Local route (Ollama) ──────────────────────────────────
  if (options.localFallback !== false) {
    try {
      const stepStart = Date.now();

      // Tạo entry giả cho Ollama nếu chưa có key
      const ollamaEntry = {
        id: "local-ollama",
        provider: "ollama" as const,
        label: "Ollama Local (Fabric Fallback)",
        apiKey: "",
        model: "qwen2.5:7b",
        enabled: true,
        priority: 99,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await routeAIThroughProvider(messages, {
        model: "ollama-local",
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 1024,
        task: options.task,
        tools: options.tools,
        toolChoice: options.toolChoice,
      });

      run.steps.push({
        route: "local",
        provider: "ollama",
        status: "success",
        latencyMs: Date.now() - stepStart,
        contentPreview: result.content.slice(0, 200),
        toolCalls: result.toolCalls || [],
      });

      run.status = "completed";
      run.winner = run.steps[run.steps.length - 1];
      run.modelUsed = result.modelUsed || "ollama-local";
      run.completedAt = new Date().toISOString();
      run.totalLatencyMs = Date.now() - started;

      // Track cost (local = free)
      recordUsage({
        agent: 'fabric',
        model: 'ollama',
        route: 'local',
        domain: (options?.domain as string) || 'general',
        completionText: result.content,
        latencyMs: run.totalLatencyMs,
        success: true,
        taskSummary: userText.slice(0, 150),
      });

      await appendAuditEvent({
        actor: "system",
        workspace: "AI Fabric",
        action: "ai_fabric.dispatch",
        target: "ollama-local",
        risk: "LOW",
        status: "executed",
        summary: `AI Fabric dispatched to Local (Ollama) in ${run.totalLatencyMs}ms.`,
        connectorId: "ai-fabric",
        evidence: { runId, route: "local" },
      }).catch(() => undefined);

      return run;
    } catch (localErr: any) {
      run.steps.push({
        route: "local",
        status: "failed",
        error: localErr.message?.slice(0, 200),
        latencyMs: 0,
      });
      console.warn(`[AI Fabric] Local route failed: ${localErr.message}`);
    }
  } else {
    run.steps.push({ route: "local", status: "skipped", latencyMs: 0 });
  }

  // ── Final: all exhausted ──────────────────────────────────────────
  run.completedAt = new Date().toISOString();
  run.totalLatencyMs = Date.now() - started;

  await appendAuditEvent({
    actor: "system",
    workspace: "AI Fabric",
    action: "ai_fabric.dispatch",
    target: options.task || "general",
    risk: "HIGH",
    status: "failed",
    summary: `AI Fabric exhausted all routes. Steps: ${run.steps.map(s => `${s.route}=${s.status}`).join(", ")}`,
    connectorId: "ai-fabric",
    evidence: { runId, steps: run.steps.length },
  }).catch(() => undefined);

  return run;
}

export async function dispatchTextThroughFabric(
  text: string,
  systemInstruction?: string,
  options: AIFabricOptions = {}
): Promise<FabricRun> {
  const messages: ChatMessage[] = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  messages.push({ role: "user", content: text });
  return dispatchThroughFabric(messages, options);
}

export async function checkFabricHealth(): Promise<{
  ok: boolean;
  apiKeys: number;
  webProfiles: number;
  localAvailable: boolean;
  message: string;
}> {
  const apiEntries = await getEnabledAIKeyEntriesWrapper();
  const profiles = await WebAiSessionManager.listProfiles();
  const readyProfiles = profiles.filter(p => p.enabled && p.status === "ready");

  let localAvailable = false;
  try {
    const res = await fetch("http://127.0.0.1:11434/api/tags", { signal: AbortSignal.timeout(3000) });
    localAvailable = res.ok;
  } catch {
    localAvailable = false;
  }

  return {
    ok: apiEntries.length > 0 || readyProfiles.length > 0 || localAvailable,
    apiKeys: apiEntries.length,
    webProfiles: readyProfiles.length,
    localAvailable,
    message: apiEntries.length > 0
      ? `${apiEntries.length} API key(s) sẵn sàng.`
      : readyProfiles.length > 0
        ? `${readyProfiles.length} Web profile(s) sẵn sàng.`
        : localAvailable
          ? "Ollama local sẵn sàng."
          : "Không có route AI nào khả dụng.",
  };
}

// Deferred import to avoid circular dependency
async function getEnabledAIKeyEntriesWrapper(): Promise<Array<{ id: string }>> {
  try {
    const { getEnabledAIKeyEntries } = await import("./aiKeyVault.ts");
    return await getEnabledAIKeyEntries();
  } catch {
    return [];
  }
}
