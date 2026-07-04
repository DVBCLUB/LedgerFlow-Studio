import React, { useMemo, useState } from 'react';
import { addGameSession } from '../../utils/gameSessionHistory';

type Scenario = {
  id: string;
  industry: string;
  transaction: string;
  risk: string;
  correctDocs: string[];
  decoys: string[];
  explanation: string;
};

type SavedRun = {
  id: string;
  playedAt: string;
  scenarioId: string;
  score: number;
  selectedDocs: string[];
  verdict: string;
};

const STORAGE_KEY = 'ledgerflow-document-matching-game-v1';

const scenarios: Scenario[] = [
  {
    id: 'trade-inventory-cutoff',
    industry: 'Thương mại',
    transaction: 'Nhập hàng cuối tháng nhưng hóa đơn về đầu tháng sau.',
    risk: 'Sai kỳ hàng tồn kho, công nợ và giá vốn.',
    correctDocs: ['Phiếu nhập kho', 'Biên bản giao nhận', 'Hợp đồng/đơn đặt hàng', 'Hóa đơn VAT', 'Sổ chi tiết công nợ NCC'],
    decoys: ['Bảng chấm công', 'Bảng phân bổ CCDC', 'Biên bản nghiệm thu nhân công'],
    explanation: 'Cần đối chiếu ngày nhận hàng, quyền sở hữu, hóa đơn và công nợ để xác định ghi nhận đúng kỳ.'
  },
  {
    id: 'manufacturing-wip-cost',
    industry: 'Sản xuất',
    transaction: 'Xuất nguyên vật liệu cho sản xuất nhưng sản phẩm chưa hoàn thành.',
    risk: 'Kết chuyển sai từ NVL sang giá vốn, bỏ sót chi phí dở dang.',
    correctDocs: ['Phiếu xuất kho', 'Lệnh sản xuất', 'Bảng định mức BOM', 'Bảng tập hợp chi phí sản xuất', 'Biên bản kiểm kê WIP'],
    decoys: ['Phiếu thu tiền mặt', 'Hợp đồng thuê văn phòng', 'Báo giá marketing'],
    explanation: 'Phải nối chứng từ kho, định mức, lệnh sản xuất và WIP để tránh ghi nhận giá vốn khi chưa đủ điều kiện.'
  },
  {
    id: 'service-revenue-cutoff',
    industry: 'Dịch vụ',
    transaction: 'Thu tiền trước 6 tháng dịch vụ nhưng ghi nhận toàn bộ vào doanh thu tháng này.',
    risk: 'Doanh thu sai kỳ, nghĩa vụ thực hiện chưa hoàn thành.',
    correctDocs: ['Hợp đồng dịch vụ', 'Phụ lục thời hạn cung cấp', 'Biên bản nghiệm thu từng kỳ', 'Hóa đơn VAT', 'Bảng phân bổ doanh thu chưa thực hiện'],
    decoys: ['Phiếu xuất vật tư', 'Biên bản kiểm kê kho', 'Bảng tính giá thành sản xuất'],
    explanation: 'Doanh thu dịch vụ cần bám thời gian cung cấp/nghiệm thu, không chỉ bám thời điểm thu tiền hoặc xuất hóa đơn.'
  },
  {
    id: 'construction-advance-settlement',
    industry: 'Xây dựng / Dự án',
    transaction: 'Tạm ứng cho đội thi công nhiều khoản nhưng hoàn ứng thiếu hóa đơn/chứng từ.',
    risk: 'Tạm ứng treo lâu, chi phí không đủ hồ sơ, rủi ro thuế và kiểm soát nội bộ.',
    correctDocs: ['Đề nghị tạm ứng', 'Phiếu chi/UNC', 'Bảng kê hoàn ứng', 'Hóa đơn/chứng từ kèm theo', 'Biên bản nghiệm thu/khối lượng'],
    decoys: ['Bảng phân tích khách hàng churn', 'Email marketing campaign', 'License key phần mềm'],
    explanation: 'Hoàn ứng phải nối được mục đích tạm ứng, chứng từ chi, nghiệm thu/khối lượng và hóa đơn hợp lệ.'
  },
  {
    id: 'founder-tool-subscription',
    industry: 'Founder / SaaS',
    transaction: 'Mua nhiều tool AI/hosting nhưng không review hằng tháng.',
    risk: 'Burn rate phình, runway giảm, không biết tool nào tạo giá trị thật.',
    correctDocs: ['Hóa đơn/subscription receipt', 'Tool Budget Ledger', 'Usage log', 'Cancel plan', 'Monthly Founder Review'],
    decoys: ['Phiếu nhập kho vật tư', 'Biên bản nghiệm thu xây dựng', 'Bảng tính WIP nhà máy'],
    explanation: 'Tool subscription cần chứng minh mục đích, mức dùng, chi phí và quyết định keep/review/cancel để bảo vệ runway.'
  }
];

