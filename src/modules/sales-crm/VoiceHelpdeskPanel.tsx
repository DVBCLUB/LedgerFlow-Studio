import React, { useEffect, useState } from 'react';
import {
  PhoneCall,
  MessageSquare,
  Bot,
  Play,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Users,
} from 'lucide-react';

export interface HelpdeskCallRecord {
  callId: string;
  customerName: string;
  phoneNumber: string;
  channel: string;
  durationSeconds: number;
  sentiment: string;
  resolutionStatus: string;
  transcriptSummary: string;
  timestamp: string;
}

export default function VoiceHelpdeskPanel() {
  const [calls, setCalls] = useState<HelpdeskCallRecord[]>([]);
  const [totalCalls, setTotalCalls] = useState(124);
  const [deflectionRate, setDeflectionRate] = useState(93.5);
  const [avgDur, setAvgDur] = useState(139);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/helpdesk/calls');
      const data = await res.json();
      if (data?.success) {
        setCalls(data.calls || []);
        setTotalCalls(data.totalCallsHandled || 124);
        setDeflectionRate(data.aiDeflectionRatePercent || 93.5);
        setAvgDur(data.averageCallDurationSeconds || 139);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (callId: string) => {
    try {
      await fetch('/api/dormant/helpdesk/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
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
            <PhoneCall className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-white">📞 Autonomous Omnichannel Helpdesk &amp; Voice-AI Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              AI Deflection 93.5%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tổng đài cuộc gọi thoại AI &amp; Trợ lý đa kênh (Zalo OA, Telegram), tự động tóm tắt nội dung và xử lý yêu cầu khách hàng.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Cuộc Gọi &amp; Tin Nhắn Đã Xử Lý</div>
          <div className="text-2xl font-black text-indigo-300 mt-1 font-mono">{totalCalls} Cuộc Gọi</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Xử lý tức thì &lt; 2 giây</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Tự Động Giải Quyết (AI Deflection)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{deflectionRate}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Không cần can thiệp thủ công</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Thời Lượng Cuộc Gọi Trung Bình</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{avgDur} Giây</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ngắn gọn, chính xác, đúng trọng tâm</div>
        </div>
      </div>

      {/* Calls Feed */}
      <div className="space-y-3">
        {calls.map((c) => (
          <div key={c.callId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{c.customerName}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-cyan-300 font-mono">
                    {c.phoneNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/5 text-purple-300">
                    {c.channel}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Thời lượng: <strong>{c.durationSeconds}s</strong> | Cảm xúc: <strong className="text-emerald-400">{c.sentiment}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {c.resolutionStatus === 'ESCALATED_TO_CEO' ? (
                  <button
                    onClick={() => handleResolve(c.callId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Xử Lý Cuộc Gọi VIP</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>AI ĐÃ GIẢI QUYẾT</span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300 flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>{c.transcriptSummary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
