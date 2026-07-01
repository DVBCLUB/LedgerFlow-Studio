import crypto from "crypto";
import fs from "fs";
import os from "os";
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from "./runtimePaths";

export type AIProviderName = "gemini" | "groq" | "openrouter" | "anthropic" | "ollama" | "openai" | "deepseek";

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

export interface AIKeyBackupFile {
  version: 1;
  app: "LedgerFlow Studio";
  exportedAt: string;
  kdf: "scrypt";
  cipher: "aes-256-gcm";
  salt: string;
  iv: string;
  tag: string;
  payload: string;
  note: string;
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

interface VaultSecurityLocal {
  mode: "local";
  updatedAt?: string;
}

interface VaultSecurityPassphrase {
  mode: "passphrase";
  kdf: "scrypt";
  cipher: "aes-256-gcm";
  salt: string;
  verifierIv: string;
  verifierTag: string;
  verifierPayload: string;
  updatedAt: string;
}

type VaultSecurity = VaultSecurityLocal | VaultSecurityPassphrase;

interface VaultFile {
  version: 1;
  entries: AIKeyRecord[];
  security?: VaultSecurity;
}

interface BackupPayload {
  version: 1;
  entries: Array<Omit<DecryptedAIKeyEntry, "id" | "createdAt" | "updatedAt" | "lastStatus" | "lastError">>;
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
    id: "openai",
    label: "OpenAI ChatGPT",
    requiresApiKey: true,
    defaultModel: "gpt-4o-mini",
    docsUrl: "https://platform.openai.com/api-keys",
    note: "Dùng API key từ OpenAI. Hỗ trợ gpt-4o, gpt-4o-mini, o1,...",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    requiresApiKey: true,
    defaultModel: "deepseek-chat",
    docsUrl: "https://platform.deepseek.com/api_keys",
    note: "Dùng API key từ DeepSeek. Hỗ trợ các model deepseek-chat, deepseek-reasoner.",
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

const VAULT_FILE = resolveRuntimePathFromEnv("AI_KEY_VAULT_FILE", "ai_keys.vault.json");
const SECRET_FILE = resolveRuntimePathFromEnv("AI_KEY_VAULT_SECRET_FILE", ".ledgerflow_secret");
const VAULT_VERIFIER_TEXT = "ledgerflow-ai-vault-passphrase-v1";

let unlockedVaultPassphrase: string | null = null;

export function getSupportedAIProviders(): AIProviderDefinition[] {
  return SUPPORTED_PROVIDERS;
}

export async function getAIVaultSecurityStatus(): Promise<AIVaultSecurityStatus> {
  const vault = await readVault();
  const security = normalizeSecurity(vault.security);
  const hasPassphrase = security.mode === "passphrase";
  const isLocked = hasPassphrase && !unlockedVaultPassphrase;
  return {
    exists: fs.existsSync(resolveRuntimeReadPathFromEnv("AI_KEY_VAULT_FILE", "ai_keys.vault.json")),
    mode: security.mode,
    hasPassphrase,
    isLocked,
    canDecrypt: !isLocked,
    totalKeys: vault.entries.length,
    enabledKeys: vault.entries.filter((entry) => entry.enabled).length,
    secretFileExists: fs.existsSync(resolveRuntimeReadPathFromEnv("AI_KEY_VAULT_SECRET_FILE", ".ledgerflow_secret")),
    updatedAt: security.updatedAt,
    message: hasPassphrase
      ? isLocked
        ? "AI Vault đang khóa. Hãy nhập mật khẩu chủ để mở khóa trước khi gọi AI."
        : "AI Vault đã mở khóa bằng mật khẩu chủ."
      : "AI Vault đang dùng mã hóa local tự động. Có thể bật mật khẩu chủ để bảo vệ tốt hơn.",
  };
}

export async function setupAIVaultPassphrase(passphrase: string): Promise<AIVaultSecurityStatus> {
  assertStrongPassphrase(passphrase, "Mật khẩu chủ AI Vault phải có ít nhất 8 ký tự.");
  const vault = await readVault();
  const currentEntries = decryptAllEntries(vault);
  const { security, key } = createPassphraseSecurity(passphrase);
  const nextVault: VaultFile = {
    version: 1,
    security,
    entries: currentEntries.map((entry) => ({
      ...entry,
      encryptedKey: encryptWithKey(entry.apiKey, key),
    })),
  };
  await writeVault(nextVault);
  unlockedVaultPassphrase = passphrase;
  return getAIVaultSecurityStatus();
}

export async function unlockAIVault(passphrase: string): Promise<AIVaultSecurityStatus> {
  const vault = await readVault();
  const security = normalizeSecurity(vault.security);
  if (security.mode === "local") {
    return getAIVaultSecurityStatus();
  }
  verifyPassphraseSecurity(security, passphrase);
  unlockedVaultPassphrase = passphrase;
  return getAIVaultSecurityStatus();
}

export async function lockAIVault(): Promise<AIVaultSecurityStatus> {
  unlockedVaultPassphrase = null;
  return getAIVaultSecurityStatus();
}

export async function listAIKeys(): Promise<AIKeySummary[]> {
  const vault = await readVault();
  return vault.entries
    .slice()
    .sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt))
    .map((entry) => toSummary(entry, vault));
}

