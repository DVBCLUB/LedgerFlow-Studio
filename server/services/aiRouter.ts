import { getEnabledAIKeyEntries, setAIKeyStatus, type AIProviderName, type DecryptedAIKeyEntry } from "./aiKeyVault.ts";
import type { CallAIOptions, CallAIResult, ChatMessage, NormalizedToolCall, ToolSpec } from "./aiClient.ts";
import { appendAIUsageLog, type AIUsageMode } from "./aiUsageLog.ts";

// ─── Circuit Breaker ─────────────────────────────────────────────────────────
// Prevents hammering a failed provider on every request.
// State machine: closed → open (after N failures) → half-open (after cooldown) → closed

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerEntry {
  state: CircuitState;
  failures: number;
  lastFailureAt: number;
  openedAt?: number;
  halfOpenSuccesses: number;
}

const CIRCUIT_FAILURE_THRESHOLD = Number(process.env.CIRCUIT_FAILURE_THRESHOLD ?? 3);
const CIRCUIT_COOLDOWN_MS = Number(process.env.CIRCUIT_COOLDOWN_MS ?? 60_000);

const circuitBreakers = new Map<string, CircuitBreakerEntry>();

function getCircuit(providerKey: string): CircuitBreakerEntry {
  if (!circuitBreakers.has(providerKey)) {
    circuitBreakers.set(providerKey, { state: 'closed', failures: 0, lastFailureAt: 0, halfOpenSuccesses: 0 });
  }
  return circuitBreakers.get(providerKey)!;
}

function circuitAllows(providerKey: string): boolean {
  const cb = getCircuit(providerKey);
  if (cb.state === 'closed') return true;
  if (cb.state === 'open') {
    if (Date.now() - (cb.openedAt ?? 0) >= CIRCUIT_COOLDOWN_MS) {
      cb.state = 'half-open'; // allow one trial request
      return true;
    }
    return false; // still open — skip this provider
  }
  // half-open: allow through
  return true;
}

function onCircuitSuccess(providerKey: string): void {
  const cb = getCircuit(providerKey);
  cb.failures = 0;
  cb.halfOpenSuccesses = 0;
  cb.state = 'closed';
}

function onCircuitFailure(providerKey: string): void {
  const cb = getCircuit(providerKey);
  cb.failures += 1;
  cb.lastFailureAt = Date.now();
  if (cb.state === 'half-open' || cb.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    cb.state = 'open';
    cb.openedAt = Date.now();
  }
}

export function getCircuitBreakerStatus(): Record<string, { state: CircuitState; failures: number; openedAt?: number; lastFailureAt: number }> {
  const out: Record<string, { state: CircuitState; failures: number; openedAt?: number; lastFailureAt: number }> = {};
  for (const [key, cb] of circuitBreakers) {
    out[key] = { state: cb.state, failures: cb.failures, openedAt: cb.openedAt, lastFailureAt: cb.lastFailureAt };
  }
  return out;
}
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderCallResult { content: string; modelUsed?: string; raw: unknown; toolCalls?: NormalizedToolCall[] }
export interface AIRouterDiagnosticItem { provider: AIProviderName | "litellm-proxy"; label: string; model?: string; status: "ok" | "quota" | "error" | "skipped"; latencyMs?: number; message?: string }
export interface AIRouterDiagnostics { ok: boolean; checkedAt: string; totalEnabledKeys: number; results: AIRouterDiagnosticItem[] }

class ProviderError extends Error {
  public status?: number;
  public body?: unknown;
  public provider?: AIProviderName | "litellm-proxy";

  constructor(
    message: string,
    status?: number,
    body?: unknown,
    provider?: AIProviderName | "litellm-proxy"
  ) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
    this.body = body;
    this.provider = provider;
  }
}

const DEFAULT_PROXY_URL = process.env.AI_PROXY_URL ?? "http://127.0.0.1:4000";
const DEFAULT_PROXY_KEY = process.env.AI_PROXY_KEY ?? "sk-ledgerflow-local-2026";

export function nativeToolCallingSupported(provider: AIProviderName | "litellm-proxy"): boolean {
  return provider !== "ollama";
}

export function toAnthropicTools(tools: ToolSpec[]): Array<Record<string, unknown>> {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

export function toOpenAITools(tools: ToolSpec[]): Array<Record<string, unknown>> {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export function toGeminiTools(tools: ToolSpec[]): Array<Record<string, unknown>> {
  return [{
    functionDeclarations: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })),
  }];
}

