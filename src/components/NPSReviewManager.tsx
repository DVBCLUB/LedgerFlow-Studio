import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Frown,
  Heart,
  MessageSquare,
  Search,
  ShieldCheck,
  Smile,
  Star,
  Users
} from 'lucide-react';
import {
  FEEDBACK_CATEGORIES,
  NPS_QUESTIONS,
  NPS_SEGMENTS,
  PRODUCT_IMPROVEMENT_LOOP,
  REVIEW_RESPONSE_TEMPLATES
} from '../data/npsReviewKnowledge';

type NpsTab = 'survey' | 'insights' | 'responses' | 'loop';

type Feedback = {
  id: number;
  name: string;
  company: string;
  score: number;
  text: string;
  status: 'new' | 'reviewing' | 'resolved';
};

const initialFeedbacks: Feedback[] = [
  { id: 1, name: 'Kế toán dự án A', company: 'Công ty dịch vụ nhỏ', score: 9, text: 'Dashboard tạm ứng và hồ sơ thiếu giúp báo cáo sếp nhanh hơn.', status: 'resolved' },
  { id: 2, name: 'Ops/Admin lead', company: 'Team triển khai HCM', score: 6, text: 'Form nhập chi phí còn hơi nhiều trường, muốn nhập nhanh trên điện thoại.', status: 'reviewing' },
  { id: 3, name: 'Kế toán trưởng', company: 'Công ty thương mại', score: 8, text: 'Cảnh báo VAT tốt, nhưng cần log người sửa dữ liệu rõ hơn.', status: 'new' },
  { id: 4, name: 'HCNS', company: 'Văn phòng công ty', score: 5, text: 'Báo cáo chi phí hành chính chưa giống mẫu sếp đang dùng.', status: 'new' }
];

