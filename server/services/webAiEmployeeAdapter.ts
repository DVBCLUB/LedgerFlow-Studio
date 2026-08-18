/**
 * webAiEmployeeAdapter.ts
 * ============================================================
 * Biến mỗi AI "nhân viên" thành worker thực thi, với:
 *   1. API-first: ưu tiên gọi qua aiRouter (free tier/API chính thống).
 *   2. Khi hết quota API → tự động fallback sang web chat, NHƯNG bị chặn
 *      bởi cổng ToS (commercial account bị block; cá nhân phải manual-assist).
 *   3. Nhân viên web chat "đi làm" bằng cách poll mailbox trên A2A hub,
 *      thực thi bằng web automator rồi gửi kết quả ngược lại hub — tức là
 *      các AI web chat làm việc với nhau THÔNG QUA TRUNG GIAN (A2A hub).
 *
 * Lưu ý: KHÔNG chứa cơ chế lách phát hiện (đổi fingerprint/bypass captcha).
 * Web chat chỉ được dùng ở chế độ hợp lệ: tài khoản cá nhân, có người duyệt.
 */

import { getAgentEmployeeById, evaluateWebChatCompliance, listAgentEmployees, type AgentEmployee } from './agentEmployeeRegistry.ts';
import { callAIWithFallback } from './aiRouter.ts';
import { WebAiSessionManager, type WebAIProfile } from './webAiSessionManager.ts';
import { executeWebAIAutomation } from './webAiAutomator.ts';
import { sendA2AMessage, fetchAgentMailbox, markA2AMessageStatus } from './agentCollaborationProtocol.ts';
import { buildLocalContext, recordCrossAiLesson } from './localLearningStore.ts';
import { callLocalModel } from './localModelRuntime.ts';
import { persistAgentResult } from './aiBusinessBridge.ts';
import type { BusinessEntityType } from './businessDataService.ts';
import { checkBudgetGate } from './costGovernor.ts';
import { recordUsage } from './costObservability.ts';

export type UsedBinding = 'api' | 'web_chat' | 'local';

export interface EmployeeTaskResult {
  employeeId: string;
  success: boolean;
  usedBinding: UsedBinding;
  provider?: string;
  content?: string;
  error?: string;
  needsApproval?: boolean;
  quotaFallbackHappened: boolean;
  compliance?: { allowed: boolean; mode: string; reasons: string[] };
}

