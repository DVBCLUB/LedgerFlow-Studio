import React, { useState, useMemo } from 'react';
import { ShieldAlert, Zap, BatteryCharging, Heart, CheckCircle2 } from 'lucide-react';

export default function FounderBurnoutMonitor() {
  const [sleep, setSleep] = useState<number>(7);
  const [meetings, setMeetings] = useState<number>(10);
  const [decisions, setDecisions] = useState<number>(3);
  const [deepWork, setDeepWork] = useState<number>(15);

  const stats = useMemo(() => {
    // Burnout index calculation:
    // meetings * 2.5 + decisions * 6 - sleep * 6 - deepWork * 1.5 + 50
    const rawBurnout = Math.round(meetings * 2.5 + decisions * 6.5 - sleep * 7.5 - deepWork * 1.2 + 65);
    const burnoutScore = Math.min(100, Math.max(0, rawBurnout));

    // Survival Probability: 100 - burnout * 0.7 - (if deepWork < 8 then penalty else bonus)
    const deepWorkPenalty = deepWork < 8 ? (8 - deepWork) * 4 : 0;
    const rawSurvival = 100 - burnoutScore * 0.6 - deepWorkPenalty + (sleep >= 7 ? 10 : 0);
    const survivalProbability = Math.min(100, Math.max(5, Math.round(rawSurvival)));

    let status = 'Tuyệt vời';
    let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let progressColor = 'bg-emerald-400';
    let advisory = 'Mức độ cân bằng hoàn hảo. Bạn đang duy trì phong độ tối đa để phát triển sản phẩm dài hạn.';

    if (burnoutScore > 75) {
      status = 'Báo động đỏ (Nguy hiểm)';
      colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      progressColor = 'bg-rose-500';
      advisory = 'Bạn đang chạm ngưỡng kiệt sức cực kỳ cao! Hãy cắt giảm tối đa các cuộc họp không cần thiết, chuyển bớt việc cho AI và đi ngủ đủ giấc ngay lập tức.';
    } else if (burnoutScore > 50) {
      status = 'Cảnh báo (Mất cân bằng)';
      colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      progressColor = 'bg-amber-500';
      advisory = 'Cơ thể đang có dấu hiệu quá tải. Hãy dành ra ít nhất 1 ngày làm việc tập trung sâu (No-meeting day) để nạp lại năng lượng.';
    } else if (burnoutScore > 25) {
      status = 'Ổn định';
      colorClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      progressColor = 'bg-indigo-400';
      advisory = 'Mọi thứ trong tầm kiểm soát. Hãy cố gắng duy trì thói quen ngủ chất lượng và dành thời gian cho cuộc sống cá nhân.';
    }

    return { burnoutScore, survivalProbability, status, colorClass, progressColor, advisory };
  }, [sleep, meetings, decisions, deepWork]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/25 rounded-xl">
          <Heart className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Founder Energy & Burnout Monitor</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Giả lập mức độ kiệt sức sinh học và xác suất sống sót của dự án trong tuần.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Sliders */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-350">1. Giờ ngủ mỗi đêm:</span>
              <span className="text-purple-300 font-mono">{sleep} giờ</span>
            </div>
            <input
              type="range"
              min="4"
              max="9"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>Thiếu ngủ trầm trọng (4h)</span>
              <span>Lý tưởng (8h)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-350">2. Số giờ họp / trao đổi tuần:</span>
              <span className="text-purple-300 font-mono">{meetings} giờ</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={meetings}
              onChange={(e) => setMeetings(Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>Họp tối giản (0h)</span>
              <span>Họp tràn lan (40h)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-350">3. Quyết định lớn cần chốt/ngày:</span>
              <span className="text-purple-300 font-mono">{decisions} quyết định</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={decisions}
              onChange={(e) => setDecisions(Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>Thư giãn (0)</span>
              <span>Quá tải quyết định (10)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-350">4. Giờ làm việc sâu / Code tuần:</span>
              <span className="text-purple-300 font-mono">{deepWork} giờ</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={deepWork}
              onChange={(e) => setDeepWork(Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>Bỏ bê sản phẩm (0h)</span>
              <span>Code tập trung cao (40h)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Results */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/60 rounded-xl p-5 border border-slate-850/80">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Chỉ số kiệt sức (Burnout Score)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white font-mono">{stats.burnoutScore}%</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${stats.colorClass}`}>
                  {stats.status}
                </span>
              </div>
              <div className="mt-2 h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                <div className={`h-full ${stats.progressColor} transition-all duration-300`} style={{ width: `${stats.burnoutScore}%` }} />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Xác suất dự án sống sót tuần này</span>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-5 h-5 text-yellow-400 animate-bounce" />
                <span className="text-2xl font-black text-yellow-300 font-mono">{stats.survivalProbability}%</span>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Lời khuyên của chuyên gia:</span>
              <p className="text-xs font-semibold leading-relaxed text-slate-350 mt-1">{stats.advisory}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-400/90 border border-emerald-500/10 bg-emerald-500/5 p-2 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Mô phỏng sức khỏe offline, giúp founder tự điều chỉnh nhịp sinh hoạt.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
