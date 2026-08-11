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
import { validateAIOutput } from "./aiOutputValidator.ts";
import { searchKnowledgeGraph } from "./knowledgeGraph.ts";
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
  // V2: actionable diagnostics
  errorCode?: string;        // api_quota, web_login_required, web_no_profile, local_unavailable, etc.
  fixSuggestion?: string;    // Hướng dẫn người dùng cách sửa
  fixAction?: string;        // Hành động cụ thể: "open_login", "add_api_key", "install_ollama"
  fixActionLabel?: string;   // Nhãn nút hiển thị cho người dùng
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

// ─── Response Cache System (TTL 5 minutes) ───────────────────────────
interface CachedFabricRun {
  run: FabricRun;
  expiresAt: number;
}
const fabricResponseCache = new Map<string, CachedFabricRun>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearFabricResponseCache(): void {
  fabricResponseCache.clear();
}

// ─── Fabric dispatch ────────────────────────────────────────────────

export async function dispatchThroughFabric(
  messages: ChatMessage[],
  options: AIFabricOptions = {}
): Promise<FabricRun> {
  const userText = messages.filter(m => m.role === "user").map(m => m.content).join("\n");

  // Check cache for identical query (short-circuit for fast response & token savings)
  const cacheKey = `${options.domain || 'general'}:${options.task || 'general'}:${userText.slice(0, 300)}`;
  const cached = fabricResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[AI Fabric] ⚡ Cache HIT for query: "${userText.slice(0, 50)}..."`);
    return {
      ...cached.run,
      id: `fabric_cached_${Date.now()}`,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      totalLatencyMs: 5,
    };
  }

  const runId = `fabric_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  const startedAt = new Date().toISOString();
  const started = Date.now();

  // Knowledge Items (KI) Enrichment — search repo memory before dispatching
  try {
    const kiMatches = searchKnowledgeGraph(userText, { maxResults: 3 });
    if (kiMatches.length > 0) {
      const kiSummary = kiMatches.map(m => `• [${m.node.type}] ${m.node.label}: ${m.node.description}`).join("\n");
      const kiHeader = `\n\n🧠 [KNOWLEDGE ITEMS SNAPSHOT - TRI THỨC DỰ ÁN TÍCH LŨY]:\n${kiSummary}`;
      const sysMsg = messages.find(m => m.role === "system");
      if (sysMsg) {
        sysMsg.content += kiHeader;
      } else {
        messages.unshift({ role: "system", content: kiHeader.trim() });
      }
    }
  } catch {
    // Non-fatal if Knowledge Graph search fails
  }

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

  // ── Step 1: API route ─────────────────────────────────────────────
  try {
    const stepStart = Date.now();
    const result = await routeAIThroughProvider(messages, {
      model: (options.agentRole as any) || "ai-assistant",
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      task: options.task,
      tools: options.tools,
      toolChoice: options.toolChoice,
    });

    const validation = validateAIOutput(userText, result.content);
    run.steps.push({
      route: "api",
      provider: result.modelUsed,
      status: "success",
      latencyMs: Date.now() - stepStart,
      contentPreview: result.content.slice(0, 200),
      toolCalls: result.toolCalls || [],
      evidence: { validationSummary: validation.summary, valid: validation.valid },
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

    fabricResponseCache.set(cacheKey, { run, expiresAt: Date.now() + CACHE_TTL_MS });
    return run;
  } catch (apiErr: any) {
    // Phân tích lỗi API để đưa ra gợi ý phù hợp
    const apiMsg = apiErr.message?.toLowerCase() || "";
    let errorCode = "api_unknown";
    let fixSuggestion: string | undefined;
    let fixAction: string | undefined;
    let fixActionLabel: string | undefined;
    
    if (apiMsg.includes("quota") || apiMsg.includes("rate") || apiMsg.includes("exceeded") || apiMsg.includes("429")) {
      errorCode = "api_quota";
      fixSuggestion = "API key đã hết quota. Hệ thống sẽ tự động chuyển sang Web AI. Nếu Web AI chưa được thiết lập, vào Đội ngũ AI → Profiles để tạo tài khoản.";
    } else if (apiMsg.includes("key") || apiMsg.includes("auth") || apiMsg.includes("unauthorized") || apiMsg.includes("401") || apiMsg.includes("403")) {
      errorCode = "api_auth";
      fixSuggestion = "API key không hợp lệ hoặc đã hết hạn. Vào Cài đặt AI → AI Settings để cập nhật key mới.";
      fixAction = "open_ai_settings";
      fixActionLabel = "Mở AI Settings";
    } else if (apiMsg.includes("no enabled") || apiMsg.includes("no api key") || apiMsg.includes("no key")) {
      errorCode = "api_no_key";
      fixSuggestion = "Chưa có API key nào được thiết lập. Vào Cài đặt AI → AI Settings để thêm key (Gemini miễn phí, Groq miễn phí...).";
      fixAction = "open_ai_settings";
      fixActionLabel = "Thêm API Key";
    }
    
    run.steps.push({
      route: "api",
      status: "failed",
      error: apiErr.message?.slice(0, 300),
      latencyMs: 0,
      errorCode,
      fixSuggestion,
      fixAction,
      fixActionLabel,
    });
    console.warn(`[AI Fabric] API route failed (${errorCode}): ${apiErr.message}`);
  }

  // ── Step 2: Web AI route ──────────────────────────────────────────
  try {
    const platform = options.webPlatform || "chatgpt";
    const domain = options.domain || "general";
    const stepStart = Date.now();

    // Route recommendation: chỉ dùng router nếu user KHÔNG chọn platform cụ thể
    let recommend;
    if (!options.webPlatform) {
      try {
        recommend = await WebAiTaskRouter.recommend(userText);
      } catch {
        recommend = { platform, reasoning: "Default dispatch" };
      }
    }

    const targetPlatform = options.webPlatform || ((recommend as any)?.recommendations?.[0]?.platform as string) || platform;
    const profiles = await WebAiSessionManager.listAvailableProfiles(targetPlatform, options.profileId);
    const profile = profiles[0];

    if (!profile) {
      // Phân biệt: không có profile nào vs có profile nhưng chưa login
      const allProfiles = await WebAiSessionManager.listProfiles();
      const platformProfiles = allProfiles.filter(p => p.platform === targetPlatform);
      const hasProfiles = platformProfiles.length > 0;
      const hasUntested = platformProfiles.some(p => p.status === "untested");
      
      let errMsg: string;
      let errorCode: string;
      let fixSuggestion: string;
      let fixAction: string;
      let fixActionLabel: string;
      
      if (!hasProfiles) {
        errMsg = `Chưa có tài khoản ${targetPlatform.toUpperCase()} nào được thiết lập.`;
        errorCode = "web_no_profile";
        fixSuggestion = `Vào Đội ngũ AI → Profiles → Thêm tài khoản mới, chọn nền tảng ${targetPlatform.toUpperCase()}, sau đó bấm "🔑 Đăng nhập Chrome" để đăng nhập một lần.`;
        fixAction = "create_profile";
        fixActionLabel = `Tạo tài khoản ${targetPlatform.toUpperCase()}`;
      } else if (hasUntested) {
        errMsg = `Tài khoản ${targetPlatform.toUpperCase()} đã được tạo nhưng CHƯA ĐĂNG NHẬP.`;
        errorCode = "web_login_required";
        fixSuggestion = `Vào Đội ngũ AI → Profiles, chọn tài khoản ${targetPlatform.toUpperCase()}, bấm "🔑 Đăng nhập Chrome". Sau khi đăng nhập xong, ĐÓNG cửa sổ Chrome để hệ thống ghi nhận.`;
        fixAction = "open_login";
        fixActionLabel = `Mở đăng nhập ${targetPlatform.toUpperCase()}`;
      } else {
        errMsg = `Không có tài khoản ${targetPlatform.toUpperCase()} nào khả dụng (tất cả đều bị lỗi hoặc hết quota).`;
        errorCode = "web_all_unavailable";
        fixSuggestion = `Vào Đội ngũ AI → Profiles để kiểm tra trạng thái các tài khoản ${targetPlatform.toUpperCase()}. Tạo tài khoản mới nếu cần.`;
        fixAction = "check_profiles";
        fixActionLabel = "Kiểm tra Profiles";
      }
      
      throw new WebAIError(errMsg, "login_required" as any, true);
    }

    // Đánh dấu profile sẽ được dùng, nếu là untested thì thử chạy không headless để user có thể login
    const shouldShowBrowser = profile.status === "untested" || profile.status === "login_required";
    const effectiveHeadless = shouldShowBrowser ? false : (options.headless ?? true);
    
    if (shouldShowBrowser) {
      console.log(`[AI Fabric] Profile ${profile.name} is untested/login_required. Opening visible browser for login...`);
    }

    const webResult = await executeWebAIAutomation(targetPlatform, userText, options.filePath, {
      profileId: profile.id,
      headless: effectiveHeadless,
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
    const isWebAIError = webErr instanceof WebAIError;
    const errorCode = isWebAIError ? `web_${webErr.code}` : "web_unknown";
    
    // Tạo thông báo sửa lỗi dựa trên loại lỗi
    let fixSuggestion: string | undefined;
    let fixAction: string | undefined;
    let fixActionLabel: string | undefined;
    
    if (isWebAIError && webErr.code === "login_required") {
      fixSuggestion = `Tài khoản Web AI chưa đăng nhập. Vào Đội ngũ AI → Profiles → bấm "🔑 Đăng nhập Chrome" để đăng nhập một lần. Sau đó đóng cửa sổ Chrome.`;
      fixAction = "open_login";
      fixActionLabel = "Mở đăng nhập Chrome";
    } else if (isWebAIError && webErr.code === "quota") {
      fixSuggestion = `Tài khoản Web AI đã hết lượt dùng. Hãy đợi quota reset hoặc tạo tài khoản mới trong Đội ngũ AI → Profiles.`;
      fixAction = "check_profiles";
      fixActionLabel = "Kiểm tra Profiles";
    } else if (status === "error") {
      fixSuggestion = `Lỗi kỹ thuật khi chạy Web AI. Kiểm tra Chrome đã được cài đặt và không bị chặn bởi firewall.`;
    }
    
    run.steps.push({
      route: "web",
      status: "failed",
      error: webErr.message?.slice(0, 300),
      latencyMs: 0,
      evidence: { webStatus: status, quotaResetAt },
      errorCode,
      fixSuggestion,
      fixAction,
      fixActionLabel,
    });
    console.warn(`[AI Fabric] Web route failed (${errorCode}): ${webErr.message}`);
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
        model: "ollama-local" as any,
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
        error: localErr.message?.slice(0, 300),
        latencyMs: 0,
        errorCode: "local_unavailable",
        fixSuggestion: "Ollama không khả dụng. Cài đặt Ollama từ https://ollama.com và chạy lệnh: ollama pull qwen2.5:7b",
        fixAction: "install_ollama",
        fixActionLabel: "Hướng dẫn cài Ollama",
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
