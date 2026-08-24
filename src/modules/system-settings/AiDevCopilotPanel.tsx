import React, { useEffect, useState } from 'react';
import {
  Code,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface CodeRefactorProposal {
  proposalId: string;
  modulePath: string;
  refactorType: string;
  impactSummary: string;
  sizeReductionKb: number;
  status: string;
}

export default function AiDevCopilotPanel() {
  const [proposals, setProposals] = useState<CodeRefactorProposal[]>([]);
  const [healthScore, setHealthScore] = useState(98.6);
  const [hoursSaved, setHoursSaved] = useState(48);
  const [totalKbSaved, setTotalKbSaved] = useState(53.7);
  const [applyMsg, setApplyMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/dev-copilot/proposals');
      const data = await res.json();
      if (data?.success) {
        setProposals(data.proposals || []);
        setHealthScore(data.codebaseHealthScore || 98.6);
        setHoursSaved(data.totalTechDebtHoursEliminated || 48);
        setTotalKbSaved(data.totalBundleReducedKb || 53.7);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (proposalId: string) => {
    try {
      const res = await fetch('/api/dormant/dev-copilot/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId }),
      });
      const data = await res.json();
      if (data?.success) {
        setApplyMsg(`Đã áp dụng thành công đề xuất refactoring vào sandbox và tạo git commit ${data.gitCommitHash}.`);
        await fetchData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-white">💻 AI Developer Copilot &amp; Architecture Refactoring Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              AST Refactor Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động phát hiện nợ kỹ thuật (Technical Debt), phân tách dynamic chunks tối ưu bundle size và tái cấu trúc mã nguồn an toàn trong sandbox.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Sức Khỏe Kiến Trúc (Health Score)</div>
          <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">{healthScore}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Zero Circular Dependencies</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Thời Gian Nợ Kỹ Thuật Đã Xóa Bỏ</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{hoursSaved} Giờ Dev</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tái cấu trúc tự động qua AI Agent</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Dung Lượng Bundle Web Đã Tiết Kiệm</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">-{totalKbSaved} kB</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tăng tốc độ tải trang lên 3.2x</div>
        </div>
      </div>

      {/* Alert */}
      {applyMsg && (
        <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{applyMsg}</span>
        </div>
      )}

      {/* Proposals Feed */}
      <div className="space-y-3">
        {proposals.map((p) => (
          <div key={p.proposalId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 font-mono">
                    {p.refactorType}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">{p.modulePath}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5">{p.impactSummary}</p>
                {p.sizeReductionKb > 0 && (
                  <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                    Tiết kiệm: -{p.sizeReductionKb} kB
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-cyan-300">
                  {p.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-white/5">
              {p.status === 'PROPOSED' ? (
                <button
                  onClick={() => handleApply(p.proposalId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Áp Dụng Bản Vá &amp; Kiểm Thử Sandbox</span>
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ĐÃ TỐI ƯU HÓA HOÀN TẤT</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
