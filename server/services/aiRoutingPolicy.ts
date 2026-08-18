/**
 * aiRoutingPolicy.ts
 * ============================================================
 * Bảng điều phối vận hành AI theo LOẠI VIỆC (backend/frontend/devops/...).
 *
 * Mỗi task type có 1 danh sách AI ưu tiên (giỏi nhất → rẻ nhất → dự phòng),
 * cân bằng giữa thế mạnh và chi phí:
 *   free tier trước (Gemini/Groq/Antigravity/local), cheap paid sau (DeepSeek),
 *   paid tốt nhất cuối (Claude Code/Midjourney/Veo) chỉ cho case khó.
 */

import { executeEmployeeTask } from './webAiEmployeeAdapter.ts';
import { runCliAgent } from './aiCliExecutor.ts';
import { callLocalModel } from './localModelRuntime.ts';

export type TaskType =
  | 'backend'
  | 'frontend'
  | 'devops'
  | 'finance'
  | 'marketing'
  | 'design'
  | 'video'
  | 'audio'
  | 'research'
  | 'sales'
  | 'support'
  | 'legal'
  | 'data'
  | 'general';

export interface RouteEntry {
  kind: 'api' | 'cli' | 'local';
  employeeId: string;
  provider: string;
  model?: string;
  reason: string;
  cost: 'free' | 'cheap' | 'paid';
}

export interface RouteResult {
  taskType: TaskType;
  routedTo: RouteEntry | null;
  tried: string[];
  result: {
    success: boolean;
    usedBinding: string;
    provider?: string;
    content?: string;
    error?: string;
  };
}

