import { getEnabledAIKeyEntries, setAIKeyStatus, type AIProviderName, type DecryptedAIKeyEntry } from "./aiKeyVault";
import type { CallAIOptions, CallAIResult, ChatMessage } from "./aiClient";

interface ProviderCallResult {
  content: string;
  modelUsed?: string;
  raw: unknown;
}

class ProviderError extends Error {
  constructor(message: string, public status?: number, public body?: unknown, public provider?: AIProviderName) {
    super(message);
    this.name = "ProviderError";
  }
}

const DEFAULT_PROXY_URL = process.env.AI_PROXY_URL ?? "http://127.0.0.1:4000";
const DEFAULT_PROXY_KEY = process.env.AI_PROXY_KEY ?? "sk-ledgerflow-local-2026";

export async function callAIWithFallback(messages: ChatMessage[], options: CallAIOptions = {}): Promise<CallAIResult> {
  const entries = await getEnabledAIKeyEntries();
  const errors: string[] = [];

  for (const entry of entries) {
    try {
      const result = await callProvider(entry, messages, options);
      await setAIKeyStatus(entry.id, "ok");
      return {
        content: result.content,
        modelUsed: `${entry.provider}/${result.modelUsed || entry.model || "default"}`,
        raw: result.raw,
      };
    } catch (err: any) {
      const isQuota = isQuotaLikeError(err);
      await setAIKeyStatus(entry.id, isQuota ? "quota" : "error", err.message || String(err));
      errors.push(`${entry.provider}:${entry.label} -> ${err.message || err}`);
      if (!isQuota && !isRetryableProviderError(err)) {
        // Keep falling back because user explicitly wants multi-provider resilience.
      }
    }
  }

  // Compatibility fallback: if no local vault keys are configured, keep old LiteLLM proxy flow working.
  if (entries.length === 0) {
    try {
      return await callLiteLLMProxy(messages, options);
    } catch (err: any) {
      errors.push(`litellm-proxy -> ${err.message || err}`);
    }
  }

  throw new ProviderError(
    `Không còn provider/key AI khả dụng. Chi tiết: ${errors.join(" | ") || "Chưa cấu hình key AI."}`,
    429,
    { errors }
  );
}

export async function* streamAIWithFallback(messages: ChatMessage[], options: CallAIOptions = {}): AsyncGenerator<string, void, unknown> {
  // Stable fallback-first implementation: route once, then emit chunks for existing SSE UI.
  // This keeps provider/key fallback consistent across Gemini/Groq/OpenRouter/Claude/Ollama.
  const result = await callAIWithFallback(messages, options);
  const text = result.content || "";
  const chunkSize = 96;
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
  }
}

export async function checkAIRouterHealth(): Promise<boolean> {
  const entries = await getEnabledAIKeyEntries();
  if (entries.length > 0) return true;
  try {
    const response = await fetch(`${DEFAULT_PROXY_URL}/health`, {
      headers: { Authorization: `Bearer ${DEFAULT_PROXY_KEY}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function testAIKey(input: {
  provider: AIProviderName;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}): Promise<{ success: boolean; content?: string; modelUsed?: string; error?: string }> {
  const temp: DecryptedAIKeyEntry = {
    id: "test",
    provider: input.provider,
    label: "Test key",
    apiKey: input.apiKey?.trim() || "",
    model: input.model,
    baseUrl: input.baseUrl,
    enabled: true,
    priority: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    const result = await callProvider(temp, [{ role: "user", content: "Trả lời ngắn gọn: OK" }], { temperature: 0.1, maxTokens: 32 });
    return { success: true, content: result.content, modelUsed: result.modelUsed };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

async function callProvider(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  switch (entry.provider) {
    case "gemini":
      return callGemini(entry, messages, options);
    case "groq":
      return callOpenAICompatible(entry, messages, options, "https://api.groq.com/openai/v1/chat/completions");
    case "openrouter":
      return callOpenAICompatible(entry, messages, options, "https://openrouter.ai/api/v1/chat/completions", {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "LedgerFlow Studio",
      });
    case "anthropic":
      return callAnthropic(entry, messages, options);
    case "ollama":
      return callOllama(entry, messages, options);
    default:
      throw new ProviderError(`Unsupported provider: ${(entry as any).provider}`);
  }
}

async function callGemini(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  if (!entry.apiKey) throw new ProviderError("Gemini API key is empty.", 401, undefined, "gemini");
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const systemInstruction = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n") || undefined;
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const url = `${entry.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(entry.apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
      },
    }),
  });
  const data = await readJson(response);
  if (!response.ok) throw providerHttpError("gemini", response.status, data);
  const content = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  return { content, modelUsed: model, raw: data };
}

async function callOpenAICompatible(
  entry: DecryptedAIKeyEntry,
  messages: ChatMessage[],
  options: CallAIOptions,
  defaultUrl: string,
  extraHeaders: Record<string, string> = {}
): Promise<ProviderCallResult> {
  if (!entry.apiKey) throw new ProviderError(`${entry.provider} API key is empty.`, 401, undefined, entry.provider);
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const response = await fetch(entry.baseUrl || defaultUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${entry.apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: false,
    }),
  });
  const data = await readJson(response);
  if (!response.ok) throw providerHttpError(entry.provider, response.status, data);
  return {
    content: data?.choices?.[0]?.message?.content ?? "",
    modelUsed: data?.model || model,
    raw: data,
  };
}

