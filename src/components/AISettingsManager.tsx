import React, { useEffect, useMemo, useState } from "react";
import { Download, KeyRound, Loader2, MessageCircle, RefreshCw, ShieldCheck, Trash2, Upload, Zap } from "lucide-react";
import {
  AIKeyPayload,
  AIKeySummary,
  AIPreflightReport,
  AIProviderDefinition,
  AIUsageLogEntry,
  callAIFromSettings,
  clearAIUsageLogs,
  createAIKey,
  deleteAIKey,
  exportAIKeyBackup,
  fetchAIKeys,
  fetchAIProviders,
  fetchAIUsageLogs,
  importAIKeyBackup,
  runAIDiagnostics,
  runAIPreflight,
  streamAIFromSettings,
  testAIKey,
  updateAIKey,
} from "../utils/aiSettingsApi";

const statusClass: Record<string, string> = {
  ok: "bg-emerald-950/30 text-emerald-300 border-emerald-800/50",
  quota: "bg-amber-950/30 text-amber-300 border-amber-800/50",
  warn: "bg-amber-950/30 text-amber-300 border-amber-800/50",
  error: "bg-rose-950/30 text-rose-300 border-rose-800/50",
  untested: "bg-slate-900/60 text-slate-400 border-slate-800",
};

const defaultForm: AIKeyPayload = {
  provider: "gemini",
  label: "",
  apiKey: "",
  model: "",
  baseUrl: "",
  priority: 10,
  enabled: true,
};

