import React, { useMemo, useState } from 'react';
import { addGameSession } from '../../utils/gameSessionHistory';

type Scenario = {
  id: string;
  title: string;
  industry: string;
  context: string;
  steps: string[];
  correctFlow: string[];
  explanation: string;
  riskNote: string;
};

type SavedAttempt = {
  id: string;
  scenarioId: string;
  score: number;
  verdict: string;
  submittedAt: string;
};

const STORAGE_KEY = 'ledgerflow-cost-flow-game-v1';

const flowOptions = [
  'Đề nghị mua hàng / hợp đồng / báo giá',
  'Nhận hàng / biên bản giao nhận',
  'Phiếu nhập kho',
  'Hóa đơn VAT / chứng từ thanh toán',
  'Phiếu xuất kho / lệnh xuất dùng',
  'Bảng phân bổ chi phí',
  'Chi phí sản xuất dở dang',
  'Thành phẩm nhập kho',
  'Giá vốn hàng bán',
  'Chi phí công trình / dự án',
  'Biên bản nghiệm thu',
  'Doanh thu / hóa đơn bán ra'
];

const scenarios: Scenario[] = [
  {
    id: 'manufacturing-material-to-cogs',
    title: 'Sản xuất: nguyên vật liệu đi vào giá thành',
    industry: 'Sản xuất',
    context: 'Công ty mua nguyên vật liệu, nhập kho, xuất cho sản xuất, sau đó hoàn thành sản phẩm và bán ra.',
    steps: flowOptions,
    correctFlow: ['Đề nghị mua hàng / hợp đồng / báo giá', 'Nhận hàng / biên bản giao nhận', 'Phiếu nhập kho', 'Hóa đơn VAT / chứng từ thanh toán', 'Phiếu xuất kho / lệnh xuất dùng', 'Chi phí sản xuất dở dang', 'Thành phẩm nhập kho', 'Giá vốn hàng bán'],
    explanation: 'Trong sản xuất, nguyên vật liệu không nhảy thẳng vào giá vốn. Nó đi qua nhập kho, xuất dùng, tập hợp dở dang, hoàn thành thành phẩm rồi mới kết chuyển giá vốn khi bán.',
    riskNote: 'Rủi ro thường gặp: bỏ qua dở dang, ghi thẳng vào chi phí kỳ này, hoặc chưa có phiếu xuất kho nhưng đã tính giá thành.'
  },
  {
    id: 'construction-material-to-project',
    title: 'Xây dựng / dự án: vật tư vào chi phí công trình',
    industry: 'Xây dựng / Dự án',
    context: 'Đội công trình mua vật tư, nhập/nhận tại công trường, xuất dùng cho hạng mục và nghiệm thu khối lượng.',
    steps: flowOptions,
    correctFlow: ['Đề nghị mua hàng / hợp đồng / báo giá', 'Nhận hàng / biên bản giao nhận', 'Phiếu nhập kho', 'Hóa đơn VAT / chứng từ thanh toán', 'Phiếu xuất kho / lệnh xuất dùng', 'Chi phí công trình / dự án', 'Biên bản nghiệm thu'],
    explanation: 'Với dự án/công trình, trọng tâm là vật tư có đi đúng công trình/hạng mục không, có xuất dùng và nghiệm thu khối lượng tương ứng không.',
    riskNote: 'Rủi ro thường gặp: vật tư mua cho công trình A nhưng hạch toán sang công trình B, thiếu nghiệm thu, hoặc hóa đơn về sau nhưng vật tư đã dùng trước.'
  },
  {
    id: 'trading-inventory-to-cogs',
    title: 'Thương mại: hàng hóa từ nhập kho đến giá vốn',
    industry: 'Thương mại',
    context: 'Công ty thương mại mua hàng để bán lại, nhập kho, bán hàng và ghi nhận giá vốn.',
    steps: flowOptions,
    correctFlow: ['Đề nghị mua hàng / hợp đồng / báo giá', 'Nhận hàng / biên bản giao nhận', 'Phiếu nhập kho', 'Hóa đơn VAT / chứng từ thanh toán', 'Doanh thu / hóa đơn bán ra', 'Giá vốn hàng bán'],
    explanation: 'Thương mại thường không qua sản xuất dở dang/thành phẩm. Khi bán, doanh thu và giá vốn cần được ghi nhận phù hợp cùng kỳ.',
    riskNote: 'Rủi ro thường gặp: đã xuất hóa đơn bán ra nhưng chưa kết chuyển giá vốn, hoặc nhập hàng cuối kỳ chưa có chứng từ nhận hàng.'
  },
  {
    id: 'service-prepaid-cost-allocation',
    title: 'Dịch vụ: chi phí trả trước phân bổ theo kỳ',
    industry: 'Dịch vụ',
    context: 'Công ty mua gói công cụ/phần mềm phục vụ dịch vụ trong 12 tháng, cần phân bổ chi phí theo kỳ thay vì ghi hết một lần.',
    steps: flowOptions,
    correctFlow: ['Đề nghị mua hàng / hợp đồng / báo giá', 'Hóa đơn VAT / chứng từ thanh toán', 'Bảng phân bổ chi phí'],
    explanation: 'Một số chi phí dịch vụ có lợi ích nhiều kỳ nên cần theo dõi và phân bổ hợp lý, không nhất thiết nhập kho/xuất kho.',
    riskNote: 'Rủi ro thường gặp: ghi toàn bộ chi phí vào một tháng làm sai lợi nhuận kỳ, hoặc không có cơ sở phân bổ.'
  }
];