export async function createAIKey(input: AIKeyInput): Promise<AIKeySummary> {
  const provider = getProvider(input.provider);
  const apiKey = (input.apiKey ?? "").trim();
  if (provider.requiresApiKey && !apiKey) {
    throw new Error(`API key is required for ${provider.label}.`);
  }

  const now = new Date().toISOString();
  const vault = await readVault();
  const record = buildRecord(input, vault.entries.length + 1, now, vault);
  vault.entries.push(record);
  await writeVault(vault);
  return toSummary(record, vault);
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
    next.encryptedKey = encryptForVault(apiKey, vault);
    next.lastStatus = "untested";
    next.lastError = undefined;
  }
  if (patch.lastStatus) next.lastStatus = patch.lastStatus;
  if (patch.lastError !== undefined) next.lastError = patch.lastError;

  vault.entries[idx] = next;
  await writeVault(vault);
  return toSummary(next, vault);
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
    .map(e => ({ ...e, apiKey: decryptForVault(e.encryptedKey, vault) }));
}

export async function setAIKeyStatus(id: string, status: AIKeyRecord["lastStatus"], error?: string): Promise<void> {
  try {
    await updateAIKey(id, { lastStatus: status, lastError: error });
  } catch {
    // Status update is best-effort; never break AI generation because telemetry failed.
  }
}

export async function exportAIKeyBackup(passphrase: string): Promise<AIKeyBackupFile> {
  assertStrongPassphrase(passphrase, "Mật khẩu backup phải có ít nhất 8 ký tự.");
  const vault = await readVault();

  const payload: BackupPayload = {
    version: 1,
    entries: vault.entries
      .slice()
      .sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt))
      .map((entry) => ({
        provider: entry.provider,
        label: entry.label,
        model: entry.model,
        baseUrl: entry.baseUrl,
        apiKey: decryptForVault(entry.encryptedKey, vault),
        enabled: entry.enabled,
        priority: entry.priority,
      })),
  };

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveBackupKey(passphrase, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    version: 1,
    app: "LedgerFlow Studio",
    exportedAt: new Date().toISOString(),
    kdf: "scrypt",
    cipher: "aes-256-gcm",
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    payload: encrypted.toString("base64"),
    note: "Encrypted AI key backup. Import inside LedgerFlow Studio AI Settings using the same password.",
  };
}

