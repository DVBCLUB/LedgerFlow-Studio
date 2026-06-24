import fs from "fs";
import path from "path";
import type { AIProviderName } from "./aiKeyVault.ts";

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

const LOG_FILE = path.join(process.cwd(), "ai_usage.log.json");
const MAX_LOG_ENTRIES = 300;

export async function appendAIUsageLog(input: Omit<AIUsageLogEntry, "id" | "at">): Promise<void> {
  try {
    const logs = await readAIUsageLogs(MAX_LOG_ENTRIES);
    const entry: AIUsageLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      at: new Date().toISOString(),
      ...input,
    };
    logs.unshift(entry);
    await fs.promises.writeFile(LOG_FILE, JSON.stringify(logs.slice(0, MAX_LOG_ENTRIES), null, 2), "utf-8");
  } catch {
    // Usage logging is best-effort and must never break AI generation.
  }
}

export async function readAIUsageLogs(limit = 100): Promise<AIUsageLogEntry[]> {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const raw = await fs.promises.readFile(LOG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, Math.max(1, Math.min(limit, MAX_LOG_ENTRIES)));
  } catch {
    return [];
  }
}

export async function clearAIUsageLogs(): Promise<void> {
  await fs.promises.writeFile(LOG_FILE, JSON.stringify([], null, 2), "utf-8");
}
