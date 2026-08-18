import React, { useState, useMemo } from 'react';
import { Layers, CheckCircle2, ShieldCheck, Sparkles, Bot, Loader2 } from 'lucide-react';
import { ExcelNumberInput } from '../../../components/ui/ExcelNumberInput';
import { formatMoneyVN, formatNumberVN, formatPercentVN } from '../../../utils/excelFormatters';

export default function VaporwareSmokeTester() {
  const [traffic, setTraffic] = useState<number>(300);
  const [signups, setSignups] = useState<number>(45);
  const [budget, setBudget] = useState<number>(500000);
  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

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

  const runAiEvaluation = async () => {
    setLoadingAi(true);
    setAiEvaluation(null);
    try {
      const prompt = `Phân tích thử nghiệm Smoke Test cho sản phẩm mới:
- Traffic thử nghiệm: ${formatNumberVN(traffic, 0)} lượt xem
- Số lead đăng ký ảo: ${formatNumberVN(signups, 0)} lead (${formatPercentVN(results.conversionRate)})
- Ngân sách chạy: ${formatMoneyVN(budget)}
- Chi phí 1 Lead (CPL): ${formatMoneyVN(results.cpl)}
- Đánh giá hiện tại: ${results.verdict}

Hãy đưa ra 3 khuyến nghị ngắn gọn từ AI CPO (OpenAI GPT-4o) về:
1. Đánh giá tính bền vững của CAC vs LTV.
2. Có nên triển khai Sprint Lập trình MVP ngay hay không?
3. Gợi ý 2 kênh phân phối tốt nhất tại Việt Nam.`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          provider: 'openai',
          model: 'gpt-4o',
          systemInstruction: 'Bạn là AI CPO chuyên về Product Validation & Smoke Testing cho SaaS & phần mềm.'
        })
      });

      if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
      const data = await res.json();
      setAiEvaluation(data.text || data.reply || data.response || 'Đã phân tích xong.');
    } catch (err: any) {
      setAiEvaluation(`⚠️ Lỗi AI Gateway: ${err.message || 'Không thể kết nối máy chủ AI'}`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-2xl shadow-lg">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight uppercase">Vaporware / Smoke Test Designer</h3>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                Market Validation
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-0.5">
              Đo lường mức độ quan tâm của thị trường trước khi code bằng cách giả lập phễu đăng ký trước.
            </p>
          </div>
        </div>

        <button
          onClick={runAiEvaluation}
          disabled={loadingAi}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loadingAi ? <Loader2 className="w-4 h-4 animate-spin text-emerald-200" /> : <Bot className="w-4 h-4 text-emerald-200" />}
          <span>{loadingAi ? 'AI CPO Đang Đánh giá...' : '⚡ AI CPO Thẩm định Thị trường'}</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300">1. Tổng lượt truy cập trang ảo (Traffic):</label>
            <input
              type="number"
              value={traffic}
              onChange={(e) => setTraffic(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-400 font-bold"
            />
            <span className="text-[10px] text-slate-400 block">Lượng view kéo từ bài đăng organic hoặc quảng cáo.</span>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">2. Số người bấm "Đăng ký" / "Pre-order":</span>
              <span className="text-emerald-400 font-mono font-black">{formatNumberVN(signups, 0)} leads</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(100, traffic)}
              value={signups}
              onChange={(e) => setSignups(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-300">3. Ngân sách chạy test (VNĐ):</label>
            <ExcelNumberInput
              value={budget}
              onValueChange={(val) => setBudget(val)}
              suffix="đ"
              placeholder="500.000"
            />
            <span className="text-[10px] text-slate-400 block pt-1">Chi phí chạy ads Facebook/Google hoặc đăng bài trả phí.</span>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/90 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Tỷ lệ chuyển đổi ảo</span>
              <p className="text-3xl font-black text-white font-mono mt-1">{formatPercentVN(results.conversionRate)}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Chi phí / 1 Lead thô (CPL)</span>
              <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                {formatMoneyVN(results.cpl)}
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3 text-left">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Kết luận đề xuất</span>
              <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border mt-2 ${results.verdictColor}`}>
                {results.verdict}
              </span>
              <p className="text-xs font-semibold leading-relaxed text-slate-300 mt-2">{results.comment}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400/90 border border-emerald-500/20 bg-emerald-500/10 p-2.5 rounded-xl text-left">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Chống lãng phí chất xám bằng kỹ thuật validate nhanh của giới Startup.</span>
          </div>
        </div>
      </div>

      {/* AI CPO Grounded Response */}
      {aiEvaluation && (
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-slate-950 text-left space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider">Đánh giá Thử nghiệm từ AI CPO (GPT-4o)</h4>
          </div>
          <div className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-wrap pl-6">
            {aiEvaluation}
          </div>
        </div>
      )}
    </div>
  );
}
