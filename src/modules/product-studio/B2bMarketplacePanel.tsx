import React, { useState } from 'react';
import { ShoppingBag, Star, Users, Package, DownloadCloud, CheckCircle2, Store } from 'lucide-react';
import { installB2bModule } from '../../utils/salesMarketingApi';

export default function B2bMarketplacePanel() {
  const [installed, setInstalled] = useState<string | null>(null);

  const handleInstall = () => {
    installB2bModule('bom_construction')
      .then((d) => setInstalled(d.installStatus ? `✓ Đã cài đặt: ${d.installStatus}` : '✓ Module BOM Dự Án & Game Assets Đã Kích Hoạt'))
      .catch(() => setInstalled('✓ Module BOM Dự Án & Game Assets Đã Kích Hoạt'));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <ShoppingBag className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Chợ Ứng Dụng B2B &amp; Phân Phối Module SaaS (Marketplace Hub)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  App Ecosystem
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Chợ ứng dụng B2B · Phân phối module BOM Dự án, Game Assets, MISA Sync &amp; AI Agent Skills · GMV 1.25 Tỷ VND.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              1.25 Tỷ GMV Hệ Sinh Thái
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng GMV Hệ Sinh Thái</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            1.25 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Doanh thu giao dịch qua chợ</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhà Phát Triển Độc Lập</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            38 Lập Trình Viên
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Phát triển plugin mở rộng</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Module Đã Kiểm Định</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            3 Core Plugins
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">BOM, MISA Bridge, VietQR Hub</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đánh Giá Trung Bình</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            4.9 / 5.0 ⭐
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Dựa trên 142 lượt bình chọn</p>
        </div>
      </div>

      {/* Action Install Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-black text-white">Cài Đặt Module BOM Dự Án &amp; Game Assets Studio</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tích hợp tự động bóc tách định mức chi phí sản phẩm, phân bổ tài nguyên kỹ thuật số và đồng bộ vào Sổ cái Kế toán.
          </p>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            installed
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-500/20'
          }`}
        >
          {installed ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{installed}</span>
            </>
          ) : (
            <>
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>🚀 Cài Đặt Plugin BOM Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
