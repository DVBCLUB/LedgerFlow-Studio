import React, { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Megaphone, Sparkles, Target, TrendingUp } from 'lucide-react';
import {
  BATTLE_CARD_BRIEFS,
  CHANNEL_KPIS,
  MARKETING_DAILY_BRIEF_TEMPLATE,
  MARKETING_SCORECARD,
} from '../../data/marketingCommandKnowledge';

type MarketingTab = 'daily' | 'channels' | 'scorecard' | 'battlecards' | 'ai_brief';

type AIChatResponse = {
  success?: boolean;
  text?: string;
  content?: string;
  output?: string;
  error?: string;
};

const tabs: { id: MarketingTab; label: string }[] = [
  { id: 'daily', label: 'Tóm tắt hôm nay' },
  { id: 'channels', label: 'Hiệu quả kênh' },
  { id: 'scorecard', label: 'Bảng điểm' },
  { id: 'battlecards', label: 'Luận điểm bán hàng' },
  { id: 'ai_brief', label: 'Tóm tắt từ AI' },
];

export default function MarketingCommandCenter() {
  const [activeTab, setActiveTab] = useState<MarketingTab>('daily');
  const dailySummary = useMemo(() => MARKETING_DAILY_BRIEF_TEMPLATE.slice(0, 5), []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-400/30 bg-sky-400/10 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">
          Tăng trưởng · tổng quan
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Tổng quan tăng trưởng</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
          Tổng hợp kênh, bảng điểm, tóm tắt hôm nay và luận điểm bán hàng cho LedgerFlow.
          Đây là màn điều phối tăng trưởng chạy cục bộ, chưa thay thế CRM hoặc báo cáo dữ liệu thật.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-5">
        <StatCard label="Kênh" value={CHANNEL_KPIS.length.toString()} icon={<Megaphone size={18} />} />
        <StatCard label="Câu hỏi hôm nay" value={MARKETING_DAILY_BRIEF_TEMPLATE.length.toString()} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Bảng điểm" value={MARKETING_SCORECARD.length.toString()} icon={<BarChart3 size={18} />} />
        <StatCard label="Luận điểm" value={BATTLE_CARD_BRIEFS.length.toString()} icon={<Target size={18} />} />
        <StatCard label="Tóm tắt AI" value="Sẵn sàng" icon={<Sparkles size={18} />} />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl px-4 py-2 text-xs font-black transition-colors ${
              activeTab === tab.id
                ? 'bg-sky-300 text-slate-950'
                : 'border border-slate-800 text-slate-400 hover:border-sky-400/50 hover:text-sky-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && <DailyBrief items={dailySummary} />}
      {activeTab === 'channels' && <ChannelGrid />}
      {activeTab === 'scorecard' && <Scorecard />}
      {activeTab === 'battlecards' && <BattleCards />}
      {activeTab === 'ai_brief' && <AIBriefConsole />}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="flex items-center justify-between gap-3 text-sky-200">
        {icon}
        <span className="text-2xl font-black text-white">{value}</span>
      </div>
      <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function DailyBrief({ items }: { items: typeof MARKETING_DAILY_BRIEF_TEMPLATE }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article key={item.section} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">{item.owner}</p>
          <h3 className="mt-2 text-lg font-black text-white">{item.section}</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">{item.question}</p>
          <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-sky-200">Kết quả cần quyết định</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{item.output}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ChannelGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {CHANNEL_KPIS.map((channel) => (
        <article key={channel.channel} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl">{channel.emoji}</p>
              <h3 className="mt-2 text-lg font-black text-white">{channel.channel}</h3>
            </div>
            <span className="rounded-2xl border border-sky-400/25 px-3 py-1 text-xs font-black text-sky-200">
              {channel.benchmarkGood}
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-sky-200">Chỉ số chính: {channel.primaryMetric}</p>
          <ul className="mt-3 space-y-2">
            {channel.secondaryMetrics.map((metric) => (
              <li key={metric} className="flex gap-2 text-sm font-semibold text-slate-300">
                <TrendingUp size={14} className="mt-1 shrink-0 text-sky-300" /> {metric}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Chi phí: {channel.costStructure}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">VN: {channel.vietnamNote}</p>
        </article>
      ))}
    </div>
  );
}

function Scorecard() {
  return (
    <div className="space-y-3">
      {MARKETING_SCORECARD.map((item) => (
        <div key={item.metric} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_0.7fr_0.7fr]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.category}</p>
              <h3 className="mt-1 text-lg font-black text-white">{item.metric}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{item.whyItMatters}</p>
            </div>
            <InfoBox label="Mục tiêu" value={item.target} />
            <InfoBox label="Khi thấp cần làm" value={item.actionWhenLow} warning />
          </div>
        </div>
      ))}
    </div>
  );
}

function BattleCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {BATTLE_CARD_BRIEFS.map((card) => (
        <article key={card.competitor} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Luận điểm cạnh tranh</p>
          <h3 className="mt-2 text-xl font-black text-white">{card.competitor}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoBox label="Đối thủ thắng khi" value={card.theyWinWhen} />
            <InfoBox label="Ta thắng khi" value={card.weWinWhen} />
          </div>
          <div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-200">Luận điểm nói chuyện</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{card.talkingPoint}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function AIBriefConsole() {
  const [context, setContext] = useState(
    'LedgerFlow đang chuẩn bị launch Marketing V2: landing copy, email sequence, PLG hub, battle cards và persona/JTBD. Chưa có dữ liệu analytics thật, dùng static playbook trước.',
  );
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const prompt = useMemo(
    () => buildMarketingBriefPrompt(context),
    [context],
  );

  const runBrief = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction:
            'Bạn là Growth Marketer và Chief of Staff cho B2B SaaS Việt Nam. Trả lời ngắn, rõ, hành động được. Không bịa số liệu; nếu chưa có dữ liệu thật thì ghi rõ là giả định/offline playbook.',
          history: [],
          model: 'ai-assistant-pro',
        }),
      });
      const data = (await response.json()) as AIChatResponse;
      const text = data.text ?? data.content ?? data.output;
      if (!response.ok || !text) {
        throw new Error(data.error ?? 'AI Gateway chưa trả về nội dung.');
      }
      setBrief(text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không gọi được AI Gateway.';
      setError(`${message} Đang dùng daily brief offline.`);
      setBrief(buildOfflineMarketingBrief(context));
    } finally {
      setLoading(false);
    }
  };

  const copyBrief = async () => {
    await navigator.clipboard?.writeText(brief || prompt);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Đầu vào tóm tắt AI</p>
        <textarea
          value={context}
          onChange={(event) => setContext(event.target.value)}
          className="mt-3 min-h-[220px] w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm font-semibold leading-6 text-white outline-none focus:border-sky-400"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={runBrief}
            disabled={loading}
            className="rounded-2xl bg-sky-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Đang tạo tóm tắt...' : 'Tạo tóm tắt AI'}
          </button>
          <button
            onClick={copyBrief}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-sky-400/60 hover:text-sky-200"
          >
            Sao chép tóm tắt/prompt
          </button>
        </div>
        {error && <p className="mt-3 text-xs font-semibold leading-5 text-amber-200">{error}</p>}
      </div>
      <div className="rounded-3xl border border-sky-400/25 bg-sky-400/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Kết quả sẵn sàng duyệt</p>
            <h3 className="mt-1 text-lg font-black text-white">Tóm tắt tăng trưởng hôm nay</h3>
          </div>
          <Sparkles size={20} className="text-sky-200" />
        </div>
        <pre className="mt-4 max-h-[460px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs font-semibold leading-6 text-slate-300">
          {brief || prompt}
        </pre>
      </div>
    </section>
  );
}

function buildMarketingBriefPrompt(context: string) {
  const questions = MARKETING_DAILY_BRIEF_TEMPLATE.map(
    (item) => `- ${item.section} (${item.owner}): ${item.question} → ${item.output}`,
  ).join('\n');
  const scorecard = MARKETING_SCORECARD.map(
    (item) => `- ${item.metric}: target ${item.target}; nếu thấp thì ${item.actionWhenLow}`,
  ).join('\n');

  return `Tạo Marketing Daily Brief cho LedgerFlow Studio.\n\nBối cảnh hiện tại:\n${context}\n\nCâu hỏi daily brief cần trả lời:\n${questions}\n\nScorecard cần xem:\n${scorecard}\n\nOutput bằng tiếng Việt, format markdown:\n1. Tình hình hôm nay\n2. 3 ưu tiên marketing hôm nay\n3. Kênh cần tập trung\n4. Rủi ro/giả định chưa có dữ liệu\n5. Next action trong 24 giờ\n\nKhông bịa số liệu. Nếu chưa có tracking thật, ghi rõ là dùng playbook offline-first.`;
}

function buildOfflineMarketingBrief(context: string) {
  return `**MARKETING DAILY BRIEF — OFFLINE FALLBACK**\n\n**Bối cảnh:** ${context}\n\n**Tình hình hôm nay:** Marketing V2 đã có nền: Landing Copy, Email Sequence, PLG, Battle Cards, Persona/JTBD và Marketing Command Center. Dữ liệu analytics thật chưa nối, nên các quyết định đang dựa trên playbook offline-first.\n\n**3 ưu tiên:**\n1. Nối MarketingGrowthV2Workspace vào MarketingSuite để user bấm được.\n2. Tạo landing page copy đầu tiên cho kế toán xây dựng/solo founder.\n3. Chọn 1 email sequence trial → paid để chạy thử.\n\n**Kênh cần tập trung:** Facebook Group kế toán + Zalo OA + founder-led email, vì phù hợp thị trường SME Việt Nam và không cần paid API ngay.\n\n**Rủi ro:** Chưa có event tracking thật nên không kết luận conversion. Cần đánh dấu mọi số liệu là giả định hoặc benchmark.\n\n**Next action 24h:** Apply docs/CODEX_PATCH_MARKETING_SUITE_V2_TAB.md, chạy lint/build, rồi test tab V2 Growth OS.`;
}

function InfoBox({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${warning ? 'border-amber-400/25 bg-amber-400/10' : 'border-slate-800 bg-slate-950/70'}`}>
      <p className={`text-[10px] font-black uppercase tracking-wide ${warning ? 'text-amber-200' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{value}</p>
    </div>
  );
}
