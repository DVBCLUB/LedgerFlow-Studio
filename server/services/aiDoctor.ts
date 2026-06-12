import fs from "fs";
import path from "path";
import { diagnoseAIRouter } from "./aiRouter";
import { listAIKeys } from "./aiKeyVault";
import { readAIUsageLogs } from "./aiUsageLog";

export type AIPreflightSeverity = "ok" | "warn" | "error";

export interface AIPreflightCheck {
  id: string;
  label: string;
  severity: AIPreflightSeverity;
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

const VAULT_FILE = path.join(process.cwd(), "ai_keys.vault.json");
const SECRET_FILE = path.join(process.cwd(), ".ledgerflow_secret");
const USAGE_LOG_FILE = path.join(process.cwd(), "ai_usage.log.json");

export async function runAIPreflight(): Promise<AIPreflightReport> {
  const checks: AIPreflightCheck[] = [];
  const keys = await listAIKeys().catch(() => []);
  const enabledKeys = keys.filter((key) => key.enabled);

  checks.push({
    id: "backend",
    label: "Backend Express",
    severity: "ok",
    message: "Backend đang phản hồi bình thường.",
  });

  checks.push({
    id: "vault-file",
    label: "AI Key Vault",
    severity: fs.existsSync(VAULT_FILE) ? "ok" : "warn",
    message: fs.existsSync(VAULT_FILE)
      ? "Đã có file vault mã hóa local."
      : "Chưa có vault key local vì bạn chưa lưu API key nào.",
    action: fs.existsSync(VAULT_FILE) ? undefined : "Mở AI Gateway và thêm ít nhất 1 provider/key.",
  });

  checks.push({
    id: "vault-secret",
    label: "Khóa mã hóa local",
    severity: fs.existsSync(SECRET_FILE) ? "ok" : "warn",
    message: fs.existsSync(SECRET_FILE)
      ? "Đã có secret local để mã hóa/giải mã vault."
      : "Chưa có secret local. Secret sẽ tự tạo khi bạn lưu key đầu tiên.",
    action: fs.existsSync(SECRET_FILE) ? undefined : "Không cần tự tạo thủ công; hệ thống sẽ tự tạo khi lưu key.",
  });

  checks.push({
    id: "key-count",
    label: "Số lượng key/provider",
    severity: enabledKeys.length > 0 ? "ok" : "warn",
    message: `${enabledKeys.length}/${keys.length} key đang bật.`,
    action: enabledKeys.length > 0 ? undefined : "Thêm hoặc bật ít nhất 1 key/provider để router không phải dựa vào LiteLLM proxy fallback.",
  });

  let diagnostics = null as Awaited<ReturnType<typeof diagnoseAIRouter>> | null;
  try {
    diagnostics = await diagnoseAIRouter();
    const okCount = diagnostics.results.filter((item) => item.status === "ok").length;
    const quotaCount = diagnostics.results.filter((item) => item.status === "quota").length;
    const errorCount = diagnostics.results.filter((item) => item.status === "error").length;
    checks.push({
      id: "provider-diagnostics",
      label: "Provider diagnostics",
      severity: okCount > 0 ? "ok" : "error",
      message: `OK: ${okCount}, quota: ${quotaCount}, error: ${errorCount}.`,
      action: okCount > 0 ? undefined : "Kiểm tra lại API key, quota, model name, internet hoặc Ollama local.",
    });
  } catch (err: any) {
    checks.push({
      id: "provider-diagnostics",
      label: "Provider diagnostics",
      severity: "error",
      message: `Không chạy được diagnostics: ${err.message || err}`,
      action: "Mở terminal xem log server hoặc chạy npm run ai:doctor sau khi server đã bật.",
    });
  }

  const logs = await readAIUsageLogs(50).catch(() => []);
  const recentErrors = logs.filter((log) => log.status === "error" || log.status === "quota").length;
  checks.push({
    id: "usage-log",
    label: "Nhật ký AI gần nhất",
    severity: recentErrors > 10 ? "warn" : "ok",
    message: fs.existsSync(USAGE_LOG_FILE)
      ? `Đã ghi log local. ${recentErrors}/50 log gần nhất là quota/error.`
      : "Chưa có file log AI vì chưa có request AI nào chạy.",
    action: recentErrors > 10 ? "Bấm Diagnostics để cập nhật trạng thái key, rồi tăng priority cho key còn sống." : undefined,
  });

  const okKeys = diagnostics?.results.filter((item) => item.status === "ok").length ?? 0;
  const quotaKeys = diagnostics?.results.filter((item) => item.status === "quota").length ?? 0;
  const errorKeys = diagnostics?.results.filter((item) => item.status === "error").length ?? 0;
  const ok = checks.every((check) => check.severity !== "error");

  return {
    ok,
    checkedAt: new Date().toISOString(),
    summary: ok
      ? "AI Gateway đã sẵn sàng dùng."
      : "AI Gateway chưa sẵn sàng; cần xử lý các mục lỗi bên dưới.",
    checks,
    stats: {
      totalKeys: keys.length,
      enabledKeys: enabledKeys.length,
      okKeys,
      quotaKeys,
      errorKeys,
      recentErrors,
    },
  };
}
