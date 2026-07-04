import React, { useEffect, useMemo, useState } from "react";
import { Download, KeyRound, Loader2, MessageCircle, RefreshCw, ShieldCheck, Trash2, Upload, Zap } from 'lucide-react';
import {
  activatePromptTemplateVersion,
  AIKeyPayload,
  AIKeySummary,
  AIPreflightReport,
  AIPromptTask,
  AIPromptTemplate,
  AIProviderDefinition,
  AIUsageLogEntry,
  AIUsageMetricsReport,
  callAIFromSettings,
  clearAIUsageLogs,
  createPromptTemplateVersion,
  createAIKey,
  deleteAIKey,
  exportAIKeyBackup,
  fetchAIKeys,
  fetchAIUsageMetrics,
  fetchAIProviders,
  fetchPromptTemplates,
  fetchAIUsageLogs,
  importAIKeyBackup,
  runAIDiagnostics,
  runAIPreflight,
  streamAIFromSettings,
  testAIKey,
  updateAIKey,
} from "../../utils/aiSettingsApi";
import {
  fetchAgentRoles,
  fetchAgentRoleById,
  updateAgentRolePrompt as updateAgentRolePromptDaemon
} from "../../utils/assistantApi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from "recharts";


const statusClass: Record<string, string> = {
  ok: "bg-emerald-950/30 text-emerald-300 border-emerald-800/50",
  quota: "bg-amber-950/30 text-amber-300 border-amber-800/50",
  warn: "bg-amber-950/30 text-amber-300 border-amber-800/50",
  error: "bg-rose-950/30 text-rose-300 border-rose-800/50",
  untested: "bg-bg-primary/60 text-text-secondary border-border-primary",
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

const taskLabels: Record<string, string> = {
  general: "General",
  accounting: "Accounting",
  analytics: "Analytics",
  marketing: "Marketing",
  sales: "Sales",
  coding: "Coding",
};

export default function AISettingsManager() {
  const [providers, setProviders] = useState<AIProviderDefinition[]>([]);
  const [keys, setKeys] = useState<AIKeySummary[]>([]);
  const [logs, setLogs] = useState<AIUsageLogEntry[]>([]);
  const [metrics, setMetrics] = useState<AIUsageMetricsReport | null>(null);
  const [templates, setTemplates] = useState<AIPromptTemplate[]>([]);
  const [preflight, setPreflight] = useState<AIPreflightReport | null>(null);
  const [form, setForm] = useState<AIKeyPayload>(defaultForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [testResult, setTestResult] = useState("");
  const [prompt, setPrompt] = useState("Bạn đang dùng provider/key nào? Trả lời ngắn gọn bằng tiếng Việt.");
  const [chatOutput, setChatOutput] = useState("");
  const [chatTask, setChatTask] = useState<AIPromptTask>("general");
  const [chatMode, setChatMode] = useState<"ai-assistant" | "ai-assistant-pro">("ai-assistant");
  const [promptEditorTask, setPromptEditorTask] = useState<AIPromptTask>("general");
  const [promptEditorContent, setPromptEditorContent] = useState("");
  const [promptEditorNote, setPromptEditorNote] = useState("");
  const [backupPassword, setBackupPassword] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [backupFileText, setBackupFileText] = useState("");

  // New states for visual metrics and unified prompt registry
  const [metricsTab, setMetricsTab] = useState<"charts" | "data">("charts");
  const [promptRegistryTab, setPromptRegistryTab] = useState<"tasks" | "roles">("tasks");
  const [roleList, setRoleList] = useState<Array<{ id: string; emoji: string; group: string }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [rolePromptContent, setRolePromptContent] = useState<string>("");
  const [rolePromptNote, setRolePromptNote] = useState<string>("");
  const [rolePromptLoading, setRolePromptLoading] = useState<boolean>(false);
  const [previewingVersion, setPreviewingVersion] = useState<any | null>(null);


  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === form.provider),
    [providers, form.provider]
  );

  async function reload() {
    const [nextProviders, nextKeys, nextLogs, nextMetrics, nextTemplates, nextRoles] = await Promise.all([
      fetchAIProviders(),
      fetchAIKeys(),
      fetchAIUsageLogs().catch(() => []),
      fetchAIUsageMetrics(24).catch(() => null),
      fetchPromptTemplates().catch(() => []),
      fetchAgentRoles().catch(() => []),
    ]);
    setProviders(nextProviders);
    setKeys(nextKeys);
    setLogs(nextLogs.slice(0, 40));
    setMetrics(nextMetrics);
    setTemplates(nextTemplates);
    setRoleList(nextRoles);

    if (nextRoles.length && !selectedRoleId) {
      setSelectedRoleId(nextRoles[0].id);
    }

    if (nextProviders.length && !form.model) {
      const provider = nextProviders.find((item) => item.id === form.provider) ?? nextProviders[0];
      setForm((prev) => ({ ...prev, provider: provider.id, model: provider.defaultModel }));
    }
  }

  useEffect(() => {
    reload().catch((err) => setMessage(`Không tải được cấu hình AI: ${err.message}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync selected role prompt content from registry templates
  useEffect(() => {
    setPreviewingVersion(null);
    if (!selectedRoleId || !templates.length) return;
    const template = templates.find((t) => t.task === selectedRoleId);
    if (template) {
      const active = template.versions.find((v) => v.version === template.activeVersion);
      if (active) {
        setRolePromptContent(active.content);
      }
    }
  }, [selectedRoleId, templates]);

  async function handleCreateRolePromptVersion() {
    if (!selectedRoleId) return;
    if (!rolePromptContent.trim()) {
      setMessage("Prompt vai trò không được để trống.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createPromptTemplateVersion({
        task: selectedRoleId as AIPromptTask,
        content: rolePromptContent,
        note: rolePromptNote || "Updated via Agent Roles Manager",
        createdBy: "local-admin",
        activate: true,
      });
      setRolePromptNote("");
      await reload();
      setMessage(`Đã tạo version mới và kích hoạt cho vai trò ${selectedRoleId}.`);
    } catch (err: any) {
      setMessage(`Lỗi khi tạo version vai trò: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }


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
        await streamAIFromSettings(prompt, (chunk) => setChatOutput((prev) => prev + chunk), chatMode, chatTask);
      } else {
        const result = await callAIFromSettings(prompt, chatMode, chatTask);
        setChatOutput(result.text || result.error || "Không có phản hồi.");
      }
      await reload();
    } catch (err: any) {
      setChatOutput(`Lỗi chat: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreatePromptVersion() {
    if (!promptEditorContent.trim()) {
      setMessage("Prompt version không được để trống.");
      return;
    }
    setBusy(true);
    try {
      await createPromptTemplateVersion({
        task: promptEditorTask,
        content: promptEditorContent,
        note: promptEditorNote,
        createdBy: "local-admin",
        activate: true,
      });
      setPromptEditorContent("");
      setPromptEditorNote("");
      await reload();
      setMessage(`Đã tạo version mới và kích hoạt cho task ${taskLabels[promptEditorTask]}.`);
    } catch (err: any) {
      setMessage(`Lỗi tạo prompt version: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleActivatePromptVersion(task: AIPromptTask, version: number) {
    setBusy(true);
    try {
      await activatePromptTemplateVersion(task, version);
      await reload();
      setMessage(`Đã chuyển task ${taskLabels[task]} sang version ${version}.`);
    } catch (err: any) {
      setMessage(`Lỗi kích hoạt prompt version: ${err.message || err}`);
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
            <h2 className="text-2xl font-black text-text-primary mt-2">Cài đặt AI đa provider</h2>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
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
        {message && <div className="mt-4 rounded-xl border border-border-primary bg-slate-950/70 p-3 text-xs font-bold text-text-secondary">{message}</div>}
      </div>

      {preflight && (
        <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-text-primary">AI Preflight Report</h3>
              <p className="text-xs text-text-secondary mt-1">{preflight.summary} · {new Date(preflight.checkedAt).toLocaleString("vi-VN")}</p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
              <div className="rounded-xl border border-border-primary bg-slate-950 p-2"><div className="text-[9px] text-text-tertiary font-black uppercase">Keys</div><div className="text-sm text-text-primary font-black">{preflight.stats.enabledKeys}/{preflight.stats.totalKeys}</div></div>
              <div className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-2"><div className="text-[9px] text-emerald-400 font-black uppercase">OK</div><div className="text-sm text-text-primary font-black">{preflight.stats.okKeys}</div></div>
              <div className="rounded-xl border border-amber-900 bg-amber-950/20 p-2"><div className="text-[9px] text-amber-400 font-black uppercase">Quota</div><div className="text-sm text-text-primary font-black">{preflight.stats.quotaKeys}</div></div>
              <div className="rounded-xl border border-rose-900 bg-rose-950/20 p-2"><div className="text-[9px] text-rose-400 font-black uppercase">Error</div><div className="text-sm text-text-primary font-black">{preflight.stats.errorKeys}</div></div>
              <div className="rounded-xl border border-border-primary bg-slate-950 p-2 md:col-span-2"><div className="text-[9px] text-text-tertiary font-black uppercase">Recent issues</div><div className="text-sm text-text-primary font-black">{preflight.stats.recentErrors}</div></div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {preflight.checks.map((check) => (
              <div key={check.id} className="rounded-xl border border-slate-900 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-text-primary">{check.label}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass[check.severity] || statusClass.untested}`}>{check.severity}</span>
                </div>
                <div className="mt-1 text-[11px] text-text-secondary">{check.message}</div>
                {check.action && <div className="mt-2 text-[10px] text-amber-300 font-bold">Gợi ý: {check.action}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-black text-text-primary"><KeyRound className="w-4 h-4 text-amber-400" /> Thêm API key</h3>
          <label className="block text-[10px] uppercase font-black text-text-tertiary">Provider</label>
          <select value={form.provider} onChange={(e) => setProvider(e.target.value as AIKeyPayload["provider"])} className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs font-bold text-slate-100">
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
          </select>
          {selectedProvider && <p className="text-[11px] text-text-secondary leading-relaxed">{selectedProvider.note}</p>}

          <input className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs text-slate-100" placeholder="Tên gợi nhớ, ví dụ Gemini acc 1" value={form.label || ""} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          {selectedProvider?.requiresApiKey !== false && (
            <input className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs text-slate-100" placeholder="API key" type="password" value={form.apiKey || ""} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
          )}
          <input className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs text-slate-100" placeholder="Model" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <input className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs text-slate-100" placeholder="Base URL tùy chọn" value={form.baseUrl || ""} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
          <input className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs text-slate-100" placeholder="Priority" type="number" value={form.priority ?? 10} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={handleTestCurrentForm} className="rounded-xl border border-blue-800 bg-blue-950/30 px-3 py-2 text-xs font-black text-blue-200 hover:bg-blue-900/30">Test</button>
            <button disabled={busy} onClick={handleSaveKey} className="rounded-xl border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-900/30">Lưu key</button>
          </div>
          {testResult && <div className="rounded-xl border border-border-primary bg-slate-950 p-2 text-[11px] font-bold text-text-secondary">{testResult}</div>}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <h3 className="text-sm font-black text-text-primary">Danh sách key/provider đã lưu</h3>
          <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
            {keys.length === 0 ? <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-xs text-text-tertiary">Chưa có key nào. Thêm ít nhất 1 key để AI router tự fallback.</div> : keys.map((key) => (
              <div key={key.id} className="rounded-xl border border-slate-900 bg-slate-950/80 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-text-primary">{key.label}</span>
                    <span className="text-[10px] font-bold text-text-secondary">{key.providerLabel}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass[key.lastStatus] || statusClass.untested}`}>{key.lastStatus}</span>
                  </div>
                  <div className="text-[11px] text-text-tertiary font-mono">{key.maskedKey} · {key.model || "default model"}</div>
                  {key.lastError && <div className="text-[10px] text-rose-300">{key.lastError}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-20 rounded-lg border border-border-primary bg-slate-950 p-1.5 text-xs text-slate-100" value={key.priority} onChange={(e) => handlePriority(key, Number(e.target.value))} />
                  <button onClick={() => handleToggle(key)} className="rounded-lg border border-border-primary px-2 py-1.5 text-[10px] font-black text-text-secondary hover:bg-bg-primary">{key.enabled ? "Bật" : "Tắt"}</button>
                  <button onClick={() => handleDelete(key)} className="rounded-lg border border-rose-900/60 px-2 py-1.5 text-rose-300 hover:bg-rose-950/30"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-black text-text-primary"><MessageCircle className="w-4 h-4 text-purple-400" /> Test chat fallback</h3>
          <textarea className="min-h-[120px] w-full rounded-xl border border-border-primary bg-slate-950 p-3 text-xs text-slate-100" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <select value={chatTask} onChange={(e) => setChatTask(e.target.value as AIPromptTask)} className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs font-bold text-slate-100">
            {Object.entries(taskLabels).map(([task, label]) => <option key={task} value={task}>{label} routing</option>)}
          </select>
          <select value={chatMode} onChange={(e) => setChatMode(e.target.value as "ai-assistant" | "ai-assistant-pro")} className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs font-bold text-slate-100">
            <option value="ai-assistant">Nhanh / tiết kiệm</option>
            <option value="ai-assistant-pro">Pro / ưu tiên model mạnh</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleChat(false)} disabled={busy} className="rounded-xl border border-purple-800 bg-purple-950/30 px-3 py-2 text-xs font-black text-purple-200 hover:bg-purple-900/30"><Zap className="inline w-3.5 h-3.5 mr-1" /> Non-stream</button>
            <button onClick={() => handleChat(true)} disabled={busy} className="rounded-xl border border-indigo-800 bg-indigo-950/30 px-3 py-2 text-xs font-black text-indigo-200 hover:bg-indigo-900/30"><Zap className="inline w-3.5 h-3.5 mr-1" /> Streaming</button>
          </div>
          <pre className="min-h-[140px] whitespace-pre-wrap rounded-xl border border-slate-900 bg-slate-950 p-3 text-xs text-text-secondary">{chatOutput || "Kết quả test sẽ hiện ở đây."}</pre>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <h3 className="text-sm font-black text-text-primary">Backup / chuyển máy</h3>
          <input className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs text-slate-100" type="password" placeholder="Mật khẩu backup tối thiểu 8 ký tự" value={backupPassword} onChange={(e) => setBackupPassword(e.target.value)} />
          <button onClick={handleExportBackup} className="w-full rounded-xl border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-900/30"><Download className="inline w-3.5 h-3.5 mr-1" /> Tải backup mã hóa</button>
          <input type="file" accept="application/json,.json" onChange={async (e) => setBackupFileText(await (e.target.files?.[0]?.text() ?? Promise.resolve("")))} className="w-full text-xs text-text-secondary" />
          <select value={importMode} onChange={(e) => setImportMode(e.target.value as "merge" | "replace")} className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs font-bold text-slate-100">
            <option value="merge">Gộp vào danh sách hiện tại</option>
            <option value="replace">Thay thế toàn bộ danh sách hiện tại</option>
          </select>
          <button onClick={handleImportBackup} disabled={busy} className="w-full rounded-xl border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs font-black text-amber-200 hover:bg-amber-900/30"><Upload className="inline w-3.5 h-3.5 mr-1" /> Nhập backup</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-900 pb-3">
            <h3 className="text-sm font-black text-text-primary">AI Ops Metrics (24h)</h3>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-slate-950 p-1 border border-border-primary">
                <button
                  onClick={() => setMetricsTab("charts")}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-md ${metricsTab === "charts" ? "bg-violet-600 text-text-primary" : "text-text-secondary hover:text-slate-200"}`}
                >
                  Đồ thị
                </button>
                <button
                  onClick={() => setMetricsTab("data")}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-md ${metricsTab === "data" ? "bg-violet-600 text-text-primary" : "text-text-secondary hover:text-slate-200"}`}
                >
                  Bảng
                </button>
              </div>
              <button
                onClick={async () => setMetrics(await fetchAIUsageMetrics(24))}
                className="rounded-xl border border-border-primary px-3 py-1.5 text-[10px] font-black text-text-secondary hover:bg-bg-primary"
              >
                Làm mới
              </button>
            </div>
          </div>
          {metrics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                <div className="rounded-xl border border-border-primary bg-slate-950 p-2"><div className="text-[9px] text-text-tertiary uppercase font-black">Requests</div><div className="text-xs text-text-primary font-black">{metrics.totals.total}</div></div>
                <div className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-2"><div className="text-[9px] text-emerald-400 uppercase font-black">Success</div><div className="text-xs text-text-primary font-black">{metrics.totals.successRate}%</div></div>
                <div className="rounded-xl border border-border-primary bg-slate-950 p-2"><div className="text-[9px] text-text-tertiary uppercase font-black">Avg Latency</div><div className="text-xs text-text-primary font-black">{metrics.totals.avgLatencyMs}ms</div></div>
                <div className="rounded-xl border border-border-primary bg-slate-950 p-2"><div className="text-[9px] text-text-tertiary uppercase font-black">Est. Cost</div><div className="text-xs text-text-primary font-black">${metrics.totals.estimatedCostUsd.toFixed(4)}</div></div>
              </div>
              <div className="text-[11px] text-text-secondary">P95 latency: <span className="font-bold text-slate-200">{metrics.totals.p95LatencyMs}ms</span> · OK/Quota/Error: <span className="font-bold text-slate-200">{metrics.totals.ok}/{metrics.totals.quota}/{metrics.totals.error}</span></div>
              
              {metricsTab === "charts" ? (
                <div className="space-y-4 pt-2">
                  <div className="rounded-xl border border-slate-900 bg-slate-950 p-3">
                    <div className="text-[10px] font-bold text-text-secondary uppercase mb-2">Cuộc gọi theo Provider (Stacked)</div>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.providers}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="provider" stroke="#64748b" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "11px" }} />
                          <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "5px" }} />
                          <Bar dataKey="ok" name="Thành công" fill="#10b981" stackId="a" />
                          <Bar dataKey="quota" name="Hết Quota" fill="#f59e0b" stackId="a" />
                          <Bar dataKey="error" name="Lỗi" fill="#ef4444" stackId="a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-900 bg-slate-950 p-3">
                    <div className="text-[10px] font-bold text-text-secondary uppercase mb-2">Độ trễ trung bình theo Provider (ms)</div>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.providers}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="provider" stroke="#64748b" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "11px" }} />
                          <Bar dataKey="avgLatencyMs" name="Độ trễ (ms)" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto rounded-xl border border-slate-900">
                  <table className="w-full min-w-[560px] text-left text-[11px]">
                    <thead className="bg-slate-950 text-text-tertiary uppercase font-black">
                      <tr><th className="p-2">Provider</th><th className="p-2">Req</th><th className="p-2">Success</th><th className="p-2">Avg</th><th className="p-2">Cost</th></tr>
                    </thead>
                    <tbody>
                      {metrics.providers.map((item) => (
                        <tr key={item.provider} className="border-t border-slate-900 text-text-secondary">
                          <td className="p-2">{item.provider}</td>
                          <td className="p-2">{item.total}</td>
                          <td className="p-2">{item.successRate}%</td>
                          <td className="p-2">{item.avgLatencyMs}ms</td>
                          <td className="p-2">${item.estimatedCostUsd.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-text-tertiary">Chưa có dữ liệu metrics.</div>
          )}
        </div>


        <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-900 pb-3">
            <h3 className="text-sm font-black text-text-primary">Prompt Registry</h3>
            <div className="flex rounded-lg bg-slate-950 p-1 border border-border-primary">
              <button
                onClick={() => setPromptRegistryTab("tasks")}
                className={`px-3 py-1 text-[10px] font-black rounded-md ${promptRegistryTab === "tasks" ? "bg-violet-600 text-text-primary" : "text-text-secondary hover:text-slate-200"}`}
              >
                Tác vụ (Tasks)
              </button>
              <button
                onClick={() => setPromptRegistryTab("roles")}
                className={`px-3 py-1 text-[10px] font-black rounded-md ${promptRegistryTab === "roles" ? "bg-violet-600 text-text-primary" : "text-text-secondary hover:text-slate-200"}`}
              >
                Vai trò (Roles)
              </button>
            </div>
          </div>

          {promptRegistryTab === "tasks" ? (
            <div className="space-y-4">
              <select value={promptEditorTask} onChange={(e) => setPromptEditorTask(e.target.value as AIPromptTask)} className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs font-bold text-slate-100">
                {Object.entries(taskLabels).map(([task, label]) => <option key={task} value={task}>{label}</option>)}
              </select>
              <textarea className="min-h-[110px] w-full rounded-xl border border-border-primary bg-slate-950 p-3 text-xs text-slate-100" placeholder="Nội dung system prompt version mới..." value={promptEditorContent} onChange={(e) => setPromptEditorContent(e.target.value)} />
              <input className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs text-slate-100" placeholder="Ghi chú version (optional)" value={promptEditorNote} onChange={(e) => setPromptEditorNote(e.target.value)} />
              <button onClick={handleCreatePromptVersion} disabled={busy} className="w-full rounded-xl border border-indigo-800 bg-indigo-950/30 px-3 py-2 text-xs font-black text-indigo-200 hover:bg-indigo-900/30">Tạo version mới và kích hoạt</button>

               <div className="max-h-[220px] overflow-auto space-y-2 pr-1">
                {templates.filter((t) => ["general", "accounting", "analytics", "marketing", "sales", "coding"].includes(t.task)).map((template) => (
                  <div key={template.task} className="rounded-xl border border-slate-900 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-text-primary">{taskLabels[template.task] || template.task} · v{template.activeVersion}</div>
                        <div className="text-[10px] text-text-tertiary">{template.description}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {template.versions.slice().reverse().map((version) => (
                        <button
                          key={`${template.task}-${version.version}`}
                          onClick={() => handleActivatePromptVersion(template.task, version.version)}
                          className={`rounded-full border px-2 py-1 text-[10px] font-black ${version.version === template.activeVersion ? "border-emerald-700 bg-emerald-950/30 text-emerald-300" : "border-border-secondary text-text-secondary hover:bg-bg-primary"}`}
                        >
                          v{version.version}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {templates.length === 0 && <div className="text-xs text-text-tertiary">Chưa có prompt template.</div>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-bold text-text-secondary">Chọn vai trò nhân sự AI:</div>
              <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs font-bold text-slate-100">
                {roleList.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.id} ({r.group})</option>)}
              </select>
              <div className="text-xs font-bold text-text-secondary">System Prompt cho vai trò:</div>
              <textarea 
                className="min-h-[160px] w-full rounded-xl border border-border-primary bg-slate-950 p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-violet-500 outline-none" 
                placeholder="Nhập System Prompt cấu hình cho vai trò..." 
                value={rolePromptContent} 
                onChange={(e) => setRolePromptContent(e.target.value)} 
                disabled={rolePromptLoading} 
              />
              <input 
                className="w-full rounded-xl border border-border-primary bg-slate-950 p-2 text-xs text-slate-100" 
                placeholder="Ghi chú version vai trò (optional)" 
                value={rolePromptNote} 
                onChange={(e) => setRolePromptNote(e.target.value)} 
              />
              <button 
                onClick={handleCreateRolePromptVersion} 
                disabled={busy || !selectedRoleId} 
                className="w-full rounded-xl border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-900/30"
              >
                Tạo version mới và kích hoạt
              </button>

              {/* Version History detailed list for Role */}
              {(() => {
                const template = templates.find((t) => t.task === selectedRoleId);
                if (!template) return null;
                return (
                  <div className="pt-2 space-y-3">
                    <div className="text-xs font-bold text-text-secondary">Danh sách phiên bản (v{template.activeVersion} đang chạy):</div>
                    <div className="max-h-[220px] overflow-auto space-y-2 pr-1 border border-slate-900 bg-slate-950 p-2 rounded-xl">
                      {template.versions.slice().reverse().map((version) => {
                        const isActive = version.version === template.activeVersion;
                        return (
                          <div 
                            key={`${selectedRoleId}-${version.version}`} 
                            className={`rounded-lg border p-2.5 space-y-1.5 transition-all ${
                              isActive ? 'bg-emerald-950/10 border-emerald-900/50' : 'bg-slate-950/40 border-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  isActive ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-bg-primary text-text-secondary border border-border-primary'
                                }`}>
                                  v{version.version}
                                </span>
                                {isActive && <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Active</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewingVersion(version)}
                                  className="px-2 py-0.5 text-[9px] font-bold rounded bg-bg-primary text-text-secondary border border-border-primary hover:text-text-primary"
                                >
                                  Xem prompt
                                </button>
                                {!isActive && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setBusy(true);
                                      try {
                                        await activatePromptTemplateVersion(selectedRoleId as AIPromptTask, version.version);
                                        await reload();
                                        setMessage(`Đã kích hoạt version ${version.version} cho ${selectedRoleId}.`);
                                      } catch (err: any) {
                                        setMessage(`Lỗi kích hoạt: ${err.message || err}`);
                                      } finally {
                                        setBusy(false);
                                      }
                                    }}
                                    className="px-2 py-0.5 text-[9px] font-bold rounded bg-violet-950/60 text-violet-300 border border-violet-850 hover:bg-violet-900/60"
                                  >
                                    Kích hoạt
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="text-[10px] text-text-secondary leading-normal">
                              <span className="font-bold text-text-tertiary">Ghi chú:</span> {version.note || "Không có ghi chú"}
                            </div>
                            <div className="text-[9px] text-text-tertiary flex justify-between">
                              <span>Tạo bởi: {version.createdBy || "admin"}</span>
                              <span>{version.createdAt ? new Date(version.createdAt).toLocaleString("vi-VN") : "không rõ"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Preview Panel */}
                    {previewingVersion && (
                      <div className="rounded-xl border border-violet-900/50 bg-violet-950/10 p-3 space-y-2 mt-2">
                        <div className="flex items-center justify-between border-b border-violet-900/30 pb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-violet-300">Nội dung prompt của v{previewingVersion.version}</span>
                          <button 
                            type="button"
                            onClick={() => setPreviewingVersion(null)} 
                            className="text-[10px] text-text-secondary hover:text-slate-200"
                          >
                            Đóng
                          </button>
                        </div>
                        <pre className="max-h-[160px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-2.5 text-[10px] font-mono text-text-secondary leading-relaxed border border-slate-900">
                          {previewingVersion.content}
                        </pre>
                        {previewingVersion.version !== template.activeVersion && (
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={async () => {
                                setBusy(true);
                                try {
                                  await activatePromptTemplateVersion(selectedRoleId as AIPromptTask, previewingVersion.version);
                                  await reload();
                                  setMessage(`Đã kích hoạt version ${previewingVersion.version} cho ${selectedRoleId}.`);
                                  setPreviewingVersion(null);
                                } catch (err: any) {
                                  setMessage(`Lỗi kích hoạt: ${err.message || err}`);
                                } finally {
                                  setBusy(false);
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-violet-600 hover:bg-violet-500 text-text-primary"
                            >
                              Kích hoạt phiên bản này
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

      </div>

      <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-text-primary">Nhật ký AI gần nhất</h3>
          <button onClick={async () => { await clearAIUsageLogs(); await reload(); }} className="rounded-xl border border-border-primary px-3 py-1.5 text-[10px] font-black text-text-secondary hover:bg-bg-primary">Xóa log</button>
        </div>
        <div className="overflow-auto rounded-xl border border-slate-900">
          <table className="w-full min-w-[760px] text-left text-[11px]">
            <thead className="bg-slate-950 text-text-tertiary uppercase font-black">
              <tr><th className="p-2">Thời gian</th><th className="p-2">Provider</th><th className="p-2">Key</th><th className="p-2">Operation</th><th className="p-2">Status</th><th className="p-2">Latency</th></tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-900 text-text-secondary">
                  <td className="p-2 text-text-tertiary">{new Date(log.timestamp).toLocaleString("vi-VN")}</td>
                  <td className="p-2">{log.provider || "-"}</td>
                  <td className="p-2">{log.keyLabel || "-"}</td>
                  <td className="p-2">{log.operation}</td>
                  <td className="p-2"><span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass[log.status] || statusClass.untested}`}>{log.status}</span></td>
                  <td className="p-2">{log.latencyMs ? `${log.latencyMs}ms` : "-"}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td className="p-4 text-text-tertiary" colSpan={6}>Chưa có log AI.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
