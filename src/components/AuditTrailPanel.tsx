import { useEffect, useMemo, useState } from 'react';

type AuditSource = 'Sessions' | 'Workboard' | 'Approval' | 'Sandbox' | 'Connectors' | 'Review Desk' | 'Build Monitor' | 'CI Recovery';

type AuditItem = {
  id: string;
  source: AuditSource;
  at: string;
  action: string;
  title: string;
  detail: string;
  risk?: string;
  status?: string;
  raw: unknown;
};

const sourceOptions: Array<'All' | AuditSource> = ['All', 'Sessions', 'Workboard', 'Approval', 'Sandbox', 'Connectors', 'Review Desk', 'Build Monitor', 'CI Recovery'];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function asText(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value); } catch { return ''; }
}

function normalizeAudit(): AuditItem[] {
  const items: AuditItem[] = [];

  const sessionEvents = readJson<any[]>('ledgerflow_agent_session_events_v1', []);
  for (const event of sessionEvents) {
    items.push({
      id: `session-${event.id ?? Math.random()}`,
      source: 'Sessions',
      at: event.at ?? '',
      action: event.action ?? 'SESSION_EVENT',
      title: event.sessionId ?? 'Agent session',
      detail: event.detail ?? '',
      raw: event
    });
  }

  const workboardAudit = readJson<any[]>('ledgerflow_aiops_audit_v1', []);
  for (const event of workboardAudit) {
    items.push({
      id: `workboard-${event.id ?? Math.random()}`,
      source: 'Workboard',
      at: event.at ?? event.time ?? '',
      action: event.action ?? 'WORKBOARD_EVENT',
      title: event.cardTitle ?? event.title ?? 'Workboard',
      detail: event.detail ?? event.message ?? '',
      status: event.status,
      raw: event
    });
  }

  const approvals = readJson<any[]>('ledgerflow_approval_gate_requests_v1', []);
  for (const approval of approvals) {
    items.push({
      id: `approval-${approval.id ?? Math.random()}`,
      source: 'Approval',
      at: approval.createdAt ?? approval.at ?? '',
      action: 'APPROVAL_REQUEST',
      title: approval.title ?? approval.action ?? 'Approval request',
      detail: approval.limits ?? approval.reason ?? approval.description ?? '',
      risk: approval.risk,
      status: approval.status,
      raw: approval
    });
  }

  const approvalEvents = readJson<any[]>('ledgerflow_approval_gate_events_v1', []);
  for (const event of approvalEvents) {
    items.push({
      id: `approval-event-${event.id ?? Math.random()}`,
      source: 'Approval',
      at: event.at ?? '',
      action: event.action ?? 'APPROVAL_EVENT',
      title: event.approvalId ?? 'Approval event',
      detail: event.detail ?? '',
      raw: event
    });
  }

  const sandboxEvents = readJson<any[]>('ledgerflow_sandbox_patch_events_v1', []);
  for (const event of sandboxEvents) {
    items.push({
      id: `sandbox-${event.id ?? Math.random()}`,
      source: 'Sandbox',
      at: event.at ?? '',
      action: event.action ?? 'SANDBOX_EVENT',
      title: event.patchId ?? event.title ?? 'Sandbox patch',
      detail: event.detail ?? '',
      raw: event
    });
  }

  const connectors = readJson<any[]>('ledgerflow_connector_sdk_registry_v1', []);
  for (const connector of connectors) {
    items.push({
      id: `connector-${connector.id ?? connector.name ?? Math.random()}`,
      source: 'Connectors',
      at: connector.updatedAt ?? connector.createdAt ?? '',
      action: 'CONNECTOR_POLICY',
      title: connector.name ?? 'Connector',
      detail: `Mode: ${connector.mode ?? 'unknown'} · Risk: ${connector.risk ?? 'unknown'} · Approval: ${connector.approvalRequired ? 'required' : 'not required'}`,
      risk: connector.risk,
      status: connector.status,
      raw: connector
    });
  }

  const connectorSummary = readJson<any>('ledgerflow_connector_policy_summary_v1', null);
  if (connectorSummary) {
    items.push({
      id: `connector-summary-${connectorSummary.updatedAt ?? 'current'}`,
      source: 'Connectors',
      at: connectorSummary.updatedAt ?? '',
      action: 'CONNECTOR_POLICY_SUMMARY',
      title: 'Connector policy summary',
      detail: `${connectorSummary.approvalRequiredCount ?? 0} connector cần approval · ${connectorSummary.blockedCount ?? 0} connector bị blocked`,
      raw: connectorSummary
    });
  }

  const reviewResult = readJson<any>('ledgerflow_review_desk_last_result_v1', null);
  if (reviewResult) {
    items.push({
      id: `review-last-${reviewResult.branch ?? reviewResult.prNumber ?? 'last'}`,
      source: 'Review Desk',
      at: reviewResult.at ?? reviewResult.createdAt ?? '',
      action: 'LAST_PR_RESULT',
      title: reviewResult.title ?? `PR #${reviewResult.prNumber ?? '?'}`,
      detail: `Repo: ${reviewResult.repo ?? ''} · Branch: ${reviewResult.branch ?? ''} · PR: ${reviewResult.prUrl ?? ''}`,
      status: reviewResult.status,
      raw: reviewResult
    });
  }

  const buildRecords = readJson<any[]>('ledgerflow_build_monitor_v1', []);
  for (const build of buildRecords) {
    items.push({
      id: `build-${build.id ?? build.branch ?? Math.random()}`,
      source: 'Build Monitor',
      at: build.updatedAt ?? build.at ?? '',
      action: 'BUILD_RECORD',
      title: build.branch ?? build.repo ?? 'Build record',
      detail: `${build.repo ?? ''} · ${build.workflowName ?? build.artifactName ?? ''}`,
      status: build.status,
      raw: build
    });
  }

  const ciQueue = readJson<any[]>('ledgerflow_ci_recovery_queue_v1', []);
  for (const item of ciQueue) {
    items.push({
      id: `ci-${item.id ?? Math.random()}`,
      source: 'CI Recovery',
      at: item.at ?? '',
      action: 'CI_RECOVERY_ITEM',
      title: `PR #${item.prNumber ?? '?'} · ${item.branch ?? 'unknown branch'}`,
      detail: `${item.workflowName ?? 'workflow'} · ${item.conclusion ?? ''}`,
      status: item.status,
      raw: item
    });
  }

  return items.sort((a, b) => asText(b.at).localeCompare(asText(a.at)));
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

export default function AuditTrailPanel() {
  const [items, setItems] = useState<AuditItem[]>(() => normalizeAudit());
  const [source, setSource] = useState<'All' | AuditSource>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = () => setItems(normalizeAudit());

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 2000);
    const onStorage = () => refresh();
    const onAnySync = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('ledgerflow-connector-policy-synced', onAnySync);
    window.addEventListener('ledgerflow-review-desk-result', onAnySync);
    window.addEventListener('ledgerflow-build-monitor-sync', onAnySync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ledgerflow-connector-policy-synced', onAnySync);
      window.removeEventListener('ledgerflow-review-desk-result', onAnySync);
      window.removeEventListener('ledgerflow-build-monitor-sync', onAnySync);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const sourceOk = source === 'All' || item.source === source;
      if (!sourceOk) return false;
      if (!q) return true;
      return [item.source, item.action, item.title, item.detail, item.risk, item.status].some((value) => asText(value).toLowerCase().includes(q));
    });
  }, [items, query, source]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];

  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-950/70 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Unified audit trail</p>
          <h3 className="mt-1 text-xl font-black text-white">Nhật ký điều phối AI</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Một nơi gom dấu vết từ Sessions, Workboard, Approval, Sandbox, Connectors, Review Desk, Build Monitor và CI Recovery.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-slate-300">Làm mới</button>
          <button onClick={() => exportJson('ledgerflow-unified-audit-trail.json', filtered)} className="rounded-2xl bg-slate-200 px-4 py-2 text-xs font-black text-slate-950">Xuất audit</button>
        </div>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[0.7fr_1.3fr]">
        <select value={source} onChange={(event) => setSource(event.target.value as 'All' | AuditSource)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white">
          {sourceOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo action, branch, risk, status, PR..." className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-h-[620px] space-y-2 overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          {filtered.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === item.id ? 'border-slate-300 bg-slate-800/80' : 'border-slate-800 bg-slate-950/50 hover:border-slate-500'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-white">{item.title}</p>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{item.source}</span>
            </div>
            <p className="mt-1 text-[11px] font-black text-slate-400">{item.action}</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{item.detail}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black text-slate-500">
              {item.status && <span>Status: {item.status}</span>}
              {item.risk && <span>Risk: {item.risk}</span>}
              {item.at && <span>{item.at}</span>}
            </div>
          </button>)}
          {filtered.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm font-semibold text-slate-400">Chưa có audit item phù hợp.</p>}
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected audit item</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.source} · {selected.action} · {selected.at || 'no time'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.status && <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-black text-slate-300">{selected.status}</span>}
              {selected.risk && <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-200">{selected.risk}</span>}
            </div>
          </div>
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-slate-300">{selected.detail || 'Không có mô tả.'}</p>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Raw event</p>
            <pre className="mt-2 max-h-[420px] overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-slate-300">{JSON.stringify(selected.raw, null, 2)}</pre>
          </div>
        </div>}
      </div>
    </section>
  );
}
