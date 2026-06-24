import React, { useMemo, useState } from 'react';
import { MULTI_INDUSTRY_CASE_BANK } from '../../data/multiIndustryCaseBank';
import { addGameSession } from '../../utils/gameSessionHistory';

type GameResult = {
  score: number;
  correctFlags: number;
  missedFlags: string[];
  extraFlags: string[];
  documentHits: number;
  verdict: string;
};

const STORAGE_KEY = 'ledgerflow-audit-red-flag-game-v1';

const distractorFlags = [
  'thiếu chữ ký nội bộ nhưng không ảnh hưởng trọng yếu',
  'hình thức chứng từ chưa đẹp',
  'mô tả nghiệp vụ quá ngắn nhưng đã có đủ căn cứ khác',
  'nhà cung cấp đổi mẫu hóa đơn',
  'file scan hơi mờ nhưng còn đọc được thông tin chính',
  'ngày lập phiếu trùng cuối tuần nhưng có xác nhận bổ sung'
];

const documentDistractors = [
  'Logo công ty',
  'Brochure bán hàng',
  'Ảnh văn phòng',
  'Tin nhắn trao đổi không liên quan',
  'Bảng chấm công phòng khác',
  'Phiếu gửi xe'
];

const makeOptions = (correct: string[], pool: string[], limit = 7) => {
  const merged = [...correct, ...pool.filter((item) => !correct.includes(item))].slice(0, limit);
  return merged.sort((a, b) => a.localeCompare(b));
};

