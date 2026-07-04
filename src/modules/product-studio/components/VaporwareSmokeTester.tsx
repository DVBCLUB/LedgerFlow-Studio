import React, { useState, useMemo } from 'react';
import { Layers, ArrowRight, Play, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function VaporwareSmokeTester() {
  const [traffic, setTraffic] = useState<number>(300);
  const [signups, setSignups] = useState<number>(45);
  const [budget, setBudget] = useState<number>(500000);

  const results = useMemo(() => {
    const conversionRate = traffic > 0 ? (signups / traffic) * 100 : 0;
    const cpl = signups > 0 ? Math.round(budget / signups) : budget;

    let verdict = 'DỪNG LẠI (NO-GO)';
    let verdictColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    let comment = 'Tỷ lệ quan tâm quá thấp. Hãy thay đổi thông điệp cốt lõi hoặc đổi hẳn sang ý tưởng khác để tránh mất thời gian lập trình vô ích.';

    if (conversionRate >= 15) {
      verdict = 'TIẾN HÀNH BUILD MVP (GO)';
      verdictColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      comment = 'Tín hiệu thị trường cực tốt! Bạn đã chứng minh tệp khách hàng có nỗi đau lớn sẵn sàng đăng ký ảo. Bắt đầu thiết lập sprint lập trình đầu tiên.';
    } else if (conversionRate >= 8) {
      verdict = 'ĐIỀU CHỈNH THÊM (HOLD)';
      verdictColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      comment = 'Tốc độ quan tâm tạm ổn nhưng chưa đột phá. Hãy thử nghiệm tiêu đề/hình ảnh khác (A/B testing) hoặc phỏng vấn thêm 3-5 khách hàng.';
    }

    return { conversionRate, cpl, verdict, verdictColor, comment };
  }, [traffic, signups, budget]);

  return (
    <div className="rounded-2xl border border-border-primary bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-border-primary pb-4 mb-5">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-xl">
          <Layers className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Vaporware / Smoke Test Designer</h3>
          <p className="text-[11px] text-text-secondary font-semibold leading-relaxed">Đo lường mức độ quan tâm của thị trường trước khi code bằng cách giả lập phễu đăng ký trước.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Sliders */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-350 mb-1.5">1. Tổng lượt truy cập trang ảo (Traffic):</label>
            <input
              type="number"
              value={traffic}
              onChange={(e) => setTraffic(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-sm text-text-primary focus:outline-none focus:border-emerald-500 font-semibold"
            />
            <span className="text-[9px] text-text-tertiary mt-1 block">Lượng view kéo từ bài đăng organic hoặc quảng cáo.</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-350">2. Số người bấm "Đăng ký" / "Pre-order":</span>
              <span className="text-emerald-400 font-mono">{signups} leads</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(100, traffic)}
              value={signups}
              onChange={(e) => setSignups(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-bg-surface rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-350 mb-1.5">3. Ngân sách chạy test (VNĐ):</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-sm text-text-primary focus:outline-none focus:border-emerald-500 font-semibold"
            />
            <span className="text-[9px] text-text-tertiary mt-1 block">Chi phí chạy ads Facebook/Google hoặc đăng bài trả phí.</span>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/60 rounded-xl p-5 border border-slate-850/80">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider block">Tỷ lệ chuyển đổi ảo</span>
              <p className="text-3xl font-black text-text-primary font-mono mt-1">{results.conversionRate.toFixed(1)}%</p>
            </div>

            <div>
              <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider block">Chi phí / 1 Lead thô (CPL)</span>
              <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                {new Intl.NumberFormat('vi-VN').format(results.cpl)}đ
              </p>
            </div>

            <div className="border-t border-slate-900 pt-3 text-left">
              <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider block">Kết luận đề xuất</span>
              <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded border mt-2 ${results.verdictColor}`}>
                {results.verdict}
              </span>
              <p className="text-xs font-semibold leading-relaxed text-slate-350 mt-2">{results.comment}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-emerald-400/90 border border-emerald-500/10 bg-emerald-500/5 p-2 rounded-lg text-left">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Chống lãng phí chất xám bằng kỹ thuật validate nhanh của giới Startup.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
