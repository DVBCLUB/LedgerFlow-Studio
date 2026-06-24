import React, { useMemo, useState } from 'react';
import { addGameSession } from '../../utils/gameSessionHistory';

type Decision = 'BUILD' | 'HOLD' | 'KILL';

type Scenario = {
  persona: string;
  painScore: number;
  paySignal: number;
  evidenceScore: number;
  distributionScore: number;
  buildCost: number;
  decision: Decision;
  notes: string;
};

const STORAGE_KEY = 'ledgerflow-pmf-decision-game-v1';

const defaultScenario: Scenario = {
  persona: 'Kế toán công ty nhỏ cần học kiểm tra chứng từ bằng case mô phỏng',
  painScore: 7,
  paySignal: 6,
  evidenceScore: 5,
  distributionScore: 5,
  buildCost: 4,
  decision: 'HOLD',
  notes: 'Có pain rõ nhưng cần thêm bằng chứng trả tiền trước khi build lớn.'
};

const readScenario = (): Scenario => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultScenario, ...JSON.parse(raw) } : defaultScenario;
  } catch {
    return defaultScenario;
  }
};

const saveScenario = (scenario: Scenario) => localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));

export default function PMFDecisionGame() {
  const [scenario, setScenario] = useState<Scenario>(readScenario);
  const [submitted, setSubmitted] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const result = useMemo(() => {
    const rawScore = scenario.painScore * 22 + scenario.paySignal * 24 + scenario.evidenceScore * 20 + scenario.distributionScore * 16 - scenario.buildCost * 14;
    const pmfScore = Math.max(0, Math.min(100, Math.round(rawScore / 10)));
    const idealDecision: Decision = pmfScore >= 70 && scenario.paySignal >= 6 && scenario.evidenceScore >= 5 ? 'BUILD' : pmfScore >= 45 ? 'HOLD' : 'KILL';
    const decisionBonus = scenario.decision === idealDecision ? 20 : scenario.decision === 'BUILD' && idealDecision === 'KILL' ? -30 : scenario.decision === 'BUILD' && scenario.buildCost >= 7 ? -18 : -10;
    const founderScore = Math.max(0, Math.min(100, pmfScore + decisionBonus));
    const verdict = founderScore >= 75 ? 'GOOD FOUNDER DECISION' : founderScore >= 50 ? 'REVIEW SIGNALS BEFORE BUILD' : 'BAD DECISION - RISK OF WASTING TIME/MONEY';
    const advice = idealDecision === 'BUILD'
      ? 'Có đủ tín hiệu để làm demo/MVP nhỏ, nhưng vẫn giữ scope hẹp.'
      : idealDecision === 'HOLD'
        ? 'Chưa đủ chắc để build lớn. Hãy phỏng vấn thêm, bán pilot hoặc test landing/demo.'
        : 'Tín hiệu yếu. Nên kill, đổi persona hoặc đổi problem trước khi tốn công build.';
    return { pmfScore, idealDecision, decisionBonus, founderScore, verdict, advice };
  }, [scenario]);

  const update = <K extends keyof Scenario>(key: K, value: Scenario[K]) => {
    const next = { ...scenario, [key]: value };
    setScenario(next);
    saveScenario(next);
    setSavedMessage('');
  };

  const reset = () => {
    setScenario(defaultScenario);
    saveScenario(defaultScenario);
    setSubmitted(false);
    setSavedMessage('');
  };

  const saveSession = () => {
    addGameSession({
      gameId: 'pmf-decision-game',
      gameLabel: 'PMF Decision Game',
      score: result.founderScore,
      verdict: result.verdict,
      note: `${scenario.decision} cho ${scenario.persona.slice(0, 90)} • PMF ${result.pmfScore}/100 • Ideal ${result.idealDecision}`
    });
    setSavedMessage('Đã lưu lượt chơi vào Game History.');
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">PMF Decision Game</p>
        <h2 className="mt-2 text-xl font-black text-white">Game quyết định Product-Market Fit</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Chấm tín hiệu pain, khả năng trả tiền, bằng chứng, kênh phân phối và chi phí build. Mục tiêu là học cách không build quá sớm khi chưa có paid signal.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <label className="block text-[10px] font-black uppercase text-slate-500">Persona / Problem
            <textarea value={scenario.persona} onChange={(event) => update('persona', event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm normal-case text-slate-200" />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            {([
              ['painScore', 'Pain score'],
              ['paySignal', 'Pay signal'],
              ['evidenceScore', 'Evidence score'],
              ['distributionScore', 'Distribution score'],
              ['buildCost', 'Build cost/risk']
            ] as Array<[keyof Scenario, string]>).map(([key, label]) => (
              <label key={String(key)} className="text-[10px] font-black uppercase text-slate-500">{label}: {scenario[key] as number}/10
                <input type="range" min="0" max="10" value={scenario[key] as number} onChange={(event) => update(key, Number(event.target.value) as never)} className="mt-2 w-full" />
              </label>
            ))}
          </div>

          <label className="block text-[10px] font-black uppercase text-slate-500">Founder decision
            <select value={scenario.decision} onChange={(event) => update('decision', event.target.value as Decision)} className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold text-white">
              <option>BUILD</option>
              <option>HOLD</option>
              <option>KILL</option>
            </select>
          </label>

          <label className="block text-[10px] font-black uppercase text-slate-500">Notes
            <textarea value={scenario.notes} onChange={(event) => update('notes', event.target.value)} className="mt-2 min-h-20 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm normal-case text-slate-200" />
          </label>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => { setSubmitted(true); setSavedMessage(''); }} className="rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Chấm quyết định</button>
            <button onClick={reset} className="rounded-2xl border border-slate-700 px-4 py-3 text-xs font-black text-slate-300 hover:border-emerald-400">Reset demo</button>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-300">PMF score</p>
            <p className="mt-2 text-4xl font-black text-white">{result.pmfScore}/100</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-[10px] font-black uppercase text-slate-500">Ideal decision</p>
            <p className="mt-2 text-2xl font-black text-amber-300">{result.idealDecision}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-[10px] font-black uppercase text-slate-500">Founder score</p>
            <p className="mt-2 text-2xl font-black text-white">{submitted ? result.founderScore : '—'}</p>
          </div>
          {submitted && (
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <p className="text-xs font-black text-cyan-200">{result.verdict}</p>
              <p className="mt-3 text-xs font-semibold leading-6 text-slate-200">{result.advice}</p>
              <p className="mt-3 text-[11px] font-semibold text-slate-400">Decision bonus/penalty: {result.decisionBonus}</p>
              <button onClick={saveSession} className="mt-4 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-xs font-black text-cyan-100 hover:bg-cyan-400/20">Lưu lượt chơi</button>
              {savedMessage && <p className="mt-3 text-xs font-bold text-emerald-200">{savedMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