export async function importAIKeyBackup(
  backup: AIKeyBackupFile,
  passphrase: string,
  mode: "merge" | "replace" = "merge"
): Promise<{ imported: number; total: number; keys: AIKeySummary[] }> {
  assertStrongPassphrase(passphrase, "Mật khẩu backup phải có ít nhất 8 ký tự.");
  const payload = decryptBackupPayload(backup, passphrase);
  const vault = await readVault();
  const now = new Date().toISOString();

  const nextEntries = mode === "replace" ? [] : vault.entries.slice();
  let imported = 0;

  for (const item of payload.entries) {
    const provider = getProvider(item.provider);
    const apiKey = (item.apiKey ?? "").trim();
    if (provider.requiresApiKey && !apiKey) continue;

    const duplicate = nextEntries.find((entry) => {
      try {
        return entry.provider === item.provider && decryptForVault(entry.encryptedKey, vault) === apiKey && (entry.model || provider.defaultModel) === (item.model || provider.defaultModel);
      } catch {
        return false;
      }
    });

    if (duplicate && mode === "merge") {
      duplicate.label = item.label?.trim().slice(0, 80) || duplicate.label;
      duplicate.model = item.model?.trim().slice(0, 120) || provider.defaultModel;
      duplicate.baseUrl = item.baseUrl?.trim() || undefined;
      duplicate.enabled = item.enabled ?? duplicate.enabled;
      duplicate.priority = Number.isFinite(item.priority) ? Number(item.priority) : duplicate.priority;
      duplicate.updatedAt = now;
      duplicate.lastStatus = "untested";
      duplicate.lastError = undefined;
      imported += 1;
      continue;
    }

    nextEntries.push(buildRecord({
      provider: item.provider,
      label: item.label,
      apiKey,
      model: item.model,
      baseUrl: item.baseUrl,
      priority: Number.isFinite(item.priority) ? Number(item.priority) : nextEntries.length + 1,
      enabled: item.enabled,
    }, nextEntries.length + 1, now, vault));
    imported += 1;
  }

  const newVault: VaultFile = { ...vault, version: 1, entries: nextEntries };
  await writeVault(newVault);
  const keys = await listAIKeys();
  return { imported, total: payload.entries.length, keys };
}

function decryptBackupPayload(backup: AIKeyBackupFile, passphrase: string): BackupPayload {
  if (!backup || backup.version !== 1 || backup.app !== "LedgerFlow Studio") {
    throw new Error("File backup không đúng định dạng LedgerFlow Studio.");
  }
  if (backup.kdf !== "scrypt" || backup.cipher !== "aes-256-gcm") {
    throw new Error("File backup dùng thuật toán không được hỗ trợ.");
  }

  try {
    const salt = Buffer.from(backup.salt, "base64");
    const iv = Buffer.from(backup.iv, "base64");
    const tag = Buffer.from(backup.tag, "base64");
    const encrypted = Buffer.from(backup.payload, "base64");
    const key = deriveBackupKey(passphrase, salt);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const raw = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(raw) as BackupPayload;
    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) {
      throw new Error("Payload backup không hợp lệ.");
    }
    return parsed;
  } catch (err: any) {
    throw new Error(`Không mở được backup. Kiểm tra lại mật khẩu hoặc file backup. ${err.message || ""}`.trim());
  }
}

function buildRecord(input: AIKeyInput, fallbackPriority: number, now: string, vault: VaultFile): AIKeyRecord {
  const provider = getProvider(input.provider);
  const apiKey = (input.apiKey ?? "").trim();
  if (provider.requiresApiKey && !apiKey) {
    throw new Error(`API key is required for ${provider.label}.`);
  }

  return {
    id: crypto.randomUUID(),
    provider: input.provider,
    label: (input.label?.trim() || `${provider.label} key`).slice(0, 80),
    model: (input.model?.trim() || provider.defaultModel).slice(0, 120),
    baseUrl: input.baseUrl?.trim() || undefined,
    encryptedKey: encryptForVault(apiKey, vault),
    enabled: input.enabled ?? true,
    priority: Number.isFinite(input.priority) ? Number(input.priority) : fallbackPriority,
    createdAt: now,
    updatedAt: now,
    lastStatus: "untested",
  };
}

function assertStrongPassphrase(passphrase: string, message: string): void {
  if (!passphrase || passphrase.length < 8) {
    throw new Error(message);
  }
}

function deriveBackupKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, 32, { N: 16384, r: 8, p: 1 });
}

function toSummary(record: AIKeyRecord, vault: VaultFile): AIKeySummary {
  const provider = getProvider(record.provider);
  let masked = "local";
  try {
    masked = provider.requiresApiKey ? maskKey(decryptForVault(record.encryptedKey, vault)) : "Không cần key";
  } catch (err: any) {
    masked = normalizeSecurity(vault.security).mode === "passphrase" && !unlockedVaultPassphrase
      ? "Vault đang khóa"
      : "Không giải mã được";
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
    const readPath = resolveRuntimeReadPathFromEnv("AI_KEY_VAULT_FILE", "ai_keys.vault.json");
    if (!fs.existsSync(readPath)) return { version: 1, entries: [], security: { mode: "local" } };
    const raw = await fs.promises.readFile(readPath, "utf-8");
    const parsed = JSON.parse(raw) as VaultFile;
    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) return { version: 1, entries: [], security: { mode: "local" } };
    return { ...parsed, security: normalizeSecurity(parsed.security) };
  } catch (err: any) {
    throw new Error(`Không đọc được AI key vault: ${err.message || err}`);
  }
}

