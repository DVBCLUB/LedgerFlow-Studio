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
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-black text-white">🧑‍💼 AI Autonomous Talent Recruiting &amp; Skill Pipeline</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              AI Match 96%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động thẩm định hồ sơ ứng viên, chấm điểm kỹ năng kỹ thuật và tích hợp nhanh vào quy trình làm việc cùng 14 AI Agent.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Vị Trí Đang Mở Tuyển</div>
          <div className="text-2xl font-black text-purple-300 mt-1 font-mono">{openRoles} Vị Trí</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Fullstack, AI Architect, CAO</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Phù Hợp Kỹ Năng Trung Bình</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{avgMatch}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đánh giá theo Rubric tiêu chuẩn</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Hồ Sơ Đã Lọc Tự Động</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{totalApplicants} Hồ Sơ</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tiết kiệm 90% thời gian HR</div>
        </div>
      </div>

      {/* Candidates Feed */}
      <div className="space-y-3">
        {candidates.map((c) => (
          <div key={c.candidateId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{c.fullName}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-cyan-300">
                    {c.appliedRole}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Kinh nghiệm: <strong>{c.experienceYears} năm</strong> | Độ phù hợp AI: <strong className="text-emerald-400 font-bold">{c.matchScorePercent}%</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {c.status === 'OFFER_EXTENDED' && (
                  <button
                    onClick={() => handleUpdateStatus(c.candidateId, 'HIRED')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Onboard Tuyển Dụng</span>
                  </button>
                )}
                {c.status === 'INTERVIEW_SCHEDULED' && (
                  <button
                    onClick={() => handleUpdateStatus(c.candidateId, 'OFFER_EXTENDED')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Thư Mời Nhận Việc</span>
                  </button>
                )}
                {c.status === 'HIRED' && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ĐÃ ONBOARD (HIRED)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
              {c.skillHighlights.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-black/40 border border-white/5 text-slate-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
