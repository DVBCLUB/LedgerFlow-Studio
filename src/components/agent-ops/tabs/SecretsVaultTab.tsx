import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const VAULT_KEY = 'ledgerflow_secret_vault_registry_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type SecretStatus = 'Planned' | 'Configured' | 'Needs Rotation' | 'Disabled';
type SecretScope = 'GitHub' | 'OpenAI' | 'Google' | 'Firebase' | 'Email' | 'Database' | 'Local Dev' | 'Other';

type SecretRecord = {
  id: string;
  name: string;
  scope: SecretScope;
  owner: string;
  status: SecretStatus;
  risk: RiskLevel;
  storageLocation: string;
  allowedUse: string;
  blockedUse: string;
  rotationNote: string;
  lastReviewedAt: string;
  createdAt: string;
};

const scopes: SecretScope[] = ['GitHub', 'OpenAI', 'Google', 'Firebase', 'Email', 'Database', 'Local Dev', 'Other'];
const statuses: SecretStatus[] = ['Planned', 'Configured', 'Needs Rotation', 'Disabled'];
const risks: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

const seedSecrets: SecretRecord[] = [
  {
    id: 'secret-github-token-policy',
    name: 'GitHub write token policy',
    scope: 'GitHub',
    owner: 'Founder / AI Dev',
    status: 'Planned',
    risk: 'HIGH',
    storageLocation: 'Environment variable or provider secret store only',
    allowedUse: 'Create branch, commit, PR only after Approval Gate.',
    blockedUse: 'Never paste token into prompt, localStorage, repo file or chat.',
    rotationNote: 'Rotate when AI agent access changes or after any suspected exposure.',
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'secret-ai-gateway-policy',
    name: 'AI gateway API key policy',
    scope: 'OpenAI',
    owner: 'Founder / Chief of Staff',
    status: 'Planned',
    risk: 'HIGH',
    storageLocation: 'Backend env only. Frontend can request through gateway.',
    allowedUse: 'Model calls with cost tracking and audit.',
    blockedUse: 'No direct frontend hardcode. No browser localStorage secret value.',
    rotationNote: 'Review monthly or when vendor billing changes.',
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

function toneFor(risk: RiskLevel) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function expiryIso() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

function markdownFor(secret: SecretRecord) {
  return [
    `# Secret Registry: ${secret.name}`,
    '',
    `- Scope: ${secret.scope}`,
    `- Owner: ${secret.owner}`,
    `- Status: ${secret.status}`,
    `- Risk: ${secret.risk}`,
    `- Storage location: ${secret.storageLocation}`,
    '',
    '## Allowed use',
    secret.allowedUse,
    '',
    '## Blocked use',
    secret.blockedUse,
    '',
    '## Rotation note',
    secret.rotationNote,
    '',
    '> Do not store the real secret value in this registry.',
  ].join('\n');
}

export default function SecretsVaultTab() {
  useLocalStorageVersion();
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [scope, setScope] = useState<SecretScope>('GitHub');
  const [status, setStatus] = useState<SecretStatus>('Planned');
  const [risk, setRisk] = useState<RiskLevel>('HIGH');
  const [owner, setOwner] = useState('Founder');
  const [storageLocation, setStorageLocation] = useState('Provider secret store / backend env only');
  const [allowedUse, setAllowedUse] = useState('Use only after Approval Gate when write access is required.');
  const [blockedUse, setBlockedUse] = useState('Do not paste value into chat, repo, localStorage or frontend code.');
  const [rotationNote, setRotationNote] = useState('Review monthly or after access changes.');

  const records = readLocalStorageValue<SecretRecord[]>(VAULT_KEY, seedSecrets);
  const visibleRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => [record.name, record.scope, record.owner, record.status, record.storageLocation].join(' ').toLowerCase().includes(needle));
  }, [query, records]);

  const save = (next: SecretRecord[]) => writeLocalStorageValue(VAULT_KEY, next);

  const addRecord = () => {
    if (!name.trim()) return;
    const now = new Date().toISOString();
    const record: SecretRecord = {
      id: `secret-${Date.now()}`,
      name: name.trim(),
      scope,
      owner: owner.trim() || 'Founder',
      status,
      risk,
      storageLocation: storageLocation.trim(),
      allowedUse: allowedUse.trim(),
      blockedUse: blockedUse.trim(),
      rotationNote: rotationNote.trim(),
      lastReviewedAt: now,
      createdAt: now,
    };
    save([record, ...records].slice(0, 200));
    appendAgentOpsAudit('SECRET_POLICY_CREATED', record.id, `${record.scope} · ${record.risk} · ${record.name}`);
    setName('');
  };

  const updateStatus = (record: SecretRecord, nextStatus: SecretStatus) => {
    save(records.map((item) => item.id === record.id ? { ...item, status: nextStatus, lastReviewedAt: new Date().toISOString() } : item));
    appendAgentOpsAudit('SECRET_POLICY_STATUS_CHANGED', record.id, `${record.name} → ${nextStatus}`);
  };

  const copyRecord = async (record: SecretRecord) => {
    await navigator.clipboard.writeText(markdownFor(record));
    appendAgentOpsAudit('SECRET_POLICY_COPIED', record.id, record.name);
  };

  const requestApproval = (record: SecretRecord) => {
    const approval: ApprovalRequest = {
      id: `approval-secret-${record.id}-${Date.now()}`,
      title: `Approve secret policy: ${record.name}`,
      source: 'Secrets Vault',
      sourceId: record.id,
      risk: record.risk === 'LOW' ? 'MEDIUM' : record.risk,
      action: `Review or activate secret policy for ${record.scope}`,
      details: markdownFor(record),
      conditions: 'Founder must confirm storage location, rotation owner and blocked usage before enabling real access.',
      createdAt: new Date().toISOString(),
      expiresAt: expiryIso(),
      status: 'Pending',
    };
    appendLocalStorageArrayItem(APPROVAL_KEY, approval, 200);
    appendAgentOpsAudit('SECRET_POLICY_APPROVAL_REQUESTED', record.id, record.name);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  return (
    <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Secrets vault</p>
          <h3 className="mt-1 text-xl font-black text-white">Secret policy registry</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Chỉ lưu metadata và policy. Không lưu giá trị secret thật trong frontend, localStorage, prompt hoặc repo.</p>
        </div>
        <span className="rounded-full border border-violet-300/40 px-3 py-1 text-xs font-black text-violet-100">{records.length} policies</span>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên secret/policy" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Owner" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <select value={scope} onChange={(event) => setScope(event.target.value as SecretScope)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-violet-300">{scopes.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-violet-300">{risks.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value as SecretStatus)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-violet-300">{statuses.map((item) => <option key={item}>{item}</option>)}</select>
        <input value={storageLocation} onChange={(event) => setStorageLocation(event.target.value)} placeholder="Storage location" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <textarea value={allowedUse} onChange={(event) => setAllowedUse(event.target.value)} placeholder="Allowed use" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <textarea value={blockedUse} onChange={(event) => setBlockedUse(event.target.value)} placeholder="Blocked use" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <textarea value={rotationNote} onChange={(event) => setRotationNote(event.target.value)} placeholder="Rotation note" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300 md:col-span-2" />
        <button onClick={addRecord} className="rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/10 md:col-span-2">Thêm policy</button>
      </div>

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search secret policy..." className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleRecords.map((record) => (
          <article key={record.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{record.name}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{record.scope} · {record.owner} · {record.status}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${toneFor(record.risk)}`}>{record.risk}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">Storage: {record.storageLocation}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">Allowed: {record.allowedUse}<br />Blocked: {record.blockedUse}</p>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">Rotation: {record.rotationNote}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((item) => <button key={item} onClick={() => updateStatus(record, item)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-violet-300 hover:text-violet-100">{item}</button>)}
              <button onClick={() => copyRecord(record)} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">Copy policy</button>
              <button onClick={() => requestApproval(record)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