async function callAnthropic(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  if (!entry.apiKey) throw new ProviderError("Anthropic API key is empty.", 401, undefined, "anthropic");
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n") || undefined;
  const anthropicMessages = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
  const response = await fetch(entry.baseUrl || "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": entry.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system,
      messages: anthropicMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });
  const data = await readJson(response);
  if (!response.ok) throw providerHttpError("anthropic", response.status, data);
  const content = Array.isArray(data?.content) ? data.content.map((p: any) => p.text || "").join("") : "";
  return { content, modelUsed: data?.model || model, raw: data };
}

async function callOllama(entry: DecryptedAIKeyEntry, messages: ChatMessage[], options: CallAIOptions): Promise<ProviderCallResult> {
  const model = entry.model || resolveDefaultModel(entry.provider, options.model);
  const response = await fetch(entry.baseUrl || "http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: options.temperature ?? 0.7, num_predict: options.maxTokens },
    }),
  });
  const data = await readJson(response);
  if (!response.ok) throw providerHttpError("ollama", response.status, data);
  return { content: data?.message?.content ?? "", modelUsed: model, raw: data };
}

async function callLiteLLMProxy(messages: ChatMessage[], options: CallAIOptions): Promise<CallAIResult> {
  const response = await fetch(`${DEFAULT_PROXY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEFAULT_PROXY_KEY}`,
    },
    body: JSON.stringify({
      model: options.model ?? "ai-assistant",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: false,
    }),
  });
  const data = await readJson(response);
  if (!response.ok) throw providerHttpError("openrouter", response.status, data);
  return {
    content: data?.choices?.[0]?.message?.content ?? "",
    modelUsed: data?.model,
    raw: data,
  };
}

function resolveDefaultModel(provider: AIProviderName, requested?: CallAIOptions["model"]): string {
  const pro = requested === "ai-assistant-pro";
  if (provider === "gemini") return pro ? "gemini-2.0-flash" : "gemini-2.0-flash";
  if (provider === "groq") return pro ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
  if (provider === "openrouter") return pro ? "meta-llama/llama-3.1-70b-instruct:free" : "meta-llama/llama-3.1-8b-instruct:free";
  if (provider === "anthropic") return pro ? "claude-3-5-sonnet-latest" : "claude-3-5-haiku-latest";
  return "qwen2.5:7b";
}

function isQuotaLikeError(err: any): boolean {
  const text = `${err?.status || ""} ${err?.message || ""} ${JSON.stringify(err?.body || {})}`.toLowerCase();
  return text.includes("429") || text.includes("quota") || text.includes("rate limit") || text.includes("too many requests") || text.includes("resource_exhausted");
}

function isRetryableProviderError(err: any): boolean {
  const status = Number(err?.status || 0);
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function providerHttpError(provider: AIProviderName, status: number, body: unknown): ProviderError {
  const message = extractErrorMessage(body) || `${provider} returned HTTP ${status}`;
  return new ProviderError(message, status, body, provider);
}

function extractErrorMessage(body: any): string | undefined {
  if (!body) return undefined;
  return body.error?.message || body.error || body.message || body.detail;
}

async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
