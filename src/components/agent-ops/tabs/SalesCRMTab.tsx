import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel, WorkCard } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const SALES_CRM_KEY = 'ledgerflow_sales_crm_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type SalesStage = 'Lead' | 'Qualified' | 'Demo' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
type SalesChannel = 'Referral' | 'LinkedIn' | 'Facebook' | 'Website' | 'Outbound' | 'Existing Network';

type SalesDeal = {
  id: string;
  account: string;
  contact: string;
  stage: SalesStage;
  channel: SalesChannel;
  risk: RiskLevel;
  pain: string;
  offer: string;
  nextAction: string;
  value: string;
  metric: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

const stages: SalesStage[] = ['Lead', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const channels: SalesChannel[] = ['Referral', 'LinkedIn', 'Facebook', 'Website', 'Outbound', 'Existing Network'];
const risks: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

const seedDeals: SalesDeal[] = [
  {
    id: 'seed-deal-founder-led-sales',
    account: 'Founder-led pilot customer',
    contact: 'Owner / decision maker',
    stage: 'Lead',
    channel: 'Existing Network',
    risk: 'LOW',
    pain: 'Đang quản lý việc, chứng từ, chi phí và AI task rời rạc.',
    offer: 'Company OS pilot: Workboard + Approval + Knowledge + Daily Standup.',
    nextAction: 'Soạn 1 trang demo script và checklist câu hỏi discovery.',
    value: 'Pilot / learning first',
    metric: 'Có 3 insight thật sau buổi demo.',
    note: 'Không hứa ERP. Chỉ demo Company OS sandbox.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function stageTone(stage: SalesStage) {
  if (stage === 'Won') return 'border-emerald-400/40 text-emerald-200';
  if (stage === 'Lost') return 'border-rose-400/40 text-rose-200';
  if (stage === 'Proposal' || stage === 'Negotiation') return 'border-amber-400/40 text-amber-200';
  return 'border-slate-700 text-slate-300';
}

function riskTone(risk: RiskLevel) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function approvalExpiryIso() {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  return expires.toISOString();
}

function buildSalesBrief(deal: SalesDeal) {
  return [
    `# Sales Brief: ${deal.account}`,
    '',
    `- Contact: ${deal.contact}`,
    `- Stage: ${deal.stage}`,
    `- Channel: ${deal.channel}`,
    `- Risk: ${deal.risk}`,
    `- Value: ${deal.value}`,
    '',
    '## Pain',
    deal.pain,
    '',
    '## Offer',
    deal.offer,
    '',
    '## Next action',
    deal.nextAction,
    '',
    '## Success metric',
    deal.metric,
    '',
    '## Guardrail',
    'Do not promise ERP, legal/tax guarantee, automation or external action without founder approval.',
  ].join('\n');
}

function approvalRiskFor(risk: RiskLevel): ApprovalRequest['risk'] {
  return risk === 'LOW' ? 'MEDIUM' : risk;
}

export default function SalesCRMTab() {
  useLocalStorageVersion();
  const [account, setAccount] = useState('');
  const [contact, setContact] = useState('');
  const [stage, setStage] = useState<SalesStage>('Lead');
  const [channel, setChannel] = useState<SalesChannel>('Referral');
  const [risk, setRisk] = useState<RiskLevel>('LOW');
  const [pain, setPain] = useState('');
  const [offer, setOffer] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [value, setValue] = useState('');
  const [filter, setFilter] = useState<'ALL' | SalesStage>('ALL');

  const deals = readLocalStorageValue<SalesDeal[]>(SALES_CRM_KEY, seedDeals);
  const visibleDeals = useMemo(() => filter === 'ALL' ? deals : deals.filter((deal) => deal.stage === filter), [deals, filter]);
  const openDeals = deals.filter((deal) => deal.stage !== 'Won' && deal.stage !== 'Lost').length;
  const weightedPipeline = deals.filter((deal) => deal.stage !== 'Lost').length;

  const saveDeals = (next: SalesDeal[]) => writeLocalStorageValue(SALES_CRM_KEY, next);

  const addDeal = () => {
    if (!account.trim() || !pain.trim() || !offer.trim()) return;
    const now = new Date().toISOString();
    const deal: SalesDeal = {
      id: `deal-${Date.now()}`,
      account: account.trim(),
      contact: contact.trim() || 'Unknown contact',
      stage,
      channel,
      risk,
      pain: pain.trim(),
      offer: offer.trim(),
      nextAction: nextAction.trim() || 'Schedule discovery / demo.',
      value: value.trim() || 'TBD',
      metric: 'Next step confirmed by customer.',
      note: 'Founder-led sales item.',
      createdAt: now,
      updatedAt: now,
    };
    saveDeals([deal, ...deals].slice(0, 200));
    appendAgentOpsAudit('SALES_DEAL_CREATED', deal.id, `${deal.account} · ${deal.stage} · ${deal.risk}`);
    setAccount('');
    setContact('');
    setPain('');
    setOffer('');
    setNextAction('');
    setValue('');
  };

  const updateStage = (deal: SalesDeal, nextStage: SalesStage) => {
    const next = deals.map((item) => item.id === deal.id ? { ...item, stage: nextStage, updatedAt: new Date().toISOString() } : item);
    saveDeals(next);
    appendAgentOpsAudit('SALES_STAGE_CHANGED', deal.id, `${deal.account} → ${nextStage}`);
  };

  const pushToWorkboard = (deal: SalesDeal) => {
    const card: WorkCard = {
      id: `sales-card-${deal.id}-${Date.now()}`,
      title: `Sales next action: ${deal.account}`,
      kind: 'Marketing',
      owner: 'AI Marketer',
      status: deal.risk === 'LOW' ? 'Planning' : 'Waiting Approval',
      risk: deal.risk,
      request: deal.nextAction,
      plan: ['Review sales brief', 'Draft outreach/demo script', 'Founder reviews before sending'],
      tools: ['Sales CRM', 'Prompt Pack', 'Approval Gate'],
      approval: deal.risk === 'LOW' ? 'Sandbox copywriting only' : 'Founder approval required before external outreach',
      expectedOutput: 'Sales script, next email/message draft or discovery checklist.',
      founderReview: 'Required before sending to customer.',
    };
    appendLocalStorageArrayItem(WORKBOARD_KEY, card, 200);
    appendAgentOpsAudit('SALES_TO_WORKBOARD', deal.id, deal.account);
  };

  const requestApproval = (deal: SalesDeal) => {
    const request: ApprovalRequest = {
      id: `sales-approval-${deal.id}-${Date.now()}`,
      title: `Approve sales outreach: ${deal.account}`,
      source: 'Sales CRM',
      sourceId: deal.id,
      risk: approvalRiskFor(deal.risk),
      action: 'Approve customer-facing message/demo commitment',
      details: buildSalesBrief(deal),
      conditions: 'Founder must review wording and commitments before sending.',
      createdAt: new Date().toISOString(),
      expiresAt: approvalExpiryIso(),
      status: 'Pending',
    };
    appendLocalStorageArrayItem(APPROVAL_KEY, request, 200);
    appendAgentOpsAudit('SALES_APPROVAL_REQUESTED', deal.id, deal.account);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  const copyBrief = async (deal: SalesDeal) => {
    await navigator.clipboard.writeText(buildSalesBrief(deal));
    appendAgentOpsAudit('SALES_BRIEF_COPIED', deal.id, deal.account);
  };

  return (
    <section className="rounded-3xl border border-indigo-400/30 bg-indigo-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Sales & CRM</p>
          <h3 className="mt-1 text-xl font-black text-white">Founder-led Sales CRM</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Pipeline nhẹ cho founder: pain, offer, next action, approval trước mọi message/demo cam kết với khách.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-indigo-300/40 px-3 py-1 text-indigo-100">{deals.length} deals</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{openDeals} open</span>
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{weightedPipeline} pipeline</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={account} onChange={(event) => setAccount(event.target.value)} placeholder="Tên khách hàng / account" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300" />
        <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Người liên hệ" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300" />
        <select value={stage} onChange={(event) => setStage(event.target.value as SalesStage)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-indigo-300">
          {stages.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={channel} onChange={(event) => setChannel(event.target.value as SalesChannel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-indigo-300">
          {channels.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-indigo-300">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Giá trị / cơ hội" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300" />
        <textarea value={pain} onChange={(event) => setPain(event.target.value)} placeholder="Pain của khách" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300 md:col-span-2" />
        <textarea value={offer} onChange={(event) => setOffer(event.target.value)} placeholder="Offer / giải pháp đề xuất" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300 md:col-span-2" />
        <input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Next action" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300 md:col-span-2" />
        <button onClick={addDeal} className="rounded-xl border border-indigo-300/50 px-3 py-2 text-xs font-black text-indigo-100 hover:bg-indigo-400/10 md:col-span-2">Thêm deal</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('ALL')} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === 'ALL' ? 'border-indigo-300 text-indigo-100' : 'border-slate-700 text-slate-300'}`}>All</button>
        {stages.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === item ? 'border-indigo-300 text-indigo-100' : 'border-slate-700 text-slate-300'}`}>{item}</button>)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleDeals.map((deal) => (
          <article key={deal.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{deal.account}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{deal.contact} · {deal.channel} · {deal.value}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${stageTone(deal.stage)}`}>{deal.stage}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(deal.risk)}`}>{deal.risk}</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">Pain: {deal.pain}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">Offer: {deal.offer}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">Next: {deal.nextAction}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {stages.map((item) => <button key={item} onClick={() => updateStage(deal, item)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-indigo-300 hover:text-indigo-100">{item}</button>)}
              <button onClick={() => copyBrief(deal)} className="rounded-xl border border-indigo-300/50 px-3 py-2 text-[11px] font-black text-indigo-100 hover:bg-indigo-400/10">Copy brief</button>
              <button onClick={() => pushToWorkboard(deal)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">To Workboard</button>
              <button onClick={() => requestApproval(deal)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
