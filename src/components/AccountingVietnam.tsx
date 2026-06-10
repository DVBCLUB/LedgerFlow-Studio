import React, { useMemo, useState } from 'react';
import { BookOpen, Briefcase, Calculator, CheckCircle2, Copy, Database, FileText, Layers, Receipt, ShieldCheck, Target, WalletCards } from 'lucide-react';
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

type AccountingTab =
  | 'cases'
  | 'costs'
  | 'docs'
  | 'score'
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

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const SIM_CASES = [
  { title: 'Case mô phỏng 01: Thương mại - hàng về lệch hóa đơn', lesson: 'Người học nhận ra hóa đơn chưa đủ; phải đối chiếu đơn hàng, nhập kho, giao nhận và công nợ.', hint: 'Gợi ý học tập: so sánh số lượng hóa đơn, số lượng kho nhận, giá vốn và công nợ NCC.' },
  { title: 'Case mô phỏng 02: Sản xuất - định mức lệch thực tế', lesson: 'Người học kiểm tra BOM, lệnh sản xuất, NVL xuất dùng, WIP, phế phẩm và giá thành.', hint: 'Gợi ý học tập: phân biệt lệch do kỹ thuật, hao hụt, định mức cũ hoặc kiểm soát kho yếu.' },
  { title: 'Case mô phỏng 03: Dịch vụ - nghiệm thu và doanh thu', lesson: 'Người học xem hợp đồng, timesheet, nghiệm thu và thời điểm ghi nhận doanh thu.', hint: 'Gợi ý học tập: dịch vụ cần bằng chứng đã cung cấp và quyền thu tiền, không chỉ nhìn hóa đơn.' },
  { title: 'Case mô phỏng 04: Xây dựng - tạm ứng quá hạn', lesson: 'Người học xem tuổi tạm ứng, người nhận, mục đích ứng, chứng từ hoàn ứng và mã công trình.', hint: 'Gợi ý học tập: đây là bài kiểm soát dòng tiền và chứng từ, không phải phần mềm hạch toán thay ERP.' }
];