export function toAnthropicToolChoice(choice: CallAIOptions["toolChoice"]): Record<string, unknown> | undefined {
  if (!choice || choice === "auto") return undefined;
  if (choice === "required") return { type: "any" };
  return { type: "tool", name: choice.name };
}

export function toOpenAIToolChoice(choice: CallAIOptions["toolChoice"]): unknown {
  if (!choice) return undefined;
  if (choice === "auto" || choice === "required") return choice;
  return { type: "function", function: { name: choice.name } };
}

export function toGeminiToolConfig(choice: CallAIOptions["toolChoice"]): Record<string, unknown> | undefined {
  if (!choice || choice === "auto") return undefined;
  if (choice === "required") return { functionCallingConfig: { mode: "ANY" } };
  return { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [choice.name] } };
}

function normalizeArgs(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function parseAnthropicToolCalls(data: unknown): NormalizedToolCall[] {
  const content = (data as any)?.content;
  if (!Array.isArray(content)) return [];
  return content
    .filter((part: any) => part?.type === "tool_use" && typeof part.name === "string")
    .map((part: any) => ({ id: String(part.id || `tool_${part.name}`), name: part.name, args: normalizeArgs(part.input) }));
}

export function parseOpenAIToolCalls(data: unknown): NormalizedToolCall[] {
  const calls = (data as any)?.choices?.[0]?.message?.tool_calls;
  if (!Array.isArray(calls)) return [];
  return calls
    .filter((call: any) => typeof call?.function?.name === "string")
    .map((call: any) => ({
      id: String(call.id || `tool_${call.function.name}`),
      name: call.function.name,
      args: normalizeArgs(call.function.arguments),
    }));
}

export function parseGeminiToolCalls(data: unknown): NormalizedToolCall[] {
  const parts = (data as any)?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return [];
  return parts
    .filter((part: any) => typeof part?.functionCall?.name === "string")
    .map((part: any, index: number) => ({
      id: String(part.functionCall.id || `gemini_tool_${index + 1}`),
      name: part.functionCall.name,
      args: normalizeArgs(part.functionCall.args),
    }));
}

// ─── Deduplication Cache (Sliding Window TTL: 30s) ───────────────────────────
interface RouterCacheEntry {
  result: CallAIResult;
  expiresAt: number;
}
const routerDedupCache = new Map<string, RouterCacheEntry>();
const ROUTER_CACHE_TTL_MS = 30_000;

function getRouterCacheKey(messages: ChatMessage[], options: CallAIOptions): string {
  const content = messages.map(m => `${m.role}:${m.content}`).join('|');
  return `${content}__${options.task || ''}__${options.model || ''}__${options.preferredProvider || ''}`;
}

export function clearRouterDedupCache(): void {
  routerDedupCache.clear();
}

export async function callAIWithFallback(messages: ChatMessage[], options: CallAIOptions = {}): Promise<CallAIResult> {
  // Check dedup cache (unless tools or streaming are requested)
  if (!options.tools?.length) {
    const cacheKey = getRouterCacheKey(messages, options);
    const cached = routerDedupCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
  }

  const entries = await getEnabledAIKeyEntries();
  const orderedEntries = orderEntriesByPolicy(entries, options);
  const errors: string[] = [];
  const skipped: string[] = [];
  const promptChars = countPromptChars(messages);

  for (const entry of orderedEntries) {
    const circuitKey = `${entry.provider}:${entry.id}`;
    if (!circuitAllows(circuitKey)) {
      skipped.push(`${entry.provider}:${entry.label} (circuit open)`);
      continue;
    }
    const started = Date.now();
    try {
      const result = await callProvider(entry, messages, options);
      onCircuitSuccess(circuitKey);
      await setAIKeyStatus(entry.id, "ok");
      await logEntry(entry, "call", "ok", started, result.modelUsed || entry.model, promptChars, result.content.length);
      const callResult: CallAIResult = { content: result.content, modelUsed: `${entry.provider}/${result.modelUsed || entry.model || "default"}`, raw: result.raw, toolCalls: result.toolCalls || [] };
      if (!options.tools?.length) {
        const cacheKey = getRouterCacheKey(messages, options);
        routerDedupCache.set(cacheKey, { result: callResult, expiresAt: Date.now() + ROUTER_CACHE_TTL_MS });
      }
      return callResult;
    } catch (err: any) {
      onCircuitFailure(circuitKey);
      const isQuota = isQuotaLikeError(err);
      await setAIKeyStatus(entry.id, isQuota ? "quota" : "error", err.message || String(err));
      await logEntry(entry, "call", isQuota ? "quota" : "error", started, entry.model, promptChars, 0, err.message || String(err));
      errors.push(`${entry.provider}:${entry.label} -> ${err.message || err}`);
    }
  }

  if (entries.length === 0) {
    const started = Date.now();
    try {
      const result = await callLiteLLMProxy(messages, options);
      await appendAIUsageLog({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, model: result.modelUsed, mode: "call", status: "ok", latencyMs: Date.now() - started, promptChars, outputChars: result.content.length });
      if (!options.tools?.length) {
        const cacheKey = getRouterCacheKey(messages, options);
        routerDedupCache.set(cacheKey, { result, expiresAt: Date.now() + ROUTER_CACHE_TTL_MS });
      }
      return result;
    } catch (err: any) {
      const isQuota = isQuotaLikeError(err);
      await appendAIUsageLog({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, model: options.model, mode: "call", status: isQuota ? "quota" : "error", latencyMs: Date.now() - started, promptChars, outputChars: 0, error: err.message || String(err) });
      errors.push(`litellm-proxy -> ${err.message || err}`);
    }
  }

  const allErrors = [...errors, ...skipped.map(s => `[skipped] ${s}`)];
  throw new ProviderError(`Không còn provider/key AI khả dụng. Chi tiết: ${allErrors.join(" | ") || "Chưa cấu hình key AI."}`, 429, { errors, skipped });
}

export async function* streamAIWithFallback(messages: ChatMessage[], options: CallAIOptions = {}): AsyncGenerator<string, void, unknown> {
  const entries = await getEnabledAIKeyEntries();
  const orderedEntries = orderEntriesByPolicy(entries, options);
  const errors: string[] = [];
  const skipped: string[] = [];
  const promptChars = countPromptChars(messages);

  for (const entry of orderedEntries) {
    const circuitKey = `${entry.provider}:${entry.id}`;
    if (!circuitAllows(circuitKey)) {
      skipped.push(`${entry.provider}:${entry.label} (circuit open)`);
      continue;
    }
    let yielded = false;
    let outputChars = 0;
    const started = Date.now();
    try {
      for await (const chunk of streamProvider(entry, messages, options)) {
        yielded = true;
        outputChars += chunk.length;
        yield chunk;
      }
      onCircuitSuccess(circuitKey);
      await setAIKeyStatus(entry.id, "ok");
      await logEntry(entry, "stream", "ok", started, entry.model, promptChars, outputChars);
      return;
    } catch (err: any) {
      onCircuitFailure(circuitKey);
      const isQuota = isQuotaLikeError(err);
      await setAIKeyStatus(entry.id, isQuota ? "quota" : "error", err.message || String(err));
      await logEntry(entry, "stream", isQuota ? "quota" : "error", started, entry.model, promptChars, outputChars, err.message || String(err));
      errors.push(`${entry.provider}:${entry.label} -> ${err.message || err}`);
      if (yielded) throw err;
    }
  }

  if (entries.length === 0) {
    let outputChars = 0;
    const started = Date.now();
    try {
      for await (const chunk of streamLiteLLMProxy(messages, options)) {
        outputChars += chunk.length;
        yield chunk;
      }
      await appendAIUsageLog({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, model: options.model, mode: "stream", status: "ok", latencyMs: Date.now() - started, promptChars, outputChars });
      return;
    } catch (err: any) {
      const isQuota = isQuotaLikeError(err);
      await appendAIUsageLog({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, model: options.model, mode: "stream", status: isQuota ? "quota" : "error", latencyMs: Date.now() - started, promptChars, outputChars, error: err.message || String(err) });
      errors.push(`litellm-proxy -> ${err.message || err}`);
    }
  }

  const allErrors = [...errors, ...skipped.map(s => `[skipped] ${s}`)];
  throw new ProviderError(`Không còn provider/key AI stream khả dụng. Chi tiết: ${allErrors.join(" | ") || "Chưa cấu hình key AI."}`, 429, { errors, skipped });
}

export async function checkAIRouterHealth(): Promise<boolean> {
  const entries = await getEnabledAIKeyEntries();
  if (entries.length > 0) return true;
  try { const r = await fetch(`${DEFAULT_PROXY_URL}/health`, { headers: { Authorization: `Bearer ${DEFAULT_PROXY_KEY}` } }); return r.ok; } catch { return false; }
}

export async function diagnoseAIRouter(): Promise<AIRouterDiagnostics> {
  const entries = await getEnabledAIKeyEntries();
  const results: AIRouterDiagnosticItem[] = [];
  for (const entry of entries) {
    const started = Date.now();
    try {
      const result = await callProvider(entry, [{ role: "user", content: "Trả lời đúng một từ: OK" }], { temperature: 0.1, maxTokens: 16 });
      await setAIKeyStatus(entry.id, "ok");
      await logEntry(entry, "diagnostic", "ok", started, result.modelUsed || entry.model, 24, result.content?.length || 0);
      results.push({ provider: entry.provider, label: entry.label, model: result.modelUsed || entry.model, status: "ok", latencyMs: Date.now() - started, message: result.content?.slice(0, 80) || "OK" });
    } catch (err: any) {
      const status = isQuotaLikeError(err) ? "quota" : "error";
      await setAIKeyStatus(entry.id, status, err.message || String(err));
      await logEntry(entry, "diagnostic", status, started, entry.model, 24, 0, err.message || String(err));
      results.push({ provider: entry.provider, label: entry.label, model: entry.model, status, latencyMs: Date.now() - started, message: err.message || String(err) });
    }
  }
  if (entries.length === 0) {
    const started = Date.now();
    try {
      const r = await fetch(`${DEFAULT_PROXY_URL}/health`, { headers: { Authorization: `Bearer ${DEFAULT_PROXY_KEY}` } });
      const status = r.ok ? "ok" : "error";
      await appendAIUsageLog({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, mode: "diagnostic", status, latencyMs: Date.now() - started, promptChars: 0, outputChars: 0, error: r.ok ? undefined : `HTTP ${r.status}` });
      results.push({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, status, latencyMs: Date.now() - started, message: r.ok ? "LiteLLM proxy reachable" : `HTTP ${r.status}` });
    } catch (err: any) {
      await appendAIUsageLog({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, mode: "diagnostic", status: "error", latencyMs: Date.now() - started, promptChars: 0, outputChars: 0, error: err.message || String(err) });
      results.push({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, status: "error", latencyMs: Date.now() - started, message: err.message || String(err) });
    }
  }
  return { ok: results.some(r => r.status === "ok"), checkedAt: new Date().toISOString(), totalEnabledKeys: entries.length, results };
}

export async function testAIKey(input: { provider: AIProviderName; apiKey?: string; model?: string; baseUrl?: string }, options: Pick<CallAIOptions, "tools" | "toolChoice"> = {}): Promise<{ success: boolean; content?: string; modelUsed?: string; error?: string }> {
  const temp: DecryptedAIKeyEntry = { id: "test", provider: input.provider, label: "Test key", apiKey: input.apiKey?.trim() || "", model: input.model, baseUrl: input.baseUrl, enabled: true, priority: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const started = Date.now();
  try {
    const result = await callProvider(temp, [{ role: "user", content: "Trả lời ngắn gọn: OK" }], { temperature: 0.1, maxTokens: 32, ...options });
    await appendAIUsageLog({ provider: input.provider, label: "Test key", model: result.modelUsed || input.model, mode: "test", status: "ok", latencyMs: Date.now() - started, promptChars: 21, outputChars: result.content.length });
    await appendAIUsageLog({ provider: input.provider, label: "Test key", model: result.modelUsed || input.model, mode: "test", status: "ok", latencyMs: Date.now() - started, promptChars: 21, outputChars: result.content.length });
    return { success: true, content: result.content, modelUsed: result.modelUsed };
  }
  catch (err: any) {
    const isQuota = isQuotaLikeError(err);
    await appendAIUsageLog({ provider: input.provider, label: "Test key", model: input.model, mode: "test", status: isQuota ? "quota" : "error", latencyMs: Date.now() - started, promptChars: 21, outputChars: 0, error: err.message || String(err) });
    return { success: false, error: err.message || String(err) };
  }
}

async function callProvider(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  if (entry.provider === "gemini") return callGemini(entry, messages, options);
  if (entry.provider === "openai") return callOpenAICompatible(entry, messages, options, "https://api.openai.com/v1/chat/completions");
  if (entry.provider === "deepseek") return callOpenAICompatible(entry, messages, options, "https://api.deepseek.com/chat/completions");
  if (entry.provider === "groq") return callOpenAICompatible(entry, messages, options, "https://api.groq.com/openai/v1/chat/completions");
  if (entry.provider === "openrouter") return callOpenAICompatible(entry, messages, options, "https://openrouter.ai/api/v1/chat/completions", { "HTTP-Referer": "http://localhost:3000", "X-Title": "LedgerFlow Studio" });
  if (entry.provider === "anthropic") return callAnthropic(entry, messages, options);
  if (entry.provider === "ollama") return callOllama(entry, messages, options);
  if (entry.provider === "mistral") return callOpenAICompatible(entry, messages, options, "https://api.mistral.ai/v1/chat/completions");
  if (entry.provider === "together") return callOpenAICompatible(entry, messages, options, "https://api.together.xyz/v1/chat/completions");
  if (entry.provider === "perplexity") return callOpenAICompatible(entry, messages, options, "https://api.perplexity.ai/chat/completions");
  if (entry.provider === "xai") return callOpenAICompatible(entry, messages, options, "https://api.x.ai/v1/chat/completions");
  throw new ProviderError(`Unsupported provider: ${(entry as any).provider}`);
}
function streamProvider(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): AsyncGenerator<string, void, unknown> {
  if (entry.provider === "gemini") return streamGemini(entry, messages, options);
  if (entry.provider === "openai") return streamOpenAICompatible(entry, messages, options, "https://api.openai.com/v1/chat/completions");
  if (entry.provider === "deepseek") return streamOpenAICompatible(entry, messages, options, "https://api.deepseek.com/chat/completions");
  if (entry.provider === "groq") return streamOpenAICompatible(entry, messages, options, "https://api.groq.com/openai/v1/chat/completions");
  if (entry.provider === "openrouter") return streamOpenAICompatible(entry, messages, options, "https://openrouter.ai/api/v1/chat/completions", { "HTTP-Referer": "http://localhost:3000", "X-Title": "LedgerFlow Studio" });
  if (entry.provider === "anthropic") return streamAnthropic(entry, messages, options);
  if (entry.provider === "ollama") return streamOllama(entry, messages, options);
  if (entry.provider === "mistral") return streamOpenAICompatible(entry, messages, options, "https://api.mistral.ai/v1/chat/completions");
  if (entry.provider === "together") return streamOpenAICompatible(entry, messages, options, "https://api.together.xyz/v1/chat/completions");
  if (entry.provider === "perplexity") return streamOpenAICompatible(entry, messages, options, "https://api.perplexity.ai/chat/completions");
  if (entry.provider === "xai") return streamOpenAICompatible(entry, messages, options, "https://api.x.ai/v1/chat/completions");
  throw new ProviderError(`Unsupported provider: ${(entry as any).provider}`);
}

async function callGemini(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  if (!entry.apiKey) throw new ProviderError("Gemini API key is empty.", 401, undefined, "gemini");
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const url = `${entry.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(entry.apiKey)}`;
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildGeminiRequest(messages, options)) });
  const data = await readJson(response); if (!response.ok) throw providerHttpError("gemini", response.status, data);
  return { content: data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "", modelUsed: model, raw: data, toolCalls: parseGeminiToolCalls(data) };
}
async function* streamGemini(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): AsyncGenerator<string, void, unknown> {
  if (!entry.apiKey) throw new ProviderError("Gemini API key is empty.", 401, undefined, "gemini");
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const url = `${entry.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(entry.apiKey)}`;
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildGeminiRequest(messages, options)) });
  if (!response.ok || !response.body) throw providerHttpError("gemini", response.status, await readJson(response));
  for await (const event of parseSSE(response)) { const text = event?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || ""; if (text) yield text; }
}
function buildGeminiRequest(messages: ChatMessage[], options: CallAIOptions): Record<string, unknown> {
  const systemInstruction = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n") || undefined;
  const contents = messages.filter(m => m.role !== "system").map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  return {
    contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: options.maxTokens },
    tools: options.tools?.length ? toGeminiTools(options.tools) : undefined,
    toolConfig: options.tools?.length ? toGeminiToolConfig(options.toolChoice) : undefined,
  };
}

