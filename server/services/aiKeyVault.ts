import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

export type AIProviderName = "gemini" | "groq" | "openrouter" | "anthropic" | "ollama";

export interface AIProviderDefinition {
  id: AIProviderName;
  label: string;
  requiresApiKey: boolean;
  defaultModel: string;
  docsUrl: string;
  note: string;
}

export interface AIKeyInput {
  provider: AIProviderName;
  label?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  priority?: number;
  enabled?: boolean;
}

export interface AIKeyRecord {
  id: string;
  provider: AIProviderName;
  label: string;
  model?: string;
  baseUrl?: string;
  encryptedKey: string;
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  lastStatus?: "ok" | "error" | "quota" | "untested";
  lastError?: string;
}

export interface AIKeySummary {
  id: string;
  provider: AIProviderName;
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

export interface DecryptedAIKeyEntry extends Omit<AIKeyRecord, "encryptedKey"> {
  apiKey: string;
}

interface VaultFile {
  version: 1;
  entries: AIKeyRecord[];
}

const SUPPORTED_PROVIDERS: AIProviderDefinition[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    requiresApiKey: true,
    defaultModel: "gemini-2.0-flash",
    docsUrl: "https://aistudio.google.com/app/apikey",
    note: "Có thể thêm nhiều key từ nhiều tài khoản Google; hết quota key này sẽ tự qua key kế tiếp.",
  },
  {
    id: "groq",
    label: "Groq",
    requiresApiKey: true,
    defaultModel: "llama-3.3-70b-versatile",
    docsUrl: "https://console.groq.com/keys",
    note: "OpenAI-compatible API, rất nhanh, phù hợp fallback free tier.",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    requiresApiKey: true,
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    docsUrl: "https://openrouter.ai/keys",
    note: "Dùng các model có hậu tố :free hoặc model bạn tự chọn trong OpenRouter.",
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    requiresApiKey: true,
    defaultModel: "claude-3-5-haiku-latest",
    docsUrl: "https://console.anthropic.com/settings/keys",
    note: "Claude Code không phải API key chat trực tiếp; mục này dùng Anthropic API key.",
  },
  {
    id: "ollama",
    label: "Ollama Local",
    requiresApiKey: false,
    defaultModel: "qwen2.5:7b",
    docsUrl: "https://ollama.com",
    note: "Fallback chạy local, không cần API key. Cần cài Ollama và pull model trước.",
  },
];

const VAULT_FILE = path.join(process.cwd(), "ai_keys.vault.json");
const SECRET_FILE = path.join(process.cwd(), ".ledgerflow_secret");

export function getSupportedAIProviders(): AIProviderDefinition[] {
  return SUPPORTED_PROVIDERS;
}

export async function listAIKeys(): Promise<AIKeySummary[]> {
  const vault = await readVault();
  return vault.entries
    .slice()
    .sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt))
    .map(toSummary);
}

export async function createAIKey(input: AIKeyInput): Promise<AIKeySummary> {
  const provider = getProvider(input.provider);
  const apiKey = (input.apiKey ?? "").trim();
  if (provider.requiresApiKey && !apiKey) {
    throw new Error(`API key is required for ${provider.label}.`);
  }

  const now = new Date().toISOString();
  const vault = await readVault();
  const record: AIKeyRecord = {
    id: crypto.randomUUID(),
    provider: input.provider,
    label: (input.label?.trim() || `${provider.label} key ${vault.entries.filter(e => e.provider === input.provider).length + 1}`).slice(0, 80),
    model: (input.model?.trim() || provider.defaultModel).slice(0, 120),
    baseUrl: input.baseUrl?.trim() || undefined,
    encryptedKey: encrypt(apiKey),
    enabled: input.enabled ?? true,
    priority: Number.isFinite(input.priority) ? Number(input.priority) : vault.entries.length + 1,
    createdAt: now,
    updatedAt: now,
    lastStatus: "untested",
  };
  vault.entries.push(record);
  await writeVault(vault);
  return toSummary(record);
}

