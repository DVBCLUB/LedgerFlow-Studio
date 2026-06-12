import { getEnabledAIKeyEntries, setAIKeyStatus, type AIProviderName, type DecryptedAIKeyEntry } from "./aiKeyVault";
import type { CallAIOptions, CallAIResult, ChatMessage } from "./aiClient";
import { appendAIUsageLog, type AIUsageMode } from "./aiUsageLog";

interface ProviderCallResult { content: string; modelUsed?: string; raw: unknown }
export interface AIRouterDiagnosticItem { provider: AIProviderName | "litellm-proxy"; label: string; model?: string; status: "ok" | "quota" | "error" | "skipped"; latencyMs?: number; message?: string }
export interface AIRouterDiagnostics { ok: boolean; checkedAt: string; totalEnabledKeys: number; results: AIRouterDiagnosticItem[] }

class ProviderError extends Error {
  constructor(message: string, public status?: number, public body?: unknown, public provider?: AIProviderName | "litellm-proxy") { super(message); this.name = "ProviderError"; }
}

const DEFAULT_PROXY_URL = process.env.AI_PROXY_URL ?? "http://127.0.0.1:4000";
const DEFAULT_PROXY_KEY = process.env.AI_PROXY_KEY ?? "sk-ledgerflow-local-2026";

export async function callAIWithFallback(messages: ChatMessage[], options: CallAIOptions = {}): Promise<CallAIResult> {
  const entries = await getEnabledAIKeyEntries();
  const errors: string[] = [];
  const promptChars = countPromptChars(messages);

  for (const entry of entries) {
    const started = Date.now();
    try {
      const result = await callProvider(entry, messages, options);
      await setAIKeyStatus(entry.id, "ok");
      await logEntry(entry, "call", "ok", started, result.modelUsed || entry.model, promptChars, result.content.length);
      return { content: result.content, modelUsed: `${entry.provider}/${result.modelUsed || entry.model || "default"}`, raw: result.raw };
    } catch (err: any) {
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
      return result;
    } catch (err: any) {
      const isQuota = isQuotaLikeError(err);
      await appendAIUsageLog({ provider: "litellm-proxy", label: DEFAULT_PROXY_URL, model: options.model, mode: "call", status: isQuota ? "quota" : "error", latencyMs: Date.now() - started, promptChars, outputChars: 0, error: err.message || String(err) });
      errors.push(`litellm-proxy -> ${err.message || err}`);
    }
  }

  throw new ProviderError(`Không còn provider/key AI khả dụng. Chi tiết: ${errors.join(" | ") || "Chưa cấu hình key AI."}`, 429, { errors });
}

