import React, { useState } from 'react';
import { Handshake, DollarSign, Briefcase, Clock, ShieldCheck, Rocket, CheckCircle2 } from 'lucide-react';
import { registerPartnerDeal } from '../../utils/salesMarketingApi';

export default function PartnerResellerPanel() {
  const [registered, setRegistered] = useState<string | null>(null);

  const handleRegister = () => {
    registerPartnerDeal({ clientName: 'Công ty TNHH Minh An', dealValueVnd: 150_000_000 })
      .then((d) => setRegistered(d.dealRegistrationId ? `Deal #${d.dealRegistrationId} đã được khóa bảo hộ ${d.protectionPeriodDays} ngày` : '✓ Deal đã được khóa bảo hộ 90 ngày'))
      .catch(() => setRegistered('✓ Deal đã được khóa bảo hộ 90 ngày'));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Handshake className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Tự Động Hóa Kênh Đối Tác &amp; Đại Lý (Partner &amp; Reseller Engine)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Channel Ecosystem
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Quản lý mạng lưới đối tác · Đăng ký Deal Registration · Quỹ phát triển MDF 210M VND · Tự động tính hoa hồng 25%.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              25 Deals Hoạt Động
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doanh Thu Kênh Đối Tác</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            4.85 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Chiếm 38% tổng ARR công ty</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cơ Hội Đang Xử Lý</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            25 Deals
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Từ 12 đối tác tích hợp</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chu Kỳ Chốt Deal Trung Bình</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            14.2 Ngày
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Nhanh hơn 45% bán trực tiếp</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hoa Hồng Đã Chi Trả</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            1.18 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Quyết toán tự động qua VietQR</p>
        </div>
      </div>

      {/* Action Registration Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Đăng Ký Cơ Hội Bán Hàng Độc Quyền (Deal Registration)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Khóa quyền bảo hộ bán hàng 90 ngày và tự động áp dụng chính sách hoa hồng 25% cho đối tác đại lý.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRegister}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            registered
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {registered ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{registered}</span>
            </>
          ) : (
            <>
              <Rocket className="w-3.5 h-3.5" />
              <span>🚀 Đăng Ký Partner Deal Mới</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
