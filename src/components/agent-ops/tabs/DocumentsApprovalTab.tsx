import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel, WorkCard } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const DOCS_KEY = 'ledgerflow_documents_approval_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type DocumentType = 'Decision Record' | 'SOP' | 'Contract Draft' | 'Invoice Note' | 'Meeting Note' | 'Risk Memo' | 'Release Note';
type DocumentStatus = 'Draft' | 'Needs Review' | 'Approved' | 'Archived';

type ControlledDocument = {
  id: string;
  title: string;
  type: DocumentType;
  owner: string;
  status: DocumentStatus;
  risk: RiskLevel;
  summary: string;
  content: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
};

const docTypes: DocumentType[] = ['Decision Record', 'SOP', 'Contract Draft', 'Invoice Note', 'Meeting Note', 'Risk Memo', 'Release Note'];
const statuses: DocumentStatus[] = ['Draft', 'Needs Review', 'Approved', 'Archived'];
const risks: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

const seedDocs: ControlledDocument[] = [
  {
    id: 'doc-seed-ci-first',
    title: 'Decision: CI xanh trước khi thêm feature mới',
    type: 'Decision Record',
    owner: 'Founder / AI Dev',
    status: 'Approved',
    risk: 'LOW',
    summary: 'Mọi thay đổi code phải ưu tiên type-check/build xanh trước khi mở rộng scope.',
    content: 'Nếu GitHub Actions đỏ, dừng feature mới và fix đúng lỗi trước. Mỗi commit nên nhỏ, dễ rollback.',
    nextAction: 'Dùng rule này trong Product Factory, Task Queue và Workboard.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-seed-approval-first',
    title: 'SOP: Approval-first cho external action',
    type: 'SOP',
    owner: 'Founder / Chief of Staff',
    status: 'Approved',
    risk: 'MEDIUM',
    summary: 'AI được chuẩn bị draft/sandbox, nhưng external write phải qua Founder Approval Gate.',
    content: 'External action gồm gửi email, tạo PR, ghi file thật, gọi connector write, publish content hoặc cam kết với khách.',
    nextAction: 'Gắn SOP này vào Tool Cards, Sales CRM, Growth Studio và Connectors.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function statusTone(status: DocumentStatus) {
  if (status === 'Approved') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Needs Review') return 'border-amber-400/40 text-amber-200';
  if (status === 'Archived') return 'border-slate-700 text-slate-400';
  return 'border-cyan-400/40 text-cyan-200';
}

function riskTone(risk: RiskLevel) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function approvalExpiryIso() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

function markdownFor(doc: ControlledDocument) {
  return [
    `# ${doc.title}`,
    '',
    `- Type: ${doc.type}`,
    `- Owner: ${doc.owner}`,
    `- Status: ${doc.status}`,
    `- Risk: ${doc.risk}`,
    '',
    '## Summary',
    doc.summary,
    '',
    '## Content',
    doc.content,
    '',
    '## Next action',
    doc.nextAction,
  ].join('\n');
}

function workCardFor(doc: ControlledDocument): WorkCard {
  return {
    id: `doc-work-${doc.id}-${Date.now()}`,
    title: `Review document: ${doc.title}`,
    kind: doc.type === 'Contract Draft' || doc.type === 'Invoice Note' ? 'Ops' : 'Audit',
    owner: doc.owner,
    status: doc.status === 'Approved' ? 'Done' : doc.status === 'Needs Review' ? 'Waiting Approval' : 'Planning',
    risk: doc.risk,
    request: doc.summary,
    plan: ['Review document content', 'Check risk and approval need', 'Update status or add founder decision'],
    tools: ['Documents Approval', 'Approval Gate', 'Workboard'],
    approval: doc.risk === 'LOW' ? 'Review optional before external use' : 'Founder approval required before external use',
    expectedOutput: markdownFor(doc),
  };
}

function approvalFor(doc: ControlledDocument): ApprovalRequest {
  return {
    id: `doc-approval-${doc.id}-${Date.now()}`,
    title: `Approve document: ${doc.title}`,
    source: 'Documents Approval',
    sourceId: doc.id,
    risk: doc.risk === 'LOW' ? 'MEDIUM' : doc.risk,
    action: `Approve ${doc.type} for controlled use`,
    details: markdownFor(doc),
    conditions: 'Only use externally after founder confirms scope, recipient and rollback note.',
    createdAt: new Date().toISOString(),
    expiresAt: approvalExpiryIso(),
    status: 'Pending',
  };
}

export default function DocumentsApprovalTab() {
  useLocalStorageVersion();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('Decision Record');
  const [risk, setRisk] = useState<RiskLevel>('LOW');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [query, setQuery] = useState('');

  const docs = readLocalStorageValue<ControlledDocument[]>(DOCS_KEY, seedDocs);
  const visibleDocs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return docs;
    return docs.filter((doc) => [doc.title, doc.type, doc.owner, doc.summary, doc.content, doc.status, doc.risk].join(' ').toLowerCase().includes(needle));
  }, [docs, query]);

  const saveDocs = (next: ControlledDocument[]) => writeLocalStorageValue(DOCS_KEY, next.slice(0, 200));

  const addDoc = () => {
    if (!title.trim() || !summary.trim()) return;
    const now = new Date().toISOString();
    const doc: ControlledDocument = {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      type,
      owner: type === 'Invoice Note' ? 'AI Accountant' : type === 'Contract Draft' ? 'Founder / AI Auditor' : 'Chief of Staff',
      status: risk === 'LOW' ? 'Draft' : 'Needs Review',
      risk,
      summary: summary.trim(),
      content: content.trim() || 'No detailed content yet.',
      nextAction: risk === 'LOW' ? 'Draft internally and review later.' : 'Send to Approval Gate before external use.',
      createdAt: now,
      updatedAt: now,
    };
    saveDocs([doc, ...docs]);
    appendAgentOpsAudit('DOCUMENT_CREATED', doc.id, `${doc.type} · ${doc.risk} · ${doc.title}`);
    setTitle('');
    setSummary('');
    setContent('');
  };

  const setStatus = (doc: ControlledDocument, status: DocumentStatus) => {
    saveDocs(docs.map((item) => item.id === doc.id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
    appendAgentOpsAudit('DOCUMENT_STATUS_CHANGED', doc.id, `${doc.title} → ${status}`);
  };

  const copyDoc = async (doc: ControlledDocument) => {
    await navigator.clipboard.writeText(markdownFor(doc));
    appendAgentOpsAudit('DOCUMENT_COPIED', doc.id, doc.title);
  };

  const pushToWorkboard = (doc: ControlledDocument) => {
    appendLocalStorageArrayItem(WORKBOARD_KEY, workCardFor(doc), 200);
    appendAgentOpsAudit('DOCUMENT_TO_WORKBOARD', doc.id, doc.title);
  };

  const requestApproval = (doc: ControlledDocument) => {
    appendLocalStorageArrayItem(APPROVAL_KEY, approvalFor(doc), 200);
    setStatus(doc, 'Needs Review');
    appendAgentOpsAudit('DOCUMENT_APPROVAL_REQUESTED', doc.id, doc.title);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  return (
    <section className="rounded-3xl border border-indigo-400/30 bg-indigo-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Documents & Approval</p>
          <h3 className="mt-1 text-xl font-black text-white">Controlled Documents Desk</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Quản lý decision record, SOP, hợp đồng nháp, invoice note, risk memo và release note theo approval-first/audit-first.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-indigo-300/40 px-3 py-1 text-indigo-100">{docs.length} docs</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{docs.filter((doc) => doc.status === 'Needs Review').length} review</span>
          <span className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-100">{docs.filter((doc) => doc.risk === 'HIGH').length} high risk</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên tài liệu / quyết định" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300" />
        <select value={type} onChange={(event) => setType(event.target.value as DocumentType)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-indigo-300">
          {docTypes.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-indigo-300">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search docs" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300" />
        <input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Tóm tắt ngắn" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300 md:col-span-2" />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Nội dung / điều kiện / bằng chứng / phạm vi dùng" className="min-h-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300 md:col-span-2" />
        <button onClick={addDoc} className="rounded-xl border border-indigo-300/50 px-3 py-2 text-xs font-black text-indigo-100 hover:bg-indigo-400/10 md:col-span-2">Thêm document</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleDocs.map((doc) => (
          <article key={doc.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{doc.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{doc.type} · {doc.owner}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(doc.status)}`}>{doc.status}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(doc.risk)}`}>{doc.risk}</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{doc.summary}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">{doc.nextAction}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((item) => <button key={item} onClick={() => setStatus(doc, item)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-indigo-300 hover:text-indigo-100">{item}</button>)}
              <button onClick={() => pushToWorkboard(doc)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">To Workboard</button>
              <button onClick={() => requestApproval(doc)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
              <button onClick={() => copyDoc(doc)} className="rounded-xl border border-indigo-300/50 px-3 py-2 text-[11px] font-black text-indigo-100 hover:bg-indigo-400/10">Copy MD</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
