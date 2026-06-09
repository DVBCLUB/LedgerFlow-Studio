import React, { useMemo, useState } from 'react';
import { BookOpen, Calculator, CheckCircle2, Copy, FileText, Receipt, ShieldCheck, WalletCards } from 'lucide-react';
import { ACCOUNTING_CONTROL_KPIS, COST_TYPE_KNOWLEDGE, DOCUMENT_CHECKLIST_RULES } from '../data/deepConstructionAccountingKnowledge';

type AccountingTab = 'cases' | 'costs' | 'docs' | 'score';
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const SIM_CASES = [
  { title: 'Case mô phỏng 01: Mua vật tư có hóa đơn nhưng thiếu phiếu nhập', lesson: 'Người học phải nhận ra hóa đơn chưa đủ để nối hàng hóa với kho/công trình.', hint: 'Gợi ý định khoản học tập: Nợ 152/154/621, Nợ 1331 nếu đủ điều kiện, Có 111/112/331.' },
  { title: 'Case mô phỏng 02: Tạm ứng công trường quá hạn', lesson: 'Người học phải xem tuổi tạm ứng, người nhận, mục đích ứng và chứng từ hoàn ứng.', hint: 'Gợi ý học tập: khi ứng Nợ 141/Có tiền; khi hoàn Nợ chi phí hoặc kho/Có 141.' },
  { title: 'Case mô phỏng 03: Cấp dầu vượt định mức', lesson: 'Người học phải đối chiếu phiếu cấp dầu với xe/máy, nhật trình và định mức.', hint: 'Gợi ý học tập: đây là bài kiểm soát, không phải kết luận sai phạm.' }
];

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

  const report = `BÁO CÁO MÔ PHỎNG\nNgân sách mẫu: ${money(budget)}đ\nChi phí mẫu: ${money(actual)}đ\nTỷ lệ dùng ngân sách: ${result.budgetUsed.toFixed(1)}%\nTạm ứng còn treo: ${money(result.advanceLeft)}đ\nĐiểm rủi ro mô phỏng: ${result.riskScore}/100`;
  const copyText = async () => { await navigator.clipboard.writeText(report); setCopied('report'); setTimeout(() => setCopied(null), 1200); };

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300"><Receipt className="h-3.5 w-3.5" /> Accounting Vietnam Simulation</div>
            <h1 className="text-2xl font-black tracking-tight text-white">Mô phỏng kế toán xây dựng để học case, chứng từ, KPI và tư duy kiểm soát</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">Module này là phòng lab học tập. Dữ liệu, bút toán và checklist đều là mô phỏng để luyện tư duy; không phải màn hình vận hành kế toán thực tế.</p>
          </div>
          <button onClick={copyText} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black text-slate-950"><Copy className="h-4 w-4" />{copied ? 'Đã copy' : 'Copy báo cáo mô phỏng'}</button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {[['cases','Case mô phỏng'],['costs','Thẻ chi phí'],['docs','Quiz chứng từ'],['score','Score lab']].map(([id,label]) => <button key={id} onClick={() => setTab(id as AccountingTab)} className={`rounded-xl px-4 py-2 text-xs font-black ${tab === id ? 'bg-cyan-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-400'}`}>{label}</button>)}
        </div>
      </section>

      {tab === 'cases' && <section className="grid gap-4 lg:grid-cols-3">{SIM_CASES.map((item) => <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><BookOpen className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">{item.title}</h2><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.lesson}</p><p className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs font-semibold leading-6 text-purple-100">{item.hint}</p></div>)}</section>}

      {tab === 'costs' && <section className="grid gap-4 lg:grid-cols-2">{COST_TYPE_KNOWLEDGE.map((item) => <div key={item.type} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><WalletCards className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">Thẻ học: {item.type}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Ví dụ: {item.examples}</p><p className="mt-3 text-[10px] font-black uppercase text-amber-300">Điểm cần quan sát trong mô phỏng</p>{item.risks.map((risk) => <p key={risk} className="text-xs font-semibold leading-6 text-amber-100">• {risk}</p>)}</div>)}</section>}

      {tab === 'docs' && <section className="grid gap-4 lg:grid-cols-2">{DOCUMENT_CHECKLIST_RULES.map((item) => <div key={item.scenario} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><FileText className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="text-sm font-black text-white">Quiz hồ sơ: {item.scenario}</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">{item.minimumDocs.map((doc) => <p key={doc} className="text-xs font-semibold leading-6 text-slate-300">• {doc}</p>)}</div><div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">{item.redFlags.map((flag) => <p key={flag} className="text-xs font-semibold leading-6 text-slate-300">• {flag}</p>)}</div></div></div>)}</section>}

      {tab === 'score' && <section className="grid gap-4 lg:grid-cols-5"><div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><Calculator className="h-4 w-4 text-cyan-300" />Score lab</h2>{[['Ngân sách mẫu',budget,setBudget],['Chi phí mẫu',actual,setActual],['Tạm ứng mẫu',advance,setAdvance],['Đã hoàn ứng mẫu',settled,setSettled]].map(([label,value,setter]) => <label key={label as string} className="mb-3 block"><span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span><input type="number" value={value as number} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400" /></label>)}</div><div className="lg:col-span-3 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5"><p className="text-xs text-cyan-200">Budget Used</p><p className="mt-2 text-3xl font-black text-white">{result.budgetUsed.toFixed(1)}%</p></div><div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><p className="text-xs text-amber-200">Tạm ứng treo</p><p className="mt-2 text-2xl font-black text-white">{money(result.advanceLeft)}đ</p></div><div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5"><p className="text-xs text-rose-200">Risk score</p><p className="mt-2 text-3xl font-black text-white">{result.riskScore}/100</p></div><div className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" />KPI học tập</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{ACCOUNTING_CONTROL_KPIS.map((item) => <div key={item.kpi} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="text-xs font-black text-white">{item.kpi}</h3><code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-cyan-300">{item.formula}</code><p className="mt-3 text-xs font-semibold leading-6 text-slate-400">{item.use}</p></div>)}</div></div></div></section>}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200"><CheckCircle2 className="h-4 w-4" />Ranh giới module</h2><p className="text-xs font-semibold leading-7 text-slate-300">Đây là simulation lab: học bằng case giả lập, không thay phần mềm kế toán và không thay người duyệt chuyên môn.</p></section>
    </div>
  );
}
