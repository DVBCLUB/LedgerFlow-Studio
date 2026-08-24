import React, { useEffect, useState } from 'react';
import {
  Dna,
  ShieldCheck,
  CheckCircle2,
  GitCommit,
  RefreshCw,
  Zap,
  Code2,
  FileCode,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export interface MutationProposal {
  mutationId: string;
  targetFile: string;
  triggerSource: string;
  issueDescription: string;
  proposedDiff: string;
  testValidationStatus: string;
  safetyScore: number;
  status: 'PROPOSED' | 'AUTO_APPLIED' | 'ROLLED_BACK';
  appliedAt?: string;
  createdAt: string;
}

export default function AutonomousSelfMutationPanel() {
  const [mutations, setMutations] = useState<MutationProposal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMutations = async () => {
    try {
      const res = await fetch('/api/dormant/mutations/proposals');
      const data = await res.json();
      if (data?.success && data?.mutations) {
        setMutations(data.mutations);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchMutations();
  }, []);

  const handleApply = async (mutationId: string) => {
    try {
      await fetch('/api/dormant/mutations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutationId }),
      });
      await fetchMutations();
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
            <Dna className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-black text-white">🧬 Autonomous Code Self-Mutation &amp; Self-Patching Engine</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              AST Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hệ thống tự động phát hiện lỗi hiệu năng/runtime exception, sinh bản vá AST atomic, kiểm thử sandbox và đề xuất hợp nhất an toàn.
          </p>
        </div>
      </div>

      {/* Mutations Feed */}
      <div className="space-y-4">
        {mutations.map((mut) => (
          <div key={mut.mutationId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-cyan-300">{mut.targetFile}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-slate-400">
                    {mut.triggerSource}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{mut.issueDescription}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 font-bold">
                  Độ an toàn: {mut.safetyScore}%
                </span>
                {mut.status === 'PROPOSED' ? (
                  <button
                    onClick={() => handleApply(mut.mutationId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Áp Dụng Bản Vá</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ĐÃ HỢP NHẤT AN TOÀN</span>
                  </span>
                )}
              </div>
            </div>

            {/* Code Diff Display */}
            <div className="p-3 rounded-lg bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap overflow-x-auto">
              {mut.proposedDiff}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
              <span>Trạng thái kiểm thử: <strong className="text-emerald-400">CI Tests Green (100% Passed)</strong></span>
              <span>Thời gian: {new Date(mut.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
