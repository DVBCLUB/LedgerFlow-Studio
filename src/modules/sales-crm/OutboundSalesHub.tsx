import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Copy, Mail, MessageSquare, PhoneCall, Send, Target, TrendingUp, Users } from 'lucide-react';
import OutboundBattleCardsPanel from './OutboundBattleCardsPanel';
import {
  COLD_MESSAGES,
  DISCOVERY_QUESTIONS,
  OBJECTIONS,
  OUTBOUND_ICP,
  PIPELINE_STAGES,
  SALES_SEQUENCE,
} from '../../data/outboundSalesKnowledge';

type SalesTab = 'icp' | 'sequence' | 'objections' | 'pipeline' | 'battle_cards';

type NumericControl = {
  label: string;
  value: number;
  setter: React.Dispatch<React.SetStateAction<number>>;
};

export default function OutboundSalesHub() {
  const [tab, setTab] = useState<SalesTab>('icp');
  const [copied, setCopied] = useState<string | null>(null);
  const [leads, setLeads] = useState(80);
  const [replyRate, setReplyRate] = useState(12);
  const [demoRate, setDemoRate] = useState(35);
  const [closeRate, setCloseRate] = useState(22);

  const replies = Math.round((leads * replyRate) / 100);
  const demos = Math.round((replies * demoRate) / 100);
  const wins = Math.round((demos * closeRate) / 100);

  const outboundBrief = `KỊCH BẢN OUTBOUND LEDGERFLOW\n\nICP: solo founder, kế toán trưởng SME, kế toán dịch vụ, chủ doanh nghiệp dịch vụ/thương mại/xây dựng nhỏ.\nThông điệp: không thay phần mềm kế toán hiện tại; LedgerFlow thêm lớp Company OS để thấy daily brief, tạm ứng treo, hồ sơ thiếu, chi phí vượt ngân sách và việc cần duyệt.\nCTA: xin demo 15 phút bằng dữ liệu mẫu hoặc file đã ẩn thông tin.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: SalesTab; label: string }[] = [
    { id: 'icp', label: 'ICP' },
    { id: 'sequence', label: 'Sequence' },
    { id: 'objections', label: 'Objections' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'battle_cards', label: 'Battle cards' },
  ];

  const metricControls: NumericControl[] = [
    { label: 'Số lead', value: leads, setter: setLeads },
    { label: 'Reply rate %', value: replyRate, setter: setReplyRate },
    { label: 'Demo rate %', value: demoRate, setter: setDemoRate },
    { label: 'Close rate %', value: closeRate, setter: setCloseRate },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-sky-300">
              <Send className="h-3.5 w-3.5" />
              Outbound Sales Hub
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Kịch bản bán hàng cho LedgerFlow Company OS
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này giúp tiếp cận đúng khách: solo founder, kế toán trưởng SME, kế toán dịch vụ và chủ doanh nghiệp có dữ liệu vận hành rời rạc. Trọng tâm là nói đúng nỗi đau, xin demo ngắn, xử lý phản đối và ghi lại lý do thắng/thua.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', outboundBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-sky-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy outbound brief'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-sky-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<Users className="mb-3 h-5 w-5 text-sky-300" />} label="Leads" value={leads} />
        <StatCard icon={<Mail className="mb-3 h-5 w-5 text-cyan-300" />} label="Replies" value={replies} />
        <StatCard icon={<PhoneCall className="mb-3 h-5 w-5 text-emerald-300" />} label="Demos" value={demos} />
        <StatCard icon={<TrendingUp className="mb-3 h-5 w-5 text-emerald-300" />} label="Wins" value={wins} highlight />
      </section>

      {tab === 'icp' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {OUTBOUND_ICP.map((item) => (
            <div key={item.target} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Target className="mb-3 h-5 w-5 text-sky-300" />
              <h2 className="text-sm font-black text-white">{item.target}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">
                <span className="font-black text-slate-200">Nỗi đau:</span> {item.pain}
              </p>
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-semibold leading-6 text-emerald-100">
                Hook: {item.hook}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'sequence' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <MessageSquare className="h-4 w-4 text-sky-300" />
              Tin nhắn mẫu
            </h2>
            <div className="space-y-3">
              {COLD_MESSAGES.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.text}</p>
                  <button onClick={() => copyText(item.title, item.text)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-sky-400 hover:text-white">
                    <Copy className="h-3.5 w-3.5" />
                    {copied === item.title ? 'Đã copy' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Sequence 14 ngày
            </h2>
            <div className="space-y-3">
              {SALES_SEQUENCE.map((item) => (
                <div key={item.day} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.day} · {item.touch}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.goal}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'objections' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {OBJECTIONS.map((item) => (
            <div key={item.objection} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <AlertTriangle className="mb-3 h-5 w-5 text-amber-300" />
              <h2 className="text-sm font-black text-amber-100">{item.objection}</h2>
              <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.response}</p>
            </div>
          ))}

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Câu hỏi chẩn đoán trước demo
            </h2>
            <div className="grid gap-3 md:grid-cols-5">
              {DISCOVERY_QUESTIONS.map((item) => (
                <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-semibold leading-6 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'pipeline' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              Funnel calculator
            </h2>
            <div className="space-y-4">
              {metricControls.map((control) => (
                <label key={control.label} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{control.label}</span>
                  <input
                    type="number"
                    value={control.value}
                    onChange={(event) => control.setter(Number(event.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-sky-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Pipeline stages
            </h2>
            <div className="space-y-3">
              {PIPELINE_STAGES.map((item) => (
                <div key={item.stage} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.stage}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">
                    <span className="font-black text-slate-200">Tiêu chí:</span> {item.criteria}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-6 text-emerald-200">
                    <span className="font-black">Bước kế:</span> {item.next}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'battle_cards' && <OutboundBattleCardsPanel />}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Nguyên tắc outbound
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Đừng bán phần mềm ngay. Hãy bán một buổi demo giải quyết đúng một nỗi đau: báo cáo sếp chậm, tạm ứng treo, hồ sơ thiếu, hoặc dữ liệu rời rạc. Sau demo mới nói giá.
        </p>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/70'}`}>
      {icon}
      <p className={`text-[10px] font-black uppercase ${highlight ? 'text-emerald-200' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
