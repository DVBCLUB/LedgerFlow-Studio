/**
 * aiClassifierEngine.ts
 * ============================================================
 * Tier-1 AI Task Classifier & Cost-Optimization Engine for LedgerFlow OS.
 *
 * Implements 2-tier routing intelligence:
 *   1. Heuristic Filter (< 2ms): Instant classification for trivial tasks
 *   2. Fast Classifier (< 800ms): Fast LLM / rule-based classifier
 *   3. SHA-256 Prompt Caching: Zero-cost instant replay for identical prompts
 *
 * Automatically recommends model tiers:
 *   - tier_free_local / tier_cheap: Groq, Gemini Flash, Ollama
 *   - tier_balanced: Gemini Pro, GPT-4o-mini, DeepSeek
 *   - tier_flagship: Claude 3.5 Sonnet, GPT-4o
 */

import { createHash } from 'node:crypto';
import type { ChatMessage, CallAIOptions } from './aiClient.ts';

export type TaskComplexity = 'simple' | 'medium' | 'complex';

export type TaskCategory =
  | 'code_generation'
  | 'bug_fix_simple'
  | 'deep_debugging'
  | 'architecture_design'
  | 'refactoring'
  | 'code_review'
  | 'documentation'
  | 'boilerplate'
  | 'general_query'
  // ── 4-Pillar Product Studio Categories ──
  | 'game_development'
  | 'video_production'
  | 'avatar_3d_modeling'
  | 'graphic_design'
  | 'blender_rendering'
  | 'ffmpeg_processing';

export type ModelTier = 'tier_free_local' | 'tier_cheap' | 'tier_balanced' | 'tier_flagship';

export interface TaskClassification {
  complexity: TaskComplexity;
  taskType: TaskCategory;
  recommendedTier: ModelTier;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  reasoning: string;
  isCached?: boolean;
  classifierLatencyMs: number;
  method: 'heuristic' | 'fast_llm' | 'fallback_rule' | 'cache';
}

// ─── Hash Caching Layer ───────────────────────────────────────────────────────
interface CachedExecution {
  content: string;
  modelUsed: string;
  timestamp: number;
  tokenUsage?: { inputTokens: number; outputTokens: number };
}

const HASH_CACHE = new Map<string, CachedExecution>();
const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function computePromptHash(messages: ChatMessage[], options?: CallAIOptions): string {
  const norm = messages.map(m => `${m.role}:${m.content}`).join('\n---\n');
  const optKey = options ? `${options.model || ''}:${options.temperature || ''}:${options.task || ''}` : '';
  return createHash('sha256').update(`${norm}:::${optKey}`).digest('hex');
}

export function getCachedAIResponse(hash: string): CachedExecution | null {
  const item = HASH_CACHE.get(hash);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    HASH_CACHE.delete(hash);
    return null;
  }
  return item;
}

export function setCachedAIResponse(hash: string, execution: Omit<CachedExecution, 'timestamp'>): void {
  if (HASH_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldest = HASH_CACHE.keys().next().value;
    if (oldest) HASH_CACHE.delete(oldest);
  }
  HASH_CACHE.set(hash, {
    ...execution,
    timestamp: Date.now(),
  });
}

export function clearPromptCache(): void {
  HASH_CACHE.clear();
}

// ─── Heuristic Classifier (< 2ms) ─────────────────────────────────────────────

