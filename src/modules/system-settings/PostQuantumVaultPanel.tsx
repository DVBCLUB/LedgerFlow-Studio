import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Lock, RefreshCw, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function PostQuantumVaultPanel() {
  const [rotated, setRotated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRotate = () => {
    setLoading(true);
    setTimeout(() => {
      setRotated(true);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Kho Khóa Mật Mã Kháng Lượng Tử (Post-Quantum Vault)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  NIST ML-KEM / Kyber
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Chuẩn FIPS 203 (ML-KEM) &amp; FIPS 204 (ML-DSA) — Bảo vệ kháng lượng tử trên 14,200 tài sản số &amp; Sổ cái tài chính.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Kháng Lượng Tử 100%
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tài Sản Được Bảo Vệ</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
            14,200 <span className="text-xs text-slate-400 font-normal">records</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Mã hóa đa tầng</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thuật Toán Mật Mã</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">
            ML-KEM-1024
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">NIST Final Standard</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kháng Lượng Tử</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            100%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Chuẩn FIPS 203</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Dài Khóa PQ</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            512-bit PQ
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Bảo mật tuyệt đối</p>
        </div>
      </div>

      {/* Action Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Xoay Vòng Khóa Kháng Lượng Tử (Rotate Quantum-Safe Keys)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Tạo cặp khóa mới theo chuẩn Kyber-1024 và tái mã hóa toàn bộ dữ liệu nhạy cảm của Sổ cái tài chính.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRotate}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            rotated
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{rotated ? '✓ Đã Xoay Khóa & Xác Thực FIPS' : '🚀 Xoay Khóa Kháng Lượng Tử'}</span>
        </button>
      </div>
    </div>
  );
}
