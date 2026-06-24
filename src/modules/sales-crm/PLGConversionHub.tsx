import React, { useMemo, useState } from 'react';
import { ArrowRight, Gauge, Lightbulb, LockKeyhole, Rocket, Timer } from 'lucide-react';
import {
  AHA_MOMENTS,
  ACTIVATION_MILESTONES,
  FREEMIUM_STRATEGY,
  PLG_METRICS_TO_TRACK,
  PLG_RECOMMENDATION_PROMPT,
} from '../../data/plgKnowledge';

type PLGTab = 'aha' | 'activation' | 'pricing' | 'metrics' | 'advisor';

type AIChatResponse = {
  success?: boolean;
  text?: string;
  content?: string;
  output?: string;
  error?: string;
};

const tabs: { id: PLGTab; label: string }[] = [
  { id: 'aha', label: 'Aha moments' },
  { id: 'activation', label: 'Activation path' },
  { id: 'pricing', label: 'Freemium' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'advisor', label: 'AI advisor' },
];

export default function PLGConversionHub() {
  const [activeTab, setActiveTab] = useState<PLGTab>('aha');
  const [userState, setUserState] = useState('User mới đăng ký, chưa tạo công trình/dự án, đã xem dashboard demo một lần.');

  const advisorPrompt = useMemo(() => PLG_RECOMMENDATION_PROMPT(userState), [userState]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
          Product-Led Growth · activation system
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">PLG Conversion Hub</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
          Thiết kế hành trình từ free/trial đến paid: aha moment, activation milestone, freemium limits và metric cần đo.
          Tất cả đang là playbook offline-first, chưa phụ thuộc analytics backend.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl px-4 py-2 text-xs font-black transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-300 text-slate-950'
                : 'border border-slate-800 text-slate-400 hover:border-emerald-400/50 hover:text-emerald-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'aha' && <AhaMoments />}
      {activeTab === 'activation' && <ActivationPath />}
      {activeTab === 'pricing' && <FreemiumPlaybook />}
      {activeTab === 'metrics' && <MetricsGrid />}
      {activeTab === 'advisor' && (
        <AdvisorPrompt userState={userState} setUserState={setUserState} advisorPrompt={advisorPrompt} />
      )}
    </div>
  );
}

function AhaMoments() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {AHA_MOMENTS.map((moment) => (
        <article key={moment.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            <Lightbulb size={14} /> {moment.timeframe}
          </div>
          <h3 className="mt-3 text-lg font-black text-white">{moment.action}</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">{moment.whyItMatters}</p>
          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-200">Accelerate</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{moment.howToAccelerate}</p>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">Metric: {moment.metric}</p>
        </article>
      ))}
    </div>
  );
}

function ActivationPath() {
  return (
    <div className="space-y-3">
      {ACTIVATION_MILESTONES.map((milestone, index) => (
        <div key={milestone.milestone} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                <Timer size={13} /> Target day {milestone.targetDay}
              </p>
              <h3 className="mt-2 text-lg font-black text-white">{milestone.milestone}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{milestone.description}</p>
            </div>
            <span className="rounded-2xl border border-slate-700 px-3 py-1 text-xs font-black text-slate-300">
              Step {index + 1}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InfoBox label="Check" value={milestone.checkCondition} />
            <InfoBox label="Next step" value={milestone.nextStep} />
            <InfoBox label="Drop-off risk" value={milestone.dropOffRisk} warning />
          </div>
        </div>
      ))}
    </div>
  );
}

function FreemiumPlaybook() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {FREEMIUM_STRATEGY.map((tier) => (
        <article key={tier.name} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            <LockKeyhole size={14} /> Upgrade design
          </p>
          <h3 className="mt-2 text-xl font-black text-white">{tier.name}</h3>
          <p className="mt-3 text-sm font-semibold text-slate-400">{tier.targetUser}</p>
          <ul className="mt-4 space-y-2">
            {tier.limits.map((limit) => (
              <li key={limit} className="flex gap-2 text-sm font-semibold text-slate-300">
                <ArrowRight size={14} className="mt-1 shrink-0 text-emerald-300" /> {limit}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoBox label="Upgrade hook" value={tier.upgradeHook} />
            <InfoBox label="Conversion tactic" value={tier.conversionTactic} />
          </div>
        </article>
      ))}
    </div>
  );
}

function MetricsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PLG_METRICS_TO_TRACK.map((metric) => (
        <article key={metric.metric} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            <Gauge size={14} /> {metric.target}
          </div>
          <h3 className="mt-3 text-lg font-black text-white">{metric.metric}</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">{metric.definition}</p>
          <p className="mt-4 text-xs font-bold text-slate-500">Tool: {metric.tool}</p>
        </article>
      ))}
    </div>
  );
}

