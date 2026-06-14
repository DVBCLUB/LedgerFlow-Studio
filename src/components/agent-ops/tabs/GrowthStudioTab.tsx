import { useMemo, useState } from 'react';
import type { WorkCard } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const GROWTH_KEY = 'ledgerflow_growth_studio_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';
const FEEDBACK_KEY = 'ledgerflow_customer_feedback_v1';

type GrowthStage = 'Idea' | 'Draft' | 'Testing' | 'Published' | 'Learning';
type GrowthChannel = 'SEO' | 'LinkedIn' | 'Facebook' | 'YouTube' | 'Email' | 'Sales Call' | 'Landing Page';
type GrowthRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type GrowthItem = {
  id: string;
  title: string;
  channel: GrowthChannel;
  stage: GrowthStage;
  risk: GrowthRisk;
  targetPersona: string;
  offer: string;
  message: string;
  metric: string;
  learning: string;
  createdAt: string;
  updatedAt: string;
};

type FeedbackSeed = {
  id: string;
  source: string;
  persona: string;
  content: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'Idea' | 'Bug' | 'Risk' | 'Question';
  status: 'New' | 'Triaged' | 'Archived';
  createdAt: string;
};

const channels: GrowthChannel[] = ['SEO', 'LinkedIn', 'Facebook', 'YouTube', 'Email', 'Sales Call', 'Landing Page'];
const stages: GrowthStage[] = ['Idea', 'Draft', 'Testing', 'Published', 'Learning'];
const risks: GrowthRisk[] = ['LOW', 'MEDIUM', 'HIGH'];

