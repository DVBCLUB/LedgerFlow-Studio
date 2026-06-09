import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Copy,
  Map,
  MessageSquare,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  COMPETITOR_MAP,
  ICP_SEGMENTS,
  INTERVIEW_SCRIPT,
  MARKET_SCORECARD,
  SURVEY_QUESTIONS
} from '../data/marketSurveyKnowledge';

type SurveyTab = 'icp' | 'questions' | 'competitors' | 'scorecard';

export default function MarketSurveySimulator() {
  const [tab, setTab] = useState<SurveyTab>('icp');
  const [copied, setCopied] = useState<string | null>(null);
  const [painScore, setPainScore] = useState(9);
  const [willingnessScore, setWillingnessScore] = useState(6);
  const [frequencyScore, setFrequencyScore] = useState(8);
  const [competitionScore, setCompetitionScore] = useState(7);

  const marketFit = useMemo(() => {
    const score = Math.round((painScore * 0.35 + willingnessScore * 0.25 + frequencyScore * 0.25 + competitionScore * 0.15) * 10);
    const label = score >= 80 ? 'Nên test MVP ngay' : score >= 65 ? 'Có tiềm năng, cần phỏng vấn thêm' : 'Chưa đủ mạnh';
    return { score, label };
  }, [painScore, willingnessScore, frequencyScore, competitionScore]);

  const surveyBrief = `BẢN KHẢO SÁT THỊ TRƯỜNG LEDGERFLOW\n\nICP ưu tiên: kế toán dự án xây dựng, kế toán trưởng, thủ kho công trình, chủ doanh nghiệp xây dựng nhỏ.\nNỗi đau chính: chi phí công trình rời rạc, tạm ứng treo, thiếu chứng từ, lệch kho/dầu, báo cáo sếp chậm.\nMVP nên test: nhập chi phí + tạm ứng/hoàn ứng + hồ sơ thiếu + dashboard sếp.\nThông điệp bán hàng: giảm thời gian tổng hợp, thấy ngay rủi ro và không mất quyền kiểm soát số liệu.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: SurveyTab; label: string }[] = [
    { id: 'icp', label: 'ICP' },
    { id: 'questions', label: 'Questions' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'scorecard', label: 'Scorecard' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-orange-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-300">
              <Search className="h-3.5 w-3.5" />
              Market Survey Simulator
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Khảo sát thị trường phần mềm kế toán công trình
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này giúp kiểm tra thị trường trước khi code thêm: ai đau nhất, họ đang dùng gì,
              hỏi câu nào để lấy sự thật, đối thủ mạnh/yếu ở đâu, và MVP nào nên test trước.
              Trọng tâm không phải khảo sát cho vui, mà là tìm người sẵn sàng dùng thử và trả tiền.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', surveyBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-orange-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy brief khảo sát'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-orange-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'icp' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ICP_SEGMENTS.map((item) => (
            <div key={item.name} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Users className="mb-3 h-5 w-5 text-orange-300" />
              <h2 className="text-sm font-black text-white">{item.name}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Nỗi đau:</span> {item.pain}</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Kích hoạt mua:</span> {item.buyingTrigger}</p>
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-semibold leading-6 text-emerald-100">
                {item.message}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'questions' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <MessageSquare className="h-4 w-4 text-orange-300" />
              Câu hỏi phỏng vấn khách hàng
            </h2>
            <div className="space-y-3">
              {SURVEY_QUESTIONS.map((item) => (
                <div key={item.question} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.question}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Mục đích: {item.purpose}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Script gọi điện / nhắn tin
            </h2>
            <div className="space-y-3">
              {INTERVIEW_SCRIPT.map((line) => (
                <div key={line} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-slate-300">
                  {line}
                </div>
              ))}
            </div>
            <button
              onClick={() => copyText('script', INTERVIEW_SCRIPT.join('\n'))}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-orange-400 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied === 'script' ? 'Đã copy' : 'Copy script'}
            </button>
          </div>
        </section>
      )}

      {tab === 'competitors' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {COMPETITOR_MAP.map((item) => (
            <div key={item.type} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Map className="mb-3 h-5 w-5 text-purple-300" />
              <h2 className="text-sm font-black text-white">{item.type}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-emerald-300"><span className="font-black">Mạnh:</span> {item.strength}</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-rose-300"><span className="font-black">Yếu:</span> {item.weakness}</p>
              <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-semibold leading-6 text-cyan-100">
                Cơ hội: {item.opportunity}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'scorecard' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Target className="h-4 w-4 text-orange-300" />
              Market fit calculator
            </h2>
            <div className="space-y-4">
              {[
                ['Độ đau', painScore, setPainScore],
                ['Khả năng trả tiền', willingnessScore, setWillingnessScore],
                ['Tần suất dùng', frequencyScore, setFrequencyScore],
                ['Khác biệt với đối thủ', competitionScore, setCompetitionScore]
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{label as string}: {value as number}/10</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={value as number}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value))}
                    className="w-full accent-orange-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                <BarChart3 className="mb-3 h-5 w-5 text-orange-300" />
                <p className="text-[10px] font-black uppercase text-orange-200">Market fit score</p>
                <p className="mt-2 text-3xl font-black text-white">{marketFit.score}/100</p>
                <p className="mt-2 text-xs font-semibold text-slate-300">{marketFit.label}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <TrendingUp className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-[10px] font-black uppercase text-slate-500">MVP nên test</p>
                <p className="mt-2 text-sm font-black text-white">Chi phí + tạm ứng + hồ sơ thiếu + báo cáo sếp</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Đừng build full ERP trước khi có 5-10 khách xác nhận nỗi đau.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Scorecard nền
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {MARKET_SCORECARD.map((item) => (
                  <div key={item.factor} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <h3 className="text-xs font-black text-white">{item.factor}</h3>
                    <p className="mt-2 text-xl font-black text-orange-300">{item.score}/10</p>
                    <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Nguyên tắc khảo sát
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Đừng hỏi khách có thích phần mềm không. Hãy hỏi tháng trước họ mất bao nhiêu giờ, thiếu chứng từ ở đâu,
          ai nhập dữ liệu, ai duyệt chi, và nếu có bản demo giảm được việc đó thì họ có dùng thử ngay không.
        </p>
      </section>
    </div>
  );
}
