import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  MessageCircle,
  QrCode,
  Send,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  WalletCards
} from 'lucide-react';
import {
  ZALO_CAMPAIGN_PLAYBOOK,
  ZALO_COMPLIANCE_RULES,
  ZALO_MESSAGE_TEMPLATES,
  ZALO_ROI_ITEMS,
  ZALO_SEGMENTS
} from '../data/zaloMarketingKnowledge';

type ZaloTab = 'segments' | 'templates' | 'playbook' | 'roi';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export default function ZaloMarketingHub() {
  const [tab, setTab] = useState<ZaloTab>('segments');
  const [copied, setCopied] = useState<string | null>(null);
  const [audience, setAudience] = useState(1200);
  const [sendCost, setSendCost] = useState(180);
  const [demoRate, setDemoRate] = useState(6);
  const [closeRate, setCloseRate] = useState(18);
  const [avgPrice, setAvgPrice] = useState(599000);

  const roi = useMemo(() => {
    const cost = audience * sendCost;
    const demos = Math.round(audience * demoRate / 100);
    const wins = Math.round(demos * closeRate / 100);
    const revenue = wins * avgPrice;
    return { cost, demos, wins, revenue, profit: revenue - cost };
  }, [audience, sendCost, demoRate, closeRate, avgPrice]);

  const zaloBrief = `ZALO MARKETING LEDGERFLOW\n\nTệp gửi: kế toán trưởng, kế toán dự án, thủ kho/chỉ huy trưởng, chủ doanh nghiệp.\nNội dung ưu tiên: nhắc demo, nhắc chứng từ thiếu, onboarding 7 ngày, báo cáo sếp 5 KPI.\nKhông spam khuyến mãi đại trà. Mỗi tin phải có mục đích nghiệp vụ rõ.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: ZaloTab; label: string }[] = [
    { id: 'segments', label: 'Segments' },
    { id: 'templates', label: 'Templates' },
    { id: 'playbook', label: 'Playbook' },
    { id: 'roi', label: 'ROI' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-300">
              <MessageCircle className="h-3.5 w-3.5" />
              Zalo Marketing Hub
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Zalo cho onboarding, nhắc chứng từ và demo phần mềm kế toán
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này dùng Zalo như kênh chăm sóc nghiệp vụ, không phải spam quảng cáo.
              Nội dung tập trung vào nhắc lịch demo, nhắc hồ sơ thiếu, onboarding dùng thử và báo cáo sếp 5 KPI.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', zaloBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-blue-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy Zalo brief'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-blue-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'segments' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ZALO_SEGMENTS.map((item) => (
            <div key={item.segment} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Users className="mb-3 h-5 w-5 text-blue-300" />
              <h2 className="text-sm font-black text-white">{item.segment}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Dùng để:</span> {item.use}</p>
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold leading-6 text-amber-100">
                {item.caution}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'templates' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {ZALO_MESSAGE_TEMPLATES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Send className="mb-3 h-5 w-5 text-blue-300" />
              <h2 className="text-sm font-black text-white">{item.title}</h2>
              <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-300">{item.text}</p>
              <button onClick={() => copyText(item.title, item.text)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-blue-400 hover:text-white">
                <Copy className="h-3.5 w-3.5" />
                {copied === item.title ? 'Đã copy' : 'Copy mẫu tin'}
              </button>
            </div>
          ))}
        </section>
      )}

      {tab === 'playbook' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Playbook 14 ngày
            </h2>
            <div className="space-y-3">
              {ZALO_CAMPAIGN_PLAYBOOK.map((item) => (
                <div key={item.day} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-white">{item.day}</h3>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black text-blue-300">{item.metric}</span>
                  </div>
                  <p className="text-xs font-semibold leading-6 text-slate-400">{item.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Quy tắc gửi tin
            </h2>
            <div className="space-y-3">
              {ZALO_COMPLIANCE_RULES.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p className="text-xs font-semibold leading-6 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'roi' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <WalletCards className="h-4 w-4 text-blue-300" />
              Zalo ROI calculator
            </h2>
            <div className="space-y-4">
              {[
                ['Số người nhận', audience, setAudience],
                ['Chi phí/tin', sendCost, setSendCost],
                ['Demo rate %', demoRate, setDemoRate],
                ['Close rate %', closeRate, setCloseRate],
                ['Giá gói/tháng', avgPrice, setAvgPrice]
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span>
                  <input
                    type="number"
                    value={value as number}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-blue-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Smartphone className="mb-3 h-5 w-5 text-blue-300" /><p className="text-xs text-slate-400">Chi phí gửi</p><p className="text-2xl font-black text-white">{money(roi.cost)}đ</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><QrCode className="mb-3 h-5 w-5 text-cyan-300" /><p className="text-xs text-slate-400">Demo dự kiến</p><p className="text-2xl font-black text-white">{roi.demos}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><TrendingUp className="mb-3 h-5 w-5 text-emerald-300" /><p className="text-xs text-slate-400">Khách trả phí</p><p className="text-2xl font-black text-white">{roi.wins}</p></div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><WalletCards className="mb-3 h-5 w-5 text-emerald-300" /><p className="text-xs text-emerald-200">Lợi ích ròng</p><p className="text-2xl font-black text-white">{money(roi.profit)}đ</p></div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white">Zalo tạo ROI ở đâu</h2>
            <div className="grid gap-3 md:grid-cols-4">
              {ZALO_ROI_ITEMS.map((item) => (
                <div key={item.item} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.item}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.effect}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <AlertTriangle className="h-4 w-4" />
          Nguyên tắc Zalo
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Zalo tốt nhất khi dùng để nhắc đúng việc, đúng người, đúng thời điểm: demo, chứng từ thiếu, onboarding,
          báo cáo sếp. Đừng biến Zalo thành kênh spam khuyến mãi đại trà.
        </p>
      </section>
    </div>
  );
}
