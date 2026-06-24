import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Flame,
  HelpCircle,
  PhoneCall,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import LeadPersonaCanvasPanel from './LeadPersonaCanvasPanel';
import {
  BEHAVIOR_SIGNALS,
  DISQUALIFY_RULES,
  LEAD_FIT_CRITERIA,
  NEXT_ACTION_RULES,
  QUALIFICATION_QUESTIONS,
} from '../../data/leadScoringKnowledge';

type LeadTab = 'criteria' | 'signals' | 'calculator' | 'queue' | 'persona_canvas';

type RangeControl = {
  label: string;
  value: number;
  setter: React.Dispatch<React.SetStateAction<number>>;
};

const sampleLeads = [
  { name: 'Kế toán trưởng SME', company: 'Công ty dịch vụ nhỏ', fit: 92, pain: 'Báo cáo sếp chậm, tạm ứng treo 300 triệu', next: 'Demo dashboard ngân sách và hoàn ứng.' },
  { name: 'Chủ doanh nghiệp sản phẩm số', company: 'Studio 30 nhân sự', fit: 85, pain: 'Không biết dự án/sản phẩm nào lãi/lỗ', next: 'Gửi brief 5 KPI cho sếp.' },
  { name: 'Ops/Admin lead', company: 'Team triển khai HCM', fit: 68, pain: 'Chứng từ và dữ liệu vận hành dễ lệch', next: 'Demo form nhập nhanh và exception board.' },
  { name: 'Sinh viên kế toán', company: 'Cá nhân', fit: 35, pain: 'Muốn học thử', next: 'Đưa vào nhóm nuôi dưỡng, chưa bán gói công ty.' },
];

