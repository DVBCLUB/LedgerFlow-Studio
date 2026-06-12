import fs from "fs";
import path from "path";
import { getAIVaultSecurityStatus, lockAIVault } from "./aiKeyVault";

export interface AIVaultAutoLockConfig {
  enabled: boolean;
  timeoutMinutes: number;
}

export interface AIVaultAutoLockStatus extends AIVaultAutoLockConfig {
  armed: boolean;
  lastActivityAt?: string;
  expiresAt?: string;
  remainingSeconds?: number;
  message: string;
}

const AUTO_LOCK_FILE = path.join(process.cwd(), ".ai_vault_session.json");
const DEFAULT_CONFIG: AIVaultAutoLockConfig = {
  enabled: true,
  timeoutMinutes: Number(process.env.AI_VAULT_AUTO_LOCK_MINUTES ?? 30),
};

let timer: NodeJS.Timeout | null = null;
let lastActivityAt: Date | null = null;
let expiresAt: Date | null = null;

export async function getAIVaultAutoLockStatus(): Promise<AIVaultAutoLockStatus> {
  const config = await readAutoLockConfig();
  const vault = await getAIVaultSecurityStatus();
  const remainingSeconds = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000))
    : undefined;

  return {
    ...config,
    armed: !!timer && vault.hasPassphrase && !vault.isLocked,
    lastActivityAt: lastActivityAt?.toISOString(),
    expiresAt: expiresAt?.toISOString(),
    remainingSeconds,
    message: !vault.hasPassphrase
      ? "Auto-lock chỉ áp dụng khi đã bật mật khẩu chủ AI Vault."
      : vault.isLocked
        ? "AI Vault đang khóa. Auto-lock sẽ tự bật lại sau khi mở khóa."
        : config.enabled
          ? `AI Vault sẽ tự khóa sau ${config.timeoutMinutes} phút không dùng.`
          : "Auto-lock đang tắt. Nên bật nếu máy dùng chung hoặc hay quên khóa vault.",
  };
}

export async function updateAIVaultAutoLockConfig(patch: Partial<AIVaultAutoLockConfig>): Promise<AIVaultAutoLockStatus> {
  const current = await readAutoLockConfig();
  const next: AIVaultAutoLockConfig = {
    enabled: patch.enabled ?? current.enabled,
    timeoutMinutes: clampTimeoutMinutes(patch.timeoutMinutes ?? current.timeoutMinutes),
  };
  await fs.promises.writeFile(AUTO_LOCK_FILE, JSON.stringify(next, null, 2), { encoding: "utf-8", mode: 0o600 });

  const vault = await getAIVaultSecurityStatus();
  if (next.enabled && vault.hasPassphrase && !vault.isLocked) {
    armAIVaultAutoLock(next, "config-update");
  } else {
    disarmAIVaultAutoLock();
  }
  return getAIVaultAutoLockStatus();
}

export async function markAIVaultActivity(reason = "activity"): Promise<void> {
  const config = await readAutoLockConfig();
  if (!config.enabled) return;

  const vault = await getAIVaultSecurityStatus();
  if (!vault.hasPassphrase || vault.isLocked) return;

  armAIVaultAutoLock(config, reason);
}

export function disarmAIVaultAutoLock(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  expiresAt = null;
}

async function readAutoLockConfig(): Promise<AIVaultAutoLockConfig> {
  try {
    if (!fs.existsSync(AUTO_LOCK_FILE)) return normalizeConfig(DEFAULT_CONFIG);
    const raw = await fs.promises.readFile(AUTO_LOCK_FILE, "utf-8");
    return normalizeConfig(JSON.parse(raw) as Partial<AIVaultAutoLockConfig>);
  } catch {
    return normalizeConfig(DEFAULT_CONFIG);
  }
}

function normalizeConfig(config: Partial<AIVaultAutoLockConfig>): AIVaultAutoLockConfig {
  return {
    enabled: config.enabled ?? true,
    timeoutMinutes: clampTimeoutMinutes(config.timeoutMinutes ?? DEFAULT_CONFIG.timeoutMinutes),
  };
}

function clampTimeoutMinutes(value: number): number {
  const numeric = Number.isFinite(value) ? Number(value) : DEFAULT_CONFIG.timeoutMinutes;
  return Math.min(24 * 60, Math.max(1, Math.round(numeric)));
}

function armAIVaultAutoLock(config: AIVaultAutoLockConfig, reason: string): void {
  if (timer) clearTimeout(timer);
  lastActivityAt = new Date();
  expiresAt = new Date(Date.now() + config.timeoutMinutes * 60_000);

  timer = setTimeout(async () => {
    try {
      await lockAIVault();
      console.log(`[AI Vault] Auto-locked after ${config.timeoutMinutes} minutes of inactivity. Last reason: ${reason}`);
    } catch (err) {
      console.warn("[AI Vault] Auto-lock failed:", err);
    } finally {
      timer = null;
      expiresAt = null;
    }
  }, config.timeoutMinutes * 60_000);

  if (typeof timer.unref === "function") timer.unref();
}