export async function* streamAIWithFallback(messages: ChatMessage[], options: CallAIOptions = {}): AsyncGenerator<string, void, unknown> {
  const entries = await getEnabledAIKeyEntries();
  const errors: string[] = [];
  const promptChars = countPromptChars(messages);

  for (const entry of entries) {
    let yielded = false;
    let outputChars = 0;
    const started = Date.now();
    try {
      for await (const chunk of streamProvider(entry, messages, options)) {
        yielded = true;
        outputChars += chunk.length;
        yield chunk;
      }
      await setAIKeyStatus(entry.id, "ok");
      await logEntry(entry, "stream", "ok", started, entry.model, promptChars, outputChars);
      return;
    } catch (err: any) {
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

  throw new ProviderError(`Không còn provider/key AI stream khả dụng. Chi tiết: ${errors.join(" | ") || "Chưa cấu hình key AI."}`, 429, { errors });
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

export async function testAIKey(input: { provider: AIProviderName; apiKey?: string; model?: string; baseUrl?: string }): Promise<{ success: boolean; content?: string; modelUsed?: string; error?: string }> {
  const temp: DecryptedAIKeyEntry = { id: "test", provider: input.provider, label: "Test key", apiKey: input.apiKey?.trim() || "", model: input.model, baseUrl: input.baseUrl, enabled: true, priority: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const started = Date.now();
  try {
    const result = await callProvider(temp, [{ role: "user", content: "Trả lời ngắn gọn: OK" }], { temperature: 0.1, maxTokens: 32 });
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
  if (entry.provider === "groq") return callOpenAICompatible(entry, messages, options, "https://api.groq.com/openai/v1/chat/completions");
  if (entry.provider === "openrouter") return callOpenAICompatible(entry, messages, options, "https://openrouter.ai/api/v1/chat/completions", { "HTTP-Referer": "http://localhost:3000", "X-Title": "LedgerFlow Studio" });
  if (entry.provider === "anthropic") return callAnthropic(entry, messages, options);
  if (entry.provider === "ollama") return callOllama(entry, messages, options);
  throw new ProviderError(`Unsupported provider: ${(entry as any).provider}`);
}
function streamProvider(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): AsyncGenerator<string, void, unknown> {
  if (entry.provider === "gemini") return streamGemini(entry, messages, options);
  if (entry.provider === "groq") return streamOpenAICompatible(entry, messages, options, "https://api.groq.com/openai/v1/chat/completions");
  if (entry.provider === "openrouter") return streamOpenAICompatible(entry, messages, options, "https://openrouter.ai/api/v1/chat/completions", { "HTTP-Referer": "http://localhost:3000", "X-Title": "LedgerFlow Studio" });
  if (entry.provider === "anthropic") return streamAnthropic(entry, messages, options);
  if (entry.provider === "ollama") return streamOllama(entry, messages, options);
  throw new ProviderError(`Unsupported provider: ${(entry as any).provider}`);
}

async function callGemini(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  if (!entry.apiKey) throw new ProviderError("Gemini API key is empty.", 401, undefined, "gemini");
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const url = `${entry.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(entry.apiKey)}`;
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildGeminiRequest(messages, options)) });
  const data = await readJson(response); if (!response.ok) throw providerHttpError("gemini", response.status, data);
  return { content: data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "", modelUsed: model, raw: data };
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
  return { contents, systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined, generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: options.maxTokens } };
}

async function callOpenAICompatible(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions, defaultUrl: string, extraHeaders: Record<string, string> = {}): Promise<ProviderCallResult> {
  if (!entry.apiKey) throw new ProviderError(`${entry.provider} API key is empty.`, 401, undefined, entry.provider);
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const response = await fetch(entry.baseUrl || defaultUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${entry.apiKey}`, ...extraHeaders }, body: JSON.stringify({ model, messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens, stream: false }) });
  const data = await readJson(response); if (!response.ok) throw providerHttpError(entry.provider, response.status, data);
  return { content: data?.choices?.[0]?.message?.content ?? "", modelUsed: data?.model || model, raw: data };
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
  return { content: Array.isArray(data?.content) ? data.content.map((p: any) => p.text || "").join("") : "", modelUsed: data?.model || model, raw: data };
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
  return { model, system, messages: anthropicMessages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 1024, stream };
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
  const response = await fetch(`${DEFAULT_PROXY_URL}/v1/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEFAULT_PROXY_KEY}` }, body: JSON.stringify({ model: options.model ?? "ai-assistant", messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens, stream: false }) });
  const data = await readJson(response); if (!response.ok) throw providerHttpError("litellm-proxy", response.status, data);
  return { content: data?.choices?.[0]?.message?.content ?? "", modelUsed: data?.model, raw: data };
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
function resolveDefaultModel(provider: AIProviderName, requested?: CallAIOptions["model"]): string { const pro = requested === "ai-assistant-pro"; if (provider === "gemini") return pro ? "gemini-2.0-flash" : "gemini-2.0-flash"; if (provider === "groq") return pro ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant"; if (provider === "openrouter") return pro ? "meta-llama/llama-3.1-70b-instruct:free" : "meta-llama/llama-3.1-8b-instruct:free"; if (provider === "anthropic") return pro ? "claude-3-5-sonnet-latest" : "claude-3-5-haiku-latest"; return "qwen2.5:7b"; }
function isQuotaLikeError(err: any): boolean { const text = `${err?.status || ""} ${err?.message || ""} ${JSON.stringify(err?.body || {})}`.toLowerCase(); return text.includes("429") || text.includes("quota") || text.includes("rate limit") || text.includes("too many requests") || text.includes("resource_exhausted"); }
function providerHttpError(provider: AIProviderName | "litellm-proxy", status: number, body: unknown): ProviderError { return new ProviderError(extractErrorMessage(body) || `${provider} returned HTTP ${status}`, status, body, provider); }
function extractErrorMessage(body: any): string | undefined { return body?.error?.message || body?.error || body?.message || body?.detail; }
async function readJson(response: Response): Promise<any> { try { return await response.json(); } catch { return null; } }
