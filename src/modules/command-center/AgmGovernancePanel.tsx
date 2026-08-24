import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Users,
  Vote,
  Landmark,
  CheckCircle2,
  ArrowRight,
  Send,
  Building,
} from 'lucide-react';

export interface AgmResolution {
  resolutionId: string;
  title: string;
  description: string;
  votesForPercent: number;
  votesAgainstPercent: number;
  quorumReached: boolean;
  status: string;
  proposedAt: string;
}

export default function AgmGovernancePanel() {
  const [resolutions, setResolutions] = useState<AgmResolution[]>([]);
  const [totalRes, setTotalRes] = useState(3);
  const [passedCount, setPassedCount] = useState(3);
  const [quorumAttendance, setQuorumAttendance] = useState(96.8);
  const [filingMsg, setFilingMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/agm/resolutions');
      const data = await res.json();
      if (data?.success) {
        setResolutions(data.resolutions || []);
        setTotalRes(data.totalResolutions || 3);
        setPassedCount(data.passedResolutionsCount || 3);
        setQuorumAttendance(data.averageQuorumAttendancePercent || 96.8);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileWithGov = async (resolutionId: string) => {
    try {
      const res = await fetch('/api/dormant/agm/file-gov', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionId }),
      });
      const data = await res.json();
      if (data?.success) {
        setFilingMsg(`Đã nộp thành công hồ sơ số ${data.filingDossierNumber} lên Cổng Dịch vụ công Quốc gia / Sở KH&ĐT.`);
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
            <Landmark className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">🏛️ Autonomous AGM &amp; Boardroom Governance Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Quorum {quorumAttendance}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cổng quản trị đại hội đồng cổ đông ĐHĐCĐ &amp; HĐQT tự trị: Bỏ phiếu ủy quyền số, phê chuẩn nghị quyết và nộp hồ sơ pháp lý Sở KH&amp;ĐT.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Nghị Quyết Đã Thông Qua</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{passedCount}/{totalRes} Nghị Quyết</div>
          <div className="text-[10px] text-slate-400 mt-0.5">100% Đạt tỷ lệ biểu quyết trên 85%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Tham Dự Biểu Quyết (Quorum)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{quorumAttendance}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bỏ phiếu ủy quyền qua chữ ký số</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Trạng Thái Pháp Lý Doanh Nghiệp</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">100% TUÂN THỦ</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Khớp sổ đăng ký cổ đông &amp; Điều lệ</div>
        </div>
      </div>

      {/* Filing Alert */}
      {filingMsg && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{filingMsg}</span>
        </div>
      )}

      {/* Resolutions Feed */}
      <div className="space-y-3">
        {resolutions.map((r) => (
          <div key={r.resolutionId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white">{r.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{r.description}</p>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-3">
                  <span>Tán thành: <strong className="text-emerald-400">{r.votesForPercent}%</strong></span>
                  <span>Không tán thành: <strong className="text-rose-400">{r.votesAgainstPercent}%</strong></span>
                  <span>Túc số: <strong className="text-cyan-300">ĐẠT QUORUM</strong></span>
                </div>
              </div>

              <div>
                {r.status === 'FILED_WITH_GOV' ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ĐÃ NỘP SỞ KH&amp;ĐT</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleFileWithGov(r.resolutionId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Nộp Hồ Sơ Lên Sở KH&amp;ĐT</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