export default function LeadScoringEngine() {
  const [tab, setTab] = useState<LeadTab>('criteria');
  const [copied, setCopied] = useState<string | null>(null);
  const [industryFit, setIndustryFit] = useState(9);
  const [painLevel, setPainLevel] = useState(9);
  const [authority, setAuthority] = useState(7);
  const [budget, setBudget] = useState(6);
  const [timing, setTiming] = useState(8);

  const score = useMemo(() => {
    return Math.round(industryFit * 2.5 + painLevel * 3 + authority * 2 + budget * 1.5 + timing * 1);
  }, [industryFit, painLevel, authority, budget, timing]);

  const scoreLabel = score >= 80 ? 'Hot lead' : score >= 60 ? 'Warm lead' : score >= 40 ? 'Nurture' : 'Low fit';
  const action = score >= 80
    ? 'Hẹn demo ngay trong ngày, xin file mẫu đã ẩn thông tin.'
    : score >= 60
      ? 'Gửi case đúng nỗi đau và hỏi 3 câu chẩn đoán.'
      : score >= 40
        ? 'Nuôi dưỡng bằng checklist/template.'
        : 'Không tốn nhiều thời gian follow-up.';

  const leadBrief = `LEAD SCORING LEDGERFLOW\n\nĐiểm lead: ${score}/100\nPhân loại: ${scoreLabel}\nHành động kế tiếp: ${action}\n\nTiêu chí: đúng ngành, nỗi đau rõ, có quyền quyết định, có khả năng trả tiền, timing phù hợp.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: LeadTab; label: string }[] = [
    { id: 'criteria', label: 'Criteria' },
    { id: 'signals', label: 'Signals' },
    { id: 'calculator', label: 'Calculator' },
    { id: 'queue', label: 'Action queue' },
    { id: 'persona_canvas', label: 'Persona/JTBD' },
  ];

  const controls: RangeControl[] = [
    { label: 'Đúng ngành', value: industryFit, setter: setIndustryFit },
    { label: 'Nỗi đau rõ', value: painLevel, setter: setPainLevel },
    { label: 'Quyền quyết định', value: authority, setter: setAuthority },
    { label: 'Khả năng trả tiền', value: budget, setter: setBudget },
    { label: 'Timing', value: timing, setter: setTiming },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-red-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-red-300">
              <Target className="h-3.5 w-3.5" />
              Lead Scoring Engine
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Chấm điểm lead Company OS để khỏi mất thời gian bán sai người
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này giúp ưu tiên lead có nỗi đau thật: dữ liệu vận hành rời rạc, tạm ứng treo, hồ sơ thiếu, báo cáo sếp chậm và thiếu daily brief. Điểm lead càng cao thì càng nên hẹn demo nhanh.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', leadBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-red-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy lead brief'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-red-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'criteria' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {LEAD_FIT_CRITERIA.map((item) => (
            <div key={item.factor} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <ShieldCheck className="mb-3 h-5 w-5 text-red-300" />
              <h2 className="text-sm font-black text-white">{item.factor}</h2>
              <p className="mt-2 text-2xl font-black text-red-300">{item.weight}%</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.detail}</p>
            </div>
          ))}
        </section>
      )}

      {tab === 'signals' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {BEHAVIOR_SIGNALS.map((item) => (
            <div key={item.signal} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Flame className="mb-3 h-5 w-5 text-amber-300" />
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-white">{item.signal}</h2>
                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-300">+{item.points}</span>
              </div>
              <p className="text-xs font-semibold leading-6 text-slate-400">{item.action}</p>
            </div>
          ))}

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <HelpCircle className="h-4 w-4 text-cyan-300" />
              Câu hỏi qualification
            </h2>
            <div className="grid gap-3 md:grid-cols-5">
              {QUALIFICATION_QUESTIONS.map((item) => (
                <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-semibold leading-6 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'calculator' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <TrendingUp className="h-4 w-4 text-red-300" />
              Lead score calculator
            </h2>
            <div className="space-y-4">
              {controls.map((control) => (
                <label key={control.label} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{control.label}: {control.value}/10</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={control.value}
                    onChange={(event) => control.setter(Number(event.target.value))}
                    className="w-full accent-red-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <Target className="mb-3 h-5 w-5 text-red-300" />
              <p className="text-[10px] font-black uppercase text-red-200">Lead score</p>
              <p className="mt-2 text-4xl font-black text-white">{score}/100</p>
              <p className="mt-2 text-sm font-black text-red-100">{scoreLabel}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <PhoneCall className="mb-3 h-5 w-5 text-emerald-300" />
              <p className="text-[10px] font-black uppercase text-emerald-200">Next action</p>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">{action}</p>
            </div>
            <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                Rule loại lead sớm
              </h2>
              <div className="grid gap-3 md:grid-cols-5">
                {DISQUALIFY_RULES.map((item) => (
                  <div key={item} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-semibold leading-6 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === 'queue' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Users className="h-4 w-4 text-red-300" />
              Lead mẫu
            </h2>
            <div className="space-y-3">
              {sampleLeads.map((lead) => (
                <div key={lead.name} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-white">{lead.name}</h3>
                    <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-300">{lead.fit}/100</span>
                  </div>
                  <p className="text-xs font-semibold leading-6 text-slate-400">{lead.company} · {lead.pain}</p>
                  <p className="mt-2 text-xs font-semibold leading-6 text-emerald-200">Next: {lead.next}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Action theo điểm
            </h2>
            <div className="space-y-3">
              {NEXT_ACTION_RULES.map((item) => (
                <div key={item.score} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-white">{item.label}</h3>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-400">{item.score}</span>
                  </div>
                  <p className="text-xs font-semibold leading-6 text-slate-400">{item.action}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'persona_canvas' && <LeadPersonaCanvasPanel />}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Nguyên tắc lead scoring
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Lead tốt không phải người khen sản phẩm hay. Lead tốt là người có nỗi đau rõ, có dữ liệu thật, có quyền kéo người quyết định vào demo và có khả năng trả tiền cho việc giảm lỗi/giảm thời gian.
        </p>
      </section>
    </div>
  );
}
