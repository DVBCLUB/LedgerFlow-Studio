import fs from "fs";
import type { AIProviderName } from "./aiKeyVault.ts";
import { ensureRuntimeRootSync, resolveRuntimeReadPathFromEnv, resolveRuntimePathFromEnv } from "./runtimePaths.ts";

export type AIUsageStatus = "ok" | "quota" | "error";
export type AIUsageMode = "call" | "stream" | "diagnostic" | "test";

export interface AIUsageLogEntry {
  id: string;
  at: string;
  provider: AIProviderName | "litellm-proxy";
  keyId?: string;
  label: string;
  model?: string;
  mode: AIUsageMode;
  status: AIUsageStatus;
  latencyMs: number;
  promptChars?: number;
  outputChars?: number;
  error?: string;
}

const MAX_LOG_ENTRIES = 300;

function logFile() {
  return resolveRuntimePathFromEnv("AI_USAGE_LOG_FILE", "ai_usage.log.json");
}

export async function appendAIUsageLog(input: Omit<AIUsageLogEntry, "id" | "at">): Promise<void> {
  try {
    ensureRuntimeRootSync();
    const logs = await readAIUsageLogs(MAX_LOG_ENTRIES);
    const entry: AIUsageLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      at: new Date().toISOString(),
      ...input,
    };
    logs.unshift(entry);
    await fs.promises.writeFile(logFile(), JSON.stringify(logs.slice(0, MAX_LOG_ENTRIES), null, 2), "utf-8");
  } catch {
    // Usage logging is best-effort and must never break AI generation.
  }
}

export async function readAIUsageLogs(limit = 100): Promise<AIUsageLogEntry[]> {
  try {
    const readPath = resolveRuntimeReadPathFromEnv("AI_USAGE_LOG_FILE", "ai_usage.log.json");
    if (!fs.existsSync(readPath)) return [];
    const raw = await fs.promises.readFile(readPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, Math.max(1, Math.min(limit, MAX_LOG_ENTRIES)));
  } catch {
    return [];
  }
}

export async function clearAIUsageLogs(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(logFile(), JSON.stringify([], null, 2), "utf-8");
}
