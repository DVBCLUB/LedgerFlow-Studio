import React, { useState, useMemo } from 'react';
import { Cpu, DollarSign, Zap, ShieldCheck } from 'lucide-react';

type TaskType = 'code' | 'marketing' | 'research' | 'qa';

interface TaskPreset {
  name: string;
  defaultCost: number;
  defaultHours: number;
  desc: string;
}

const PRESETS: Record<TaskType, TaskPreset> = {
  code: {
    name: 'Lập trình & Fix bug',
    defaultCost: 0.5,
    defaultHours: 6,
    desc: 'Nhờ AI dev viết code patch, gỡ lỗi TypeScript hoặc tạo boilerplate.'
  },
  marketing: {
    name: 'Viết bài & Lên kịch bản',
    defaultCost: 0.1,
    defaultHours: 3,
    desc: 'Lên outline, viết bài blog, email marketing, kịch bản video ngắn.'
  },
  research: {
    name: 'Đọc hiểu & Phân tích tài liệu',
    defaultCost: 0.8,
    defaultHours: 4,
    desc: 'Rà soát thông tư pháp lý thuế hoặc phân tích dữ liệu log thô.'
  },
  qa: {
    name: 'Kiểm thử UI & Logic',
    defaultCost: 0.3,
    defaultHours: 2,
    desc: 'Viết bộ test case hoặc review lỗi hiển thị, sai chính tả.'
  }
};

export default function AiAgentCostRoiTracker() {
  const [taskType, setTaskType] = useState<TaskType>('code');
  const [apiCost, setApiCost] = useState<number>(0.5);
  const [hoursSaved, setHoursSaved] = useState<number>(6);
  const [founderRate, setFounderRate] = useState<number>(20); // 20$ / hour

  const handleTypeChange = (type: TaskType) => {
    setTaskType(type);
    setApiCost(PRESETS[type].defaultCost);
    setHoursSaved(PRESETS[type].defaultHours);
  };

  const results = useMemo(() => {
    const valueSaved = hoursSaved * founderRate;
    const netSavings = valueSaved - apiCost;
    const roi = apiCost > 0 ? valueSaved / apiCost : valueSaved;

    return { valueSaved, netSavings, roi };
  }, [hoursSaved, founderRate, apiCost]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-violet-500/10 text-violet-400 border border-violet-500/25 rounded-xl">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Agent Cost/Benefit Tracker</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Đo lường lợi nhuận thực tế (ROI) khi giao việc cho nhân sự AI thay vì tự làm thủ công.</p>
        </div>
      </div>

      {/* Selector */}
      <div className="grid grid-cols-4 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-850 mb-5">
        {(Object.keys(PRESETS) as TaskType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`py-2 text-[10px] sm:text-xs font-black rounded-lg transition-all cursor-pointer border ${
              taskType === type
                ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {PRESETS[type].name.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Inputs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl bg-slate-900/50 p-3 border border-slate-850/60 text-xs">
            <h4 className="font-bold text-white">{PRESETS[taskType].name}</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">{PRESETS[taskType].desc}</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-350">1. Chi phí API của mô hình AI ($):</span>
              <span className="text-violet-300 font-mono">${apiCost.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="5.0"
              step="0.05"
              value={apiCost}
              onChange={(e) => setApiCost(Number(e.target.value))}
              className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>Rất rẻ (Gemini Flash: $0.01)</span>
              <span>Model lớn (GPT-4/Claude 3.5: $5.00)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-350">2. Số giờ tự làm được AI tiết kiệm (giờ):</span>
              <span className="text-violet-300 font-mono">{hoursSaved} giờ</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={hoursSaved}
              onChange={(e) => setHoursSaved(Number(e.target.value))}
              className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>Task nhỏ (1h)</span>
              <span>Cả ngày làm việc (24h)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-350 mb-1">3. Định giá 1 giờ làm việc của Founder ($):</label>
            <input
              type="number"
              value={founderRate}
              onChange={(e) => setFounderRate(Math.max(1, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
            />
          </div>
        </div>

        {/* Right Outputs */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/60 rounded-xl p-5 border border-slate-850/80">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Giá trị thời gian tiết kiệm được</span>
              <p className="text-2xl font-black text-white font-mono mt-1">${results.valueSaved}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Lợi nhuận ròng thu hồi</span>
              <p className="text-2xl font-black text-violet-300 font-mono mt-1">${results.netSavings.toFixed(2)}</p>
            </div>

            <div className="border-t border-slate-900 pt-3">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Hệ số hoàn vốn đầu tư AI (ROI)</span>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-5 h-5 text-yellow-400 animate-bounce" />
                <span className="text-3xl font-black text-yellow-300 font-mono">{Math.round(results.roi)}x</span>
              </div>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold leading-relaxed">
                Đồng nghĩa chi 1 USD cho AI mang lại hiệu suất tương đương {Math.round(results.roi)} USD làm thủ công.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-violet-400/90 border border-violet-500/10 bg-violet-500/5 p-2 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Đồng hành R&D tinh gọn chi phí cho Startup.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