const seedItems: GrowthItem[] = [
  {
    id: 'growth-seed-accountant-os',
    title: 'Bài viết: Vì sao kế toán solo cần Company OS thay vì file rời',
    channel: 'LinkedIn',
    stage: 'Idea',
    risk: 'LOW',
    targetPersona: 'Kế toán trưởng / founder vận hành nhỏ',
    offer: 'LedgerFlow Studio như bàn điều hành AI-first cho kế toán và dự án.',
    message: 'Tập trung vào kiểm soát việc, approval, audit, memory thay vì nhập liệu thủ công rời rạc.',
    metric: 'Số lead nhắn hỏi demo / số bình luận có vấn đề thật.',
    learning: 'Chưa chạy.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'growth-seed-construction-template',
    title: 'Landing page: Template xây dựng là ngành mẫu, không phải lõi app',
    channel: 'Landing Page',
    stage: 'Draft',
    risk: 'MEDIUM',
    targetPersona: 'Công ty xây dựng nhỏ cần kiểm soát chi phí/chứng từ',
    offer: 'Industry Template Xây dựng chạy trên Company OS lõi.',
    message: 'Có thể bắt đầu từ chi phí công trình nhưng không khóa sản phẩm vào một ngành.',
    metric: 'Tỷ lệ đăng ký dùng thử / câu hỏi về workflow chứng từ.',
    learning: 'Cần Founder review trước khi publish.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function toneFor(stage: GrowthStage) {
  if (stage === 'Published') return 'border-emerald-400/40 text-emerald-200';
  if (stage === 'Testing') return 'border-cyan-400/40 text-cyan-200';
  if (stage === 'Learning') return 'border-violet-400/40 text-violet-200';
  return 'border-slate-700 text-slate-300';
}

function riskTone(risk: GrowthRisk) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function markdownFor(item: GrowthItem) {
  return [
    `# Growth Brief: ${item.title}`,
    '',
    `- Channel: ${item.channel}`,
    `- Stage: ${item.stage}`,
    `- Risk: ${item.risk}`,
    `- Persona: ${item.targetPersona}`,
    `- Offer: ${item.offer}`,
    `- Metric: ${item.metric}`,
    '',
    '## Message',
    item.message,
    '',
    '## Learning',
    item.learning,
    '',
    '## AI Marketer rules',
    '- Draft only unless Founder approves publishing.',
    '- Do not claim real customers, revenue or legal compliance without evidence.',
    '- Return headline, outline, CTA and test metric.',
  ].join('\n');
}

function workCardFor(item: GrowthItem): WorkCard {
  return {
    id: `growth-work-${item.id}`,
    kind: 'Marketing',
    title: item.title,
    status: item.risk === 'LOW' ? 'Planning' : 'Waiting Approval',
    risk: item.risk,
    owner: 'AI Marketer',
    request: item.offer,
    plan: ['Review persona and offer', 'Draft message and CTA', 'Define test metric', 'Return learning note'],
    tools: [item.channel, 'Prompt Pack', 'Feedback Loop'],
    approval: item.risk === 'LOW' ? 'Sandbox draft allowed' : 'Founder approval required before publishing',
    expectedOutput: 'Draft content, CTA, channel plan, test metric and learning note',
    founderReview: markdownFor(item),
  };
}

export default function GrowthStudioTab() {
  useLocalStorageVersion();
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<GrowthChannel>('LinkedIn');
  const [risk, setRisk] = useState<GrowthRisk>('LOW');
  const [persona, setPersona] = useState('');
  const [offer, setOffer] = useState('');
  const [message, setMessage] = useState('');

  const items = readLocalStorageValue<GrowthItem[]>(GROWTH_KEY, seedItems);
  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => [item.title, item.channel, item.targetPersona, item.offer, item.message].join(' ').toLowerCase().includes(needle));
  }, [items, query]);

  const saveItems = (next: GrowthItem[]) => writeLocalStorageValue(GROWTH_KEY, next);

  const addItem = () => {
    if (!title.trim() || !offer.trim()) return;
    const now = new Date().toISOString();
    const item: GrowthItem = {
      id: `growth-${Date.now()}`,
      title: title.trim(),
      channel,
      stage: risk === 'LOW' ? 'Idea' : 'Draft',
      risk,
      targetPersona: persona.trim() || 'Founder/operator cần Company OS',
      offer: offer.trim(),
      message: message.trim() || 'Draft message needed.',
      metric: 'Learning metric chưa đặt.',
      learning: 'Chưa chạy.',
      createdAt: now,
      updatedAt: now,
    };
    saveItems([item, ...items].slice(0, 200));
    appendAgentOpsAudit('GROWTH_ITEM_CREATED', item.id, item.title);
    setTitle('');
    setOffer('');
    setPersona('');
    setMessage('');
  };

  const updateStage = (item: GrowthItem, stage: GrowthStage) => {
    saveItems(items.map((entry) => entry.id === item.id ? { ...entry, stage, updatedAt: new Date().toISOString() } : entry));
    appendAgentOpsAudit('GROWTH_STAGE_CHANGED', item.id, `${item.title} -> ${stage}`);
  };

  const copyBrief = async (item: GrowthItem) => {
    await navigator.clipboard.writeText(markdownFor(item));
    appendAgentOpsAudit('GROWTH_BRIEF_COPIED', item.id, item.title);
  };

  const pushToWorkboard = (item: GrowthItem) => {
    appendLocalStorageArrayItem(WORKBOARD_KEY, workCardFor(item), 200);
    appendAgentOpsAudit('GROWTH_TO_WORKBOARD', item.id, item.title);
  };

  const pushLearningToFeedback = (item: GrowthItem) => {
    const feedback: FeedbackSeed = {
      id: `growth-feedback-${item.id}-${Date.now()}`,
      source: `Growth Studio / ${item.channel}`,
      persona: item.targetPersona,
      content: `${item.title}\nOffer: ${item.offer}\nLearning: ${item.learning}`,
      severity: item.risk,
      type: item.risk === 'HIGH' ? 'Risk' : 'Idea',
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    appendLocalStorageArrayItem(FEEDBACK_KEY, feedback, 200);
    appendAgentOpsAudit('GROWTH_LEARNING_TO_FEEDBACK', item.id, item.title);
  };

  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Marketing & Growth</p>
          <h3 className="mt-1 text-xl font-black text-white">Growth Studio</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Lập offer, content test, channel plan và learning loop trước khi publish thật.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{items.length} growth items</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{items.filter((item) => item.stage !== 'Published').length} not published</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên campaign/content/offer" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <select value={channel} onChange={(event) => setChannel(event.target.value as GrowthChannel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-emerald-300">
          {channels.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={risk} onChange={(event) => setRisk(event.target.value as GrowthRisk)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-emerald-300">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={persona} onChange={(event) => setPersona(event.target.value)} placeholder="Persona / khách hàng mục tiêu" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <textarea value={offer} onChange={(event) => setOffer(event.target.value)} placeholder="Offer / lời hứa giá trị" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300 md:col-span-2" />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Thông điệp / angle / CTA" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300 md:col-span-2" />
        <button onClick={addItem} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/10 md:col-span-2">Thêm growth item</button>
      </div>

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search growth items" className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-emerald-300" />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleItems.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{item.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{item.channel} · {item.targetPersona}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${toneFor(item.stage)}`}>{item.stage}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(item.risk)}`}>{item.risk}</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">Offer: {item.offer}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">{item.message}</p>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">Metric: {item.metric}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {stages.map((stage) => <button key={stage} onClick={() => updateStage(item, stage)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-emerald-300 hover:text-emerald-100">{stage}</button>)}
              <button onClick={() => copyBrief(item)} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">Copy brief</button>
              <button onClick={() => pushToWorkboard(item)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">To Workboard</button>
              <button onClick={() => pushLearningToFeedback(item)} className="rounded-xl border border-violet-300/50 px-3 py-2 text-[11px] font-black text-violet-100 hover:bg-violet-400/10">To Feedback</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