function tryHeuristicClassification(messages: ChatMessage[]): TaskClassification | null {
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserText = userMessages[userMessages.length - 1]?.content?.trim() || '';
  const textLower = lastUserText.toLowerCase();
  const wordCount = lastUserText.split(/\s+/).length;
  const totalLength = messages.reduce((acc, m) => acc + m.content.length, 0);

  // Short formatting, typo, git, or docstring requests (< 40 words)
  if (wordCount < 40 && totalLength < 800) {
    if (/(format|prettier|indent|eslint|beautify|căn lề|thụt đầu dòng)/i.test(textLower)) {
      return {
        complexity: 'simple',
        taskType: 'boilerplate',
        recommendedTier: 'tier_cheap',
        estimatedInputTokens: Math.ceil(totalLength / 4),
        estimatedOutputTokens: 250,
        reasoning: 'Heuristic fast-match: Simple formatting/indentation',
        classifierLatencyMs: 1,
        method: 'heuristic',
      };
    }

    if (/(fix typo|sửa lỗi chính tả|syntax error|lỗi cú pháp|rename variable|đổi tên biến)/i.test(textLower)) {
      return {
        complexity: 'simple',
        taskType: 'bug_fix_simple',
        recommendedTier: 'tier_cheap',
        estimatedInputTokens: Math.ceil(totalLength / 4),
        estimatedOutputTokens: 200,
        reasoning: 'Heuristic fast-match: Minor syntax/typo fix',
        classifierLatencyMs: 1,
        method: 'heuristic',
      };
    }

    if (/(git commit|commit message|generate readme summary|viết commit)/i.test(textLower)) {
      return {
        complexity: 'simple',
        taskType: 'documentation',
        recommendedTier: 'tier_free_local',
        estimatedInputTokens: Math.ceil(totalLength / 4),
        estimatedOutputTokens: 150,
        reasoning: 'Heuristic fast-match: Git commit or basic documentation',
        classifierLatencyMs: 1,
        method: 'heuristic',
      };
    }
  }

  // Obvious heavy architectural keywords
  if (
    /(microservice architecture|distributed consensus|raft algorithm|concurrency race condition|full system refactor|game physics loop|dsge monte carlo)/i.test(
      textLower
    ) ||
    totalLength > 12000
  ) {
    return {
      complexity: 'complex',
      taskType: 'architecture_design',
      recommendedTier: 'tier_flagship',
      estimatedInputTokens: Math.ceil(totalLength / 4),
      estimatedOutputTokens: 3000,
      reasoning: 'Heuristic fast-match: High-complexity architecture/algorithm detected',
      classifierLatencyMs: 1,
      method: 'heuristic',
    };
  }

  // ── 4-Pillar Product Studio Heuristics ──
  // Chạy sau các heuristics chính, trước fallback rule-based

  // Game development heuristic
  if (/(game|playable|phaser|pixi|babylon|rpg|platformer|joystick|wasd|2d platformer|hyper casual|tower defense|webgl canvas|game physics)/i.test(textLower)) {
    return {
      complexity: 'medium',
      taskType: 'game_development',
      recommendedTier: 'tier_balanced',
      estimatedInputTokens: Math.ceil(totalLength / 4),
      estimatedOutputTokens: 1024,
      reasoning: 'Heuristic: Game development task detected',
      classifierLatencyMs: 1,
      method: 'heuristic',
    };
  }

  // Video production heuristic
  if (/(video|tts|text to speech|ffmpeg|subtitle|capcut|davinci|render|timeline|voiceover|voice over|short|youtube|tiktok)/i.test(textLower)) {
    return {
      complexity: 'medium',
      taskType: 'video_production',
      recommendedTier: 'tier_cheap',
      estimatedInputTokens: Math.ceil(totalLength / 4),
      estimatedOutputTokens: 768,
      reasoning: 'Heuristic: Video/Audio production task detected',
      classifierLatencyMs: 1,
      method: 'heuristic',
    };
  }

  // 3D Avatar / Blender heuristic
  if (/(3d|avatar|glb|gltf|blender|bpy|rigging|viseme|lip.?sync|digital human|humanoid|virtual being|three\.js|webgl 3d)/i.test(textLower)) {
    return {
      complexity: 'medium',
      taskType: 'avatar_3d_modeling',
      recommendedTier: 'tier_balanced',
      estimatedInputTokens: Math.ceil(totalLength / 4),
      estimatedOutputTokens: 1024,
      reasoning: 'Heuristic: 3D avatar or Blender modeling task detected',
      classifierLatencyMs: 1,
      method: 'heuristic',
    };
  }

  // Graphic design heuristic
  if (/(banner|poster|canva|photopea|logo|thumbnail|social media|graphic|design plan)/i.test(textLower)) {
    return {
      complexity: 'simple',
      taskType: 'graphic_design',
      recommendedTier: 'tier_cheap',
      estimatedInputTokens: Math.ceil(totalLength / 4),
      estimatedOutputTokens: 512,
      reasoning: 'Heuristic: Graphic design automation task detected',
      classifierLatencyMs: 1,
      method: 'heuristic',
    };
  }

  return null;
}

// ─── Rule-Based Fallback Classifier ──────────────────────────────────────────

