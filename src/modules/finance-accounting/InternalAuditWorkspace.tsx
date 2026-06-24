import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Copy, FileText, Search, ShieldCheck, Target, Users } from 'lucide-react';
import { AUDIT_AREAS, AUDIT_PROGRAM, FINDING_TEMPLATES, FOLLOW_UP_TRACKER, RISK_CONTROL_MATRIX, SAMPLING_GUIDE } from '../../data/internalAuditKnowledge';
import InternalAuditDeepDivePanel from './InternalAuditDeepDivePanel';

type AuditTab = 'scenarios' | 'matrix' | 'program' | 'findings' | 'followup' | 'deepdive';

export default function InternalAuditWorkspace() {
  const [tab, setTab] = useState<AuditTab>('scenarios');
  const [copied, setCopied] = useState<string | null>(null);
  const [sampleSize, setSampleSize] = useState(30);
  const [errorCount, setErrorCount] = useState(3);

  const errorRate = sampleSize ? (errorCount / sampleSize) * 100 : 0;
  const conclusion = errorRate >= 10 ? 'Mô phỏng rủi ro cao - nên mở rộng mẫu' : errorRate >= 5 ? 'Mô phỏng rủi ro trung bình - cần follow-up' : 'Mô phỏng tạm ổn - tiếp tục quan sát';
  const report = `BÁO CÁO MÔ PHỎNG KIỂM TOÁN NỘI BỘ\nMẫu kiểm tra: ${sampleSize}\nSai sót mô phỏng: ${errorCount}\nTỷ lệ sai sót: ${errorRate.toFixed(1)}%\nKết luận học tập: ${conclusion}`;

  const copyText = async (id: string, value: string) => { await navigator.clipboard.writeText(value); setCopied(id); setTimeout(() => setCopied(null), 1200); };

  const tabs: { id: AuditTab; label: string }[] = [
    { id: 'scenarios', label: 'Audit scenarios' },
    { id: 'matrix', label: 'Risk-control' },
    { id: 'program', label: 'Audit program' },
    { id: 'findings', label: 'Finding lab' },
    { id: 'followup', label: 'Follow-up' },
    { id: 'deepdive', label: 'Audit Deep Dive' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Internal Audit Simulation Lab</div>
            <h1 className="text-2xl font-black tracking-tight text-white">Mô phỏng kiểm toán nội bộ: rủi ro, chọn mẫu, finding và follow-up</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">Đây là module học bằng tình huống giả lập. Nó giúp luyện cách nhìn rủi ro, chọn mẫu, viết phát hiện và theo dõi khắc phục; không phải hệ thống kiểm toán vận hành thực tế.</p>
          </div>
          <button onClick={() => copyText('report', report)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950"><Copy className="h-4 w-4" />{copied === 'report' ? 'Đã copy' : 'Copy audit simulation'}</button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-xl px-4 py-2 text-xs font-black transition ${tab === item.id ? 'bg-emerald-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}>{item.label}</button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-100">
          <ShieldCheck className="h-4 w-4 text-amber-300" />
          Boundary note
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Workspace nay chi dung du lieu mo phong va checklist static/offline-first de luyen chuong trinh kiem toan, chon mau va nhan dien ngoai le kiem soat.
          Ket qua trong man hinh la diem can kiem tra, khong phai ket luan kiem toan. Reviewer hoac nguoi duyet cuoi phai xac minh bang chung that truoc khi ghi nhan finding.
        </p>
      </section>

      {tab === 'scenarios' && <section className="grid gap-4 lg:grid-cols-2">{AUDIT_AREAS.map((item) => <div key={item.area} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Target className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">Tình huống mô phỏng: {item.area}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Mục tiêu học: {item.objective}</p><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><p className="mb-2 text-[10px] font-black uppercase text-rose-200">Rủi ro để người học tìm</p>{item.keyRisks.map((risk) => <p key={risk} className="text-xs font-semibold leading-6 text-slate-300">• {risk}</p>)}</div><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="mb-2 text-[10px] font-black uppercase text-emerald-200">Gợi ý kiểm soát</p>{item.controls.map((control) => <p key={control} className="text-xs font-semibold leading-6 text-slate-300">• {control}</p>)}</div></div></div>)}</section>}

      {tab === 'matrix' && <section className="space-y-4">{RISK_CONTROL_MATRIX.map((item) => <div key={item.risk} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="grid gap-4 lg:grid-cols-4"><div><AlertTriangle className="mb-3 h-5 w-5 text-amber-300" /><h2 className="text-sm font-black text-white">{item.risk}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Process: {item.process}</p></div><div><p className="mb-2 text-[10px] font-black uppercase text-emerald-300">Control gợi ý</p><p className="text-xs font-semibold leading-6 text-slate-300">{item.control}</p></div><div><p className="mb-2 text-[10px] font-black uppercase text-cyan-300">Bài test mô phỏng</p><p className="text-xs font-semibold leading-6 text-slate-300">{item.test}</p></div><div><p className="mb-2 text-[10px] font-black uppercase text-purple-300">Evidence giả lập</p><p className="text-xs font-semibold leading-6 text-slate-300">{item.evidence}</p></div></div></div>)}</section>}

      {tab === 'program' && <section className="grid gap-4 lg:grid-cols-5"><div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><ClipboardList className="h-4 w-4 text-emerald-300" />Audit program mô phỏng</h2><div className="space-y-3">{AUDIT_PROGRAM.map((item) => <div key={item.step} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="text-sm font-black text-white">{item.step}</h3><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.work}</p><p className="mt-1 text-xs font-semibold leading-6 text-emerald-200">Sản phẩm học tập: {item.output}</p></div>)}</div></div><div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><Search className="h-4 w-4 text-cyan-300" />Sampling guide</h2><div className="space-y-3">{SAMPLING_GUIDE.map((item) => <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-semibold leading-6 text-slate-300">{item}</div>)}</div></div></section>}

      {tab === 'findings' && <section className="grid gap-4 lg:grid-cols-5"><div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><FileText className="h-4 w-4 text-emerald-300" />Sampling calculator mô phỏng</h2>{[['Số mẫu',sampleSize,setSampleSize],['Sai sót',errorCount,setErrorCount]].map(([label,value,setter]) => <label key={label as string} className="mb-3 block"><span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span><input type="number" value={value as number} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-emerald-400" /></label>)}<div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><p className="text-xs font-black uppercase text-amber-200">Tỷ lệ sai sót mô phỏng</p><p className="mt-2 text-3xl font-black text-white">{errorRate.toFixed(1)}%</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{conclusion}</p></div></div><div className="lg:col-span-3 space-y-4">{FINDING_TEMPLATES.map((item) => { const text = `${item.title}\nCondition: ${item.condition}\nCriteria: ${item.criteria}\nImpact: ${item.impact}\nRecommendation: ${item.recommendation}`; return <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="text-sm font-black text-white">Finding mẫu: {item.title}</h2><p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Condition: {item.condition}</p><p className="mt-1 text-xs font-semibold leading-6 text-amber-200">Impact: {item.impact}</p><p className="mt-1 text-xs font-semibold leading-6 text-emerald-200">Recommendation: {item.recommendation}</p><button onClick={() => copyText(item.title, text)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-emerald-400 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied === item.title ? 'Đã copy' : 'Copy finding mẫu'}</button></div>; })}</div></section>}

      {tab === 'followup' && <section className="grid gap-4 lg:grid-cols-2">{FOLLOW_UP_TRACKER.map((item) => <div key={item.finding} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Users className="mb-3 h-5 w-5 text-emerald-300" /><h2 className="text-sm font-black text-white">Follow-up mô phỏng: {item.finding}</h2><p className="text-xs font-semibold leading-6 text-slate-400">Owner mẫu: {item.owner}</p><p className="text-xs font-semibold leading-6 text-slate-400">Deadline mẫu: {item.deadline}</p><p className="mt-2 text-xs font-semibold leading-6 text-emerald-200">Evidence cần nộp: {item.evidence}</p></div>)}</section>}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200"><CheckCircle2 className="h-4 w-4" />Ranh giới module</h2><p className="text-xs font-semibold leading-7 text-slate-300">Đây là phòng lab mô phỏng kiểm toán nội bộ, dùng static data/offline-first để luyện tư duy. Nội dung chỉ nêu điểm cần kiểm tra và ngoại lệ kiểm soát, không thay quy trình kiểm toán, bằng chứng thật hoặc phê duyệt thực tế của người duyệt cuối.</p></section>
      {tab === 'deepdive' && <InternalAuditDeepDivePanel />}
    </div>
  );
}
