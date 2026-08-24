import React, { useEffect, useState } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  Target,
  CheckCircle2,
  Mic,
  ArrowRight,
  ListTodo,
  Bot,
} from 'lucide-react';

export interface FounderThought {
  thoughtId: string;
  rawInput: string;
  extractedCategory: string;
  actionItems: string[];
  assignedAgent: string;
  delegationStatus: string;
  capturedAt: string;
}

export default function FounderSecondBrainPanel() {
  const [thoughts, setThoughts] = useState<FounderThought[]>([]);
  const [activeDelegations, setActiveDelegations] = useState(2);
  const [completedCount, setCompletedCount] = useState(1);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/second-brain/thoughts');
      const data = await res.json();
      if (data?.success) {
        setThoughts(data.thoughts || []);
        setActiveDelegations(data.activeDelegationsCount || 2);
        setCompletedCount(data.completedTasksCount || 1);
        setPriorities(data.northStarPriorities || []);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCapture = async () => {
    if (!inputText.trim()) return;
    try {
      const res = await fetch('/api/dormant/second-brain/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: inputText }),
      });
      const data = await res.json();
      if (data?.success) {
        setSuccessMsg(`Đã tiếp nhận suy nghĩ và tự động ủy quyền nhiệm vụ cho ${data.thought.assignedAgent}.`);
        setInputText('');
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
            <Brain className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-black text-white">🧠 Founder Second-Brain &amp; Neural Executive Assistant</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Neural Assistant Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Thu nạp suy nghĩ, ghi âm giọng nói tức thời của Nhà Sáng Lập, tự động phân rã hành động và ủy quyền cho Swarm AI Agents thực thi 24/7.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Nhiệm Vụ Đang Ủy Quyền Cho AI Swarm</div>
          <div className="text-2xl font-black text-violet-400 mt-1 font-mono">{activeDelegations} Tác Vụ</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tự động báo cáo tiến độ khi hoàn thành</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Nhiệm Vụ Đã Tự Động Hoàn Thành</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{completedCount} Tác Vụ</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Zero Founder Intervention</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Hiệu Suất Điều Hành Doanh Nghiệp</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">10x Founder Speed</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Focus vào Top-3 North Star Goals</div>
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-bold text-white uppercase">Thu Nạp Ý Tưởng Nhanh Của Nhà Sáng Lập (Thought Stream)</h4>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập suy nghĩ hoặc chỉ đạo khẩn cấp (ví dụ: Khách hàng yêu cầu báo giá nâng cấp 100 ghế...)"
            className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-medium"
            onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
          />
          <button
            onClick={handleCapture}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-violet-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ủy Quyền Cho AI</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/30 text-xs text-violet-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* North Star Priorities */}
      <div className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase">Top-3 Mục Tiêu Tối Thượng Hôm Nay (Daily North Star)</h4>
        </div>
        <div className="space-y-1.5 pt-1">
          {priorities.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                {idx + 1}
              </span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Thoughts Feed */}
      <div className="space-y-3">
        {thoughts.map((t) => (
          <div key={t.thoughtId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 font-mono">
                    {t.extractedCategory}
                  </span>
                  <span className="text-xs font-bold text-white">&ldquo;{t.rawInput}&rdquo;</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 space-y-1">
                  <div className="font-bold text-slate-300">Hành động AI tự động thực thi:</div>
                  {t.actionItems.map((act, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-cyan-300">
                      <ArrowRight className="w-3 h-3" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-[11px] font-bold text-violet-300">
                  <Bot className="w-3.5 h-3.5" />
                  <span>{t.assignedAgent}</span>
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-emerald-300">
                  {t.delegationStatus}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
