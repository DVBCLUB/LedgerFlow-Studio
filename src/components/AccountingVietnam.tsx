import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Briefcase, Calculator, CheckCircle2, Copy, Database, FileText, Layers, Receipt, ShieldCheck, Target, WalletCards } from 'lucide-react';
import AccountingVietnamDeepDivePanel from './AccountingVietnamDeepDivePanel';
import {
  ACCOUNTING_CONTROL_KPIS,
  ADVANCED_CONSTRUCTION_CASES,
  AI_AGENT_STAFF_MATRIX,
  COMMERCIALIZATION_ROADMAP,
  COST_TYPE_KNOWLEDGE,
  DATA_AI_CONTROL_FRAMEWORK,
  DOCUMENT_CHECKLIST_RULES,
  FINANCIAL_ACCOUNTING_BLUEPRINT,
  FULLSTACK_DELIVERY_BLUEPRINT,
  GROWTH_BUSINESS_PLAYBOOK,
  IMPROVEMENT_BACKLOG,
  LOW_COST_TOOL_STACK_MATRIX,
  MODULE_KNOWLEDGE_AUDIT,
  OPERATING_RHYTHM_CHECKLIST,
  RESEARCH_EXPERIMENT_TEMPLATES,
  SIMULATION_DATASETS,
  SOLO_FOUNDER_COMPANY_MODULES,
  SOLO_FOUNDER_OPERATING_SYSTEM
} from '../data/deepConstructionAccountingKnowledge';
import {
  AI_AGENT_TASK_TEMPLATES,
  AI_AGENT_WORK_ORDER_BOARD,
  DECISION_LOG_STARTER,
  FOUNDER_DAILY_KPI_DASHBOARD,
  FOUNDER_RISK_REGISTER,
  FOUNDER_SIMULATOR_SCENARIOS,
  OPERATING_SOP_LIBRARY,
  PRODUCT_IDEA_PORTFOLIO,
  PRODUCT_IDEA_SCORE_FACTORS,
  RELEASE_READINESS_CHECKLIST,
  SURVEY_QUESTION_BANK
} from '../data/founderCompanyEnhancements';

type AccountingTab =
  | 'dashboard'
  | 'cases'
  | 'costs'
  | 'docs'
  | 'score'
  | 'deepdive'
  | 'simulator'
  | 'decisions'
  | 'workorders'
  | 'portfolio'
  | 'sop'
  | 'risks'
  | 'promptlab'
  | 'survey'
  | 'coverage'
  | 'casebank'
  | 'blueprint'
  | 'companyos'
  | 'departments'
  | 'agents'
  | 'datasets'
  | 'roadmap'
  | 'tools'
  | 'experiments'
  | 'backlog';

type DecisionLogItem = {
  decision: string;
  reason: string;
  evidence: string;
  nextAction: string;
};

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const storageKey = 'ledgerflow-founder-decision-log-v1';

const SIM_CASES = [
  { title: 'Case mô phỏng 01: Thương mại - hàng về lệch hóa đơn', lesson: 'Người học nhận ra hóa đơn chưa đủ; phải đối chiếu đơn hàng, nhập kho, giao nhận và công nợ.', hint: 'Gợi ý học tập: so sánh số lượng hóa đơn, số lượng kho nhận, giá vốn và công nợ NCC.' },
  { title: 'Case mô phỏng 02: Sản xuất - định mức lệch thực tế', lesson: 'Người học kiểm tra BOM, lệnh sản xuất, NVL xuất dùng, WIP, phế phẩm và giá thành.', hint: 'Gợi ý học tập: phân biệt lệch do kỹ thuật, hao hụt, định mức cũ hoặc kiểm soát kho yếu.' },
  { title: 'Case mô phỏng 03: Dịch vụ - nghiệm thu và doanh thu', lesson: 'Người học xem hợp đồng, timesheet, nghiệm thu và thời điểm ghi nhận doanh thu.', hint: 'Gợi ý học tập: dịch vụ cần bằng chứng đã cung cấp và quyền thu tiền, không chỉ nhìn hóa đơn.' },
  { title: 'Case mô phỏng 04: Xây dựng - tạm ứng quá hạn', lesson: 'Người học xem tuổi tạm ứng, người nhận, mục đích ứng, chứng từ hoàn ứng và mã công trình.', hint: 'Gợi ý học tập: đây là bài kiểm soát dòng tiền và chứng từ, không phải phần mềm hạch toán thay ERP.' }
];

