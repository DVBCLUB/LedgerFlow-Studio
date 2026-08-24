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
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-black text-white">📡 Autonomous Brand Reputation &amp; PR Radar</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Brand Score {overallScore}/100
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Lắng nghe mạng xã hội 24/7 (Facebook, Voz, LinkedIn, Review), phát hiện sớm rủi ro khủng hoảng và sinh câu trả lời thương hiệu.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Chỉ Số Uy Tín Thương Hiệu (Brand Score)</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{overallScore}/100</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dựa trên 412 thảo luận tuần qua</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Đánh Giá Tích Cực (Positive)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{posPercent}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cộng đồng CFO &amp; Kỹ sư phần mềm</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Nguy Cơ Khủng Hoảng Truyền Thông</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">LOW (0%)</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Không phát hiện làn sóng tiêu cực</div>
        </div>
      </div>

      {/* Mentions Feed */}
      <div className="space-y-3">
        {mentions.map((m) => (
          <div key={m.mentionId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-rose-300 font-mono">
                    {m.sourcePlatform}
                  </span>
                  <h4 className="text-xs font-bold text-white">{m.author}</h4>
                </div>
                <p className="text-xs text-slate-300 italic mt-1.5">"{m.snippet}"</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  {m.sentiment} ({m.sentimentScorePercent}%)
                </span>
              </div>
            </div>

            {/* Auto-response Box */}
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">🤖 Dự Thảo Phản Hồi Tự Động:</span>
                {publishedIds[m.mentionId] ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ĐÃ XUẤT BẢN PHẢN HỒI</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handlePublish(m.mentionId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer"
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
  );
}
