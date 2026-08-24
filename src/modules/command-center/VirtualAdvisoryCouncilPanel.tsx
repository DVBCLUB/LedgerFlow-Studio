import React, { useEffect, useState } from 'react';
import {
  Users2,
  HelpCircle,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Award,
} from 'lucide-react';

export interface VirtualAdvisor {
  advisorId: string;
  name: string;
  domain: string;
  avatarTitle: string;
  latestStrategicCounsel: string;
  keyRecommendation: string;
  status: string;
}

export default function VirtualAdvisoryCouncilPanel() {
  const [advisors, setAdvisors] = useState<VirtualAdvisor[]>([]);
  const [consensusScore, setConsensusScore] = useState(96.8);
  const [question, setQuestion] = useState('');
  const [consultMsg, setConsultMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/advisory/council');
      const data = await res.json();
      if (data?.success) {
        setAdvisors(data.advisors || []);
        setConsensusScore(data.strategicConsensusScorePercent || 96.8);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConsult = async () => {
    if (!question.trim()) return;
    try {
      const res = await fetch('/api/dormant/advisory/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategicQuestion: question }),
      });
      const data = await res.json();
      if (data?.success) {
        setConsultMsg(data.advisoryConsensusSummary);
        setQuestion('');
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
            <Users2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-black text-white">🏛️ Virtual Advisory Council &amp; Strategic Think-Tank</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              5 Elite Advisors Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hội đồng Cố vấn Chiến lược Ảo (YC Partner, Big-4 Tax Partner, Top AI Scientist, M&amp;A Banker) cung cấp góc nhìn cố vấn đa chiều cho Nhà Sáng Lập.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Đồng Thuận Chiến Lược (Consensus)</div>
          <div className="text-2xl font-black text-purple-400 mt-1 font-mono">{consensusScore}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dựa trên ma trận phân tích 5 góc nhìn</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Số Lượng Cố Vấn Tinh Hoa Đang Hoạt Động</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">5 Chuyên Gia AI</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Venture Capital, Big-4, AI, M&amp;A, Growth</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Nhịp Giao Ban Cố Vấn Định Kỳ</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">Chủ Nhật 20:00</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tự động tổng hợp báo cáo chiến lược tuần</div>
        </div>
      </div>

      {/* Question Box */}
      <div className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-bold text-white uppercase">Hỏi Ý Kiến Hội Đồng Cố Vấn Chiến Lược</h4>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Đặt câu hỏi chiến lược cho Hội đồng Cố vấn (ví dụ: Có nên mở rộng sang thị trường Singapore ngay quý này?)"
            className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-medium"
            onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
          />
          <button
            onClick={handleConsult}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Xin Ý Kiến Cố Vấn</span>
          </button>
        </div>

        {consultMsg && (
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{consultMsg}</span>
          </div>
        )}
      </div>

      {/* Advisors Feed */}
      <div className="space-y-3">
        {advisors.map((adv) => (
          <div key={adv.advisorId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 font-mono">
                  {adv.domain}
                </span>
                <h4 className="text-xs font-bold text-white">{adv.name}</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{adv.avatarTitle}</span>
            </div>

            <p className="text-xs text-slate-300 italic">&ldquo;{adv.latestStrategicCounsel}&rdquo;</p>

            <div className="pt-2 border-t border-white/5 text-[11px] text-cyan-300">
              Khuyến nghị cốt lõi: <strong>{adv.keyRecommendation}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