export const ROUTING_POLICY: Record<TaskType, RouteEntry[]> = {
  backend: [
    { kind: 'api', employeeId: 'ai-dev', provider: 'gemini', model: 'gemini-2.5-pro', reason: 'Gemini 2.5 Pro code mạnh, free tier', cost: 'free' },
    { kind: 'api', employeeId: 'ai-dev', provider: 'deepseek', reason: 'DeepSeek code rẻ, mạnh', cost: 'cheap' },
    { kind: 'cli', employeeId: 'ai-dev', provider: 'claude', reason: 'Claude Code giỏi nhất, case khó', cost: 'paid' },
    { kind: 'local', employeeId: 'ai-dev', provider: 'ollama', model: 'qwen2.5-coder:7b', reason: 'Local $0, offline', cost: 'free' },
  ],
  frontend: [
    { kind: 'cli', employeeId: 'ai-dev', provider: 'antigravity', reason: 'Antigravity free, agentic UI', cost: 'free' },
    { kind: 'api', employeeId: 'ai-dev', provider: 'gemini', model: 'gemini-3-flash', reason: 'Gemini Flash free, nhanh', cost: 'free' },
    { kind: 'api', employeeId: 'ai-dev', provider: 'deepseek', reason: 'DeepSeek rẻ', cost: 'cheap' },
    { kind: 'cli', employeeId: 'ai-dev', provider: 'claude', reason: 'Claude Code cho UI phức tạp', cost: 'paid' },
  ],
  devops: [
    { kind: 'api', employeeId: 'ai-devops', provider: 'gemini', model: 'gemini-2.5-pro', reason: 'Gemini 2.5 Pro free, mạnh infra', cost: 'free' },
    { kind: 'api', employeeId: 'ai-devops', provider: 'deepseek', reason: 'DeepSeek rẻ', cost: 'cheap' },
  ],
  finance: [
    { kind: 'api', employeeId: 'ai-cfo', provider: 'gemini', model: 'gemini-2.5-pro', reason: 'Gemini 2.5 Pro suy luận tài chính mạnh, free tier', cost: 'free' },
    { kind: 'api', employeeId: 'ai-cfo', provider: 'deepseek', reason: 'DeepSeek toán/rẻ', cost: 'cheap' },
  ],
  marketing: [
    { kind: 'api', employeeId: 'ai-marketer', provider: 'gemini', model: 'gemini-3-flash', reason: 'Gemini Flash free, content tốt', cost: 'free' },
    { kind: 'api', employeeId: 'ai-marketer', provider: 'groq', reason: 'Groq free, nhanh', cost: 'free' },
    { kind: 'local', employeeId: 'ai-marketer', provider: 'ollama', model: 'llama3.2:3b', reason: 'Local $0', cost: 'free' },
  ],
  design: [
    { kind: 'api', employeeId: 'ai-designer', provider: 'gemini', model: 'gemini-2.5-flash-image', reason: 'Nano Banana ảnh $0.039', cost: 'cheap' },
    { kind: 'local', employeeId: 'ai-designer', provider: 'flux', reason: 'Flux local $0', cost: 'free' },
    { kind: 'api', employeeId: 'ai-designer', provider: 'midjourney', reason: 'Midjourney subscription', cost: 'paid' },
  ],
  video: [
    { kind: 'local', employeeId: 'ai-video', provider: 'ffmpeg', reason: 'Ảnh+TTS+FFmpeg $0', cost: 'free' },
    { kind: 'api', employeeId: 'ai-video', provider: 'veo', model: 'veo-3.1-lite', reason: 'Veo Lite clip ngắn $0.05/s', cost: 'cheap' },
  ],
  audio: [
    { kind: 'api', employeeId: 'ai-music', provider: 'lyria', reason: 'Lyria nhạc $0.04/bài', cost: 'cheap' },
    { kind: 'local', employeeId: 'ai-music', provider: 'local', reason: 'Nhạc local $0', cost: 'free' },
  ],
  research: [
    { kind: 'api', employeeId: 'ai-research', provider: 'perplexity', reason: 'Trích dẫn nguồn', cost: 'cheap' },
    { kind: 'api', employeeId: 'ai-research', provider: 'gemini', model: 'gemini-2.5-flash', reason: 'Gemini Search grounding free 500 RPD', cost: 'free' },
  ],
  sales: [
    { kind: 'api', employeeId: 'ai-sales', provider: 'gemini', model: 'gemini-3-flash', reason: 'Gemini Flash free', cost: 'free' },
    { kind: 'api', employeeId: 'ai-sales', provider: 'groq', reason: 'Groq free, nhanh', cost: 'free' },
  ],
  support: [
    { kind: 'api', employeeId: 'ai-support', provider: 'gemini', model: 'gemini-3-flash', reason: 'Gemini Flash free', cost: 'free' },
    { kind: 'api', employeeId: 'ai-support', provider: 'groq', reason: 'Groq free', cost: 'free' },
  ],
  legal: [
    { kind: 'api', employeeId: 'ai-legal', provider: 'claude', reason: 'Claude an toàn, dài ngữ cảnh', cost: 'paid' },
    { kind: 'api', employeeId: 'ai-legal', provider: 'gemini', model: 'gemini-2.5-pro', reason: 'Gemini 2.5 Pro free tier', cost: 'free' },
  ],
  data: [
    { kind: 'api', employeeId: 'ai-analyst', provider: 'gemini', model: 'gemini-3-flash', reason: 'Gemini Flash free', cost: 'free' },
    { kind: 'api', employeeId: 'ai-analyst', provider: 'deepseek', reason: 'DeepSeek rẻ', cost: 'cheap' },
  ],
  general: [
    { kind: 'api', employeeId: 'chief-of-staff', provider: 'gemini', model: 'gemini-3-flash', reason: 'Gemini Flash free', cost: 'free' },
    { kind: 'api', employeeId: 'chief-of-staff', provider: 'groq', reason: 'Groq free', cost: 'free' },
    { kind: 'local', employeeId: 'chief-of-staff', provider: 'ollama', model: 'llama3.2:3b', reason: 'Local $0', cost: 'free' },
  ],
};

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function resolveTaskType(goal: string, domain?: string): TaskType {
  const g = normalize(goal);
  if (domain === 'media' || /video|trailer|phim|reel|short/.test(g)) return 'video';
  if (domain === 'finance' || /ke toan|so sach|thue|bao cao tai chinh|vat|ha quan|dong tien|hoa don/.test(g)) return 'finance';
  if (domain === 'marketing' || /marketing|content|bai viet|seo|chien dich|quang cao/.test(g)) return 'marketing';
  if (domain === 'research' || /research|nghien cuu|phan tich thi truong/.test(g)) return 'research';
  if (domain === 'sales' || /sales|ban hang|khach hang|lead/.test(g)) return 'sales';
  if (/backend|server|api|database|sql|node|express|schema/.test(g)) return 'backend';
  if (/frontend|react|ui|ux|tsx|tailwind|css|giao dien/.test(g)) return 'frontend';
  if (/docker|deploy|ci\/cd|kubernetes|infra|pipeline/.test(g)) return 'devops';
  if (/hinh anh|anh|image|design|logo|banner/.test(g)) return 'design';
  return 'general';
}

