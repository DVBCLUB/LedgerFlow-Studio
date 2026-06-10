import React, { useMemo, useState } from 'react';
import { CASE_BANK_INDUSTRIES, MULTI_INDUSTRY_CASE_BANK } from '../data/multiIndustryCaseBank';

const riskClasses: Record<string, string> = {
  High: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  Medium: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  Low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
};

export default function MultiIndustryCaseBank() {
  const [industry, setIndustry] = useState<string>('Tất cả');
  const [risk, setRisk] = useState<string>('Tất cả');

  const filtered = useMemo(() => MULTI_INDUSTRY_CASE_BANK.filter((item) => {
    const industryOk = industry === 'Tất cả' || item.industry === industry;
    const riskOk = risk === 'Tất cả' || item.riskLevel === risk;
    return industryOk && riskOk;
  }), [industry, risk]);

  const stats = useMemo(() => ({
    total: MULTI_INDUSTRY_CASE_BANK.length,
    high: MULTI_INDUSTRY_CASE_BANK.filter((item) => item.riskLevel === 'High').length,
    medium: MULTI_INDUSTRY_CASE_BANK.filter((item) => item.riskLevel === 'Medium').length,
    industries: CASE_BANK_INDUSTRIES.length
  }), []);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Multi-Industry Case Bank</p>
        <h2 className="mt-2 text-xl font-black text-white">Case bank kế toán / kiểm toán đa ngành</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Thư viện tình huống học tập cho thương mại, sản xuất, dịch vụ và xây dựng/dự án. Mục tiêu là luyện tư duy chứng từ, red flag, cut-off, giá thành, doanh thu và kiểm soát rủi ro — không thay thế tư vấn kế toán/kiểm toán chính thức.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Cases</p><p className="mt-2 text-3xl font-black text-white">{stats.total}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Industries</p><p className="mt-2 text-3xl font-black text-cyan-300">{stats.industries}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">High risk</p><p className="mt-2 text-3xl font-black text-rose-300">{stats.high}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Medium risk</p><p className="mt-2 text-3xl font-black text-amber-300">{stats.medium}</p></div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-2">
        <label className="text-[10px] font-black uppercase text-slate-500">Ngành
          <select value={industry} onChange={(event) => setIndustry(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white">
            <option>Tất cả</option>
            {CASE_BANK_INDUSTRIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-black uppercase text-slate-500">Mức rủi ro
          <select value={risk} onChange={(event) => setRisk(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white">
            <option>Tất cả</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">{item.industry}</p>
                <h3 className="mt-2 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">{item.scenario}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${riskClasses[item.riskLevel]}`}>{item.riskLevel}</span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[10px] font-black uppercase text-emerald-300">Chứng từ cần xem</p>
                <div className="mt-3 flex flex-wrap gap-2">{item.documents.map((doc) => <span key={doc} className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-bold text-slate-300">{doc}</span>)}</div>
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-[10px] font-black uppercase text-rose-300">Red flags</p>
                <ul className="mt-3 space-y-2">{item.redFlags.map((flag) => <li key={flag} className="text-xs font-semibold leading-6 text-rose-100">• {flag}</li>)}</ul>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-[10px] font-black uppercase text-cyan-300">Trọng tâm kế toán</p>
                <ul className="mt-3 space-y-2">{item.accountingFocus.map((focus) => <li key={focus} className="text-xs font-semibold leading-6 text-cyan-100">• {focus}</li>)}</ul>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-[10px] font-black uppercase text-amber-300">Câu hỏi kiểm toán</p>
                <ul className="mt-3 space-y-2">{item.auditQuestions.map((question) => <li key={question} className="text-xs font-semibold leading-6 text-amber-100">• {question}</li>)}</ul>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[10px] font-black uppercase text-emerald-300">Bài học</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-emerald-100">{item.learningOutcome}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Next action</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{item.nextAction}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
