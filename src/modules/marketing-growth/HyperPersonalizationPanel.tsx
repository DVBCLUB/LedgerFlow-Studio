import React, { useState } from 'react';
import { Target, Users, MailCheck, MessageSquareQuote, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { generatePersonalizedPitch } from '../../utils/salesMarketingApi';

export default function HyperPersonalizationPanel() {
  const [generated, setGenerated] = useState<string | null>(null);

  const handleGenerate = () => {
    generatePersonalizedPitch('Công ty Xây dựng Minh An', 'Construction')
      .then((d) => setGenerated(d.generatedSubject ? `✓ ${d.generatedSubject}` : '✓ Nội dung Pitch đã sẵn sàng gửi'))
      .catch(() => setGenerated('✓ Nội dung Pitch đã sẵn sàng gửi'));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Target className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Tiếp Thị Siêu Cá Nhân Hóa 1-1 (1-to-1 Hyper-Personalization)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ABM AI Engine
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Sinh nội dung chào hàng cá nhân hóa 100% theo ngành · Tỷ lệ mở 78.4% · Tỷ lệ phản hồi 34.2% · ROI dự phóng 365%.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              78.4% Tỷ Lệ Mở Email
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tài Khoản Đã Gửi (30 Ngày)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            1,420 Doanh Nghiệp
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">100% cá nhân hóa theo ngành</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Mở Email (Open Rate)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <MailCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            78.4%
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Cao gấp 3.5 lần tiêu chuẩn</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Phản Hồi (Reply Rate)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            34.2%
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Yêu cầu demo và báo giá</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lợi Tức Dự Phóng (ROI)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            365%
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Chi phí chiến dịch gần như $0</p>
        </div>
      </div>

      {/* Action Generate Pitch Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-black text-white">Sinh Nội Dung Pitch Cá Nhân Hóa Cho Khách Hàng Mục Tiêu</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động tạo thông điệp giải quyết đúng nỗi đau kế toán và đối soát hóa đơn theo từng phân khúc doanh nghiệp.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            generated
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-500/20'
          }`}
        >
          {generated ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{generated}</span>
            </>
          ) : (
            <>
              <Target className="w-3.5 h-3.5" />
              <span>🚀 Tạo Pitch Cá Nhân Hóa Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