export interface PollMailboxResult {
  employeeId: string;
  processed: number;
  replied: number;
  blocked: number;
  errors: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const PLATFORM_FOR_DOMAIN: Record<string, string> = {
  coding: 'claude',
  finance: 'gemini',
  marketing: 'chatgpt',
  sales: 'chatgpt',
  general: 'chatgpt',
};

function termsModeForPlatform(platform: string): 'standard_terms' | 'commercial_terms' {
  // Gemini consumer web UI dùng commercial terms → tự động hóa bị chặn.
  return platform === 'gemini' ? 'commercial_terms' : 'standard_terms';
}

function isQuotaLikeError(err: unknown): boolean {
  const text = `${(err as any)?.status || ''} ${(err as any)?.message || ''}`.toLowerCase();
  return text.includes('429') || text.includes('quota') || text.includes('rate limit') || text.includes('too many requests') || text.includes('resource_exhausted');
}

function pickWebProfile(profiles: WebAIProfile[], preferredId: string | undefined, domains: string[]): WebAIProfile | undefined {
  const ready = profiles.filter((p) => p.enabled && p.status === 'ready');
  if (!ready.length) return undefined;
  if (preferredId) {
    const preferred = ready.find((p) => p.id === preferredId);
    if (preferred) return preferred;
  }
  const targetPlatform = PLATFORM_FOR_DOMAIN[domains[0] || 'general'] || 'chatgpt';
  return ready.find((p) => p.platform === targetPlatform) || ready[0];
}

// Mỗi role → loại entity nghiệp vụ tương ứng khi AI hoàn thành việc.
const ROLE_BUSINESS_TYPE: Record<string, BusinessEntityType> = {
  'AI Sales': 'deal',
  'AI Marketer': 'campaign',
  'AI CFO': 'invoice',
  'AI Accountant': 'invoice',
  'AI Auditor': 'knowledge',
  'AI Research': 'knowledge',
  'AI Analyst': 'knowledge',
  'AI Product Owner': 'product',
  'AI PM': 'product',
  'AI Legal': 'task',
  'AI Support': 'task',
  'AI Onboarding': 'task',
  'AI HR': 'task',
  'Chief of Staff': 'task',
};

// Ghi kết quả AI hoàn thành thành entity nghiệp vụ (Business API) để founder
// thấy được "AI đã làm gì" trong Business Hub — không chỉ nằm trong hộp thư A2A.
function persistEmployeeOutput(input: {
  employee: AgentEmployee;
  subject: string;
  prompt: string;
  output: string;
  threadId?: string;
}): void {
  try {
    const type = ROLE_BUSINESS_TYPE[input.employee.roleId] ?? 'task';
    persistAgentResult({
      type,
      data: {
        title: input.subject,
        prompt: input.prompt.slice(0, 500),
        output: input.output.slice(0, 2000),
        employeeId: input.employee.id,
        roleId: input.employee.roleId,
        threadId: input.threadId ?? '',
      },
      source: 'ai',
    });
  } catch {
    // Ghi nghiệp vụ thất bại không được chặn luồng làm việc.
  }
}

// ─── Core: API-first + quota fallback → web chat ─────────────────────────────
export async function executeEmployeeTask(input: {
  employeeId: string;
  prompt: string;
  allowWebChatFallback?: boolean;
  webProfileId?: string;
  /** Bắt buộc true khi cần fallback sang web chat (human approval). */
  approved?: boolean;
  /** Local-first: thử Ollama trước, API free tier là dự phòng. */
  localFirst?: boolean;
  /** Override provider/model khi điều phối theo loại việc. */
  preferredProvider?: string;
  preferredModel?: string;
}): Promise<EmployeeTaskResult> {
  const employee = getAgentEmployeeById(input.employeeId);
  if (!employee) {
    return { employeeId: input.employeeId, success: false, usedBinding: 'api', error: 'Employee not found.', quotaFallbackHappened: false };
  }

  const allowWebChatFallback = input.allowWebChatFallback !== false;

  // 0) Local-first (nếu bật): model local trước, API free tier là dự phòng.
  if (input.localFirst) {
    const t0 = Date.now();
    const learnedContext = buildLocalContext(input.prompt, employee.domains[0]);
    const localResult = await callLocalModel({
      system: employee.systemPrompt + learnedContext,
      prompt: input.prompt,
    });
    if (localResult.ok && localResult.content) {
      recordCrossAiLesson({
        domain: employee.domains[0] || 'general',
        title: input.prompt.slice(0, 80),
        content: localResult.content,
        source: 'local:ollama',
        success: true,
      });
      recordUsage({
        agent: employee.roleId,
        model: localResult.model || 'ollama',
        route: 'local',
        domain: employee.domains[0] || 'general',
        promptText: input.prompt,
        completionText: localResult.content,
        latencyMs: Date.now() - t0,
        success: true,
        taskSummary: input.prompt.slice(0, 200),
      });
      return {
        employeeId: input.employeeId,
        success: true,
        usedBinding: 'local',
        provider: localResult.model || 'ollama',
        content: localResult.content,
        quotaFallbackHappened: false,
      };
    }
    // local thất bại → rơi xuống API-first bên dưới.
  }

  // 1) API-first (có chốt ngân sách trước khi chi tiền)
  const gate = checkBudgetGate({ agent: employee.roleId, domain: employee.domains[0] });
  if (!gate.allowed) {
    return {
      employeeId: input.employeeId,
      success: false,
      usedBinding: 'api',
      error: gate.reason || 'Budget gate closed.',
      quotaFallbackHappened: false,
    };
  }
  try {
    const t0 = Date.now();
    const learnedContext = buildLocalContext(input.prompt, employee.domains[0]);
    const result = await callAIWithFallback(
      [
        { role: 'system', content: employee.systemPrompt + learnedContext },
        { role: 'user', content: input.prompt },
      ],
      { preferredProvider: (input.preferredProvider || employee.binding.provider) as any, preferredModel: input.preferredModel, temperature: 0.4 }
    );
    recordUsage({
      agent: employee.roleId,
      model: result.modelUsed || employee.binding.provider || 'unknown',
      route: 'api',
      domain: employee.domains[0] || 'general',
      promptText: input.prompt,
      completionText: result.content,
      latencyMs: Date.now() - t0,
      success: true,
      taskSummary: input.prompt.slice(0, 200),
    });
    recordCrossAiLesson({
      domain: employee.domains[0] || 'general',
      title: input.prompt.slice(0, 80),
      content: result.content,
      source: `api:${employee.binding.provider || 'ai'}`,
      success: true,
    });
    return {
      employeeId: input.employeeId,
      success: true,
      usedBinding: 'api',
      provider: employee.binding.provider,
      content: result.content,
      quotaFallbackHappened: false,
    };
  } catch (apiErr) {
    if (!allowWebChatFallback || !isQuotaLikeError(apiErr)) {
      return {
        employeeId: input.employeeId,
        success: false,
        usedBinding: 'api',
        error: apiErr instanceof Error ? apiErr.message : String(apiErr),
        quotaFallbackHappened: false,
      };
    }
    // Quota exhausted → try web chat (gated below)
  }

  // 2) Web chat fallback — ToS gate (cần người duyệt trước khi dùng web chat)
  if (input.approved !== true) {
    return {
      employeeId: input.employeeId,
      success: false,
      usedBinding: 'web_chat',
      needsApproval: true,
      error: 'Web-chat fallback requires human approval before execution.',
      quotaFallbackHappened: true,
    };
  }

  const profiles = await WebAiSessionManager.listProfiles();
  const profile = pickWebProfile(profiles, input.webProfileId, employee.domains);
  if (!profile) {
    return {
      employeeId: input.employeeId,
      success: false,
      usedBinding: 'web_chat',
      error: 'API quota exhausted and no ready web profile available for fallback.',
      quotaFallbackHappened: true,
    };
  }

  const compliance = evaluateWebChatCompliance({
    enabled: profile.enabled,
    status: profile.status,
    termsMode: termsModeForPlatform(profile.platform),
  });

  if (!compliance.allowed) {
    return {
      employeeId: input.employeeId,
      success: false,
      usedBinding: 'web_chat',
      error: `Web chat fallback blocked by ToS gate: ${compliance.reasons.join('; ')}`,
      quotaFallbackHappened: true,
      compliance: { allowed: false, mode: compliance.mode, reasons: compliance.reasons },
    };
  }

  try {
    const t0 = Date.now();
    const webResult = await executeWebAIAutomation(profile.platform, input.prompt, undefined, { profileId: profile.id });
    recordUsage({
      agent: employee.roleId,
      model: profile.platform,
      route: 'web',
      domain: employee.domains[0] || 'general',
      promptText: input.prompt,
      completionText: webResult.text,
      latencyMs: Date.now() - t0,
      success: true,
      taskSummary: input.prompt.slice(0, 200),
    });
    recordCrossAiLesson({
      domain: employee.domains[0] || 'general',
      title: input.prompt.slice(0, 80),
      content: webResult.text,
      source: `web:${profile.platform}`,
      success: true,
    });
    return {
      employeeId: input.employeeId,
      success: true,
      usedBinding: 'web_chat',
      provider: profile.platform,
      content: webResult.text,
      quotaFallbackHappened: true,
      compliance: { allowed: true, mode: compliance.mode, reasons: compliance.reasons },
    };
  } catch (webErr) {
    return {
      employeeId: input.employeeId,
      success: false,
      usedBinding: 'web_chat',
      error: webErr instanceof Error ? webErr.message : String(webErr),
      quotaFallbackHappened: true,
      compliance: { allowed: true, mode: compliance.mode, reasons: compliance.reasons },
    };
  }
}

// ─── Web-chat employee "đi làm" qua A2A hub ──────────────────────────────────
export async function pollEmployeeMailbox(input: {
  employeeId: string;
  webProfileId?: string;
}): Promise<PollMailboxResult> {
  const employee = getAgentEmployeeById(input.employeeId);
  const result: PollMailboxResult = { employeeId: input.employeeId, processed: 0, replied: 0, blocked: 0, errors: [] };
  if (!employee) {
    result.errors.push('Employee not found.');
    return result;
  }

  const unread = fetchAgentMailbox(employee.roleId, { status: 'unread' });
  const profiles = await WebAiSessionManager.listProfiles();
  const profile = pickWebProfile(profiles, input.webProfileId, employee.domains);

  for (const msg of unread) {
    result.processed++;
    if (!profile) {
      result.blocked++;
      result.errors.push(`${employee.roleId}: no ready web profile available.`);
      continue;
    }

    const compliance = evaluateWebChatCompliance({
      enabled: profile.enabled,
      status: profile.status,
      termsMode: termsModeForPlatform(profile.platform),
    });
    if (!compliance.allowed) {
      result.blocked++;
      result.errors.push(`${employee.roleId}: ${compliance.reasons.join('; ')}`);
      continue;
    }

    try {
      const webResult = await executeWebAIAutomation(profile.platform, msg.body, undefined, { profileId: profile.id });
      // Gửi kết quả ngược lại người gửi thông qua trung gian (A2A hub).
      sendA2AMessage({
        threadId: msg.threadId,
        senderRole: employee.roleId,
        recipientRole: msg.senderRole,
        messageType: 'share_artifact',
        subject: `RE: ${msg.subject}`,
        body: webResult.text,
      });
      markA2AMessageStatus(msg.id, employee.roleId, 'completed');
      persistEmployeeOutput({
        employee,
        subject: msg.subject,
        prompt: msg.body,
        output: webResult.text,
        threadId: msg.threadId,
      });
      result.replied++;
    } catch (err) {
      result.errors.push(`${employee.roleId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

// ─── Nhân viên "đi làm": xử lý hộp thư A2A (API-first) ─────────────────────────
export async function runEmployeeShift(input: {
  employeeId: string;
  webProfileId?: string;
}): Promise<PollMailboxResult> {
  const employee = getAgentEmployeeById(input.employeeId);
  const result: PollMailboxResult = { employeeId: input.employeeId, processed: 0, replied: 0, blocked: 0, errors: [] };
  if (!employee) {
    result.errors.push('Employee not found.');
    return result;
  }

  const unread = fetchAgentMailbox(employee.roleId, { status: 'unread' });
  for (const msg of unread) {
    result.processed++;
    const task = await executeEmployeeTask({
      employeeId: input.employeeId,
      prompt: msg.body,
      webProfileId: input.webProfileId,
      approved: msg.approved === true,
    });

    if (task.needsApproval) {
      result.blocked++;
      result.errors.push(`${employee.roleId}: tin "${msg.subject}" cần người duyệt trước khi dùng web chat.`);
      continue;
    }
    if (!task.success) {
      result.blocked++;
      result.errors.push(`${employee.roleId}: ${task.error || 'failed'}`);
      continue;
    }

    // Gửi kết quả ngược lại người gửi thông qua trung gian (A2A hub).
    sendA2AMessage({
      threadId: msg.threadId,
      senderRole: employee.roleId,
      recipientRole: msg.senderRole,
      messageType: 'share_artifact',
      subject: `RE: ${msg.subject}`,
      body: task.content || '',
    });
    markA2AMessageStatus(msg.id, employee.roleId, 'completed');
    persistEmployeeOutput({
      employee,
      subject: msg.subject,
      prompt: msg.body,
      output: task.content || '',
      threadId: msg.threadId,
    });
    result.replied++;
  }

  return result;
}

// ─── Worker định kỳ: nhân viên web chat tự "đi làm" qua A2A hub ───────────────
export function startEmployeeMailboxWorker(intervalMs = 60_000): () => void {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const employees = listAgentEmployees();
      for (const employee of employees) {
        const result = await runEmployeeShift({ employeeId: employee.id });
        if (result.processed > 0) {
          console.log(`[EmployeeWorker] ${employee.name}: processed=${result.processed} replied=${result.replied} blocked=${result.blocked}`);
        }
      }
    } catch (err) {
      console.error('[EmployeeWorker] shift error:', err);
    } finally {
      running = false;
    }
  }, intervalMs);
  return () => clearInterval(timer);
}