async function callOpenAICompatible(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions, defaultUrl: string, extraHeaders: Record<string, string> = {}): Promise<ProviderCallResult> {
  if (!entry.apiKey) throw new ProviderError(`${entry.provider} API key is empty.`, 401, undefined, entry.provider);
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const body = { model, messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens, stream: false, tools: options.tools?.length ? toOpenAITools(options.tools) : undefined, tool_choice: options.tools?.length ? toOpenAIToolChoice(options.toolChoice) : undefined };
  const response = await fetch(entry.baseUrl || defaultUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${entry.apiKey}`, ...extraHeaders }, body: JSON.stringify(body) });
  const data = await readJson(response); if (!response.ok) throw providerHttpError(entry.provider, response.status, data);
  return { content: data?.choices?.[0]?.message?.content ?? "", modelUsed: data?.model || model, raw: data, toolCalls: parseOpenAIToolCalls(data) };
}
async function* streamOpenAICompatible(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions, defaultUrl: string, extraHeaders: Record<string, string> = {}): AsyncGenerator<string, void, unknown> {
  if (!entry.apiKey) throw new ProviderError(`${entry.provider} API key is empty.`, 401, undefined, entry.provider);
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const response = await fetch(entry.baseUrl || defaultUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${entry.apiKey}`, ...extraHeaders }, body: JSON.stringify({ model, messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens, stream: true }) });
  if (!response.ok || !response.body) throw providerHttpError(entry.provider, response.status, await readJson(response));
  for await (const event of parseSSE(response)) { const delta = event?.choices?.[0]?.delta?.content; if (delta) yield delta; }
}

