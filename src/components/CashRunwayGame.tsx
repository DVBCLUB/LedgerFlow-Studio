import React, { useMemo, useState } from 'react';

type Decision = 'Cut tools' | 'Raise price' | 'Find paid pilot' | 'Build more features' | 'Pause launch';

type Scenario = {
  id: string;
  name: string;
  cash: number;
  monthlyBurn: number;
  mrr: number;
  churnRate: number;
  toolCost: number;
  decision: Decision;
};

const STORAGE_KEY = 'ledgerflow-cash-runway-game-v1';

const defaultScenarios: Scenario[] = [
  { id: 'solo-ai-founder', name: 'Solo founder dùng nhiều AI tool', cash: 12000000, monthlyBurn: 3500000, mrr: 1200000, churnRate: 8, toolCost: 1800000, decision: 'Cut tools' },
  { id: 'paid-pilot', name: 'Có 2 khách pilot nhưng burn tăng', cash: 25000000, monthlyBurn: 7000000, mrr: 5000000, churnRate: 5, toolCost: 2200000, decision: 'Find paid pilot' },
  { id: 'feature-trap', name: 'Muốn build thêm feature khi chưa có paid signal', cash: 9000000, monthlyBurn: 4200000, mrr: 0, churnRate: 0, toolCost: 1500000, decision: 'Pause launch' }
];

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.round(value));

function readScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultScenarios;
    return Array.isArray(parsed) ? parsed : defaultScenarios;
  } catch {
    return defaultScenarios;
  }
}

function calculateGame(scenario: Scenario) {
  const netBurn = Math.max(scenario.monthlyBurn - scenario.mrr, 0);
  const runway = netBurn === 0 ? 99 : scenario.cash / netBurn;
  const toolBurnRatio = scenario.monthlyBurn ? scenario.toolCost / scenario.monthlyBurn : 0;
  const churnRisk = Math.min(40, scenario.churnRate * 3);
  const burnRisk = runway < 3 ? 35 : runway < 6 ? 20 : 5;
  const toolRisk = toolBurnRatio > 0.35 ? 25 : toolBurnRatio > 0.2 ? 15 : 5;
  const decisionBonus: Record<Decision, number> = {
    'Cut tools': toolBurnRatio > 0.25 ? 18 : 5,
    'Raise price': scenario.mrr > 0 && scenario.churnRate < 8 ? 15 : 4,
    'Find paid pilot': scenario.mrr < scenario.monthlyBurn ? 18 : 8,
    'Build more features': runway >= 9 && scenario.mrr > 0 ? 10 : -20,
    'Pause launch': runway < 4 && scenario.mrr === 0 ? 18 : 3
  };
  const survivalScore = Math.max(0, Math.min(100, Math.round(100 - burnRisk - toolRisk - churnRisk + decisionBonus[scenario.decision])));
  const verdict = survivalScore >= 75 ? 'SAFE - tiếp tục pilot có kiểm soát' : survivalScore >= 50 ? 'WARNING - phải giảm burn hoặc tăng paid signal' : 'DANGER - dừng scope, cứu runway trước';
  return { netBurn, runway, toolBurnRatio, burnRisk, toolRisk, churnRisk, survivalScore, verdict };
}

export default function CashRunwayGame() {
  const [scenarios, setScenarios] = useState<Scenario[]>(readScenarios);
  const [activeId, setActiveId] = useState(scenarios[0]?.id || defaultScenarios[0].id);
  const active = scenarios.find((item) => item.id === activeId) || scenarios[0] || defaultScenarios[0];
  const game = useMemo(() => calculateGame(active), [active]);

  const save = (next: Scenario[]) => {
    setScenarios(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateActive = (patch: Partial<Scenario>) => {
    const next = scenarios.map((item) => item.id === active.id ? { ...item, ...patch } : item);
    save(next);
  };

  const addScenario = () => {
    const next: Scenario = {
      id: `scenario-${Date.now()}`,
      name: 'Kịch bản runway mới',
      cash: 10000000,
      monthlyBurn: 3000000,
      mrr: 1000000,
      churnRate: 5,
      toolCost: 1000000,
      decision: 'Find paid pilot'
    };
    save([next, ...scenarios]);
    setActiveId(next.id);
  };

  const reset = () => {
    save(defaultScenarios);
    setActiveId(defaultScenarios[0].id);
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Cash Runway Game</p>
        <h2 className="mt-2 text-xl font-black text-white">Game quyết định sống còn của solo founder</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Nhập cash, burn, MRR, churn và tool cost. Sau đó chọn quyết định tháng này. Game sẽ chấm runway, rủi ro burn và cảnh báo nếu đang build quá đà khi chưa có paid signal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Runway</p><p className="mt-2 text-3xl font-black text-white">{game.runway >= 99 ? '∞' : game.runway.toFixed(1)} tháng</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Net burn</p><p className="mt-2 text-2xl font-black text-amber-300">{money(game.netBurn)}đ</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Tool burn</p><p className="mt-2 text-3xl font-black text-cyan-300">{Math.round(game.toolBurnRatio * 100)}%</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Survival score</p><p className="mt-2 text-3xl font-black text-emerald-300">{game.survivalScore}/100</p></div>
      </div>

      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
        <p className="text-[10px] font-black uppercase text-emerald-300">Verdict</p>
        <h3 className="mt-2 text-lg font-black text-white">{game.verdict}</h3>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex gap-2">
            <button onClick={addScenario} className="flex-1 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950">Thêm</button>
            <button onClick={reset} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300">Reset</button>
          </div>
          {scenarios.map((scenario) => (
            <button key={scenario.id} onClick={() => setActiveId(scenario.id)} className={`w-full rounded-2xl border p-3 text-left text-xs font-bold ${active.id === scenario.id ? 'border-emerald-400 bg-emerald-500/10 text-white' : 'border-slate-800 bg-slate-950/60 text-slate-300'}`}>
              {scenario.name}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Tên kịch bản<input value={active.name} onChange={(event) => updateActive({ name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
            <label className="text-[10px] font-black uppercase text-slate-500">Quyết định<select value={active.decision} onChange={(event) => updateActive({ decision: event.target.value as Decision })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200"><option>Cut tools</option><option>Raise price</option><option>Find paid pilot</option><option>Build more features</option><option>Pause launch</option></select></label>
            <label className="text-[10px] font-black uppercase text-slate-500">Cash hiện có<input type="number" value={active.cash} onChange={(event) => updateActive({ cash: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
            <label className="text-[10px] font-black uppercase text-slate-500">Monthly burn<input type="number" value={active.monthlyBurn} onChange={(event) => updateActive({ monthlyBurn: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
            <label className="text-[10px] font-black uppercase text-slate-500">MRR<input type="number" value={active.mrr} onChange={(event) => updateActive({ mrr: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
            <label className="text-[10px] font-black uppercase text-slate-500">Tool cost/tháng<input type="number" value={active.toolCost} onChange={(event) => updateActive({ toolCost: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
            <label className="text-[10px] font-black uppercase text-slate-500">Churn %<input type="number" value={active.churnRate} onChange={(event) => updateActive({ churnRate: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-semibold leading-6 text-slate-300">Burn risk: {game.burnRisk}/35<br />Runway dưới 3 tháng là vùng nguy hiểm.</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-semibold leading-6 text-slate-300">Tool risk: {game.toolRisk}/25<br />Tool cost cao hơn 25–35% burn cần cắt ngay.</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-semibold leading-6 text-slate-300">Churn risk: {game.churnRisk}/40<br />Churn cao thì đừng scale marketing vội.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
