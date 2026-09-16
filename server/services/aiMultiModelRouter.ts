/**
 * aiMultiModelRouter.ts
 * ============================================================
 * MULTI-MODEL AI ROUTER - Smart Model Selection Engine
 * Routes tasks to the best AI model based on task type,
 * complexity, cost optimization, and provider availability.
 * ============================================================
 */

import { callAIWithFallback } from './aiRouter.ts';
import type { ChatMessage } from './aiClient.ts';

// --- Types ---

export type ModelCapability =
  | 'code_generation'
  | 'game_dev'
  | 'video_script'
  | 'asset_design'
  | 'research_analysis'
  | 'reasoning_complex'
  | 'quick_chat'
  | 'local_only';

export interface ModelRouteConfig {
  taskType: string;
  primaryCapability: ModelCapability;
  preferredProvider?: string;
  preferredModel?: string;
  fallbackProviders: string[];
  minTier: 'tier_free_local' | 'tier_cheap' | 'tier_balanced' | 'tier_flagship';
  maxTokens: number;
  temperature: number;
}

export interface MultiModelRequest {
  messages: ChatMessage[];
  taskType?: string;
  capability?: ModelCapability;
  options?: {
    temperature?: number;
    maxTokens?: number;
    preferredModel?: string;
    bypassCache?: boolean;
  };
}

export interface MultiModelResponse {
  content: string;
  modelUsed: string;
  capabilityUsed: ModelCapability;
  latencyMs: number;
  estimatedCostUsd: number;
  isCached: boolean;
}

// --- Route Configuration ---

const MODEL_ROUTES: Record<ModelCapability, ModelRouteConfig> = {
  code_generation: {
    taskType: 'coding',
    primaryCapability: 'code_generation',
    fallbackProviders: ['anthropic', 'openai', 'google', 'groq'],
    minTier: 'tier_balanced',
    maxTokens: 4096,
    temperature: 0.2,
  },
  game_dev: {
    taskType: 'game_dev',
    primaryCapability: 'game_dev',
    fallbackProviders: ['anthropic', 'openai', 'google'],
    minTier: 'tier_balanced',
    maxTokens: 8192,
    temperature: 0.3,
  },
  video_script: {
    taskType: 'video_script',
    primaryCapability: 'video_script',
    fallbackProviders: ['google', 'openai', 'anthropic'],
    minTier: 'tier_cheap',
    maxTokens: 4096,
    temperature: 0.7,
  },
  asset_design: {
    taskType: 'asset_design',
    primaryCapability: 'asset_design',
    fallbackProviders: ['anthropic', 'google', 'openai'],
    minTier: 'tier_balanced',
    maxTokens: 4096,
    temperature: 0.4,
  },
  research_analysis: {
    taskType: 'research',
    primaryCapability: 'research_analysis',
    fallbackProviders: ['google', 'openai', 'anthropic'],
    minTier: 'tier_cheap',
    maxTokens: 2048,
    temperature: 0.5,
  },
  reasoning_complex: {
    taskType: 'reasoning',
    primaryCapability: 'reasoning_complex',
    fallbackProviders: ['openai', 'anthropic', 'google'],
    minTier: 'tier_flagship',
    maxTokens: 8192,
    temperature: 0.1,
  },
  quick_chat: {
    taskType: 'general',
    primaryCapability: 'quick_chat',
    fallbackProviders: ['groq', 'google', 'openai'],
    minTier: 'tier_free_local',
    maxTokens: 1024,
    temperature: 0.7,
  },
  local_only: {
    taskType: 'local',
    primaryCapability: 'local_only',
    fallbackProviders: [],
    minTier: 'tier_free_local',
    maxTokens: 2048,
    temperature: 0.5,
  },
};

// --- Capability Auto-Detection ---

const TASK_CAPABILITY_MAP: Record<string, ModelCapability> = {
  auto_program: 'code_generation',
  skill_execute: 'quick_chat',
  vision_analyze: 'research_analysis',
  web_research: 'research_analysis',
  self_heal: 'code_generation',
  swarm_shift: 'reasoning_complex',
  telegram_command: 'quick_chat',
  multi_model_reason: 'reasoning_complex',
  blender_render: 'game_dev',
  video_generate: 'video_script',
  banner_design: 'asset_design',
  game_generate: 'game_dev',
  asset_generate: 'game_dev',
  physics_simulate: 'game_dev',
};

const CONTENT_CAPABILITY_HEURISTICS: Array<{ pattern: RegExp; capability: ModelCapability }> = [
  { pattern: /generate|write|create|implement|code|function|class|component/i, capability: 'code_generation' },
  { pattern: /game|physics|canvas|sprite|animation|collision|player|score/i, capability: 'game_dev' },
  { pattern: /video|script|storyboard|voiceover|caption|tiktok|youtube|shorts/i, capability: 'video_script' },
  { pattern: /design|banner|svg|color|theme|style|font|layout|ui/i, capability: 'asset_design' },
  { pattern: /research|search|analyze|compare|summary|report|find/i, capability: 'research_analysis' },
  { pattern: /reason|solve|calculate|optimize|prove|derive|logic/i, capability: 'reasoning_complex' },
  { pattern: /hello|hi|hey|thanks|ok|yes|no|quick|simple/i, capability: 'quick_chat' },
];

function detectCapability(taskType?: string, messages?: ChatMessage[]): ModelCapability {
  if (taskType && TASK_CAPABILITY_MAP[taskType]) {
    return TASK_CAPABILITY_MAP[taskType];
  }
  if (messages && messages.length > 0) {
    const allContent = messages.map(m => m.content).join(' ');
    for (const heuristic of CONTENT_CAPABILITY_HEURISTICS) {
      if (heuristic.pattern.test(allContent)) {
        return heuristic.capability;
      }
    }
  }
  return 'quick_chat';
}

// --- Main Router Function ---

export async function routeToBestModel(request: MultiModelRequest): Promise<MultiModelResponse> {
  const startTime = Date.now();
  const capability = request.capability || detectCapability(request.taskType, request.messages);
  const routeConfig = MODEL_ROUTES[capability];

  const response = await callAIWithFallback(request.messages, {
    task: routeConfig.taskType as any,
    temperature: request.options?.temperature ?? routeConfig.temperature,
    maxTokens: request.options?.maxTokens ?? routeConfig.maxTokens,
    preferredModel: request.options?.preferredModel,
    bypassCache: request.options?.bypassCache,
    forceTier: routeConfig.minTier,
  });

  const latencyMs = Date.now() - startTime;

  return {
    content: response.content,
    modelUsed: response.modelUsed || 'unknown',
    capabilityUsed: capability,
    latencyMs,
    estimatedCostUsd: response.estimatedCostUsd || 0,
    isCached: response.isCached || false,
  };
}

export async function smartCall(
  messages: ChatMessage[],
  taskType?: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<MultiModelResponse> {
  return routeToBestModel({ messages, taskType, options });
}

export function getModelRouteDiagnostics(): Record<string, {
  preferredProvider: string | undefined;
  fallbackProviders: string[];
  minTier: string;
  maxTokens: number;
  temperature: number;
}> {
  const diagnostics: any = {};
  for (const [cap, config] of Object.entries(MODEL_ROUTES)) {
    diagnostics[cap] = {
      preferredProvider: config.preferredProvider,
      fallbackProviders: config.fallbackProviders,
      minTier: config.minTier,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    };
  }
  return diagnostics;
}