function ruleBasedClassification(messages: ChatMessage[], startTime: number): TaskClassification {
  const totalLength = messages.reduce((acc, m) => acc + m.content.length, 0);
  const userText = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
  const estimatedInput = Math.ceil(totalLength / 4);

  if (totalLength > 6000 || /(refactor|architect|benchmark|security audit|optimize engine)/i.test(userText)) {
    return {
      complexity: 'complex',
      taskType: 'refactoring',
      recommendedTier: 'tier_flagship',
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: 2048,
      reasoning: 'Rule fallback: Large payload or critical architectural keywords',
      classifierLatencyMs: Date.now() - startTime,
      method: 'fallback_rule',
    };
  }

  if (totalLength > 1500 || /(implement|component|endpoint|feature|tạo mới|viết chức năng)/i.test(userText)) {
    return {
      complexity: 'medium',
      taskType: 'code_generation',
      recommendedTier: 'tier_balanced',
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: 1024,
      reasoning: 'Rule fallback: Standard feature development or logic implementation',
      classifierLatencyMs: Date.now() - startTime,
      method: 'fallback_rule',
    };
  }

  // ── 4-Pillar Rule Fallbacks ──
  if (/(game|playable|phaser|canvas.*2d|webgl.*game|rpg)/i.test(userText)) {
    return {
      complexity: 'medium',
      taskType: 'game_development',
      recommendedTier: 'tier_balanced',
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: 1024,
      reasoning: 'Rule fallback: Game development keywords detected',
      classifierLatencyMs: Date.now() - startTime,
      method: 'fallback_rule',
    };
  }

  if (/(video|ffmpeg|subtitle|tts|voiceover|render)/i.test(userText)) {
    return {
      complexity: 'medium',
      taskType: 'video_production',
      recommendedTier: 'tier_cheap',
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: 768,
      reasoning: 'Rule fallback: Video production keywords detected',
      classifierLatencyMs: Date.now() - startTime,
      method: 'fallback_rule',
    };
  }

  if (/(avatar|blender|3d|glb|gltf|bpy|rigging|viseme)/i.test(userText)) {
    return {
      complexity: 'medium',
      taskType: 'avatar_3d_modeling',
      recommendedTier: 'tier_balanced',
      estimatedInputTokens: estimatedInput,
      estimatedOutputTokens: 1024,
      reasoning: 'Rule fallback: 3D/avatar keywords detected',
      classifierLatencyMs: Date.now() - startTime,
      method: 'fallback_rule',
    };
  }

  return {
    complexity: 'simple',
    taskType: 'general_query',
    recommendedTier: 'tier_cheap',
    estimatedInputTokens: estimatedInput,
    estimatedOutputTokens: 512,
    reasoning: 'Rule fallback: Lightweight query',
    classifierLatencyMs: Date.now() - startTime,
    method: 'fallback_rule',
  };
}

// ─── Main Classifier API ─────────────────────────────────────────────────────

export async function classifyTask(
  messages: ChatMessage[],
  options?: CallAIOptions,
  fastLlmRunner?: (prompt: string) => Promise<string>
): Promise<TaskClassification> {
  const startTime = Date.now();

  // 1. Check Heuristic first (<2ms)
  const heuristic = tryHeuristicClassification(messages);
  if (heuristic) return heuristic;

  // 2. If fast LLM runner provided (Gemini Flash/Groq/Haiku), perform quick meta-prompt (<800ms)
  if (fastLlmRunner) {
    try {
      const userText = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(' ')
        .slice(0, 1000);

      const prompt = `Analyze this AI prompt and return ONLY a JSON object:
Task: "${userText}"
JSON Schema:
{
  "complexity": "simple" | "medium" | "complex",
  "taskType": "code_generation" | "bug_fix_simple" | "deep_debugging" | "architecture_design" | "refactoring" | "code_review" | "documentation" | "boilerplate" | "general_query",
  "recommendedTier": "tier_free_local" | "tier_cheap" | "tier_balanced" | "tier_flagship",
  "reasoning": "brief 1-sentence explanation"
}`;

      const raw = await fastLlmRunner(prompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const totalLength = messages.reduce((acc, m) => acc + m.content.length, 0);
        return {
          complexity: parsed.complexity || 'medium',
          taskType: parsed.taskType || 'code_generation',
          recommendedTier: parsed.recommendedTier || 'tier_balanced',
          estimatedInputTokens: Math.ceil(totalLength / 4),
          estimatedOutputTokens: parsed.complexity === 'complex' ? 2048 : 512,
          reasoning: parsed.reasoning || 'Fast LLM classified',
          classifierLatencyMs: Date.now() - startTime,
          method: 'fast_llm',
        };
      }
    } catch {
      // Fallback to rule based
    }
  }

  // 3. Fallback rule-based
  return ruleBasedClassification(messages, startTime);
}