const readSnapshots = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function AuditRedFlagGame() {
  const [caseIndex, setCaseIndex] = useState(0);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const activeCase = MULTI_INDUSTRY_CASE_BANK[caseIndex];

  const flagOptions = useMemo(() => makeOptions(activeCase.redFlags, distractorFlags, 8), [activeCase.id]);
  const docOptions = useMemo(() => makeOptions(activeCase.documents, documentDistractors, 8), [activeCase.id]);

  const result: GameResult = useMemo(() => {
    const correctFlags = selectedFlags.filter((flag) => activeCase.redFlags.includes(flag)).length;
    const missedFlags = activeCase.redFlags.filter((flag) => !selectedFlags.includes(flag));
    const extraFlags = selectedFlags.filter((flag) => !activeCase.redFlags.includes(flag));
    const documentHits = selectedDocs.filter((doc) => activeCase.documents.includes(doc)).length;
    const flagScore = correctFlags * 18 - extraFlags.length * 8 - missedFlags.length * 10;
    const docScore = documentHits * 8 - selectedDocs.filter((doc) => !activeCase.documents.includes(doc)).length * 4;
    const riskBonus = activeCase.riskLevel === 'High' && missedFlags.length === 0 ? 10 : 0;
    const score = Math.max(0, Math.min(100, Math.round(flagScore + docScore + riskBonus)));
    const verdict = score >= 80 ? 'PASS - kiểm toán viên phát hiện tốt' : score >= 55 ? 'REVIEW - còn bỏ sót rủi ro' : 'FAIL - cần học lại case';
    return { score, correctFlags, missedFlags, extraFlags, documentHits, verdict };
  }, [activeCase, selectedFlags, selectedDocs]);

  const toggle = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const saveSession = () => {
    const playedAt = new Date().toISOString();
    const snapshot = {
      id: `${activeCase.id}-${playedAt}`,
      caseId: activeCase.id,
      caseTitle: activeCase.title,
      industry: activeCase.industry,
      riskLevel: activeCase.riskLevel,
      score: result.score,
      verdict: result.verdict,
      correctFlags: result.correctFlags,
      missedFlags: result.missedFlags.length,
      extraFlags: result.extraFlags.length,
      documentHits: result.documentHits,
      playedAt
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([snapshot, ...readSnapshots()].slice(0, 50)));
    addGameSession({
      gameId: 'audit-red-flag-game',
      gameLabel: 'Audit Red Flag Game',
      score: result.score,
      verdict: result.verdict,
      note: `${activeCase.industry} • ${activeCase.title} • đúng red flag ${result.correctFlags}/${activeCase.redFlags.length} • đúng chứng từ ${result.documentHits}/${activeCase.documents.length}`,
      playedAt
    });
    setMessage('Đã lưu lượt chơi vào Game History.');
  };

  const submit = () => {
    setSubmitted(true);
    saveSession();
  };

  const nextCase = () => {
    setCaseIndex((value) => (value + 1) % MULTI_INDUSTRY_CASE_BANK.length);
    setSelectedFlags([]);
    setSelectedDocs([]);
    setSubmitted(false);
    setMessage('');
  };

  const resetCase = () => {
    setSelectedFlags([]);
    setSelectedDocs([]);
    setSubmitted(false);
    setMessage('');
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-rose-300">Audit Red Flag Game</p>
        <h2 className="mt-2 text-xl font-black text-white">Game nhận diện rủi ro chứng từ</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Chọn red flags và chứng từ cần kiểm tra trong từng case đa ngành. Điểm cao khi chọn đúng rủi ro trọng yếu, không chọn nhiễu và không bỏ sót chứng từ quan trọng.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase text-cyan-300">{activeCase.industry} • {activeCase.riskLevel} risk</p>
              <h3 className="mt-2 text-lg font-black text-white">{activeCase.title}</h3>
            </div>
            <select value={caseIndex} onChange={(event) => { setCaseIndex(Number(event.target.value)); resetCase(); }} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white">
              {MULTI_INDUSTRY_CASE_BANK.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.industry}</option>)}
            </select>
          </div>
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold leading-7 text-slate-300">{activeCase.scenario}</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <p className="text-[10px] font-black uppercase text-emerald-300">Score</p>
          <p className="mt-2 text-5xl font-black text-white">{submitted ? result.score : '--'}</p>
          <p className="mt-2 text-sm font-black text-emerald-200">{submitted ? result.verdict : 'Chưa nộp bài'}</p>
          <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-300">
            <p>Đúng red flag: {submitted ? result.correctFlags : 0}/{activeCase.redFlags.length}</p>
            <p>Đúng chứng từ: {submitted ? result.documentHits : 0}/{activeCase.documents.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-sm font-black text-white">1. Chọn red flags</h3>
          <div className="mt-4 grid gap-2">
            {flagOptions.map((flag) => (
              <button key={flag} onClick={() => toggle(flag, selectedFlags, setSelectedFlags)} className={`rounded-2xl border p-3 text-left text-xs font-semibold leading-6 transition ${selectedFlags.includes(flag) ? 'border-rose-400 bg-rose-500/10 text-white' : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-rose-500/50'}`}>
                {flag}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-sm font-black text-white">2. Chọn chứng từ cần kiểm tra</h3>
          <div className="mt-4 grid gap-2">
            {docOptions.map((doc) => (
              <button key={doc} onClick={() => toggle(doc, selectedDocs, setSelectedDocs)} className={`rounded-2xl border p-3 text-left text-xs font-semibold leading-6 transition ${selectedDocs.includes(doc) ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-cyan-500/50'}`}>
                {doc}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <button onClick={submit} className="rounded-2xl bg-emerald-400 px-5 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Nộp bài & lưu lịch sử</button>
        <button onClick={resetCase} className="rounded-2xl border border-slate-700 px-5 py-3 text-xs font-black text-slate-300 hover:border-cyan-400">Làm lại case</button>
        <button onClick={nextCase} className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-xs font-black text-rose-100 hover:bg-rose-500/20">Case tiếp theo</button>
      </div>

      {message && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">{message}</div>}

      {submitted && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
            <h3 className="text-sm font-black text-white">Red flags đúng</h3>
            <ul className="mt-3 space-y-2 text-xs font-semibold leading-6 text-rose-100">{activeCase.redFlags.map((flag) => <li key={flag}>• {flag}</li>)}</ul>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <h3 className="text-sm font-black text-white">Câu hỏi kiểm toán</h3>
            <ul className="mt-3 space-y-2 text-xs font-semibold leading-6 text-cyan-100">{activeCase.auditQuestions.map((question) => <li key={question}>• {question}</li>)}</ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="text-sm font-black text-white">Bài học & next action</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-emerald-100">{activeCase.learningOutcome}</p>
            <p className="mt-3 rounded-xl border border-emerald-500/20 bg-slate-950/60 p-3 text-xs font-semibold leading-6 text-slate-300">{activeCase.nextAction}</p>
          </div>
        </div>
      )}
    </section>
  );
}