export async function updateAIKey(id: string, patch: Partial<AIKeyInput> & { lastStatus?: AIKeyRecord["lastStatus"]; lastError?: string }): Promise<AIKeySummary> {
  const vault = await readVault();
  const idx = vault.entries.findIndex(e => e.id === id);
  if (idx < 0) throw new Error("AI key not found.");

  const current = vault.entries[idx];
  const provider = patch.provider ? getProvider(patch.provider) : getProvider(current.provider);
  const next: AIKeyRecord = { ...current, updatedAt: new Date().toISOString() };

  if (patch.provider) next.provider = patch.provider;
  if (patch.label !== undefined) next.label = patch.label.trim().slice(0, 80) || current.label;
  if (patch.model !== undefined) next.model = patch.model.trim().slice(0, 120) || provider.defaultModel;
  if (patch.baseUrl !== undefined) next.baseUrl = patch.baseUrl.trim() || undefined;
  if (patch.enabled !== undefined) next.enabled = !!patch.enabled;
  if (patch.priority !== undefined && Number.isFinite(patch.priority)) next.priority = Number(patch.priority);
  if (patch.apiKey !== undefined) {
    const apiKey = patch.apiKey.trim();
    if (provider.requiresApiKey && !apiKey) throw new Error(`API key is required for ${provider.label}.`);
    next.encryptedKey = encrypt(apiKey);
    next.lastStatus = "untested";
    next.lastError = undefined;
  }
  if (patch.lastStatus) next.lastStatus = patch.lastStatus;
  if (patch.lastError !== undefined) next.lastError = patch.lastError;

  vault.entries[idx] = next;
  await writeVault(vault);
  return toSummary(next);
}

export async function deleteAIKey(id: string): Promise<boolean> {
  const vault = await readVault();
  const before = vault.entries.length;
  vault.entries = vault.entries.filter(e => e.id !== id);
  await writeVault(vault);
  return vault.entries.length !== before;
}

export async function getEnabledAIKeyEntries(): Promise<DecryptedAIKeyEntry[]> {
  const vault = await readVault();
  return vault.entries
    .filter(e => e.enabled)
    .sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt))
    .map(e => ({ ...e, apiKey: decrypt(e.encryptedKey) }));
}

export async function setAIKeyStatus(id: string, status: AIKeyRecord["lastStatus"], error?: string): Promise<void> {
  try {
    await updateAIKey(id, { lastStatus: status, lastError: error });
  } catch {
    // Status update is best-effort; never break AI generation because telemetry failed.
  }
}

function toSummary(record: AIKeyRecord): AIKeySummary {
  const provider = getProvider(record.provider);
  let masked = "local";
  try {
    masked = provider.requiresApiKey ? maskKey(decrypt(record.encryptedKey)) : "Không cần key";
  } catch {
    masked = "Không giải mã được";
  }
  return {
    id: record.id,
    provider: record.provider,
    providerLabel: provider.label,
    label: record.label,
    model: record.model || provider.defaultModel,
    baseUrl: record.baseUrl,
    maskedKey: masked,
    enabled: record.enabled,
    priority: record.priority,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastStatus: record.lastStatus ?? "untested",
    lastError: record.lastError,
  };
}

function getProvider(id: AIProviderName): AIProviderDefinition {
  const provider = SUPPORTED_PROVIDERS.find(p => p.id === id);
  if (!provider) throw new Error(`Unsupported AI provider: ${id}`);
  return provider;
}

function maskKey(key: string): string {
  if (!key) return "Không có key";
  if (key.length <= 10) return `${key.slice(0, 2)}••••${key.slice(-2)}`;
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

async function readVault(): Promise<VaultFile> {
  try {
    if (!fs.existsSync(VAULT_FILE)) return { version: 1, entries: [] };
    const raw = await fs.promises.readFile(VAULT_FILE, "utf-8");
    const parsed = JSON.parse(raw) as VaultFile;
    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) return { version: 1, entries: [] };
    return parsed;
  } catch (err: any) {
    throw new Error(`Không đọc được AI key vault: ${err.message || err}`);
  }
}

async function writeVault(vault: VaultFile): Promise<void> {
  await fs.promises.writeFile(VAULT_FILE, JSON.stringify(vault, null, 2), { encoding: "utf-8", mode: 0o600 });
}

function encrypt(plainText: string): string {
  const key = getVaultKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decrypt(payload: string): string {
  if (!payload) return "";
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getVaultKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function getVaultKey(): Buffer {
  const explicitSecret = process.env.AI_VAULT_SECRET?.trim();
  const secret = explicitSecret || getOrCreateLocalSecret();
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

function getOrCreateLocalSecret(): string {
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, "utf-8").trim();
  }
  const secret = [
    "ledgerflow-local-vault-v1",
    os.hostname(),
    os.userInfo().username,
    crypto.randomBytes(32).toString("hex"),
  ].join(":");
  fs.writeFileSync(SECRET_FILE, secret, { encoding: "utf-8", mode: 0o600 });
  return secret;
}