const readRuns = (): SavedRun[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveRuns = (runs: SavedRun[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));

const scoreScenario = (scenario: Scenario, selectedDocs: string[]) => {
  const correctSelected = selectedDocs.filter((doc) => scenario.correctDocs.includes(doc)).length;
  const missed = scenario.correctDocs.filter((doc) => !selectedDocs.includes(doc)).length;
  const wrongSelected = selectedDocs.filter((doc) => scenario.decoys.includes(doc)).length;
  const raw = correctSelected * 20 - missed * 8 - wrongSelected * 12;
  const score = Math.max(0, Math.min(100, raw));
  const verdict = score >= 80 ? 'PASS - ghép chứng từ tốt' : score >= 55 ? 'REVIEW - còn thiếu chứng từ quan trọng' : 'FAIL - cần học lại luồng chứng từ';
  return { score, verdict, correctSelected, missed, wrongSelected };
};

export default function DocumentMatchingGame() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [runs, setRuns] = useState<SavedRun[]>(readRuns);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0];
  const allDocs = useMemo(() => [...scenario.correctDocs, ...scenario.decoys].sort(), [scenario]);
  const result = scoreScenario(scenario, selectedDocs);
  const avgScore = runs.length ? Math.round(runs.reduce((sum, run) => sum + run.score, 0) / runs.length) : 0;
  const bestScore = runs.length ? Math.max(...runs.map((run) => run.score)) : 0;

  const toggleDoc = (doc: string) => {
    setSubmitted(false);
    setMessage('');
    setSelectedDocs((current) => current.includes(doc) ? current.filter((item) => item !== doc) : [...current, doc]);
  };

  const submit = () => {
    const nextRun: SavedRun = {
      id: `${Date.now()}`,
      playedAt: new Date().toISOString(),
      scenarioId: scenario.id,
      score: result.score,
      selectedDocs,
      verdict: result.verdict
    };
    const next = [nextRun, ...runs].slice(0, 25);
    setRuns(next);
    saveRuns(next);
    addGameSession({
      gameId: 'document-matching-game',
      gameLabel: 'Document Matching Game',
      score: result.score,
      verdict: result.verdict,
      note: `${scenario.industry} • ${scenario.transaction} • đúng ${result.correctSelected}, bỏ sót ${result.missed}, chọn sai ${result.wrongSelected}`
    });
    setSubmitted(true);
    setMessage('Đã lưu lượt chơi vào Game History.');
  };

  const reset = () => {
    setSelectedDocs([]);
    setSubmitted(false);
    setMessage('');
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Document Matching Game</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Ghép chứng từ với nghiệp vụ/rủi ro</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Chọn chứng từ cần kiểm tra cho từng nghiệp vụ. Game giúp học tư duy kiểm toán: không nhìn một chứng từ đơn lẻ, mà phải nối đủ chuỗi chứng từ để chứng minh nghiệp vụ.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Lượt chơi</p><p className="mt-2 text-3xl font-black text-text-primary">{runs.length}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Điểm TB</p><p className="mt-2 text-3xl font-black text-emerald-300">{avgScore}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Best score</p><p className="mt-2 text-3xl font-black text-cyan-300">{bestScore}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Current</p><p className="mt-2 text-3xl font-black text-amber-300">{result.score}</p></div>
      </div>

      <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
        <label className="text-[10px] font-black uppercase text-text-tertiary">Chọn case</label>
        <select value={scenarioId} onChange={(event) => { setScenarioId(event.target.value); setSelectedDocs([]); setSubmitted(false); setMessage(''); }} className="mt-2 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary">
          {scenarios.map((item) => <option key={item.id} value={item.id}>{item.industry} - {item.transaction}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
          <p className="text-[10px] font-black uppercase text-emerald-300">{scenario.industry}</p>
          <h3 className="mt-2 text-lg font-black text-text-primary">{scenario.transaction}</h3>
          <p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold leading-6 text-rose-100">Rủi ro: {scenario.risk}</p>
          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-semibold leading-6 text-cyan-100">
            Mục tiêu: chọn đủ chứng từ đúng, tránh chọn chứng từ nhiễu. Sau khi nộp bài, game sẽ hiện chứng từ bị bỏ sót và giải thích.
          </div>
        </div>

        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
          <h3 className="text-sm font-black text-text-primary">Chọn chứng từ cần kiểm tra</h3>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {allDocs.map((doc) => (
              <button key={doc} onClick={() => toggleDoc(doc)} className={`rounded-xl border p-3 text-left text-xs font-bold leading-5 transition ${selectedDocs.includes(doc) ? 'border-emerald-400 bg-emerald-500/15 text-text-primary' : 'border-border-primary bg-slate-950 text-text-secondary hover:border-emerald-500/40'}`}>
                {doc}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={submit} className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Nộp bài & lưu lịch sử</button>
            <button onClick={reset} className="rounded-xl border border-border-secondary px-4 py-3 text-xs font-black text-text-secondary hover:border-cyan-400">Làm lại</button>
          </div>
          {message && <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-100">{message}</p>}
        </div>
      </div>

      {submitted && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
          <p className="text-[10px] font-black uppercase text-emerald-300">Kết quả</p>
          <h3 className="mt-2 text-2xl font-black text-text-primary">{result.score}/100 - {result.verdict}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Đúng</p><p className="mt-2 text-3xl font-black text-emerald-300">{result.correctSelected}</p></div>
            <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Bỏ sót</p><p className="mt-2 text-3xl font-black text-amber-300">{result.missed}</p></div>
            <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Chọn sai</p><p className="mt-2 text-3xl font-black text-rose-300">{result.wrongSelected}</p></div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4">
              <h4 className="text-xs font-black uppercase text-emerald-300">Chứng từ đúng phải kiểm tra</h4>
              <ul className="mt-3 space-y-2 text-xs font-semibold text-text-secondary">
                {scenario.correctDocs.map((doc) => <li key={doc}>• {doc}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4">
              <h4 className="text-xs font-black uppercase text-cyan-300">Giải thích</h4>
              <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{scenario.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