export default function NPSReviewManager() {
  const [tab, setTab] = useState<NpsTab>('survey');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [score, setScore] = useState(8);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [text, setText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const nps = useMemo(() => {
    const total = feedbacks.length || 1;
    const promoters = feedbacks.filter((f) => f.score >= 9).length;
    const detractors = feedbacks.filter((f) => f.score <= 6).length;
    const passives = feedbacks.length - promoters - detractors;
    const scoreValue = Math.round((promoters / total) * 100 - (detractors / total) * 100);
    return { promoters, passives, detractors, scoreValue };
  }, [feedbacks]);

  const addFeedback = () => {
    if (!name.trim() || !text.trim()) return;
    setFeedbacks([
      { id: Date.now(), name, company: company || 'Chưa rõ', score, text, status: 'new' },
      ...feedbacks
    ]);
    setName('');
    setCompany('');
    setText('');
    setScore(8);
  };

  const copyText = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: NpsTab; label: string }[] = [
    { id: 'survey', label: 'Survey' },
    { id: 'insights', label: 'Insights' },
    { id: 'responses', label: 'Responses' },
    { id: 'loop', label: 'Improvement loop' }
  ];

  const npsBrief = `BÁO CÁO NPS\n\nNPS hiện tại: ${nps.scoreValue}\nPromoters: ${nps.promoters}\nPassives: ${nps.passives}\nDetractors: ${nps.detractors}\n\nƯu tiên: gọi khách chấm thấp, phân loại feedback thành bug/UX/nghiệp vụ/báo cáo, rồi báo lại sau khi sửa.`;

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-pink-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-pink-300">
              <Heart className="h-3.5 w-3.5" />
              NPS & Review Manager
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Đo hài lòng khách hàng và biến góp ý thành backlog
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này dùng để gom NPS, review, khiếu nại và yêu cầu tính năng cho LedgerFlow Company OS.
              Mục tiêu không phải lấy điểm cho đẹp, mà là phát hiện khách sắp rời bỏ, sửa đúng điểm đau,
              và biến khách hài lòng thành testimonial/referral.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', npsBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-pink-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy báo cáo NPS'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-pink-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-5">
          <Star className="mb-3 h-5 w-5 text-pink-300" />
          <p className="text-[10px] font-black uppercase text-pink-200">NPS</p>
          <p className="mt-2 text-3xl font-black text-white">{nps.scoreValue}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <Smile className="mb-3 h-5 w-5 text-emerald-300" />
          <p className="text-[10px] font-black uppercase text-emerald-200">Promoters</p>
          <p className="mt-2 text-3xl font-black text-white">{nps.promoters}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <Users className="mb-3 h-5 w-5 text-amber-300" />
          <p className="text-[10px] font-black uppercase text-amber-200">Passives</p>
          <p className="mt-2 text-3xl font-black text-white">{nps.passives}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
          <Frown className="mb-3 h-5 w-5 text-rose-300" />
          <p className="text-[10px] font-black uppercase text-rose-200">Detractors</p>
          <p className="mt-2 text-3xl font-black text-white">{nps.detractors}</p>
        </div>
      </section>

      {tab === 'survey' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <MessageSquare className="h-4 w-4 text-pink-300" />
              Thêm phản hồi mẫu
            </h2>
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên người phản hồi" className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-pink-400" />
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Công ty / vai trò" className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-pink-400" />
              <label className="block text-xs font-black text-slate-400">Điểm NPS: {score}/10</label>
              <input type="range" min="0" max="10" value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full accent-pink-400" />
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Lý do chấm điểm" className="h-28 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-pink-400" />
              <button onClick={addFeedback} className="w-full rounded-xl bg-pink-400 px-4 py-3 text-xs font-black text-slate-950">Thêm feedback</button>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Câu hỏi NPS nên dùng
            </h2>
            <div className="space-y-3">
              {NPS_QUESTIONS.map((question) => (
                <div key={question} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-slate-300">
                  {question}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'insights' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Search className="h-4 w-4 text-emerald-300" />
              Phân loại NPS
            </h2>
            <div className="space-y-3">
              {NPS_SEGMENTS.map((item) => (
                <div key={item.group} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.group}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.meaning}</p>
                  <p className="mt-2 text-xs font-semibold leading-6 text-emerald-200">Hành động: {item.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              Chủ đề feedback thường gặp
            </h2>
            <div className="space-y-3">
              {FEEDBACK_CATEGORIES.map((item) => (
                <div key={item.name} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="text-sm font-black text-amber-100">{item.name}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Tín hiệu: {item.signal}</p>
                  <p className="mt-2 text-xs font-semibold leading-6 text-emerald-200">Cách sửa: {item.fix}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'responses' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {REVIEW_RESPONSE_TEMPLATES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                <MessageSquare className="h-4 w-4 text-pink-300" />
                {item.title}
              </h2>
              <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-300">{item.text}</p>
              <button onClick={() => copyText(item.title, item.text)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-pink-400 px-3 py-2 text-[11px] font-black text-slate-950">
                <Copy className="h-3.5 w-3.5" />
                {copied === item.title ? 'Đã copy' : 'Copy mẫu trả lời'}
              </button>
            </div>
          ))}
        </section>
      )}

      {tab === 'loop' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Vòng lặp cải tiến sản phẩm
            </h2>
            <div className="space-y-3">
              {PRODUCT_IMPROVEMENT_LOOP.map((item) => (
                <div key={item.step} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.step}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Feedback inbox
            </h2>
            <div className="space-y-3">
              {feedbacks.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-black text-white">{item.name}</h3>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black text-pink-300">{item.score}/10</span>
                  </div>
                  <p className="text-xs font-semibold leading-6 text-slate-400">{item.text}</p>
                  <p className="mt-2 text-[10px] font-black uppercase text-slate-500">{item.company} · {item.status}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Nguyên tắc xử lý feedback
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Feedback xấu không phải thất bại. Nó là dữ liệu ưu tiên sản phẩm. Với phần mềm kế toán,
          hãy sửa trước những phản hồi liên quan tiền, chứng từ, báo cáo sếp, bảo mật và thao tác nhập liệu hằng ngày.
        </p>
      </section>
    </div>
  );
}