function AdvisorPrompt({
  userState,
  setUserState,
  advisorPrompt,
}: {
  userState: string;
  setUserState: (value: string) => void;
  advisorPrompt: string;
}) {
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const copyPrompt = async () => {
    await navigator.clipboard?.writeText(advisorPrompt);
  };

  const copyRecommendation = async () => {
    await navigator.clipboard?.writeText(recommendation);
  };

  const runAdvisor = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: advisorPrompt,
          systemInstruction:
            'Bạn là PLG strategist cho B2B SaaS Việt Nam. Trả lời bằng tiếng Việt, thực tế, không hứa quá mức. Luôn đưa next action, trigger, metric và rủi ro cần kiểm soát.',
          history: [],
          model: 'ai-assistant-pro',
        }),
      });
      const data = (await response.json()) as AIChatResponse;
      const text = data.text ?? data.content ?? data.output;
      if (!response.ok || !text) {
        throw new Error(data.error ?? 'AI Gateway chưa trả về nội dung.');
      }
      setRecommendation(text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không gọi được AI Gateway.';
      setError(`${message} Đang dùng khuyến nghị offline.`);
      setRecommendation(buildOfflineRecommendation(userState));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">User state</p>
        <textarea
          value={userState}
          onChange={(event) => setUserState(event.target.value)}
          className="mt-3 min-h-[220px] w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm font-semibold leading-6 text-white outline-none focus:border-emerald-400"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={runAdvisor}
            disabled={loading}
            className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Đang phân tích...' : 'Tạo khuyến nghị AI'}
          </button>
          <button
            onClick={copyPrompt}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-400/60 hover:text-emerald-200"
          >
            Copy prompt
          </button>
          {recommendation && (
            <button
              onClick={copyRecommendation}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-400/60 hover:text-emerald-200"
            >
              Copy draft
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-xs font-semibold leading-5 text-amber-200">{error}</p>}
      </div>
      <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">AI recommendation</p>
            <h3 className="mt-1 text-lg font-black text-white">Next-best-action cho PLG</h3>
          </div>
          <Rocket size={20} className="text-emerald-200" />
        </div>
        <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs font-semibold leading-6 text-slate-300">
          {recommendation || advisorPrompt}
        </pre>
      </div>
    </section>
  );
}

function buildOfflineRecommendation(userState: string) {
  return `**PLG NEXT-BEST-ACTION — OFFLINE FALLBACK**\n\n**User state:** ${userState}\n\n**Ưu tiên 1:** Đẩy user tới Aha Moment gần nhất: tạo 1 công trình/dự án và nhập ít nhất 5 giao dịch mẫu.\n\n**Trigger đề xuất:** Nếu user chưa tạo project sau 24–48h, hiển thị checklist 3 bước trong app và gửi activation email ngắn.\n\n**Metric cần đo:** project_created_24h, transactions_count_7d, first_report_exported_7d.\n\n**Rủi ro:** Đừng paywall quá sớm khi user chưa thấy dashboard có dữ liệu thật. Giữ bản free/trial đủ để tạo giá trị đầu tiên.\n\n**Next action:** Thêm CTA \"Tạo công trình đầu tiên\" và template dữ liệu mẫu ngay trong onboarding.`;
}

function InfoBox({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${warning ? 'border-amber-400/25 bg-amber-400/10' : 'border-slate-800 bg-slate-950/70'}`}>
      <p className={`text-[10px] font-black uppercase tracking-wide ${warning ? 'text-amber-200' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{value}</p>
    </div>
  );
}