async function callAnthropic(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  if (!entry.apiKey) throw new ProviderError("Anthropic API key is empty.", 401, undefined, "anthropic");
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const response = await fetch(entry.baseUrl || "https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": entry.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify(buildAnthropicRequest(messages, options, model, false)) });
  const data = await readJson(response); if (!response.ok) throw providerHttpError("anthropic", response.status, data);
  return { content: Array.isArray(data?.content) ? data.content.map((p: any) => p.text || "").join("") : "", modelUsed: data?.model || model, raw: data, toolCalls: parseAnthropicToolCalls(data) };
}
async function* streamAnthropic(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): AsyncGenerator<string, void, unknown> {
  if (!entry.apiKey) throw new ProviderError("Anthropic API key is empty.", 401, undefined, "anthropic");
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const response = await fetch(entry.baseUrl || "https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": entry.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify(buildAnthropicRequest(messages, options, model, true)) });
  if (!response.ok || !response.body) throw providerHttpError("anthropic", response.status, await readJson(response));
  for await (const event of parseSSE(response)) { if (event?.type === "content_block_delta" && event.delta?.text) yield event.delta.text; }
}
function buildAnthropicRequest(messages: ChatMessage[], options: CallAIOptions, model: string, stream: boolean): Record<string, unknown> {
  const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n") || undefined;
  const anthropicMessages = messages.filter(m => m.role !== "system").map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
  return { model, system, messages: anthropicMessages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 1024, stream, tools: options.tools?.length ? toAnthropicTools(options.tools) : undefined, tool_choice: options.tools?.length ? toAnthropicToolChoice(options.toolChoice) : undefined };
}

