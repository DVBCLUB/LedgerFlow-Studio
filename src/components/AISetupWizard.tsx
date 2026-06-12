import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, KeyRound, Loader2, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import {
  AIKeyPayload,
  AIKeySummary,
  AIProviderDefinition,
  createAIKey,
  runAIDiagnostics,
  runAIPreflight,
  testAIKey,
} from "../utils/aiSettingsApi";

const WIZARD_DONE_KEY = "ledgerflow_ai_setup_wizard_done";

interface AISetupWizardProps {
  providers: AIProviderDefinition[];
  keys: AIKeySummary[];
  onChanged: () => Promise<void> | void;
  onMessage?: (message: string) => void;
}

const emptyForm: AIKeyPayload = {
  provider: "gemini",
  label: "Gemini acc 1",
  apiKey: "",
  model: "",
  baseUrl: "",
  priority: 1,
  enabled: true,
};

export default function AISetupWizard({ providers, keys, onChanged, onMessage }: AISetupWizardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [form, setForm] = useState<AIKeyPayload>(emptyForm);

  const enabledKeys = keys.filter((key) => key.enabled);
  const okKeys = keys.filter((key) => key.lastStatus === "ok");
  const hasAnyKey = keys.length > 0;
  const hasWorkingKey = okKeys.length > 0;
  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === form.provider),
    [providers, form.provider]
  );

  useEffect(() => {
    const done = localStorage.getItem(WIZARD_DONE_KEY) === "1";
    setCollapsed(done && hasAnyKey);
  }, [hasAnyKey]);

  useEffect(() => {
    if (!providers.length) return;
    const provider = providers.find((item) => item.id === form.provider) ?? providers[0];
    setForm((prev) => ({
      ...prev,
      provider: provider.id,
      model: prev.model || provider.defaultModel,
      apiKey: provider.requiresApiKey === false ? "" : prev.apiKey,
      baseUrl: provider.id === "ollama" ? prev.baseUrl || "http://127.0.0.1:11434" : prev.baseUrl,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers.length]);

  function emit(message: string) {
    setLocalMessage(message);
    onMessage?.(message);
  }

  function setProvider(providerId: AIKeyPayload["provider"]) {
    const provider = providers.find((item) => item.id === providerId);
    setForm((prev) => ({
      ...prev,
      provider: providerId,
      label: providerId === "ollama" ? "Ollama local" : prev.label || `${provider?.label || providerId} acc 1`,
      model: provider?.defaultModel || prev.model,
      apiKey: provider?.requiresApiKey === false ? "" : prev.apiKey,
      baseUrl: providerId === "ollama" ? prev.baseUrl || "http://127.0.0.1:11434" : prev.baseUrl,
    }));
  }

  async function saveAndTest() {
    setBusy(true);
    emit("Đang test key trước khi lưu...");
    try {
      const test = await testAIKey(form);
      if (!test.ok) {
        emit(`Key chưa OK: ${test.status} - ${test.error || "Không rõ lỗi"}. Vẫn có thể lưu nếu bạn muốn thử sau.`);
        return;
      }

      await createAIKey({ ...form, priority: Number(form.priority || 10), enabled: true });
      await onChanged();
      emit(`Đã lưu và test OK (${test.latencyMs ?? 0}ms).`);
      setForm((prev) => ({
        ...prev,
        label: `${selectedProvider?.label || prev.provider} acc ${keys.length + 2}`,
        apiKey: "",
        priority: Number(prev.priority || 1) + 1,
      }));
    } catch (err: any) {
      emit(`Lỗi lưu/test key: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function quickDiagnostics() {
    setBusy(true);
    emit("Đang chạy diagnostics nhanh...");
    try {
      const results = await runAIDiagnostics();
      await onChanged();
      const ok = results.filter((item) => item.status === "ok").length;
      const quota = results.filter((item) => item.status === "quota").length;
      const error = results.filter((item) => item.status === "error").length;
      emit(`Diagnostics xong: OK ${ok}, quota ${quota}, lỗi ${error}.`);
    } catch (err: any) {
      emit(`Lỗi diagnostics: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function preflight() {
    setBusy(true);
    emit("Đang kiểm tra toàn bộ AI Gateway...");
    try {
      const report = await runAIPreflight();
      await onChanged();
      emit(report.summary);
    } catch (err: any) {
      emit(`Lỗi preflight: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  function finishWizard() {
    localStorage.setItem(WIZARD_DONE_KEY, "1");
    setCollapsed(true);
    emit("Đã ẩn hướng dẫn setup. Bạn vẫn có thể mở lại ở thẻ Setup nhanh.");
  }

  const steps = [
    { label: "Có ít nhất 1 key", done: hasAnyKey, detail: hasAnyKey ? `${keys.length} key đã lưu` : "Chưa có key nào" },
    { label: "Có key đang bật", done: enabledKeys.length > 0, detail: `${enabledKeys.length} key active` },
    { label: "Có key test OK", done: hasWorkingKey, detail: hasWorkingKey ? `${okKeys.length} key OK` : "Bấm diagnostics để kiểm tra" },
    { label: "Nên tạo backup", done: false, detail: "Dùng khối Backup bên dưới để chuyển máy" },
  ];

  return (
    <div className="rounded-2xl border border-cyan-900/40 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-slate-950 p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Setup nhanh lần đầu
          </div>
          <h3 className="mt-1 text-lg font-black text-white">Dẫn nhập AI Gateway cho máy mới</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-3xl">
            Dùng khối này khi vừa tải LedgerFlow Studio về máy khác: nhập key, test, chạy fallback, rồi tạo backup mã hóa.
          </p>
        </div>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-black text-slate-200 hover:bg-slate-900"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {collapsed ? "Mở setup" : "Thu gọn"}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-5 grid lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-900 bg-slate-950/70 p-4 space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-black text-white"><KeyRound className="w-4 h-4 text-cyan-300" /> Bước 1: nhập key đầu tiên</h4>
            <select value={form.provider} onChange={(event) => setProvider(event.target.value as AIKeyPayload["provider"])} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-100">
              {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
            </select>
            <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" placeholder="Tên key, ví dụ Gemini acc 1" value={form.label || ""} onChange={(event) => setForm({ ...form, label: event.target.value })} />
            {selectedProvider?.requiresApiKey !== false && (
              <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" type="password" placeholder="Dán API key" value={form.apiKey || ""} onChange={(event) => setForm({ ...form, apiKey: event.target.value })} />
            )}
            <input className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" placeholder="Model" value={form.model || ""} onChange={(event) => setForm({ ...form, model: event.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100" type="number" placeholder="Priority" value={form.priority ?? 1} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} />
              <button disabled={busy} onClick={saveAndTest} className="rounded-xl border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-900/30 disabled:opacity-60">
                {busy ? <Loader2 className="inline w-3.5 h-3.5 mr-1 animate-spin" /> : <PlayCircle className="inline w-3.5 h-3.5 mr-1" />}
                Test & lưu
              </button>
            </div>
            {selectedProvider?.note && <p className="text-[11px] text-slate-500 leading-relaxed">{selectedProvider.note}</p>}
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/70 p-4 space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-black text-white"><ShieldCheck className="w-4 h-4 text-emerald-300" /> Bước 2: kiểm tra fallback</h4>
            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-900 bg-slate-950 p-2">
                  <div>
                    <div className="text-xs font-black text-slate-100">{step.label}</div>
                    <div className="text-[10px] text-slate-500">{step.detail}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${step.done ? "border-emerald-800 text-emerald-300" : "border-amber-800 text-amber-300"}`}>
                    {step.done && <CheckCircle2 className="w-3 h-3" />}
                    {step.done ? "OK" : "Chờ"}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={busy} onClick={quickDiagnostics} className="rounded-xl border border-purple-800 bg-purple-950/30 px-3 py-2 text-xs font-black text-purple-200 hover:bg-purple-900/30 disabled:opacity-60">Diagnostics</button>
              <button disabled={busy} onClick={preflight} className="rounded-xl border border-cyan-800 bg-cyan-950/30 px-3 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-900/30 disabled:opacity-60">Preflight</button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/70 p-4 space-y-3">
            <h4 className="text-sm font-black text-white">Bước 3: hoàn tất</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sau khi có ít nhất 1 key OK, hãy kéo xuống mục Backup để tải file backup mã hóa. Sang máy khác chỉ cần import file đó và nhập đúng mật khẩu.
            </p>
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-3 text-[11px] text-slate-400 leading-relaxed">
              Gợi ý priority: Gemini acc 1 = 1, Gemini acc 2 = 2, Groq = 10, OpenRouter = 20, Ollama = 99.
            </div>
            <button onClick={finishWizard} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:bg-slate-800">
              Tôi đã hiểu, ẩn setup nhanh
            </button>
            {localMessage && <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-[11px] font-bold text-slate-300">{localMessage}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
