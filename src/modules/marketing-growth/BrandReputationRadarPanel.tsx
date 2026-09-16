import React, { useEffect, useState } from 'react';
import {
  Radio,
  Share2,
  ThumbsUp,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Send,
  Globe2,
  ShieldCheck,
  Activity,
  Award,
} from 'lucide-react';

export interface BrandMentionItem {
  mentionId: string;
  sourcePlatform: string;
  author: string;
  snippet: string;
  sentiment: string;
  sentimentScorePercent: number;
  crisisRisk: string;
  autoResponseDraft: string;
  timestamp: string;
}

export default function BrandReputationRadarPanel() {
  const [mentions, setMentions] = useState<BrandMentionItem[]>([]);
  const [overallScore, setOverallScore] = useState(94.2);
  const [posPercent, setPosPercent] = useState(88.5);
  const [totalMentions, setTotalMentions] = useState(412);
  const [publishedIds, setPublishedIds] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/brand/mentions');
      const data = await res.json();
      if (data?.success) {
        setMentions(data.mentions || []);
        setOverallScore(data.overallBrandScorePercent || 94.2);
        setPosPercent(data.positiveSentimentPercent || 88.5);
        setTotalMentions(data.totalMentionsThisWeek || 412);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePublish = async (mentionId: string) => {
    try {
      const res = await fetch('/api/dormant/brand/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentionId }),
      });
      const data = await res.json();
      if (data?.success) {
        setPublishedIds((prev) => ({ ...prev, [mentionId]: true }));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Radar Uy Tín Thương Hiệu &amp; Xử Lý Khủng Hoảng (Brand PR Radar)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  24/7 Social Listening
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Lắng nghe mạng xã hội 24/7 (Facebook, Voz, LinkedIn, Review), phát hiện sớm rủi ro khủng hoảng và sinh câu trả lời thương hiệu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              Điểm Uy Tín: {overallScore}/100
            </span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950 to-rose-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chỉ Số Uy Tín Thương Hiệu</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300 font-mono">{overallScore}/100</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Dựa trên {totalMentions} thảo luận tuần qua</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đánh Giá Tích Cực (Positive)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">{posPercent}%</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">Cộng đồng CFO &amp; Kỹ sư phần mềm</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rủi Ro Khủng Hoảng PR</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">LOW (0%)</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Không phát hiện làn sóng tiêu cực</p>
        </div>
      </div>

      {/* Mentions Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-black text-white">Dòng Thảo Luận Xã Hội &amp; Phản Hồi Tự Động (Live Feed)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">AI Auto-Responder</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {mentions.map((m) => (
            <div key={m.mentionId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                      {m.sourcePlatform}
                    </span>
                    <h4 className="text-sm font-bold text-white">{m.author}</h4>
                  </div>
                  <p className="text-xs text-slate-300 italic mt-1.5">"{m.snippet}"</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {m.sentiment} ({m.sentimentScorePercent}%)
                  </span>
                </div>
              </div>

              {/* Auto-response Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🤖 Dự Thảo Phản Hồi Tự Động Chuẩn PR:</span>
                  {publishedIds[m.mentionId] ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ĐÃ XUẤT BẢN PHẢN HỒI</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePublish(m.mentionId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                    >
                      <Send className="w-3 h-3" />
                      <span>Xuất Bản Phản Hồi</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-200">{m.autoResponseDraft}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

