import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  Smile,
  Mic,
  Star,
  CheckCircle2,
  Gift,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export interface CustomerSentimentAudit {
  auditId: string;
  customerName: string;
  npsScore: number;
  csatRating: number;
  voiceEmotion: string;
  feedbackSummary: string;
  retentionActionTaken: string;
  auditedAt: string;
}

export default function NpsCsatVoiceSentimentPanel() {
  const [audits, setAudits] = useState<CustomerSentimentAudit[]>([]);
  const [npsScore, setNpsScore] = useState(84);
  const [csatPercent, setCsatPercent] = useState(96.5);
  const [positiveRatio, setPositiveRatio] = useState(92.0);
  const [perkMsg, setPerkMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/sentiment/audits');
      const data = await res.json();
      if (data?.success) {
        setAudits(data.audits || []);
        setNpsScore(data.overallNps || 84);
        setCsatPercent(data.overallCsatPercent || 96.5);
        setPositiveRatio(data.positiveEmotionRatioPercent || 92.0);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendPerk = async (auditId: string) => {
    try {
      const res = await fetch('/api/dormant/sentiment/perk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId }),
      });
      const data = await res.json();
      if (data?.success) {
        setPerkMsg(`Đã kích hoạt chế độ chăm sóc đặc biệt: ${data.perkDescription}`);
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
            <Smile className="w-5 h-5 text-pink-400" />
            <h2 className="text-base font-black text-white">❤️ NPS, CSAT &amp; AI Voice Sentiment Analyzer</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
              NPS Điểm {npsScore} / 100
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phân tích mức độ hài lòng khách hàng NPS &amp; CSAT 360 độ, nhận diện cảm xúc giọng nói tổng đài thoại AI và tự động tri ân VIP.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Chỉ Số Quảng Bá Net Promoter Score (NPS)</div>
          <div className="text-2xl font-black text-pink-400 mt-1 font-mono">+{npsScore} Xuất Sắc</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Top 1% SaaS B2B toàn cầu</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Hài Lòng Khách Hàng (CSAT)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{csatPercent}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đo lường sau mỗi cuộc gọi / ticket</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Cảm Xúc Giọng Nói Tích Cực (Audio Sentiment)</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{positiveRatio}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Nhận diện ngữ điệu &amp; mức độ hài lòng</div>
        </div>
      </div>

      {/* Perk Alert */}
      {perkMsg && (
        <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/30 text-xs text-pink-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{perkMsg}</span>
        </div>
      )}

      {/* Audits Feed */}
      <div className="space-y-3">
        {audits.map((a) => (
          <div key={a.auditId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{a.customerName}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 font-mono">
                    NPS: {a.npsScore}/10
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                    CSAT: {a.csatRating}★
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-cyan-300">
                    Cảm xúc: {a.voiceEmotion}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 italic font-sans">
                  &ldquo;{a.feedbackSummary}&rdquo;
                </p>
                <div className="text-[11px] text-slate-400 mt-2">
                  Hành động chăm sóc: <span className="text-amber-300 font-medium">{a.retentionActionTaken}</span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleSendPerk(a.auditId)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-pink-600/20"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Kích Hoạt Tri Ân VIP</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
