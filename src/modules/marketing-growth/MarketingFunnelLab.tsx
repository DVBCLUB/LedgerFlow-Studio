import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Megaphone,
  MousePointerClick,
  Target,
  TrendingUp,
  Users,
  WalletCards
} from 'lucide-react';
import {
  CHANNELS,
  CONTENT_ANGLES,
  CTA_LIBRARY,
  FUNNEL_FIXES,
  FUNNEL_STAGES
} from '../../data/marketingFunnelKnowledge';

type FunnelTab = 'funnel' | 'channels' | 'content' | 'calculator';

export default function MarketingFunnelLab() {
  const [tab, setTab] = useState<FunnelTab>('funnel');
  const [copied, setCopied] = useState<string | null>(null);
  const [traffic, setTraffic] = useState(1000);
  const [leadRate, setLeadRate] = useState(8);
  const [demoRate, setDemoRate] = useState(30);
  const [proposalRate, setProposalRate] = useState(60);
  const [closeRate, setCloseRate] = useState(25);
  const [avgPrice, setAvgPrice] = useState(599000);

  const metrics = useMemo(() => {
    const leads = Math.round(traffic * leadRate / 100);
    const demos = Math.round(leads * demoRate / 100);
    const proposals = Math.round(demos * proposalRate / 100);
    const paid = Math.round(proposals * closeRate / 100);
    const mrr = paid * avgPrice;
    return { leads, demos, proposals, paid, mrr };
  }, [traffic, leadRate, demoRate, proposalRate, closeRate, avgPrice]);

  const funnelBrief = `MARKETING FUNNEL LEDGERFLOW\n\nTraffic: ${traffic}\nLeads: ${metrics.leads}\nDemos: ${metrics.demos}\nProposals: ${metrics.proposals}\nPaid customers: ${metrics.paid}\nMRR ước tính: ${new Intl.NumberFormat('vi-VN').format(metrics.mrr)}đ\n\nƯu tiên: nội dung Company OS, daily brief, hồ sơ thiếu, báo cáo sếp, accounting templates đa ngành; CTA demo 15 phút hoặc checklist miễn phí.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: FunnelTab; label: string }[] = [
    { id: 'funnel', label: 'Funnel' },
    { id: 'channels', label: 'Channels' },
    { id: 'content', label: 'Content' },
    { id: 'calculator', label: 'Calculator' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-violet-300">
              <Megaphone className="h-3.5 w-3.5" />
              Marketing Funnel Lab
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Phễu marketing cho LedgerFlow Company OS
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này nối marketing với sales: traffic → lead → demo → proposal → paid.
              Trọng tâm là nội dung đúng nỗi đau solo founder/SME, CTA ít rào cản, demo ngắn và đo rò rỉ ở từng bước.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', funnelBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-violet-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy funnel brief'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-violet-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <MousePointerClick className="mb-3 h-5 w-5 text-violet-300" />
          <p className="text-[10px] font-black uppercase text-slate-500">Traffic</p>
          <p className="mt-2 text-3xl font-black text-white">{traffic}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <Users className="mb-3 h-5 w-5 text-cyan-300" />
          <p className="text-[10px] font-black uppercase text-slate-500">Leads</p>
          <p className="mt-2 text-3xl font-black text-white">{metrics.leads}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <Target className="mb-3 h-5 w-5 text-emerald-300" />
          <p className="text-[10px] font-black uppercase text-slate-500">Demos</p>
          <p className="mt-2 text-3xl font-black text-white">{metrics.demos}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <ClipboardList className="mb-3 h-5 w-5 text-amber-300" />
          <p className="text-[10px] font-black uppercase text-slate-500">Proposals</p>
          <p className="mt-2 text-3xl font-black text-white">{metrics.proposals}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <WalletCards className="mb-3 h-5 w-5 text-emerald-300" />
          <p className="text-[10px] font-black uppercase text-emerald-200">MRR</p>
          <p className="mt-2 text-2xl font-black text-white">{new Intl.NumberFormat('vi-VN').format(metrics.mrr)}đ</p>
        </div>
      </section>

      {tab === 'funnel' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <TrendingUp className="h-4 w-4 text-violet-300" />
              Các tầng phễu
            </h2>
            <div className="space-y-3">
              {FUNNEL_STAGES.map((item) => (
                <div key={item.stage} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.stage}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Mục tiêu:</span> {item.goal}</p>
                  <p className="mt-1 text-xs font-semibold leading-6 text-cyan-200"><span className="font-black">Metric:</span> {item.metric}</p>
                  <p className="mt-1 text-xs font-semibold leading-6 text-amber-200"><span className="font-black">Rò rỉ:</span> {item.leak}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              Cách vá rò rỉ
            </h2>
            <div className="space-y-3">
              {FUNNEL_FIXES.map((item) => (
                <div key={item.problem} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="text-sm font-black text-amber-100">{item.problem}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{item.fix}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'channels' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {CHANNELS.map((item) => (
            <div key={item.channel} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Megaphone className="mb-3 h-5 w-5 text-violet-300" />
              <h2 className="text-sm font-black text-white">{item.channel}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Hợp cho:</span> {item.bestFor}</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-emerald-200">Nội dung: {item.content}</p>
            </div>
          ))}
        </section>
      )}

      {tab === 'content' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Target className="h-4 w-4 text-violet-300" />
              Góc nội dung nên chạy
            </h2>
            <div className="space-y-3">
              {CONTENT_ANGLES.map((item) => (
                <div key={item.angle} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.angle}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Hook: {item.hook}</p>
                  <p className="mt-1 text-xs font-semibold leading-6 text-emerald-200">Offer: {item.offer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              CTA library
            </h2>
            <div className="space-y-3">
              {CTA_LIBRARY.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.text}</p>
                  <p className="mt-1 text-xs font-semibold leading-6 text-cyan-200">{item.why}</p>
                  <button onClick={() => copyText(item.title, item.text)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-violet-400 hover:text-white">
                    <Copy className="h-3.5 w-3.5" />
                    {copied === item.title ? 'Đã copy' : 'Copy CTA'}
                  </button>
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
              <TrendingUp className="h-4 w-4 text-violet-300" />
              Funnel calculator
            </h2>
            <div className="space-y-4">
              {[
                ['Traffic', traffic, setTraffic],
                ['Lead rate %', leadRate, setLeadRate],
                ['Demo rate %', demoRate, setDemoRate],
                ['Proposal rate %', proposalRate, setProposalRate],
                ['Close rate %', closeRate, setCloseRate],
                ['Giá trung bình/tháng', avgPrice, setAvgPrice]
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span>
                  <input
                    type="number"
                    value={value as number}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-violet-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white">Kết quả dự kiến</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs text-slate-400">Leads</p><p className="text-2xl font-black text-white">{metrics.leads}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs text-slate-400">Demos</p><p className="text-2xl font-black text-white">{metrics.demos}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs text-slate-400">Paid</p><p className="text-2xl font-black text-white">{metrics.paid}</p></div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-xs text-emerald-200">MRR</p><p className="text-2xl font-black text-white">{new Intl.NumberFormat('vi-VN').format(metrics.mrr)}đ</p></div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Nguyên tắc funnel
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Funnel tốt không bắt đầu bằng “phần mềm của tôi có nhiều tính năng”. Nó bắt đầu bằng một nỗi đau rõ:
          tạm ứng treo, hồ sơ thiếu, báo cáo sếp chậm, dữ liệu rời rạc. Mỗi bước phải có CTA nhỏ và đo được.
        </p>
      </section>
    </div>
  );
}
