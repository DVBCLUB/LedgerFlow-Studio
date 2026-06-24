#!/usr/bin/env node

const baseUrl = process.env.LEDGERFLOW_URL || process.env.APP_URL || "http://127.0.0.1:3000";
const endpoint = `${baseUrl.replace(/\/$/, "")}/api/ai/preflight`;

async function getSessionCookie() {
  const password = process.env.LOCAL_AUTH_DEV_PASSWORD || "admin123";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/auth/local-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "doctor@ledgerflow.local", password }),
  });
  if (!response.ok) throw new Error(`AI Doctor login failed: HTTP ${response.status}`);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("AI Doctor login did not return a session cookie.");
  return cookie;
}

function icon(severity) {
  if (severity === "ok") return "✅";
  if (severity === "warn") return "⚠️ ";
  return "❌";
}

try {
  const cookie = await getSessionCookie();
  const response = await fetch(endpoint, { headers: { Cookie: cookie } });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.report) {
    console.error(`❌ AI Doctor không đọc được preflight: HTTP ${response.status}`);
    if (payload?.error) console.error(payload.error);
    process.exit(1);
  }

  const report = payload.report;
  console.log(`\nLedgerFlow AI Doctor — ${new Date(report.checkedAt).toLocaleString()}`);
  console.log("=".repeat(72));
  console.log(`${report.ok ? "✅" : "❌"} ${report.summary}`);
  console.log(`Keys: ${report.stats.enabledKeys}/${report.stats.totalKeys} enabled | OK: ${report.stats.okKeys} | Quota: ${report.stats.quotaKeys} | Error: ${report.stats.errorKeys} | Recent issues: ${report.stats.recentErrors}`);
  console.log("-".repeat(72));

  for (const check of report.checks) {
    console.log(`${icon(check.severity)} ${check.label}: ${check.message}`);
    if (check.action) console.log(`   → ${check.action}`);
  }

  console.log("=".repeat(72));
  process.exit(report.ok ? 0 : 1);
} catch (err) {
  console.error("❌ Không kết nối được LedgerFlow server.");
  console.error(`Đang gọi: ${endpoint}`);
  console.error("Hãy chạy `npm run dev` ở terminal khác rồi chạy lại `npm run ai:doctor`.");
  if (err?.message) console.error(`Chi tiết: ${err.message}`);
  process.exit(1);
}
