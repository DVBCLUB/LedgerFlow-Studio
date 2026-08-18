import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  FileCode,
  GitMerge,
  GitPullRequest,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Code,
  Sparkles,
} from 'lucide-react';

interface PatchProposal {
  id: string;
  errorLogSnippet: string;
  classification: string;
  targetFile: string;
  summary: string;
  diffSnippet: string;
  suggestedAction: string;
  riskLevel: 'low' | 'medium' | 'high';
  safetyScore: number;
  judgeReasoning: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'applied';
  createdAt: string;
  approvedBy?: string;
}

export default function SelfHealingPatchGatePanel() {
  const [patches, setPatches] = useState<PatchProposal[]>([]);
  const [errorInput, setErrorInput] = useState('');
  const [preferLocal, setPreferLocal] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errNotice, setErrNotice] = useState('');

  const loadPatches = async () => {
    try {
      const res = await fetch('/api/self-healing/patches').then((r) => r.json());
      if (res.success && res.patches) {
        setPatches(res.patches);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadPatches();
  }, []);

  const handleDiagnoseAndPatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorInput.trim()) {
      setErrNotice('Vui lòng dán log lỗi cần tự động phục hồi.');
      return;
    }

    setIsDiagnosing(true);
    setErrNotice('');
    setStatusMsg('');

    try {
      const res = await fetch('/api/self-healing/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorLog: errorInput,
          preferLocal,
        }),
      }).then((r) => r.json());

      if (res.success && res.patch) {
        setPatches((prev) => [res.patch, ...prev]);
        setStatusMsg(`Robot đã phân tích và sinh bản vá an toàn (Safety Score: ${res.patch.safetyScore}/100)!`);
        setErrorInput('');
      } else {
        setErrNotice(res.error || 'Không thể tạo bản vá.');
      }
    } catch (err: any) {
      setErrNotice(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleApprovePatch = async (id: string) => {
    setMergingId(id);
    try {
      const res = await fetch('/api/self-healing/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved', approvedBy: 'Founder / Lead Engineer' }),
      }).then((r) => r.json());

      if (res.success && res.patch) {
        setPatches((prev) => prev.map((p) => (p.id === id ? res.patch : p)));
      }
    } catch {
      // ignore
    } finally {
      setMergingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl text-left space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <GitPullRequest className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Autonomous Code Self-Healing &amp; PR Gate v2</h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
                LLM-Judge Safety Guard
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Robot tự động chẩn đoán lỗi, viết atomic patch, thẩm định độ an toàn qua LLM-Judge và trình duyệt 1-Click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="h-4 w-4" />
          <span>Safe Release Gate Active</span>
        </div>
      </div>

      {/* Autonomous Diagnose Form */}
      <form onSubmit={handleDiagnoseAndPatch} className="rounded-2xl border border-border-primary bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-text-primary flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-300" />
            Nạp log lỗi để Robot tự sửa (TypeScript, Missing Import, Syntax, Env Var)
          </span>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary cursor-pointer">
            <input type="checkbox" checked={preferLocal} onChange={(e) => setPreferLocal(e.target.checked)} />
            Chạy với Ollama local ($0)
          </label>
        </div>

        <textarea
          value={errorInput}
          onChange={(e) => setErrorInput(e.target.value)}
          placeholder="Dán log lỗi từ terminal hoặc CI... VD: TypeError: Cannot find module './missing.ts' at server/services/aiRouter.ts:45"
          className="w-full rounded-xl border border-border-secondary bg-slate-950 p-3 text-xs font-mono text-cyan-300 placeholder:text-text-tertiary outline-none focus:border-emerald-500"
          rows={3}
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-tertiary">
            Mọi bản vá đều bắt buộc qua duyệt (Approval Gate) trước khi áp dụng vào codebase.
          </span>
          <button
            type="submit"
            disabled={isDiagnosing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isDiagnosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isDiagnosing ? 'Đang phân tích & thẩm định...' : 'Robot Chẩn Đoán & Sinh Bản Vá'}
          </button>
        </div>

        {errNotice && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {errNotice}
          </div>
        )}
        {statusMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {statusMsg}
          </div>
        )}
      </form>

      {/* Candidates & Patches List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-text-primary">
            Danh sách Bản vá Robot đề xuất ({patches.length})
          </h4>
          <button
            onClick={loadPatches}
            className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-white cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" /> Làm mới
          </button>
        </div>

        {patches.map((patch) => {
          const isApproved = patch.status === 'approved' || patch.status === 'applied';
          const isMerging = mergingId === patch.id;

          return (
            <div
              key={patch.id}
              className="space-y-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-black text-indigo-300 border border-indigo-500/30 uppercase">
                      {patch.classification}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      patch.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      patch.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      Rủi ro: {patch.riskLevel}
                    </span>
                    <span className="text-xs font-black text-white">{patch.summary}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1 font-mono text-cyan-300">
                      <FileCode className="h-3.5 w-3.5 text-slate-500" /> {patch.targetFile}
                    </span>
                    <span className="text-text-tertiary">· Hành động: {patch.suggestedAction}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="flex items-center gap-1 text-xs font-black text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" /> Safety: {patch.safetyScore}/100
                    </span>
                    <span className="block text-[9px] font-semibold text-slate-500 truncate max-w-[160px]">
                      {patch.judgeReasoning}
                    </span>
                  </div>

                  <button
                    onClick={() => handleApprovePatch(patch.id)}
                    disabled={isApproved || isMerging}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-md ${
                      isApproved
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : isMerging
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-600/20'
                    }`}
                  >
                    {isMerging ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Đang Áp Dụng...
                      </>
                    ) : isApproved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Đã Duyệt Bản Vá
                      </>
                    ) : (
                      <>
                        <GitMerge className="h-4 w-4" /> 1-Click Duyệt Bản Vá
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Diff snippet preview */}
              <div className="rounded-xl bg-slate-950 p-2.5 text-xs font-mono text-emerald-300 border border-border-secondary overflow-x-auto">
                <div className="text-[10px] text-text-tertiary mb-1 uppercase font-sans font-bold flex items-center gap-1">
                  <Code className="h-3 w-3" /> Mã Diff Đề Xuất:
                </div>
                <pre className="whitespace-pre-wrap">{patch.diffSnippet}</pre>
              </div>
            </div>
          );
        })}

        {patches.length === 0 && (
          <div className="py-8 text-center text-xs text-text-tertiary italic rounded-2xl border border-dashed border-border-primary">
            Chưa có bản vá nào. Dán log lỗi vào ô trên để Robot tự động chẩn đoán!
          </div>
        )}
      </div>
    </div>
  );
}