const TAB_LABELS: Array<[AccountingTab, string]> = [
  ['dashboard', 'Founder Dashboard'],
  ['simulator', 'Simulator'],
  ['workorders', 'AI Work Orders'],
  ['portfolio', 'Idea Portfolio'],
  ['sop', 'SOP Library'],
  ['risks', 'Risk & Release'],
  ['decisions', 'Decision Log'],
  ['promptlab', 'Prompt giao việc'],
  ['survey', 'Khảo sát'],
  ['cases', 'Case mô phỏng'],
  ['costs', 'Thẻ chi phí'],
  ['docs', 'Quiz chứng từ'],
  ['score', 'Score lab'],
  ['deepdive', 'VN Deep Dive'],
  ['coverage', 'Rà soát module'],
  ['casebank', 'Case nâng cao'],
  ['blueprint', 'Blueprint triển khai'],
  ['companyos', 'Company OS'],
  ['departments', 'Sơ đồ công ty'],
  ['agents', 'Nhân viên AI'],
  ['datasets', 'Dataset mô phỏng'],
  ['experiments', 'Thí nghiệm R&D'],
  ['roadmap', 'Roadmap bán hàng'],
  ['tools', 'Tool miễn phí/rẻ'],
  ['backlog', 'Backlog cải tiến']
];

