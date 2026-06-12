import { useEffect, useMemo, useState } from 'react';

type ConnectorRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
type ConnectorMode = 'Read Only' | 'Draft Write' | 'Approval Required' | 'Blocked';
type ConnectorStatus = 'Planned' | 'Prototype' | 'Active' | 'Disabled';

type ConnectorDefinition = {
  id: string;
  name: string;
  category: 'Code' | 'Data' | 'Docs' | 'Finance' | 'Communication' | 'Deployment' | 'Local';
  status: ConnectorStatus;
  mode: ConnectorMode;
  risk: ConnectorRisk;
  purpose: string;
  allowedActions: string[];
  blockedActions: string[];
  inputSchema: string;
  outputSchema: string;
  approvalRequired: boolean;
  auditRequired: boolean;
};

const starterConnectors: ConnectorDefinition[] = [
  {
    id: 'github-draft-pr',
    name: 'GitHub Draft PR Connector',
    category: 'Code',
    status: 'Active',
    mode: 'Approval Required',
    risk: 'HIGH',
    purpose: 'Tạo branch ai/*, commit patch đã duyệt, mở Draft PR và theo dõi PR/CI.',
    allowedActions: ['Đọc repo metadata', 'Tạo branch ai/*', 'Tạo Draft PR', 'Đọc PR status', 'Đọc workflow run'],
    blockedActions: ['Push trực tiếp main/master', 'Merge tự động', 'Ghi file nhạy cảm', 'Ghi token ra frontend'],
    inputSchema: '{ repo, branchName, title, summary, files[], approvalId }',
    outputSchema: '{ branch, commitSha, pullRequest, status, auditEvent }',
    approvalRequired: true,
    auditRequired: true
  },
  {
    id: 'knowledge-library',
    name: 'Knowledge Library Connector',
    category: 'Data',
    status: 'Active',
    mode: 'Read Only',
    risk: 'LOW',
    purpose: 'Đọc thư viện tri thức nội bộ để tạo context pack cho agent.',
    allowedActions: ['Đọc knowledge item', 'Tìm theo tag/category', 'Xuất context pack'],
    blockedActions: ['Tự xóa knowledge', 'Lưu secret/API key', 'Ghi dữ liệu nhạy cảm không duyệt'],
    inputSchema: '{ query, kind, tags, limit }',
    outputSchema: '{ contextItems[], matchScore, source }',
    approvalRequired: false,
    auditRequired: true
  },
  {
    id: 'ci-doctor',
    name: 'CI Doctor Connector',
    category: 'Deployment',
    status: 'Prototype',
    mode: 'Read Only',
    risk: 'MEDIUM',
    purpose: 'Đọc build log/workflow run để đề xuất patch sửa lỗi CI.',
    allowedActions: ['Đọc workflow run', 'Đọc job steps', 'Đọc log lỗi', 'Tạo gói phân tích lỗi'],
    blockedActions: ['Rerun workflow tự động', 'Tự merge sau khi xanh', 'Chạy lệnh local không duyệt'],
    inputSchema: '{ repo, runId, jobId, branch, prNumber }',
    outputSchema: '{ diagnosis, failingStep, proposedPatch, risk }',
    approvalRequired: false,
    auditRequired: true
  },
  {
    id: 'local-tools',
    name: 'Local Tools Connector',
    category: 'Local',
    status: 'Planned',
    mode: 'Blocked',
    risk: 'BLOCKED',
    purpose: 'Tương lai mới cho phép thao tác local/VS Code có sandbox và duyệt.',
    allowedActions: ['Mô phỏng task', 'Tạo checklist thủ công'],
    blockedActions: ['Chạy terminal thật', 'Ghi file máy thật', 'Đọc thư mục không chọn', 'Xóa file local'],
    inputSchema: '{ task, workspaceId, approvalId }',
    outputSchema: '{ simulatedPlan, manualSteps }',
    approvalRequired: true,
    auditRequired: true
  }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function riskClass(risk: ConnectorRisk) {
  if (risk === 'LOW') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  if (risk === 'HIGH') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-slate-600 bg-slate-900 text-slate-400';
}

function modeClass(mode: ConnectorMode) {
  if (mode === 'Read Only') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (mode === 'Draft Write') return 'border-blue-400/35 bg-blue-400/10 text-blue-200';
  if (mode === 'Approval Required') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
}

export default function ConnectorSdkRegistry() {
  const [connectors, setConnectors] = useState<ConnectorDefinition[]>(() => readLocal('ledgerflow_connector_sdk_registry_v1', starterConnectors));
  const [selectedId, setSelectedId] = useState(() => connectors[0]?.id ?? starterConnectors[0].id);
  const [filter, setFilter] = useState<'All' | ConnectorRisk | ConnectorStatus>('All');
  const [draft, setDraft] = useState({
    name: '',
    category: 'Code' as ConnectorDefinition['category'],
    purpose: '',
    risk: 'MEDIUM' as ConnectorRisk,
    mode: 'Approval Required' as ConnectorMode
  });

  useEffect(() => {
    localStorage.setItem('ledgerflow_connector_sdk_registry_v1', JSON.stringify(connectors));
  }, [connectors]);

  const selected = useMemo(() => connectors.find((connector) => connector.id === selectedId) ?? connectors[0], [connectors, selectedId]);

  const filtered = useMemo(() => {
    if (filter === 'All') return connectors;
    return connectors.filter((connector) => connector.risk === filter || connector.status === filter);
  }, [connectors, filter]);

  const addConnector = () => {
    if (!draft.name.trim() || !draft.purpose.trim()) return;
    const id = `connector-${Date.now()}`;
    const connector: ConnectorDefinition = {
      id,
      name: draft.name.trim(),
      category: draft.category,
      status: 'Planned',
      mode: draft.mode,
      risk: draft.risk,
      purpose: draft.purpose.trim(),
      allowedActions: ['Mô phỏng hành động', 'Ghi audit', 'Yêu cầu duyệt trước khi ghi dữ liệu'],
      blockedActions: ['Ghi trực tiếp production', 'Lộ secret ra frontend', 'Xóa dữ liệu không duyệt'],
      inputSchema: '{ request, context, approvalId }',
      outputSchema: '{ result, auditEvent, risk }',
      approvalRequired: draft.mode === 'Approval Required' || draft.risk === 'HIGH' || draft.risk === 'BLOCKED',
      auditRequired: true
    };
    setConnectors((current) => [connector, ...current]);
    setSelectedId(id);
    setDraft({ name: '', category: draft.category, purpose: '', risk: draft.risk, mode: draft.mode });
  };

  const updateSelected = (patch: Partial<ConnectorDefinition>) => {
    if (!selected) return;
    setConnectors((current) => current.map((connector) => connector.id === selected.id ? { ...connector, ...patch } : connector));
  };

  const policySummary = useMemo(() => ({
    generatedAt: new Date().toISOString(),
    connectors: connectors.map((connector) => ({
      id: connector.id,
      name: connector.name,
      mode: connector.mode,
      risk: connector.risk,
      approvalRequired: connector.approvalRequired,
      auditRequired: connector.auditRequired,
      blockedActions: connector.blockedActions
    }))
  }), [connectors]);

  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Connector SDK Registry</p>
          <h3 className="mt-1 text-xl font-black text-white">Registry connector / plugin</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Chuẩn hóa connector theo kiểu OpenClaw: quyền, schema, risk, approval và audit trước khi AI dùng tool.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportJson('ledgerflow-connector-sdk-registry.json', connectors)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-indigo-300">Xuất registry</button>
          <button onClick={() => exportJson('ledgerflow-connector-policy-summary.json', policySummary)} className="rounded-2xl bg-indigo-300 px-4 py-2 text-xs font-black text-slate-950">Xuất policy summary</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Thêm connector mới</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên connector" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ConnectorDefinition['category'] })}>
              {(['Code', 'Data', 'Docs', 'Finance', 'Communication', 'Deployment', 'Local'] as ConnectorDefinition['category'][]).map((category) => <option key={category}>{category}</option>)}
            </select>
            <div className="grid gap-2 md:grid-cols-2">
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.mode} onChange={(event) => setDraft({ ...draft, mode: event.target.value as ConnectorMode })}>
                {(['Read Only', 'Draft Write', 'Approval Required', 'Blocked'] as ConnectorMode[]).map((mode) => <option key={mode}>{mode}</option>)}
              </select>
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as ConnectorRisk })}>
                {(['LOW', 'MEDIUM', 'HIGH', 'BLOCKED'] as ConnectorRisk[]).map((risk) => <option key={risk}>{risk}</option>)}
              </select>
            </div>
            <textarea className="min-h-[100px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Mục đích connector..." value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} />
            <button onClick={addConnector} className="rounded-2xl bg-indigo-300 px-4 py-2 text-xs font-black text-slate-950">Thêm connector</button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['All', 'LOW', 'MEDIUM', 'HIGH', 'BLOCKED', 'Active', 'Prototype', 'Planned', 'Disabled'] as Array<typeof filter>).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-[10px] font-black ${filter === item ? 'border-indigo-300 bg-indigo-300 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-indigo-300'}`}>{item}</button>)}
          </div>

          <div className="mt-4 space-y-2">
            {filtered.map((connector) => <button key={connector.id} onClick={() => setSelectedId(connector.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === connector.id ? 'border-indigo-300 bg-indigo-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-indigo-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{connector.name}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskClass(connector.risk)}`}>{connector.risk}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{connector.category} · {connector.status} · {connector.mode}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected connector</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.name}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.category} · {selected.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(selected.risk)}`}>{selected.risk}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${modeClass(selected.mode)}`}>{selected.mode}</span>
            </div>
          </div>

          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-slate-300">{selected.purpose}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">Allowed actions</p>
              <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-300">
                {selected.allowedActions.map((action) => <li key={action}>• {action}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-200">Blocked actions</p>
              <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-300">
                {selected.blockedActions.map((action) => <li key={action}>• {action}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Input schema</p>
              <code className="mt-2 block whitespace-pre-wrap text-xs font-semibold leading-6 text-indigo-100">{selected.inputSchema}</code>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Output schema</p>
              <code className="mt-2 block whitespace-pre-wrap text-xs font-semibold leading-6 text-indigo-100">{selected.outputSchema}</code>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-black text-slate-300">
              Status
              <select className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={selected.status} onChange={(event) => updateSelected({ status: event.target.value as ConnectorStatus })}>
                {(['Planned', 'Prototype', 'Active', 'Disabled'] as ConnectorStatus[]).map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-black text-slate-300">
              Mode
              <select className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={selected.mode} onChange={(event) => updateSelected({ mode: event.target.value as ConnectorMode, approvalRequired: event.target.value === 'Approval Required' || selected.risk === 'HIGH' || selected.risk === 'BLOCKED' })}>
                {(['Read Only', 'Draft Write', 'Approval Required', 'Blocked'] as ConnectorMode[]).map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => updateSelected({ approvalRequired: !selected.approvalRequired })} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.approvalRequired ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-slate-700 text-slate-300'}`}>Approval required: {selected.approvalRequired ? 'YES' : 'NO'}</button>
            <button onClick={() => updateSelected({ auditRequired: !selected.auditRequired })} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.auditRequired ? 'border-blue-300 bg-blue-300 text-slate-950' : 'border-slate-700 text-slate-300'}`}>Audit required: {selected.auditRequired ? 'YES' : 'NO'}</button>
          </div>
        </div>}
      </div>
    </section>
  );
}