async function writeVault(vault: VaultFile): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(VAULT_FILE, JSON.stringify(vault, null, 2), { encoding: "utf-8", mode: 0o600 });
}

function normalizeSecurity(security?: VaultSecurity): VaultSecurity {
  if (security?.mode === "passphrase") return security;
  return { mode: "local", updatedAt: security?.updatedAt };
}

function decryptAllEntries(vault: VaultFile): DecryptedAIKeyEntry[] {
  return vault.entries.map((entry) => ({
    ...entry,
    apiKey: decryptForVault(entry.encryptedKey, vault),
  }));
}

function encryptForVault(plainText: string, vault: VaultFile): string {
  return encryptWithKey(plainText, getVaultKeyForReadWrite(vault));
}

function decryptForVault(payload: string, vault: VaultFile): string {
  return decryptWithKey(payload, getVaultKeyForReadWrite(vault));
}

function getVaultKeyForReadWrite(vault: VaultFile): Buffer {
  const security = normalizeSecurity(vault.security);
  if (security.mode === "passphrase") {
    if (!unlockedVaultPassphrase) {
      throw new Error("AI Vault đang khóa. Mở khóa bằng mật khẩu chủ trước khi dùng key.");
    }
    return getPassphraseKey(security, unlockedVaultPassphrase);
  }
  return getLocalVaultKey();
}

function createPassphraseSecurity(passphrase: string): { security: VaultSecurityPassphrase; key: Buffer } {
  const salt = crypto.randomBytes(16);
  const key = deriveBackupKey(passphrase, salt);
  const verifier = encryptWithKey(VAULT_VERIFIER_TEXT, key);
  const raw = Buffer.from(verifier, "base64");
  return {
    key,
    security: {
      mode: "passphrase",
      kdf: "scrypt",
      cipher: "aes-256-gcm",
      salt: salt.toString("base64"),
      verifierIv: raw.subarray(0, 12).toString("base64"),
      verifierTag: raw.subarray(12, 28).toString("base64"),
      verifierPayload: raw.subarray(28).toString("base64"),
      updatedAt: new Date().toISOString(),
    },
  };
}

function verifyPassphraseSecurity(security: VaultSecurityPassphrase, passphrase: string): void {
  const key = getPassphraseKey(security, passphrase);
  const payload = Buffer.concat([
    Buffer.from(security.verifierIv, "base64"),
    Buffer.from(security.verifierTag, "base64"),
    Buffer.from(security.verifierPayload, "base64"),
  ]).toString("base64");
  const decoded = decryptWithKey(payload, key);
  if (decoded !== VAULT_VERIFIER_TEXT) {
    throw new Error("Mật khẩu AI Vault không đúng.");
  }
}

function getPassphraseKey(security: VaultSecurityPassphrase, passphrase: string): Buffer {
  if (security.kdf !== "scrypt" || security.cipher !== "aes-256-gcm") {
    throw new Error("AI Vault dùng thuật toán bảo mật không được hỗ trợ.");
  }
  return deriveBackupKey(passphrase, Buffer.from(security.salt, "base64"));
}

function encryptWithKey(plainText: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decryptWithKey(payload: string, key: Buffer): string {
  if (!payload) return "";
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function getLocalVaultKey(): Buffer {
  const explicitSecret = process.env.AI_VAULT_SECRET?.trim();
  const secret = explicitSecret || getOrCreateLocalSecret();
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

function getOrCreateLocalSecret(): string {
  const readPath = resolveRuntimeReadPathFromEnv("AI_KEY_VAULT_SECRET_FILE", ".ledgerflow_secret");
  if (fs.existsSync(readPath)) {
    return fs.readFileSync(readPath, "utf-8").trim();
  }
  ensureRuntimeRootSync();
  const secret = [
    "ledgerflow-local-vault-v1",
    os.hostname(),
    os.userInfo().username,
    crypto.randomBytes(32).toString("hex"),
  ].join(":");
  fs.writeFileSync(SECRET_FILE, secret, { encoding: "utf-8", mode: 0o600 });
  return secret;
}