import { reorderEntriesAdaptively, recordRouteTelemetry } from './aiDynamicRouterEngine.ts';

export function listRoutingPolicy(): Array<{ taskType: TaskType; entries: RouteEntry[]; adaptiveSummary?: string }> {
  return (Object.keys(ROUTING_POLICY) as TaskType[]).map((taskType) => {
    const staticEntries = ROUTING_POLICY[taskType];
    const { entries, telemetrySummary } = reorderEntriesAdaptively(taskType, staticEntries);
    return {
      taskType,
      entries,
      adaptiveSummary: telemetrySummary,
    };
  });
}

export async function routeTask(input: {
  goal: string;
  taskType?: TaskType;
  domain?: string;
  useCli?: boolean;
}): Promise<RouteResult> {
  const taskType = input.taskType || resolveTaskType(input.goal, input.domain);
  const staticEntries = ROUTING_POLICY[taskType] || ROUTING_POLICY.general;
  const { entries } = reorderEntriesAdaptively(taskType, staticEntries);
  const tried: string[] = [];

  for (const entry of entries) {
    tried.push(`${entry.kind}:${entry.provider}`);
    const startMs = Date.now();
    try {
      if (entry.kind === 'cli') {
        if (input.useCli !== true) continue;
        const r = await runCliAgent({ cli: entry.provider as 'antigravity' | 'claude' | 'gemini', prompt: input.goal });
        const latencyMs = Date.now() - startMs;
        recordRouteTelemetry({
          taskType,
          provider: entry.provider,
          model: entry.model,
          kind: 'cli',
          latencyMs,
          costUsd: entry.cost === 'paid' ? 0.015 : 0,
          qualityScore: r.success ? 90 : 0,
          success: r.success,
          source: 'task_execution',
        });
        if (r.success) {
          return { taskType, routedTo: entry, tried, result: { success: true, usedBinding: 'cli', provider: entry.provider, content: r.output } };
        }
        continue;
      }

      if (entry.kind === 'local') {
        const r = await callLocalModel({ prompt: input.goal, model: entry.model });
        const latencyMs = Date.now() - startMs;
        const success = Boolean(r.ok && r.content);
        recordRouteTelemetry({
          taskType,
          provider: r.model || 'ollama',
          model: entry.model,
          kind: 'local',
          latencyMs,
          costUsd: 0,
          qualityScore: success ? 85 : 0,
          success,
          source: 'task_execution',
        });
        if (success) {
          return { taskType, routedTo: entry, tried, result: { success: true, usedBinding: 'local', provider: r.model || 'ollama', content: r.content } };
        }
        continue;
      }

      const r = await executeEmployeeTask({
        employeeId: entry.employeeId,
        prompt: input.goal,
        preferredProvider: entry.provider,
        preferredModel: entry.model,
      });
      const latencyMs = Date.now() - startMs;
      const estimatedCost = entry.cost === 'free' ? 0 : entry.cost === 'cheap' ? 0.0005 : 0.005;
      recordRouteTelemetry({
        taskType,
        provider: r.provider || entry.provider,
        model: entry.model,
        kind: 'api',
        latencyMs,
        costUsd: estimatedCost,
        qualityScore: r.success ? 88 : 0,
        success: r.success,
        source: 'task_execution',
      });
      if (r.success) {
        return { taskType, routedTo: entry, tried, result: { success: true, usedBinding: r.usedBinding, provider: r.provider, content: r.content } };
      }
    } catch {
      const latencyMs = Date.now() - startMs;
      recordRouteTelemetry({
        taskType,
        provider: entry.provider,
        model: entry.model,
        kind: entry.kind,
        latencyMs,
        costUsd: 0,
        qualityScore: 0,
        success: false,
        source: 'task_execution',
      });
      // thử entry tiếp theo
    }
  }

  return {
    taskType,
    routedTo: null,
    tried,
    result: { success: false, usedBinding: 'api', error: `All routing entries failed: ${tried.join(' > ')}` },
  };
}