export default function AISettingsManager() {
  const [providers, setProviders] = useState<AIProviderDefinition[]>([]);
  const [keys, setKeys] = useState<AIKeySummary[]>([]);
  const [logs, setLogs] = useState<AIUsageLogEntry[]>([]);
  const [preflight, setPreflight] = useState<AIPreflightReport | null>(null);
  const [form, setForm] = useState<AIKeyPayload>(defaultForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [testResult, setTestResult] = useState("");
  const [prompt, setPrompt] = useState("Bạn đang dùng provider/key nào? Trả lời ngắn gọn bằng tiếng Việt.");
  const [chatOutput, setChatOutput] = useState("");
  const [chatMode, setChatMode] = useState<"ai-assistant" | "ai-assistant-pro">("ai-assistant");
  const [backupPassword, setBackupPassword] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [backupFileText, setBackupFileText] = useState("");

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === form.provider),
    [providers, form.provider]
  );

  async function reload() {
    const [nextProviders, nextKeys, nextLogs] = await Promise.all([
      fetchAIProviders(),
      fetchAIKeys(),
      fetchAIUsageLogs().catch(() => []),
    ]);
    setProviders(nextProviders);
    setKeys(nextKeys);
    setLogs(nextLogs.slice(0, 40));

    if (nextProviders.length && !form.model) {
      const provider = nextProviders.find((item) => item.id === form.provider) ?? nextProviders[0];
      setForm((prev) => ({ ...prev, provider: provider.id, model: provider.defaultModel }));
    }
  }

  useEffect(() => {
    reload().catch((err) => setMessage(`Không tải được cấu hình AI: ${err.message}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setProvider(providerId: AIKeyPayload["provider"]) {
    const provider = providers.find((item) => item.id === providerId);
    setForm((prev) => ({
      ...prev,
      provider: providerId,
      model: provider?.defaultModel || prev.model,
      apiKey: provider?.requiresApiKey === false ? "" : prev.apiKey,
      baseUrl: providerId === "ollama" ? prev.baseUrl || "http://127.0.0.1:11434" : prev.baseUrl,
    }));
  }

  async function handlePreflight() {
    setBusy(true);
    setMessage("Đang chạy AI Preflight Check...");
    try {
      const report = await runAIPreflight();
      setPreflight(report);
      await reload();
      setMessage(report.summary);
    } catch (err: any) {
      setMessage(`Lỗi preflight: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveKey() {
    setBusy(true);
    setMessage("");
    try {
      await createAIKey({ ...form, priority: Number(form.priority || 10) });
      setForm((prev) => ({ ...defaultForm, provider: prev.provider, model: selectedProvider?.defaultModel || prev.model }));
      await reload();
      setMessage("Đã lưu key vào vault mã hóa local.");
    } catch (err: any) {
      setMessage(`Lỗi lưu key: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleTestCurrentForm() {
    setBusy(true);
    setTestResult("");
    try {
      const result = await testAIKey(form);
      setTestResult(result.ok ? `OK (${result.latencyMs ?? 0}ms)` : `${result.status}: ${result.error || "Không rõ lỗi"}`);
      await reload();
    } catch (err: any) {
      setTestResult(`Lỗi test: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(key: AIKeySummary) {
    await updateAIKey(key.id, { enabled: !key.enabled });
    await reload();
  }

  async function handlePriority(key: AIKeySummary, priority: number) {
    await updateAIKey(key.id, { priority });
    await reload();
  }

  async function handleDelete(key: AIKeySummary) {
    if (!window.confirm(`Xóa ${key.label}?`)) return;
    await deleteAIKey(key.id);
    await reload();
  }

  async function handleDiagnostics() {
    setBusy(true);
    setMessage("Đang kiểm tra toàn bộ provider/key...");
    try {
      const results = await runAIDiagnostics();
      await reload();
      const ok = results.filter((item) => item.status === "ok").length;
      setMessage(`Đã kiểm tra ${results.length} key/provider. OK: ${ok}.`);
    } catch (err: any) {
      setMessage(`Lỗi diagnostics: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleChat(stream: boolean) {
    setBusy(true);
    setChatOutput("");
    try {
      if (stream) {
        await streamAIFromSettings(prompt, (chunk) => setChatOutput((prev) => prev + chunk), chatMode);
      } else {
        const result = await callAIFromSettings(prompt, chatMode);
        setChatOutput(result.text || result.error || "Không có phản hồi.");
      }
      await reload();
    } catch (err: any) {
      setChatOutput(`Lỗi chat: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleExportBackup() {
    if (backupPassword.length < 8) {
      setMessage("Mật khẩu backup cần tối thiểu 8 ký tự.");
      return;
    }
    const backup = await exportAIKeyBackup(backupPassword);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledgerflow-ai-keys-${new Date().toISOString().slice(0, 10)}.backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportBackup() {
    if (!backupFileText.trim()) {
      setMessage("Chưa chọn hoặc chưa dán file backup.");
      return;
    }
    if (backupPassword.length < 8) {
      setMessage("Mật khẩu backup cần tối thiểu 8 ký tự.");
      return;
    }
    setBusy(true);
    try {
      const backup = JSON.parse(backupFileText);
      const result = await importAIKeyBackup(backup, backupPassword, importMode);
      await reload();
      setMessage(`Đã import ${result.imported}/${result.total} key theo chế độ ${importMode}.`);
    } catch (err: any) {
      setMessage(`Lỗi import backup: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 select-text">
      <div className="rounded-2xl border border-purple-900/40 bg-gradient-to-br from-purple-950/25 via-slate-950 to-slate-950 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-300 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> AI Key Manager
            </div>
            <h2 className="text-2xl font-black text-white mt-2">Cài đặt AI đa provider</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Nhập nhiều key Gemini/Groq/OpenRouter/Claude/Ollama trực tiếp trong phần mềm. Backend mã hóa key, tự fallback theo priority khi quota hoặc provider lỗi.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handlePreflight}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-600/20 px-4 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-600/30 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Preflight Check
            </button>
            <button
              onClick={handleDiagnostics}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-purple-700 bg-purple-600/20 px-4 py-2 text-xs font-black text-purple-100 hover:bg-purple-600/30 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Kiểm tra tất cả provider
            </button>
          </div>
        </div>
        {message && <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-300">{message}</div>}
      </div>

      {preflight && (
        <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white">AI Preflight Report</h3>
              <p className="text-xs text-slate-400 mt-1">{preflight.summary} · {new Date(preflight.checkedAt).toLocaleString("vi-VN")}</p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2"><div className="text-[9px] text-slate-500 font-black uppercase">Keys</div><div className="text-sm text-white font-black">{preflight.stats.enabledKeys}/{preflight.stats.totalKeys}</div></div>
              <div className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-2"><div className="text-[9px] text-emerald-400 font-black uppercase">OK</div><div className="text-sm text-white font-black">{preflight.stats.okKeys}</div></div>
              <div className="rounded-xl border border-amber-900 bg-amber-950/20 p-2"><div className="text-[9px] text-amber-400 font-black uppercase">Quota</div><div className="text-sm text-white font-black">{preflight.stats.quotaKeys}</div></div>
              <div className="rounded-xl border border-rose-900 bg-rose-950/20 p-2"><div className="text-[9px] text-rose-400 font-black uppercase">Error</div><div className="text-sm text-white font-black">{preflight.stats.errorKeys}</div></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 md:col-span-2"><div className="text-[9px] text-slate-500 font-black uppercase">Recent issues</div><div className="text-sm text-white font-black">{preflight.stats.recentErrors}</div></div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {preflight.checks.map((check) => (
              <div key={check.id} className="rounded-xl border border-slate-900 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">{check.label}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass[check.severity] || statusClass.untested}`}>{check.severity}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">{check.message}</div>
                {check.action && <div className="mt-2 text-[10px] text-amber-300 font-bold">Gợi ý: {check.action}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-black text-white"><KeyRound className="w-4 h-4 text-amber-400" /> Thêm API key</h3>
          <label className="block text-[10px] uppercase font-black text-slate-500">Provider</label>
          <select value={form.provider} onChange={(e) => setProvider(e.target.value as AIKeyPayload["provider"])} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-100">
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
          </select>
          {selectedProvider && <p className="text-[11px] text-slate-400 leading-relaxed">{selectedProvider.note}</p>}

          <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" placeholder="Tên gợi nhớ, ví dụ Gemini acc 1" value={form.label || ""} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          {selectedProvider?.requiresApiKey !== false && (
            <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" placeholder="API key" type="password" value={form.apiKey || ""} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
          )}
          <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" placeholder="Model" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" placeholder="Base URL tùy chọn" value={form.baseUrl || ""} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
          <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" placeholder="Priority" type="number" value={form.priority ?? 10} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={handleTestCurrentForm} className="rounded-xl border border-blue-800 bg-blue-950/30 px-3 py-2 text-xs font-black text-blue-200 hover:bg-blue-900/30">Test</button>
            <button disabled={busy} onClick={handleSaveKey} className="rounded-xl border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-900/30">Lưu key</button>
          </div>
          {testResult && <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-[11px] font-bold text-slate-300">{testResult}</div>}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <h3 className="text-sm font-black text-white">Danh sách key/provider đã lưu</h3>
          <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
            {keys.length === 0 ? <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-xs text-slate-500">Chưa có key nào. Thêm ít nhất 1 key để AI router tự fallback.</div> : keys.map((key) => (
              <div key={key.id} className="rounded-xl border border-slate-900 bg-slate-950/80 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-white">{key.label}</span>
                    <span className="text-[10px] font-bold text-slate-400">{key.providerLabel}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass[key.lastStatus] || statusClass.untested}`}>{key.lastStatus}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{key.maskedKey} · {key.model || "default model"}</div>
                  {key.lastError && <div className="text-[10px] text-rose-300">{key.lastError}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-20 rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-100" value={key.priority} onChange={(e) => handlePriority(key, Number(e.target.value))} />
                  <button onClick={() => handleToggle(key)} className="rounded-lg border border-slate-800 px-2 py-1.5 text-[10px] font-black text-slate-300 hover:bg-slate-900">{key.enabled ? "Bật" : "Tắt"}</button>
                  <button onClick={() => handleDelete(key)} className="rounded-lg border border-rose-900/60 px-2 py-1.5 text-rose-300 hover:bg-rose-950/30"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-black text-white"><MessageCircle className="w-4 h-4 text-purple-400" /> Test chat fallback</h3>
          <textarea className="min-h-[120px] w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <select value={chatMode} onChange={(e) => setChatMode(e.target.value as "ai-assistant" | "ai-assistant-pro")} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-100">
            <option value="ai-assistant">Nhanh / tiết kiệm</option>
            <option value="ai-assistant-pro">Pro / ưu tiên model mạnh</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleChat(false)} disabled={busy} className="rounded-xl border border-purple-800 bg-purple-950/30 px-3 py-2 text-xs font-black text-purple-200 hover:bg-purple-900/30"><Zap className="inline w-3.5 h-3.5 mr-1" /> Non-stream</button>
            <button onClick={() => handleChat(true)} disabled={busy} className="rounded-xl border border-indigo-800 bg-indigo-950/30 px-3 py-2 text-xs font-black text-indigo-200 hover:bg-indigo-900/30"><Zap className="inline w-3.5 h-3.5 mr-1" /> Streaming</button>
          </div>
          <pre className="min-h-[140px] whitespace-pre-wrap rounded-xl border border-slate-900 bg-slate-950 p-3 text-xs text-slate-300">{chatOutput || "Kết quả test sẽ hiện ở đây."}</pre>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <h3 className="text-sm font-black text-white">Backup / chuyển máy</h3>
          <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" type="password" placeholder="Mật khẩu backup tối thiểu 8 ký tự" value={backupPassword} onChange={(e) => setBackupPassword(e.target.value)} />
          <button onClick={handleExportBackup} className="w-full rounded-xl border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-900/30"><Download className="inline w-3.5 h-3.5 mr-1" /> Tải backup mã hóa</button>
          <input type="file" accept="application/json,.json" onChange={async (e) => setBackupFileText(await (e.target.files?.[0]?.text() ?? Promise.resolve("")))} className="w-full text-xs text-slate-400" />
          <select value={importMode} onChange={(e) => setImportMode(e.target.value as "merge" | "replace")} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-100">
            <option value="merge">Gộp vào danh sách hiện tại</option>
            <option value="replace">Thay thế toàn bộ danh sách hiện tại</option>
          </select>
          <button onClick={handleImportBackup} disabled={busy} className="w-full rounded-xl border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs font-black text-amber-200 hover:bg-amber-900/30"><Upload className="inline w-3.5 h-3.5 mr-1" /> Nhập backup</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-white">Nhật ký AI gần nhất</h3>
          <button onClick={async () => { await clearAIUsageLogs(); await reload(); }} className="rounded-xl border border-slate-800 px-3 py-1.5 text-[10px] font-black text-slate-300 hover:bg-slate-900">Xóa log</button>
        </div>
        <div className="overflow-auto rounded-xl border border-slate-900">
          <table className="w-full min-w-[760px] text-left text-[11px]">
            <thead className="bg-slate-950 text-slate-500 uppercase font-black">
              <tr><th className="p-2">Thời gian</th><th className="p-2">Provider</th><th className="p-2">Key</th><th className="p-2">Operation</th><th className="p-2">Status</th><th className="p-2">Latency</th></tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-900 text-slate-300">
                  <td className="p-2 text-slate-500">{new Date(log.timestamp).toLocaleString("vi-VN")}</td>
                  <td className="p-2">{log.provider || "-"}</td>
                  <td className="p-2">{log.keyLabel || "-"}</td>
                  <td className="p-2">{log.operation}</td>
                  <td className="p-2"><span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass[log.status] || statusClass.untested}`}>{log.status}</span></td>
                  <td className="p-2">{log.latencyMs ? `${log.latencyMs}ms` : "-"}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={6}>Chưa có log AI.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
