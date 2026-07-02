/**
 * aiClient.ts
 * ============================================================
 * Unified AI client for LedgerFlow Studio.
 *
 * Current mode:
 *   - Reads encrypted provider keys from the local AI Key Vault.
 *   - Automatically falls back across many keys/providers:
 *       Gemini -> Groq -> OpenRouter -> Anthropic Claude -> Ollama.
 *   - If no local keys are configured, keeps the old LiteLLM proxy fallback.
 *
 * Users can configure keys inside the app UI; no fixed .env file is required
 * for normal desktop/local usage.
 * ============================================================
 */

import { callAIWithFallback, checkAIRouterHealth, streamAIWithFallback } from "./aiRouter.ts";
import type { AIProviderName } from "./aiKeyVault.ts";

export type ChatRole = "system" | "user" | "assistant";
export type AIRoutingTask = "general" | "accounting" | "analytics" | "marketing" | "sales" | "coding" | (string & {});

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface NormalizedToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface CallAIOptions {
  /** "ai-assistant" (default rotation) or "ai-assistant-pro" */
  model?: "ai-assistant" | "ai-assistant-pro";
  /** Optional task hint so router can prefer the most suitable provider stack. */
  task?: AIRoutingTask;
  preferredProvider?: AIProviderName;
  preferredModel?: string;
  strictPreferred?: boolean;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolSpec[];
  toolChoice?: "auto" | "required" | { name: string };
}

export interface CallAIResult {
  content: string;
  /** Backward-compatible alias used by older server routes. */
  text?: string;
  /** Provider/model that actually answered. */
  modelUsed?: string;
  /** Backward-compatible aliases used by older server routes. */
  provider?: string;
  model?: string;
  usage?: unknown;
  toolCalls?: NormalizedToolCall[];
  raw: unknown;
}

/**
 * Non-streaming AI call. Use for transaction classification, audit suggestions,
 * market survey generation, short assistant tasks, etc.
 */
export async function callAI(
  messages: ChatMessage[],
  options: CallAIOptions = {}
): Promise<CallAIResult> {
  const result = await callAIWithFallback(messages, options);
  return {
    ...result,
    text: result.content,
    provider: result.modelUsed?.split("/")[0],
    model: result.modelUsed,
  };
}

/**
 * Streaming-compatible AI call. The router selects the first working provider/key,
 * then yields text chunks so existing SSE routes keep working.
 */
export async function* streamAI(
  messages: ChatMessage[],
  options: CallAIOptions = {}
): AsyncGenerator<string, void, unknown> {
  yield* streamAIWithFallback(messages, options);
}

/**
 * Health check: true when at least one local encrypted AI key is enabled,
 * or when the optional LiteLLM proxy is reachable.
 */
export async function checkAIProxyHealth(): Promise<{ ok: boolean }> {
  return { ok: await checkAIRouterHealth() };
}
