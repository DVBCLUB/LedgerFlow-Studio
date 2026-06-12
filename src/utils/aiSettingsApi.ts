export type AIProviderId = "gemini" | "groq" | "openrouter" | "anthropic" | "ollama";

export interface AIProviderDefinition {
  id: AIProviderId;
  label: string;
  requiresApiKey: boolean;
  defaultModel: string;
  docsUrl: string;
  note: string;
}

export interface AIKeySummary {
  id: string;
  provider: AIProviderId;
  providerLabel: string;
  label: string;
  model?: string;
  baseUrl?: string;
  maskedKey: string;
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  lastStatus: "ok" | "error" | "quota" | "untested";
  lastError?: string;
}

export interface AIKeyPayload {
  provider: AIProviderId;
  label?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  priority?: number;
  enabled?: boolean;
}

export interface AIVaultSecurityStatus {
  exists: boolean;
  mode: "local" | "passphrase";
  hasPassphrase: boolean;
  isLocked: boolean;
  canDecrypt: boolean;
  totalKeys: number;
  enabledKeys: number;
  secretFileExists: boolean;
  updatedAt?: string;
  message: string;
}

export interface AIVaultAutoLockStatus {
  enabled: boolean;
  timeoutMinutes: number;
  armed: boolean;
  lastActivityAt?: string;
  expiresAt?: string;
  remainingSeconds?: number;
  message: string;
}

export interface AIUsageLogEntry {
  id: string;
  timestamp: string;
  provider?: AIProviderId | "litellm-proxy";
  keyId?: string;
  keyLabel?: string;
  model?: string;
  operation: "call" | "stream" | "diagnostic" | "test";
  status: "ok" | "quota" | "error";
  latencyMs?: number;
  promptChars?: number;
  outputChars?: number;
  error?: string;
}

export interface AIDiagnosticResult {
  provider: AIProviderId | "litellm-proxy";
  label: string;
  model?: string;
  status: "ok" | "quota" | "error" | "skipped";
  latencyMs?: number;
  message?: string;
}

export interface AIPreflightCheck {
  id: string;
  label: string;
  severity: "ok" | "warn" | "error";
  message: string;
  action?: string;
}

export interface AIPreflightReport {
  ok: boolean;
  checkedAt: string;
  summary: string;
  checks: AIPreflightCheck[];
  stats: {
    totalKeys: number;
    enabledKeys: number;
    okKeys: number;
    quotaKeys: number;
    errorKeys: number;
    recentErrors: number;
  };
}

export interface AIChatResponse {
  success: boolean;
  text?: string;
  modelUsed?: string;
  error?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.error || payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function fetchAIProviders(): Promise<AIProviderDefinition[]> {
  const data = await readJson<{ providers: AIProviderDefinition[] }>(await fetch("/api/ai/providers"));
  return data.providers;
}

export async function fetchAIVaultStatus(): Promise<AIVaultSecurityStatus> {
  const data = await readJson<{ vault: AIVaultSecurityStatus }>(await fetch("/api/ai/vault/status"));
  return data.vault;
}

export async function fetchAIVaultAutoLockStatus(): Promise<AIVaultAutoLockStatus> {
  const data = await readJson<{ autoLock: AIVaultAutoLockStatus }>(await fetch("/api/ai/vault/auto-lock"));
  return data.autoLock;
}

export async function updateAIVaultAutoLock(payload: Partial<Pick<AIVaultAutoLockStatus, "enabled" | "timeoutMinutes">>): Promise<AIVaultAutoLockStatus> {
  const data = await readJson<{ autoLock: AIVaultAutoLockStatus }>(await fetch("/api/ai/vault/auto-lock", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
  return data.autoLock;
}

export async function setAIVaultPassphrase(passphrase: string): Promise<AIVaultSecurityStatus> {
  const data = await readJson<{ vault: AIVaultSecurityStatus }>(await fetch("/api/ai/vault/passphrase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passphrase }),
  }));
  return data.vault;
}

export async function unlockAIVault(passphrase: string): Promise<AIVaultSecurityStatus> {
  const data = await readJson<{ vault: AIVaultSecurityStatus }>(await fetch("/api/ai/vault/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passphrase }),
  }));
  return data.vault;
}

export async function lockAIVault(): Promise<AIVaultSecurityStatus> {
  const data = await readJson<{ vault: AIVaultSecurityStatus }>(await fetch("/api/ai/vault/lock", { method: "POST" }));
  return data.vault;
}

export async function fetchAIKeys(): Promise<AIKeySummary[]> {
  const data = await readJson<{ keys: AIKeySummary[] }>(await fetch("/api/ai/keys"));
  return data.keys;
}

export async function createAIKey(payload: AIKeyPayload): Promise<AIKeySummary> {
  const data = await readJson<{ key: AIKeySummary }>(await fetch("/api/ai/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
  return data.key;
}

export async function updateAIKey(id: string, payload: Partial<AIKeyPayload>): Promise<AIKeySummary> {
  const data = await readJson<{ key: AIKeySummary }>(await fetch(`/api/ai/keys/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
  return data.key;
}

export async function deleteAIKey(id: string): Promise<void> {
  await readJson(await fetch(`/api/ai/keys/${id}`, { method: "DELETE" }));
}

export async function testAIKey(payload: AIKeyPayload): Promise<{ ok: boolean; status: string; latencyMs?: number; error?: string }> {
  return readJson(await fetch("/api/ai/keys/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export async function runAIDiagnostics(): Promise<AIDiagnosticResult[]> {
  const data = await readJson<{ results: AIDiagnosticResult[] }>(await fetch("/api/ai/diagnostics"));
  return data.results;
}

export async function runAIPreflight(): Promise<AIPreflightReport> {
  const data = await readJson<{ report: AIPreflightReport }>(await fetch("/api/ai/preflight"));
  return data.report;
}

export async function fetchAIUsageLogs(): Promise<AIUsageLogEntry[]> {
  const data = await readJson<{ logs: AIUsageLogEntry[] }>(await fetch("/api/ai/logs"));
  return data.logs;
}

export async function clearAIUsageLogs(): Promise<void> {
  await readJson(await fetch("/api/ai/logs", { method: "DELETE" }));
}

export async function exportAIKeyBackup(passphrase: string): Promise<unknown> {
  const data = await readJson<{ backup: unknown }>(await fetch("/api/ai/backup/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passphrase }),
  }));
  return data.backup;
}

export async function importAIKeyBackup(backup: unknown, passphrase: string, mode: "merge" | "replace"): Promise<{ imported: number; total: number; keys: AIKeySummary[] }> {
  return readJson(await fetch("/api/ai/backup/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ backup, passphrase, mode }),
  }));
}

export async function callAIFromSettings(prompt: string, model: "ai-assistant" | "ai-assistant-pro" = "ai-assistant"): Promise<AIChatResponse> {
  return readJson(await fetch("/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  }));
}

export async function streamAIFromSettings(
  prompt: string,
  onChunk: (text: string) => void,
  model: "ai-assistant" | "ai-assistant-pro" = "ai-assistant"
): Promise<void> {
  const response = await fetch("/api/gemini/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  });

  if (!response.ok || !response.body) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        if (json.error) throw new Error(json.error);
        if (json.text) onChunk(json.text);
      } catch (err) {
        if (err instanceof Error && payload.startsWith("{")) throw err;
      }
    }
  }
}