async function callOllama(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const response = await fetch(entry.baseUrl || "http://127.0.0.1:11434/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages, stream: false, options: { temperature: options.temperature ?? 0.7, num_predict: options.maxTokens } }) });
  const data = await readJson(response); if (!response.ok) throw providerHttpError("ollama", response.status, data);
  return { content: data?.message?.content ?? "", modelUsed: model, raw: data };
}
async function* streamOllama(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): AsyncGenerator<string, void, unknown> {
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const response = await fetch(entry.baseUrl || "http://127.0.0.1:11434/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages, stream: true, options: { temperature: options.temperature ?? 0.7, num_predict: options.maxTokens } }) });
  if (!response.ok || !response.body) throw providerHttpError("ollama", response.status, await readJson(response));
  for await (const obj of parseNDJSON(response)) { const text = obj?.message?.content; if (text) yield text; }
}

async function callLiteLLMProxy(messages: ChatMessage[], options: CallAIOptions): Promise<CallAIResult> {
  const body = { model: options.model ?? "ai-assistant", messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens, stream: false, tools: options.tools?.length ? toOpenAITools(options.tools) : undefined, tool_choice: options.tools?.length ? toOpenAIToolChoice(options.toolChoice) : undefined };
  const response = await fetch(`${DEFAULT_PROXY_URL}/v1/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEFAULT_PROXY_KEY}` }, body: JSON.stringify(body) });
  const data = await readJson(response); if (!response.ok) throw providerHttpError("litellm-proxy", response.status, data);
  return { content: data?.choices?.[0]?.message?.content ?? "", modelUsed: data?.model, raw: data, toolCalls: parseOpenAIToolCalls(data) };
}
async function* streamLiteLLMProxy(messages: ChatMessage[], options: CallAIOptions): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${DEFAULT_PROXY_URL}/v1/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEFAULT_PROXY_KEY}` }, body: JSON.stringify({ model: options.model ?? "ai-assistant", messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens, stream: true }) });
  if (!response.ok || !response.body) throw providerHttpError("litellm-proxy", response.status, await readJson(response));
  for await (const event of parseSSE(response)) { const delta = event?.choices?.[0]?.delta?.content; if (delta) yield delta; }
}

async function* parseSSE(response: Response): AsyncGenerator<any, void, unknown> {
  const reader = response.body?.getReader(); if (!reader) return;
  const decoder = new TextDecoder(); let buffer = "";
  try { while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split(/\n\n/); buffer = events.pop() ?? ""; for (const event of events) { for (const line of event.split("\n")) { const trimmed = line.trim(); if (!trimmed.startsWith("data:")) continue; const payload = trimmed.slice(5).trim(); if (!payload || payload === "[DONE]") return; try { yield JSON.parse(payload); } catch {} } } } } finally { reader.releaseLock(); }
}
async function* parseNDJSON(response: Response): AsyncGenerator<any, void, unknown> {
  const reader = response.body?.getReader(); if (!reader) return;
  const decoder = new TextDecoder(); let buffer = "";
  try { while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; for (const line of lines) { const trimmed = line.trim(); if (!trimmed) continue; try { yield JSON.parse(trimmed); } catch {} } } const last = buffer.trim(); if (last) { try { yield JSON.parse(last); } catch {} } } finally { reader.releaseLock(); }
}

async function logEntry(entry: DecryptedAIKeyEntry, mode: AIUsageMode, status: "ok" | "quota" | "error", started: number, model?: string, promptChars = 0, outputChars = 0, error?: string): Promise<void> {
  await appendAIUsageLog({ provider: entry.provider, keyId: entry.id, label: entry.label, model, mode, status, latencyMs: Date.now() - started, promptChars, outputChars, error });
}
function countPromptChars(messages: ChatMessage[]): number { return messages.reduce((sum, msg) => sum + msg.content.length, 0); }
export interface TaskComplexityAnalysis {
  score: number; // 0 to 100
  tier: 'fast' | 'standard' | 'pro';
  recommendedModel: string;
  reason: string;
}

export function analyzeTaskComplexity(messages: ChatMessage[], task: string = 'general'): TaskComplexityAnalysis {
  const userText = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
  const length = userText.length;
  let score = 25;

  if (length > 2500) score += 35;
  else if (length > 800) score += 20;
  else if (length < 80) score -= 10;

  const lower = userText.toLowerCase();
  if (/\b(refactor|architecture|debug|cơ chế|thuật toán|audit|báo cáo tài chính|vas 200|phân tích chuyên sâu|so sánh chi tiết)\b/i.test(lower)) {
    score += 30;
  }
  if (/\b(câu lệnh|sql|regex|typescript|function|interface|schema)\b/i.test(lower)) {
    score += 15;
  }
  if (/\b(tóm tắt|dịch|ngắn gọn|yes\/no|ok|chào|check)\b/i.test(lower)) {
    score -= 15;
  }

  score = Math.max(5, Math.min(100, score));

  if (score >= 70 || task === 'coding' || task === 'analytics' || task === 'accounting') {
    return {
      score,
      tier: 'pro',
      recommendedModel: 'gemini-2.5-pro',
      reason: 'Nhiệm vụ phức tạp đòi hỏi khả năng suy luận sâu và độ chính xác cao.',
    };
  }
  if (score >= 35) {
    return {
      score,
      tier: 'standard',
      recommendedModel: 'deepseek-chat',
      reason: 'Nhiệm vụ tiêu chuẩn, cân bằng giữa chất lượng và chi phí tối ưu.',
    };
  }
  return {
    score,
    tier: 'fast',
    recommendedModel: 'gemini-2.5-flash',
    reason: 'Nhiệm vụ ngắn/nhanh, ưu tiên phản hồi siêu tốc với chi phí $0.',
  };
}

function orderEntriesByPolicy(entries: DecryptedAIKeyEntry[], options: CallAIOptions): DecryptedAIKeyEntry[] {
  const preferredProvider = options.preferredProvider;
  const preferredModel = options.preferredModel?.trim();
  const preferredEntries = entries.filter((entry) => {
    if (preferredProvider && entry.provider !== preferredProvider) return false;
    if (preferredModel && (entry.model || '').trim() !== preferredModel) return false;
    return true;
  });

  const candidateEntries = preferredEntries.length > 0 ? preferredEntries : entries;
  if (options.strictPreferred && (preferredProvider || preferredModel) && preferredEntries.length === 0) {
    throw new ProviderError('No enabled AI key matched the preferred provider/model.', 404, { preferredProvider, preferredModel });
  }

  if (candidateEntries.length <= 1) return candidateEntries;
  const model = options.model ?? "ai-assistant";
  const task = options.task ?? "general";
  return candidateEntries
    .slice()
    .sort((a, b) => {
      const rankA = getProviderRank(a.provider, model, task);
      const rankB = getProviderRank(b.provider, model, task);
      if (rankA !== rankB) return rankA - rankB;
      return a.priority - b.priority || a.createdAt.localeCompare(b.createdAt);
    });
}
function getProviderRank(provider: AIProviderName, model: NonNullable<CallAIOptions["model"]>, task: NonNullable<CallAIOptions["task"]>): number {
  const fastModelOrder: AIProviderName[] = ["groq", "gemini", "deepseek", "openrouter", "openai", "anthropic", "ollama"];
  const proModelOrder: AIProviderName[] = ["anthropic", "openai", "gemini", "deepseek", "openrouter", "groq", "ollama"];
  const rank = (order: AIProviderName[]): number => {
    const idx = order.indexOf(provider);
    return idx >= 0 ? idx : 999;
  };

  if (task === "coding") {
    const order: AIProviderName[] = ["anthropic", "openai", "deepseek", "openrouter", "gemini", "groq", "ollama"];
    return rank(order);
  }
  if (task === "analytics" || task === "accounting") {
    const order: AIProviderName[] = ["anthropic", "openai", "gemini", "deepseek", "openrouter", "groq", "ollama"];
    return rank(order);
  }
  if (task === "marketing" || task === "sales") {
    const order: AIProviderName[] = ["openai", "anthropic", "gemini", "openrouter", "groq", "deepseek", "ollama"];
    return rank(order);
  }

  return rank(model === "ai-assistant-pro" ? proModelOrder : fastModelOrder);
}
function resolveDefaultModel(provider: AIProviderName, requested?: CallAIOptions["model"]): string {
  const pro = requested === "ai-assistant-pro";
  if (provider === "gemini") return pro ? "gemini-2.5-pro" : "gemini-2.5-flash";
  if (provider === "openai") return pro ? "gpt-4o" : "gpt-4o-mini";
  if (provider === "deepseek") return pro ? "deepseek-reasoner" : "deepseek-chat";
  if (provider === "groq") return pro ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
  if (provider === "openrouter") return pro ? "meta-llama/llama-3.1-70b-instruct:free" : "meta-llama/llama-3.1-8b-instruct:free";
  if (provider === "anthropic") return pro ? "claude-3-7-sonnet" : "claude-3-5-haiku-latest";
  if (provider === "mistral") return pro ? "mistral-large-latest" : "mistral-small-latest";
  if (provider === "together") return pro ? "meta-llama/Llama-3.3-70B-Instruct-Turbo" : "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
  if (provider === "perplexity") return pro ? "sonar-reasoning-pro" : "sonar-pro";
  if (provider === "xai") return "grok-2-latest";
  return "qwen2.5-coder:7b";
}
function isQuotaLikeError(err: any): boolean { const text = `${err?.status || ""} ${err?.message || ""} ${JSON.stringify(err?.body || {})}`.toLowerCase(); return text.includes("429") || text.includes("quota") || text.includes("rate limit") || text.includes("too many requests") || text.includes("resource_exhausted"); }
function providerHttpError(provider: AIProviderName | "litellm-proxy", status: number, body: unknown): ProviderError { return new ProviderError(extractErrorMessage(body) || `${provider} returned HTTP ${status}`, status, body, provider); }
function extractErrorMessage(body: any): string | undefined { return body?.error?.message || body?.error || body?.message || body?.detail; }
async function readJson(response: Response): Promise<any> { try { return await response.json(); } catch { return null; } }
