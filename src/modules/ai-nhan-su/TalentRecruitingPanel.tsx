import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Send,
} from 'lucide-react';

export interface JobCandidate {
  candidateId: string;
  fullName: string;
  appliedRole: string;
  experienceYears: number;
  matchScorePercent: number;
  status: 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'OFFER_EXTENDED' | 'HIRED';
  skillHighlights: string[];
  appliedAt: string;
}

export default function TalentRecruitingPanel() {
  const [candidates, setCandidates] = useState<JobCandidate[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(48);
  const [avgMatch, setAvgMatch] = useState(96);
  const [openRoles, setOpenRoles] = useState(3);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/talent/recruiting-data');
      const data = await res.json();
      if (data?.success) {
        setCandidates(data.candidates || []);
        setTotalApplicants(data.totalApplicants || 48);
        setAvgMatch(data.avgMatchScore || 96);
        setOpenRoles(data.openRolesCount || 3);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (candidateId: string, status: JobCandidate['status']) => {
    try {
      await fetch('/api/dormant/talent/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status }),
      });
      await fetchData();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <UserCheck className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Tuyển Dụng &amp; Phễu Kỹ Năng Nhân Tài (Talent Recruiting Pipeline)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI Match 96%
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tự động thẩm định hồ sơ ứng viên, chấm điểm kỹ năng kỹ thuật và tích hợp nhanh vào quy trình làm việc cùng 14 AI Agent.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              {openRoles} Vị Trí Tuyển Dụng
            </span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vị Trí Đang Mở Tuyển</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">{openRoles} Vị Trí</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Fullstack, AI Architect, CAO</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Phù Hợp Kỹ Năng</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">{avgMatch}%</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Đánh giá theo Rubric chuẩn</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hồ Sơ Đã Lọc Tự Động</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">{totalApplicants} Hồ Sơ</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Tiết kiệm 90% thời gian HR</p>
        </div>
      </div>

      {/* Candidates Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-black text-white">Danh Sách Ứng Viên Tiềm Năng Qua Sàng Lọc AI</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Shortlisted Talent</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {candidates.map((c) => (
            <div key={c.candidateId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{c.fullName}</span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    {c.appliedRole}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Kinh nghiệm: <strong className="text-slate-200">{c.experienceYears} năm</strong> · Độ phù hợp AI: <strong className="text-emerald-400 font-mono">{c.matchScorePercent}%</strong>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.skillHighlights.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-950/80 border border-slate-800 text-slate-400 font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {c.status === 'OFFER_EXTENDED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(c.candidateId, 'HIRED')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Onboard Tuyển Dụng</span>
                  </button>
                )}
                {c.status === 'INTERVIEW_SCHEDULED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(c.candidateId, 'OFFER_EXTENDED')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Thư Mời Nhận Việc</span>
                  </button>
                )}
                {c.status === 'HIRED' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ĐÃ ONBOARD (HIRED)</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

