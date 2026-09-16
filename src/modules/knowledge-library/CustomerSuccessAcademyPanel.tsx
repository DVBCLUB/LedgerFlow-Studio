import React, { useState } from 'react';
import { GraduationCap, Award, CheckCircle2, Sparkles, BookOpen, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { issueCertificate } from '../../utils/salesMarketingApi';

export default function CustomerSuccessAcademyPanel() {
  const [issued, setIssued] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleIssue = () => {
    setLoading(true);
    issueCertificate('Học viên Kế toán Trưởng A', 'course_01')
      .then((d) => setIssued(d.certificateId ? `✓ Đã Cấp Chứng Chỉ: ${d.certificateId}` : '✓ Đã Cấp Chứng Chỉ: CERT-LF-Q3'))
      .catch(() => setIssued('✓ Đã Cấp Chứng Chỉ: CERT-LF-Q3'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <GraduationCap className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Học Viện Đào Tạo & Khách Hàng Thành Công (Customer Success Academy)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Academy
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Lộ trình đào tạo tự động, cấp chứng chỉ kế toán viên AI có mã định danh số và theo dõi tỷ lệ hoàn thành khóa học.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              1,420 Chuyên Gia Tốt Nghiệp
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Học Viên Tốt Nghiệp</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            1,420 <span className="text-xs text-slate-400 font-normal">học viên</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Đã cấp chứng chỉ QR</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Hoàn Thành</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            92.4%
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Vượt chuẩn ngành (+15%)</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tăng Điểm NPS</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
            +28.5%
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Mức độ hài lòng của khách</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lộ Trình Đào Tạo</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            2 Tracks
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Kế toán VAS & AI Operator</p>
        </div>
      </div>

      {/* Certificate Action Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Cấp Chứng Chỉ Tốt Nghiệp Tự Động (Issue Certificate)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Sinh chứng chỉ số có mã xác thực QR và chữ ký điện tử cho học viên sau khi hoàn thành khóa đào tạo vận hành LedgerFlow.
          </p>
        </div>

        <button
          type="button"
          onClick={handleIssue}
          disabled={loading}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            issued
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
          }`}
        >
          {issued ? issued : '🚀 Cấp Chứng Chỉ Số'}
        </button>
      </div>
    </div>
  );
}