const BulletList = ({ items, className = 'text-slate-300' }: { items: string[]; className?: string }) => (
  <>{items.map((x) => <p key={x} className={`text-xs font-semibold leading-6 ${className}`}>• {x}</p>)}</>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 ${className}`}>{children}</div>
);

const NumberInput = ({ label, value, setValue }: { label: string; value: number; setValue: React.Dispatch<React.SetStateAction<number>> }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-black text-slate-400">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(Number(e.target.value) || 0)}
      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400"
    />
  </label>
);

const ideaScore = (idea: { pain: number; mvpCheapness: number; distribution: number; technicalRisk: number }) =>
  Math.round(idea.pain * 3 + idea.mvpCheapness * 2 + idea.distribution * 1.5 - idea.technicalRisk * 1.5);

export default function AccountingVietnam() {
  const [tab, setTab] = useState<AccountingTab>('dashboard');
  const [copied, setCopied] = useState<string | null>(null);
  const [budget, setBudget] = useState(1200000000);
  const [actual, setActual] = useState(735000000);
  const [advance, setAdvance] = useState(180000000);
  const [settled, setSettled] = useState(95000000);

  const [scenarioId, setScenarioId] = useState(FOUNDER_SIMULATOR_SCENARIOS[0].id);
  const [revenue, setRevenue] = useState(25000000);
  const [cost, setCost] = useState(13500000);
  const [opsCost, setOpsCost] = useState(3500000);
  const [pain, setPain] = useState(8);
  const [buyer, setBuyer] = useState(6);
  const [mvpCheap, setMvpCheap] = useState(7);
  const [distribution, setDistribution] = useState(5);
  const [techRisk, setTechRisk] = useState(4);
  const [decisions, setDecisions] = useState<DecisionLogItem[]>(DECISION_LOG_STARTER);
  const [newDecision, setNewDecision] = useState('');

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) setDecisions(JSON.parse(raw));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(decisions));
  }, [decisions]);

  const result = useMemo(() => {
    const budgetUsed = budget ? (actual / budget) * 100 : 0;
    const advanceLeft = advance - settled;
    const advanceSettled = advance ? (settled / advance) * 100 : 0;
    const riskScore = Math.min(100, Math.round(budgetUsed * 0.45 + (advanceLeft / Math.max(advance, 1)) * 35 + (advanceSettled < 60 ? 20 : 5)));
    return { budgetUsed, advanceLeft, advanceSettled, riskScore };
  }, [budget, actual, advance, settled]);

  const simulation = useMemo(() => {
    const grossMargin = revenue ? ((revenue - cost) / revenue) * 100 : 0;
    const netProfit = revenue - cost - opsCost;
    const productScore = Math.round(pain * 3 + buyer * 2 + mvpCheap * 2 + distribution * 1.5 - techRisk * 1.5);
    const risk = Math.min(100, Math.max(0, 100 - grossMargin + techRisk * 6 + (netProfit < 0 ? 25 : 0)));
    const verdict = productScore >= 45 && netProfit >= 0 ? 'GO - có thể làm MVP nhỏ để kiểm chứng' : productScore >= 35 ? 'HOLD - cần khảo sát thêm trước khi code' : 'NO-GO - chưa nên tốn công build';
    return { grossMargin, netProfit, productScore, risk, verdict };
  }, [buyer, cost, distribution, mvpCheap, opsCost, pain, revenue, techRisk]);

  const selectedScenario = FOUNDER_SIMULATOR_SCENARIOS.find((x) => x.id === scenarioId) ?? FOUNDER_SIMULATOR_SCENARIOS[0];

  const report = `BÁO CÁO MÔ PHỎNG SOLO FOUNDER COMPANY OS\nNgân sách mẫu: ${money(budget)}đ\nChi phí mẫu: ${money(actual)}đ\nTỷ lệ dùng ngân sách: ${result.budgetUsed.toFixed(1)}%\nTạm ứng còn treo: ${money(result.advanceLeft)}đ\nĐiểm rủi ro mô phỏng: ${result.riskScore}/100\n\nSIMULATOR\nScenario: ${selectedScenario.name}\nGross margin: ${simulation.grossMargin.toFixed(1)}%\nLãi/lỗ mô phỏng: ${money(simulation.netProfit)}đ\nIdea score: ${simulation.productScore}/100\nKết luận: ${simulation.verdict}\n\nCÔNG TY SOLO FOUNDER\n${SOLO_FOUNDER_COMPANY_MODULES.map((item, index) => `${index + 1}. ${item.department}: ${item.purpose}`).join('\n')}\n\nNHÂN VIÊN AI\n${AI_AGENT_STAFF_MATRIX.map((item, index) => `${index + 1}. ${item.role}: ${item.mission}`).join('\n')}\n\nDECISION LOG\n${decisions.map((item, index) => `${index + 1}. ${item.decision} - ${item.nextAction}`).join('\n')}`;

  const copyText = async (text = report, key = 'report') => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const addDecision = () => {
    if (!newDecision.trim()) return;
    setDecisions([{ decision: newDecision.trim(), reason: 'Founder nhập nhanh trong lab.', evidence: 'Cần bổ sung bằng chứng sau khi khảo sát/mô phỏng.', nextAction: 'Giao AI Chief of Staff viết decision memo chi tiết.' }, ...decisions]);
    setNewDecision('');
  };

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300">
              <Receipt className="h-3.5 w-3.5" /> Multi-Industry Founder Simulation Lab
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Lab học tập kế toán - kiểm toán đa ngành, mô phỏng sản phẩm và vận hành công ty solo founder</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">Module này không phải phần mềm nhập liệu kế toán thay MISA AMIS, Bravo hay ERP. Đây là phòng học, R&amp;D, mô phỏng và điều hành: kế toán/kiểm toán đa ngành, lập trình sản phẩm/app/game, AI agent workforce, marketing, tài chính và quy trình vận hành với chi phí thấp nhất.</p>
          </div>
          <button onClick={() => copyText()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black text-slate-950"><Copy className="h-4 w-4" />{copied === 'report' ? 'Đã copy' : 'Copy báo cáo mô phỏng'}</button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {TAB_LABELS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-xs font-black ${tab === id ? 'bg-cyan-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-400'}`}>{label}</button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-100">
          <ShieldCheck className="h-4 w-4 text-amber-300" />
          Boundary note
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Toan bo so lieu, case va ket qua tinh trong workspace nay la du lieu mo phong offline-first, phuc vu hoc tap, thiet ke san pham va kiem thu y tuong.
          Truoc khi ap dung vao ho so ke toan, thue, phap ly hoac quyet dinh kinh doanh that, can co ke toan/nguoi duyet chuyen mon xac nhan cuoi.
        </p>
      </section>

      {tab === 'deepdive' && <AccountingVietnamDeepDivePanel />}

      {tab === 'dashboard' && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><p className="text-xs text-cyan-200">Budget used</p><p className="mt-2 text-3xl font-black text-white">{result.budgetUsed.toFixed(1)}%</p><p className="mt-2 text-xs text-slate-400">Mức dùng ngân sách mô phỏng</p></Card>
            <Card><p className="text-xs text-amber-200">Advance open</p><p className="mt-2 text-2xl font-black text-white">{money(result.advanceLeft)}đ</p><p className="mt-2 text-xs text-slate-400">Tạm ứng/công việc còn treo</p></Card>
            <Card><p className="text-xs text-emerald-200">Idea score</p><p className="mt-2 text-3xl font-black text-white">{simulation.productScore}/100</p><p className="mt-2 text-xs text-slate-400">Điểm ý tưởng đang mô phỏng</p></Card>
            <Card><p className="text-xs text-rose-200">Founder risk</p><p className="mt-2 text-3xl font-black text-white">{Math.max(result.riskScore, Math.round(simulation.risk))}/100</p><p className="mt-2 text-xs text-slate-400">Rủi ro tổng hợp</p></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {FOUNDER_DAILY_KPI_DASHBOARD.map((item) => <Card key={item.group}><h2 className="text-sm font-black text-white">{item.group}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.purpose}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">KPI nên theo dõi</p><BulletList items={item.kpis} className="text-cyan-100" /><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">Cảnh báo: {item.warning}</p></Card>)}
          </div>
        </section>
      )}

      {tab === 'cases' && <section className="grid gap-4 lg:grid-cols-4">{SIM_CASES.map((item) => <Card key={item.title}><BookOpen className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.title}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.lesson}</p><p className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs font-semibold leading-6 text-purple-100">{item.hint}</p></Card>)}</section>}

      {tab === 'costs' && <section className="grid gap-4 lg:grid-cols-2">{COST_TYPE_KNOWLEDGE.map((item) => <Card key={item.type}><WalletCards className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">Thẻ học: {item.type}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Ví dụ: {item.examples}</p><p className="mt-3 text-[10px] font-black uppercase text-cyan-300">Hồ sơ nên có</p><BulletList items={item.documents} className="text-cyan-100" /><p className="mt-3 text-[10px] font-black uppercase text-amber-300">Điểm cần quan sát trong mô phỏng</p><BulletList items={item.risks} className="text-amber-100" /></Card>)}</section>}

      {tab === 'docs' && <section className="grid gap-4 lg:grid-cols-2">{DOCUMENT_CHECKLIST_RULES.map((item) => <Card key={item.scenario}><FileText className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">Quiz hồ sơ: {item.scenario}</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><BulletList items={item.minimumDocs} /></div><div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><BulletList items={item.redFlags} /></div></div></Card>)}</section>}

      {tab === 'score' && <section className="grid gap-4 lg:grid-cols-5"><Card className="lg:col-span-2"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><Calculator className="h-4 w-4 text-cyan-300" />Score lab</h2><div className="space-y-3"><NumberInput label="Ngân sách mẫu" value={budget} setValue={setBudget} /><NumberInput label="Chi phí mẫu" value={actual} setValue={setActual} /><NumberInput label="Tạm ứng mẫu" value={advance} setValue={setAdvance} /><NumberInput label="Đã hoàn ứng mẫu" value={settled} setValue={setSettled} /></div></Card><div className="grid gap-4 lg:col-span-3 md:grid-cols-3"><Card><p className="text-xs text-cyan-200">Budget Used</p><p className="mt-2 text-3xl font-black text-white">{result.budgetUsed.toFixed(1)}%</p></Card><Card><p className="text-xs text-amber-200">Tạm ứng treo</p><p className="mt-2 text-2xl font-black text-white">{money(result.advanceLeft)}đ</p></Card><Card><p className="text-xs text-rose-200">Risk score</p><p className="mt-2 text-3xl font-black text-white">{result.riskScore}/100</p></Card><Card className="md:col-span-3"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" />KPI học tập</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{ACCOUNTING_CONTROL_KPIS.map((item) => <div key={item.kpi} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="text-xs font-black text-white">{item.kpi}</h3><code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-cyan-300">{item.formula}</code><p className="mt-3 text-xs font-semibold leading-6 text-slate-400">{item.use}</p></div>)}</div></Card></div></section>}

      {tab === 'simulator' && <section className="grid gap-4 lg:grid-cols-5"><Card className="lg:col-span-2"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><Calculator className="h-4 w-4 text-cyan-300" />Founder what-if simulator</h2><label className="mb-3 block"><span className="mb-1 block text-xs font-black text-slate-400">Kịch bản mô phỏng</span><select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400">{FOUNDER_SIMULATOR_SCENARIOS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><div className="grid gap-3 md:grid-cols-2"><NumberInput label="Doanh thu/giá trị kỳ vọng" value={revenue} setValue={setRevenue} /><NumberInput label="Giá vốn/chi phí trực tiếp" value={cost} setValue={setCost} /><NumberInput label="Chi phí vận hành/MVP" value={opsCost} setValue={setOpsCost} /><NumberInput label="Pain score 1-10" value={pain} setValue={setPain} /><NumberInput label="Buyer clarity 1-10" value={buyer} setValue={setBuyer} /><NumberInput label="MVP rẻ 1-10" value={mvpCheap} setValue={setMvpCheap} /><NumberInput label="Kênh bán 1-10" value={distribution} setValue={setDistribution} /><NumberInput label="Rủi ro kỹ thuật 1-10" value={techRisk} setValue={setTechRisk} /></div></Card><div className="space-y-4 lg:col-span-3"><Card><p className="text-xs font-black uppercase text-cyan-300">{selectedScenario.industry}</p><h2 className="mt-2 text-lg font-black text-white">{selectedScenario.name}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{selectedScenario.description}</p><div className="mt-4 grid gap-3 md:grid-cols-2"><div><p className="text-[10px] font-black uppercase text-cyan-300">Input</p><BulletList items={selectedScenario.inputs} className="text-cyan-100" /></div><div><p className="text-[10px] font-black uppercase text-emerald-300">Output</p><BulletList items={selectedScenario.outputs} className="text-emerald-100" /></div></div></Card><div className="grid gap-4 md:grid-cols-4"><Card><p className="text-xs text-cyan-200">Gross margin</p><p className="mt-2 text-2xl font-black text-white">{simulation.grossMargin.toFixed(1)}%</p></Card><Card><p className="text-xs text-emerald-200">Lãi/lỗ mô phỏng</p><p className="mt-2 text-xl font-black text-white">{money(simulation.netProfit)}đ</p></Card><Card><p className="text-xs text-amber-200">Idea score</p><p className="mt-2 text-2xl font-black text-white">{simulation.productScore}/100</p></Card><Card><p className="text-xs text-rose-200">Risk</p><p className="mt-2 text-2xl font-black text-white">{simulation.risk.toFixed(0)}/100</p></Card></div><Card><p className="text-xs font-black uppercase text-amber-300">Kết luận mô phỏng</p><p className="mt-3 text-base font-black text-white">{simulation.verdict}</p><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Rule: {selectedScenario.goNoGoRule}</p><div className="mt-4 grid gap-2 md:grid-cols-5">{PRODUCT_IDEA_SCORE_FACTORS.map((x) => <div key={x.factor} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-xs font-black text-white">{x.factor}</p><p className="mt-2 text-[11px] leading-5 text-slate-400">{x.meaning}</p></div>)}</div></Card></div></section>}

      {tab === 'decisions' && <section className="space-y-4"><Card><h2 className="text-sm font-black uppercase tracking-wider text-white">Decision Log của founder</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Lưu tạm bằng localStorage trên trình duyệt, chưa cần backend để tiết kiệm chi phí MVP.</p><div className="mt-4 flex gap-2"><input value={newDecision} onChange={(e) => setNewDecision(e.target.value)} placeholder="Nhập quyết định mới..." className="flex-1 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400" /><button onClick={addDecision} className="rounded-xl bg-cyan-400 px-4 text-xs font-black text-slate-950">Thêm</button></div></Card><div className="grid gap-4 lg:grid-cols-2">{decisions.map((item, index) => <Card key={`${item.decision}-${index}`}><p className="text-[10px] font-black uppercase text-cyan-300">Decision #{decisions.length - index}</p><h2 className="mt-2 text-sm font-black text-white">{item.decision}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Lý do: {item.reason}</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Bằng chứng: {item.evidence}</p><p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Bước tiếp: {item.nextAction}</p></Card>)}</div></section>}

      {tab === 'workorders' && <section className="grid gap-4 lg:grid-cols-2">{AI_AGENT_WORK_ORDER_BOARD.map((item) => <Card key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase text-cyan-300">{item.id} • {item.status}</p><h2 className="mt-2 text-sm font-black text-white">{item.ownerAgent}</h2></div><span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black text-cyan-200">Work Order</span></div><p className="mt-3 text-xs font-bold leading-6 text-slate-200">{item.task}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Input</p><BulletList items={item.input} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Expected output</p><BulletList items={item.expectedOutput} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">Founder review: {item.founderReview}</p></Card>)}</section>}

      {tab === 'portfolio' && <section className="grid gap-4 lg:grid-cols-2">{PRODUCT_IDEA_PORTFOLIO.map((item) => <Card key={item.idea}><div className="flex items-start justify-between gap-3"><div><Target className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">{item.idea}</h2></div><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center"><p className="text-[10px] font-black uppercase text-emerald-200">Score</p><p className="text-2xl font-black text-white">{ideaScore(item)}</p></div></div><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">User: {item.targetUser}</p><div className="mt-4 grid gap-2 md:grid-cols-4"><div className="rounded-xl bg-slate-950/70 p-3 text-center"><p className="text-[10px] text-slate-400">Pain</p><p className="text-lg font-black">{item.pain}</p></div><div className="rounded-xl bg-slate-950/70 p-3 text-center"><p className="text-[10px] text-slate-400">MVP rẻ</p><p className="text-lg font-black">{item.mvpCheapness}</p></div><div className="rounded-xl bg-slate-950/70 p-3 text-center"><p className="text-[10px] text-slate-400">Kênh bán</p><p className="text-lg font-black">{item.distribution}</p></div><div className="rounded-xl bg-slate-950/70 p-3 text-center"><p className="text-[10px] text-slate-400">Risk tech</p><p className="text-lg font-black">{item.technicalRisk}</p></div></div><p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">MVP đầu tiên: {item.firstMvp}</p><p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">Monetization: {item.monetization}</p></Card>)}</section>}

      {tab === 'sop' && <section className="grid gap-4 lg:grid-cols-2">{OPERATING_SOP_LIBRARY.map((item) => <Card key={item.sop}><CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">{item.sop}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Trigger: {item.trigger}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Các bước</p><BulletList items={item.steps} className="text-cyan-100" /><p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Output: {item.output}</p></Card>)}</section>}

      {tab === 'risks' && <section className="space-y-4"><div className="grid gap-4 lg:grid-cols-2">{FOUNDER_RISK_REGISTER.map((item) => <Card key={item.risk}><ShieldCheck className="mb-3 h-5 w-5 text-rose-300" /><p className="text-[10px] font-black uppercase text-rose-300">Severity: {item.severity}</p><h2 className="mt-2 text-sm font-black text-white">{item.risk}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Tín hiệu: {item.signal}</p><p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Kiểm soát: {item.control}</p></Card>)}</div><Card><h2 className="text-sm font-black text-white">Release readiness checklist</h2><div className="mt-4 grid gap-2 md:grid-cols-2"><BulletList items={RELEASE_READINESS_CHECKLIST} className="text-cyan-100" /></div></Card></section>}

      {tab === 'promptlab' && <section className="grid gap-4 lg:grid-cols-2">{AI_AGENT_TASK_TEMPLATES.map((item) => <Card key={item.agent + item.task}><ShieldCheck className="mb-3 h-5 w-5 text-purple-300" /><h2 className="text-sm font-black text-white">{item.agent}: {item.task}</h2><pre className="mt-3 whitespace-pre-wrap rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">{item.prompt}</pre><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Chuẩn đầu ra</p><BulletList items={item.acceptance} className="text-emerald-100" /><button onClick={() => copyText(item.prompt, item.agent)} className="mt-4 rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-200">{copied === item.agent ? 'Đã copy' : 'Copy prompt'}</button></Card>)}</section>}

      {tab === 'survey' && <section className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><Target className="mb-3 h-5 w-5 text-amber-300" /><h2 className="text-sm font-black text-white">Bộ câu hỏi khảo sát thị trường</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Dùng để phỏng vấn người học kế toán, kế toán viên, founder, dev hoặc người muốn dùng AI agent làm việc.</p><div className="mt-4 space-y-2">{SURVEY_QUESTION_BANK.map((x, index) => <p key={x} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-slate-200">{index + 1}. {x}</p>)}</div></Card><Card><h2 className="text-sm font-black text-white">Cách dùng</h2><BulletList items={['Phỏng vấn 5-10 người/ngành trước khi code thêm', 'Ghi nguyên văn pain point, không tự đoán', 'Đếm số người có cùng vấn đề', 'Chỉ build nếu có tín hiệu trả tiền hoặc dùng thử thật', 'Đưa kết quả vào Decision Log']} className="text-emerald-100" /></Card></section>}

      {tab === 'coverage' && <section className="grid gap-4 lg:grid-cols-2">{MODULE_KNOWLEDGE_AUDIT.map((item) => <Card key={item.module}><Target className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.module}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Góc nhìn: {item.roleView}</p><p className="mt-4 text-[10px] font-black uppercase text-rose-300">Kiến thức cần bổ sung/kiểm tra</p><BulletList items={item.missingKnowledge} className="text-rose-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Đề xuất thêm</p><BulletList items={item.recommendedAdditions} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">Chuẩn đạt: {item.acceptanceCriteria}</p></Card>)}</section>}

      {tab === 'casebank' && <section className="grid gap-4 lg:grid-cols-3">{ADVANCED_CONSTRUCTION_CASES.map((item) => <Card key={item.title}><BookOpen className="mb-3 h-5 w-5 text-purple-300" /><h2 className="text-sm font-black text-white">{item.title}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.situation}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Trọng tâm kế toán</p><BulletList items={item.accountingFocus} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-amber-300">Câu hỏi kiểm soát</p><BulletList items={item.controlQuestions} className="text-amber-100" /></Card>)}</section>}

      {tab === 'blueprint' && <section className="space-y-4"><div className="grid gap-4 lg:grid-cols-2">{FINANCIAL_ACCOUNTING_BLUEPRINT.map((item) => <Card key={item.area}><Briefcase className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">{item.area}</h2><BulletList items={item.add} /></Card>)}{DATA_AI_CONTROL_FRAMEWORK.map((item) => <Card key={item.layer}><Database className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.layer}</h2><BulletList items={item.checks} /></Card>)}</div><div className="grid gap-4 lg:grid-cols-2">{FULLSTACK_DELIVERY_BLUEPRINT.map((item) => <Card key={item.layer}><Layers className="mb-3 h-5 w-5 text-indigo-300" /><h2 className="text-sm font-black text-white">{item.layer}</h2><BulletList items={item.mustBuild} /></Card>)}{GROWTH_BUSINESS_PLAYBOOK.map((item) => <Card key={item.theme}><Target className="mb-3 h-5 w-5 text-amber-300" /><h2 className="text-sm font-black text-white">{item.theme}</h2><BulletList items={item.actions} /></Card>)}</div></section>}

      {tab === 'companyos' && <section className="grid gap-4 lg:grid-cols-2">{SOLO_FOUNDER_OPERATING_SYSTEM.map((item) => <Card key={item.process}><Briefcase className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.process}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Phụ trách mô phỏng: {item.owner}</p><p className="mt-1 text-xs font-semibold leading-6 text-slate-400">Nhịp vận hành: {item.rhythm}</p><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Đầu ra phải có</p><BulletList items={item.outputs} className="text-emerald-100" /></Card>)}</section>}

      {tab === 'departments' && <section className="grid gap-4 lg:grid-cols-2">{SOLO_FOUNDER_COMPANY_MODULES.map((item) => <Card key={item.department}><Briefcase className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.department}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.purpose}</p><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Module nên có</p><BulletList items={item.modules} className="text-emerald-100" /><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Dữ liệu cần thu</p><BulletList items={item.dataNeeded} className="text-cyan-100" /></Card>)}</section>}

      {tab === 'agents' && <section className="grid gap-4 lg:grid-cols-2">{AI_AGENT_STAFF_MATRIX.map((item) => <Card key={item.role}><ShieldCheck className="mb-3 h-5 w-5 text-purple-300" /><h2 className="text-sm font-black text-white">{item.role}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.mission}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Input</p><BulletList items={item.inputs} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Output</p><BulletList items={item.outputs} className="text-emerald-100" /><p className="mt-4 text-[10px] font-black uppercase text-rose-300">Guardrail</p><BulletList items={item.guardrails} className="text-rose-100" /></Card>)}</section>}

      {tab === 'datasets' && <section className="grid gap-4 lg:grid-cols-2">{SIMULATION_DATASETS.map((item) => <Card key={item.name}><Database className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.name}</h2><p className="mt-2 text-xs font-black text-slate-400">Ngành/phòng ban: {item.industry}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Dòng dữ liệu giả lập</p><BulletList items={item.rows} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Điều cần học</p><BulletList items={item.whatToLearn} className="text-emerald-100" /><p className="mt-4 text-[10px] font-black uppercase text-amber-300">Chỉ số mô phỏng</p><BulletList items={item.metrics} className="text-amber-100" /></Card>)}</section>}

      {tab === 'experiments' && <section className="grid gap-4 lg:grid-cols-2">{RESEARCH_EXPERIMENT_TEMPLATES.map((item) => <Card key={item.experiment}><Target className="mb-3 h-5 w-5 text-amber-300" /><h2 className="text-sm font-black text-white">{item.experiment}</h2><p className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">Giả thuyết: {item.hypothesis}</p><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Dữ liệu cần thu</p><BulletList items={item.sampleData} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Tín hiệu đạt: {item.successSignal}</p></Card>)}</section>}

      {tab === 'roadmap' && <section className="grid gap-4 lg:grid-cols-2">{COMMERCIALIZATION_ROADMAP.map((item) => <Card key={item.stage}><Target className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">{item.stage}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.goal}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Cần build</p><BulletList items={item.build} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Bằng chứng đạt</p><BulletList items={item.evidence} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">Quyết định: {item.decision}</p></Card>)}</section>}

      {tab === 'tools' && <section className="grid gap-4 lg:grid-cols-2">{LOW_COST_TOOL_STACK_MATRIX.map((item) => <Card key={item.job}><WalletCards className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">{item.job}</h2><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Ưu tiên miễn phí/rẻ trước</p><BulletList items={item.freeFirst} className="text-cyan-100" /><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">Khi nào mới trả phí: {item.paidWhen}</p><p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-bold leading-6 text-rose-100">Giữ/bỏ: {item.keepKillRule}</p></Card>)}</section>}

      {tab === 'backlog' && <section className="space-y-4"><div className="grid gap-4 lg:grid-cols-2">{IMPROVEMENT_BACKLOG.map((item) => <Card key={item.item}><Layers className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">[{item.priority}] {item.item}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Lý do: {item.reason}</p><p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Hành động: {item.suggestedAction}</p></Card>)}</div><div className="grid gap-4 lg:grid-cols-2">{OPERATING_RHYTHM_CHECKLIST.map((item) => <Card key={item.cadence}><CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">Nhịp {item.cadence}</h2><BulletList items={item.actions} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-bold leading-6 text-rose-100">Cảnh báo: {item.danger}</p></Card>)}</div></section>}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200"><CheckCircle2 className="h-4 w-4" />Ranh giới module</h2><p className="text-xs font-semibold leading-7 text-slate-300">Đây là simulation lab và company operating system cho solo founder: học bằng case giả lập, mô phỏng khảo sát, lập kế hoạch sản phẩm và quản lý AI agent. Dữ liệu chạy offline-first bằng static data/localStorage, không thay phần mềm kế toán, không thay văn bản pháp lý hiện hành và không thay người duyệt chuyên môn.</p></section>
    </div>
  );
}
