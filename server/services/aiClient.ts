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

import { callAIWithFallback, checkAIRouterHealth, streamAIWithFallback } from "./aiRouter";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CallAIOptions {
  /** "ai-assistant" (default rotation) or "ai-assistant-pro" */
  model?: "ai-assistant" | "ai-assistant-pro";
  temperature?: number;
  maxTokens?: number;
}

export interface CallAIResult {
  content: string;
  /** Provider/model that actually answered. */
  modelUsed?: string;
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
  return callAIWithFallback(messages, options);
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
export async function checkAIProxyHealth(): Promise<boolean> {
  return checkAIRouterHealth();
}
