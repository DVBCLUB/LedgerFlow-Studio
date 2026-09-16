import React, { useState } from 'react';
import { Network, Share2, Compass, CheckCircle2, GitFork, Cpu } from 'lucide-react';

export default function KnowledgeGraphMeshPanel() {
  const [queried, setQueried] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Network className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Đồ Thị Tri Thức Doanh Nghiệp Tự Tiến Hóa (Knowledge Graph Mesh)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Graph Neural AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Đồ thị tri thức tự tổng hợp · 1,840 Nodes &amp; 7,920 Liên kết · Dòng tiền &harr; Khách hàng &harr; Khoản mục &harr; Git Commit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              0.942 Mật Độ Đồ Thị
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thực Thể Tri Thức</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            1,840 Nodes
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Thực thể tự động định danh</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Liên Kết Quan Hệ (Edges)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            7,920 Links
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Quan hệ ngữ nghĩa đa chiều</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mật Độ Mạng Lưới (Density)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <GitFork className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            0.942 Cao
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Độ kết dính thông tin cao</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thực Thể PageRank Cao Nhất</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            90-Pillars Core
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Tâm điểm kiến trúc tri thức</p>
        </div>
      </div>

      {/* Action Explore Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-black text-white">Khám Phá Mạng Quan Hệ Đa Chiều Của Thực Thể (Query Graph Neighbors)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Truy vấn liên kết giữa Sổ cái IFRS 15, Khách hàng Vinaconex và Quyết định Hội đồng quản trị.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setQueried(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            queried
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
          }`}
        >
          {queried ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Tìm Thấy 14 Nút Liên Kết Trực Tiếp</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5" />
              <span>🚀 Khám Phá Graph Mesh Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