const readAttempts = (): SavedAttempt[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const arraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);

export default function CostFlowGame() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<{ score: number; verdict: string; missing: string[]; wrongOrder: boolean } | null>(null);
  const [attempts, setAttempts] = useState<SavedAttempt[]>(readAttempts);

  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0];

  const summary = useMemo(() => {
    const best = attempts.length ? Math.max(...attempts.map((item) => item.score)) : 0;
    const avg = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length) : 0;
    return { total: attempts.length, best, avg };
  }, [attempts]);

  const toggleStep = (step: string) => {
    setResult(null);
    setSelected((current) => current.includes(step) ? current.filter((item) => item !== step) : [...current, step]);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    setResult(null);
    setSelected((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const submit = () => {
    const missing = scenario.correctFlow.filter((step) => !selected.includes(step));
    const extra = selected.filter((step) => !scenario.correctFlow.includes(step));
    const filteredSelected = selected.filter((step) => scenario.correctFlow.includes(step));
    const wrongOrder = !arraysEqual(filteredSelected, scenario.correctFlow.filter((step) => filteredSelected.includes(step)));
    const correctCount = scenario.correctFlow.filter((step) => selected.includes(step)).length;
    let score = Math.round((correctCount / scenario.correctFlow.length) * 80 - extra.length * 8 - missing.length * 6);
    if (!wrongOrder && missing.length === 0 && extra.length === 0) score += 20;
    if (wrongOrder) score -= 15;
    score = Math.max(0, Math.min(100, score));
    const verdict = score >= 85 ? 'PASS - hiểu đúng luồng chi phí' : score >= 60 ? 'REVIEW - còn thiếu hoặc sai thứ tự' : 'FAIL - cần học lại luồng chứng từ/chi phí';
    const nextResult = { score, verdict, missing, wrongOrder };
    setResult(nextResult);
    const nextAttempts = [{ id: `${Date.now()}`, scenarioId: scenario.id, score, verdict, submittedAt: new Date().toISOString() }, ...attempts].slice(0, 20);
    setAttempts(nextAttempts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAttempts));
    addGameSession({
      gameId: 'cost-flow-game',
      gameLabel: 'Cost Flow Game',
      score,
      verdict,
      note: `${scenario.industry} - ${scenario.title}. Đúng ${correctCount}/${scenario.correctFlow.length}, bỏ sót ${missing.length}, chọn dư ${extra.length}, sai thứ tự: ${wrongOrder ? 'có' : 'không'}.`
    });
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Cost Flow Game</p>
        <h2 className="mt-2 text-xl font-black text-white">Game học luồng chi phí</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Chọn đúng các bước chi phí và sắp xếp đúng thứ tự theo ngành. Mục tiêu là hiểu tiền/chứng từ đi qua đâu trước khi thành giá vốn, chi phí dự án hoặc chi phí phân bổ.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Attempts</p><p className="mt-2 text-3xl font-black text-white">{summary.total}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Best score</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.best}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Average</p><p className="mt-2 text-3xl font-black text-cyan-300">{summary.avg}</p></div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <label className="text-[10px] font-black uppercase text-slate-500">Scenario</label>
        <select value={scenarioId} onChange={(event) => { setScenarioId(event.target.value); setSelected([]); setResult(null); }} className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white">
          {scenarios.map((item) => <option key={item.id} value={item.id}>{item.industry} - {item.title}</option>)}
        </select>
        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs font-black uppercase text-emerald-300">{scenario.industry}</p>
          <h3 className="mt-1 text-lg font-black text-white">{scenario.title}</h3>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">{scenario.context}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-sm font-black text-white">1. Chọn các bước có trong luồng</h3>
          <div className="mt-4 grid gap-2">
            {scenario.steps.map((step) => (
              <button key={step} onClick={() => toggleStep(step)} className={`rounded-xl border p-3 text-left text-xs font-bold transition ${selected.includes(step) ? 'border-emerald-400 bg-emerald-500/10 text-emerald-100' : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-emerald-500/50'}`}>
                {step}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-sm font-black text-white">2. Sắp xếp thứ tự bạn chọn</h3>
          <div className="mt-4 space-y-2">
            {selected.length === 0 && <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-semibold text-slate-500">Chưa chọn bước nào.</p>}
            {selected.map((step, index) => (
              <div key={step} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-xs font-black text-emerald-300">{index + 1}</span>
                <span className="text-xs font-bold text-slate-200">{step}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveStep(index, -1)} className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-black text-slate-300">↑</button>
                  <button onClick={() => moveStep(index, 1)} className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-black text-slate-300">↓</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={submit} className="mt-4 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Nộp bài & lưu lịch sử</button>
        </div>
      </div>

      {result && (
        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <p className="text-[10px] font-black uppercase text-cyan-300">Result</p>
          <h3 className="mt-2 text-2xl font-black text-white">{result.score}/100 - {result.verdict}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-black text-white">Giải thích</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{scenario.explanation}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs font-black text-amber-200">Rủi ro cần nhớ</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-amber-100">{scenario.riskNote}</p>
            </div>
          </div>
          {result.missing.length > 0 && <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-100">Bỏ sót: {result.missing.join(' → ')}</p>}
          {result.wrongOrder && <p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-100">Bạn chọn đúng một số bước nhưng thứ tự chưa hợp lý.</p>}
        </div>
      )}
    </section>
  );
}