const TAB_LABELS: Array<[AccountingTab, string]> = [
  ['cases', 'Case mô phỏng'],
  ['costs', 'Thẻ chi phí'],
  ['docs', 'Quiz chứng từ'],
  ['score', 'Score lab'],
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

export default function AccountingVietnam() {
  const [tab, setTab] = useState<AccountingTab>('cases');
  const [copied, setCopied] = useState<string | null>(null);
  const [budget, setBudget] = useState(1200000000);
  const [actual, setActual] = useState(735000000);
  const [advance, setAdvance] = useState(180000000);
  const [settled, setSettled] = useState(95000000);

  const result = useMemo(() => {
    const budgetUsed = budget ? (actual / budget) * 100 : 0;
    const advanceLeft = advance - settled;
    const advanceSettled = advance ? (settled / advance) * 100 : 0;
    const riskScore = Math.min(100, Math.round(budgetUsed * 0.45 + (advanceLeft / Math.max(advance, 1)) * 35 + (advanceSettled < 60 ? 20 : 5)));
    return { budgetUsed, advanceLeft, advanceSettled, riskScore };
  }, [budget, actual, advance, settled]);

  const report = `BÁO CÁO MÔ PHỎNG SOLO FOUNDER COMPANY OS\nNgân sách mẫu: ${money(budget)}đ\nChi phí mẫu: ${money(actual)}đ\nTỷ lệ dùng ngân sách: ${result.budgetUsed.toFixed(1)}%\nTạm ứng còn treo: ${money(result.advanceLeft)}đ\nĐiểm rủi ro mô phỏng: ${result.riskScore}/100\n\nRÀ SOÁT MODULE\n${MODULE_KNOWLEDGE_AUDIT.map((item, index) => `${index + 1}. ${item.module}: ${item.acceptanceCriteria}`).join('\n')}\n\nCÔNG TY SOLO FOUNDER\n${SOLO_FOUNDER_COMPANY_MODULES.map((item, index) => `${index + 1}. ${item.department}: ${item.purpose}`).join('\n')}\n\nNHÂN VIÊN AI\n${AI_AGENT_STAFF_MATRIX.map((item, index) => `${index + 1}. ${item.role}: ${item.mission}`).join('\n')}\n\nDATASET MÔ PHỎNG\n${SIMULATION_DATASETS.map((item, index) => `${index + 1}. ${item.name} - ${item.industry}`).join('\n')}\n\nBACKLOG CẢI TIẾN\n${IMPROVEMENT_BACKLOG.map((item, index) => `${index + 1}. [${item.priority}] ${item.item}`).join('\n')}`;

  const copyText = async () => {
    await navigator.clipboard.writeText(report);
    setCopied('report');
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300"><Receipt className="h-3.5 w-3.5" /> Multi-Industry Founder Simulation Lab</div>
            <h1 className="text-2xl font-black tracking-tight text-white">Lab học tập kế toán - kiểm toán đa ngành, mô phỏng sản phẩm và vận hành công ty solo founder</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">Module này không phải phần mềm nhập liệu kế toán thay MISA AMIS, Bravo hay ERP. Đây là phòng học, R&amp;D, mô phỏng và điều hành: kế toán/kiểm toán đa ngành, lập trình sản phẩm/app/game, AI agent workforce, marketing, tài chính và quy trình vận hành với chi phí thấp nhất.</p>
          </div>
          <button onClick={copyText} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black text-slate-950"><Copy className="h-4 w-4" />{copied ? 'Đã copy' : 'Copy báo cáo mô phỏng'}</button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {TAB_LABELS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-xs font-black ${tab === id ? 'bg-cyan-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-400'}`}>{label}</button>)}
        </div>
      </section>

      {tab === 'cases' && <section className="grid gap-4 lg:grid-cols-4">{SIM_CASES.map((item) => <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><BookOpen className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.title}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.lesson}</p><p className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs font-semibold leading-6 text-purple-100">{item.hint}</p></div>)}</section>}

      {tab === 'costs' && <section className="grid gap-4 lg:grid-cols-2">{COST_TYPE_KNOWLEDGE.map((item) => <div key={item.type} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><WalletCards className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">Thẻ học: {item.type}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Ví dụ: {item.examples}</p><p className="mt-3 text-[10px] font-black uppercase text-cyan-300">Hồ sơ nên có</p><BulletList items={item.documents} className="text-cyan-100" /><p className="mt-3 text-[10px] font-black uppercase text-amber-300">Điểm cần quan sát trong mô phỏng</p><BulletList items={item.risks} className="text-amber-100" /></div>)}</section>}

      {tab === 'docs' && <section className="grid gap-4 lg:grid-cols-2">{DOCUMENT_CHECKLIST_RULES.map((item) => <div key={item.scenario} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><FileText className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">Quiz hồ sơ: {item.scenario}</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><BulletList items={item.minimumDocs} /></div><div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><BulletList items={item.redFlags} /></div></div></div>)}</section>}

      {tab === 'score' && <section className="grid gap-4 lg:grid-cols-5"><div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><Calculator className="h-4 w-4 text-cyan-300" />Score lab</h2>{[['Ngân sách mẫu', budget, setBudget], ['Chi phí mẫu', actual, setActual], ['Tạm ứng mẫu', advance, setAdvance], ['Đã hoàn ứng mẫu', settled, setSettled]].map(([label, value, setter]) => <label key={label as string} className="mb-3 block"><span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span><input type="number" value={value as number} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400" /></label>)}</div><div className="lg:col-span-3 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5"><p className="text-xs text-cyan-200">Budget Used</p><p className="mt-2 text-3xl font-black text-white">{result.budgetUsed.toFixed(1)}%</p></div><div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><p className="text-xs text-amber-200">Tạm ứng treo</p><p className="mt-2 text-2xl font-black text-white">{money(result.advanceLeft)}đ</p></div><div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5"><p className="text-xs text-rose-200">Risk score</p><p className="mt-2 text-3xl font-black text-white">{result.riskScore}/100</p></div><div className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" />KPI học tập</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{ACCOUNTING_CONTROL_KPIS.map((item) => <div key={item.kpi} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="text-xs font-black text-white">{item.kpi}</h3><code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-cyan-300">{item.formula}</code><p className="mt-3 text-xs font-semibold leading-6 text-slate-400">{item.use}</p></div>)}</div></div></div></section>}

      {tab === 'coverage' && <section className="grid gap-4 lg:grid-cols-2">{MODULE_KNOWLEDGE_AUDIT.map((item) => <div key={item.module} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Target className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.module}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Góc nhìn: {item.roleView}</p><p className="mt-4 text-[10px] font-black uppercase text-rose-300">Kiến thức cần bổ sung/kiểm tra</p><BulletList items={item.missingKnowledge} className="text-rose-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Đề xuất thêm</p><BulletList items={item.recommendedAdditions} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">Chuẩn đạt: {item.acceptanceCriteria}</p></div>)}</section>}

      {tab === 'casebank' && <section className="grid gap-4 lg:grid-cols-3">{ADVANCED_CONSTRUCTION_CASES.map((item) => <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><BookOpen className="mb-3 h-5 w-5 text-purple-300" /><h2 className="text-sm font-black text-white">{item.title}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.situation}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Trọng tâm kế toán</p><BulletList items={item.accountingFocus} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-amber-300">Câu hỏi kiểm soát</p><BulletList items={item.controlQuestions} className="text-amber-100" /></div>)}</section>}

      {tab === 'blueprint' && <section className="space-y-4"><div className="grid gap-4 lg:grid-cols-2">{FINANCIAL_ACCOUNTING_BLUEPRINT.map((item) => <div key={item.area} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Briefcase className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">{item.area}</h2><BulletList items={item.add} /></div>)}{DATA_AI_CONTROL_FRAMEWORK.map((item) => <div key={item.layer} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Database className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.layer}</h2><BulletList items={item.checks} /></div>)}</div><div className="grid gap-4 lg:grid-cols-2">{FULLSTACK_DELIVERY_BLUEPRINT.map((item) => <div key={item.layer} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Layers className="mb-3 h-5 w-5 text-indigo-300" /><h2 className="text-sm font-black text-white">{item.layer}</h2><BulletList items={item.mustBuild} /></div>)}{GROWTH_BUSINESS_PLAYBOOK.map((item) => <div key={item.theme} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Target className="mb-3 h-5 w-5 text-amber-300" /><h2 className="text-sm font-black text-white">{item.theme}</h2><BulletList items={item.actions} /></div>)}</div></section>}

      {tab === 'companyos' && <section className="grid gap-4 lg:grid-cols-2">{SOLO_FOUNDER_OPERATING_SYSTEM.map((item) => <div key={item.process} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Briefcase className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.process}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Phụ trách mô phỏng: {item.owner}</p><p className="mt-1 text-xs font-semibold leading-6 text-slate-400">Nhịp vận hành: {item.rhythm}</p><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Đầu ra phải có</p><BulletList items={item.outputs} className="text-emerald-100" /></div>)}</section>}

      {tab === 'departments' && <section className="grid gap-4 lg:grid-cols-2">{SOLO_FOUNDER_COMPANY_MODULES.map((item) => <div key={item.department} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Briefcase className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.department}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.purpose}</p><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Module nên có</p><BulletList items={item.modules} className="text-emerald-100" /><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Dữ liệu cần thu</p><BulletList items={item.dataNeeded} className="text-cyan-100" /></div>)}</section>}

      {tab === 'agents' && <section className="grid gap-4 lg:grid-cols-2">{AI_AGENT_STAFF_MATRIX.map((item) => <div key={item.role} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><ShieldCheck className="mb-3 h-5 w-5 text-purple-300" /><h2 className="text-sm font-black text-white">{item.role}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.mission}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Input</p><BulletList items={item.inputs} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Output</p><BulletList items={item.outputs} className="text-emerald-100" /><p className="mt-4 text-[10px] font-black uppercase text-rose-300">Guardrail</p><BulletList items={item.guardrails} className="text-rose-100" /></div>)}</section>}

      {tab === 'datasets' && <section className="grid gap-4 lg:grid-cols-2">{SIMULATION_DATASETS.map((item) => <div key={item.name} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Database className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.name}</h2><p className="mt-2 text-xs font-black text-slate-400">Ngành/phòng ban: {item.industry}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Dòng dữ liệu giả lập</p><BulletList items={item.rows} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Điều cần học</p><BulletList items={item.whatToLearn} className="text-emerald-100" /><p className="mt-4 text-[10px] font-black uppercase text-amber-300">Chỉ số mô phỏng</p><BulletList items={item.metrics} className="text-amber-100" /></div>)}</section>}

      {tab === 'experiments' && <section className="grid gap-4 lg:grid-cols-2">{RESEARCH_EXPERIMENT_TEMPLATES.map((item) => <div key={item.experiment} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Target className="mb-3 h-5 w-5 text-amber-300" /><h2 className="text-sm font-black text-white">{item.experiment}</h2><p className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">Giả thuyết: {item.hypothesis}</p><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Dữ liệu cần thu</p><BulletList items={item.sampleData} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Tín hiệu đạt: {item.successSignal}</p></div>)}</section>}

      {tab === 'roadmap' && <section className="grid gap-4 lg:grid-cols-2">{COMMERCIALIZATION_ROADMAP.map((item) => <div key={item.stage} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Target className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">{item.stage}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.goal}</p><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Cần build</p><BulletList items={item.build} className="text-cyan-100" /><p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Bằng chứng đạt</p><BulletList items={item.evidence} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">Quyết định: {item.decision}</p></div>)}</section>}

      {tab === 'tools' && <section className="grid gap-4 lg:grid-cols-2">{LOW_COST_TOOL_STACK_MATRIX.map((item) => <div key={item.job} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><WalletCards className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">{item.job}</h2><p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Ưu tiên miễn phí/rẻ trước</p><BulletList items={item.freeFirst} className="text-cyan-100" /><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">Khi nào mới trả phí: {item.paidWhen}</p><p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-bold leading-6 text-rose-100">Giữ/bỏ: {item.keepKillRule}</p></div>)}</section>}

      {tab === 'backlog' && <section className="space-y-4"><div className="grid gap-4 lg:grid-cols-2">{IMPROVEMENT_BACKLOG.map((item) => <div key={item.item} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Layers className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">[{item.priority}] {item.item}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Lý do: {item.reason}</p><p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">Hành động: {item.suggestedAction}</p></div>)}</div><div className="grid gap-4 lg:grid-cols-2">{OPERATING_RHYTHM_CHECKLIST.map((item) => <div key={item.cadence} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">Nhịp {item.cadence}</h2><BulletList items={item.actions} className="text-emerald-100" /><p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-bold leading-6 text-rose-100">Cảnh báo: {item.danger}</p></div>)}</div></section>}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200"><CheckCircle2 className="h-4 w-4" />Ranh giới module</h2><p className="text-xs font-semibold leading-7 text-slate-300">Đây là simulation lab và company operating system cho solo founder: học bằng case giả lập, mô phỏng khảo sát, lập kế hoạch sản phẩm và quản lý AI agent. Nó không thay phần mềm kế toán, không thay văn bản pháp lý hiện hành và không thay người duyệt chuyên môn.</p></section>
    </div>
  );
}
