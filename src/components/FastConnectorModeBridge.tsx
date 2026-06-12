import { useEffect } from 'react';

type ReviewMode = { mode?: string };
type ConnectorApproval = { id: string; source?: string; status?: string; sourceId?: string; title?: string };
type ConnectorAudit = { id: string; at: string; action: string; detail: string };
type PolicySummary = { connectorId: string; name: string; mustApprove?: boolean; mustAudit?: boolean; risk?: string; mode?: string; status?: string };

const REVIEW_MODE_KEY = 'ledgerflow_review_mode_v1';
const APPROVALS_KEY = 'ledgerflow_approval_gate_requests_v1';
const POLICY_SUMMARY_KEY = 'ledgerflow_connector_policy_summary_v1';
const AUDIT_KEY = 'ledgerflow_connector_policy_audit_v1';
const LAST_RUN_KEY = 'ledgerflow_fast_connector_mode_last_v1';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isFastMode() {
  const mode = readLocal<ReviewMode>(REVIEW_MODE_KEY, { mode: 'fast_secure' });
  return mode.mode !== 'strict_review';
}

function syncFastConnectorMode() {
  if (!isFastMode()) return;

  const approvals = readLocal<ConnectorApproval[]>(APPROVALS_KEY, []);
  const connectorApprovals = approvals.filter((item) => item.source === 'Connector' && item.status === 'Pending');
  const keptApprovals = approvals.filter((item) => !(item.source === 'Connector' && item.status === 'Pending'));

  const summaries = readLocal<PolicySummary[]>(POLICY_SUMMARY_KEY, []);
  const nextSummaries = summaries.map((item) => ({ ...item, mustApprove: false, mustAudit: item.mustAudit ?? true }));

  const fingerprint = JSON.stringify({ connectorApprovalIds: connectorApprovals.map((item) => item.id).sort(), summaries: nextSummaries });
  if (localStorage.getItem(LAST_RUN_KEY) === fingerprint) return;
  localStorage.setItem(LAST_RUN_KEY, fingerprint);

  if (connectorApprovals.length) writeLocal(APPROVALS_KEY, keptApprovals);
  if (summaries.length) writeLocal(POLICY_SUMMARY_KEY, nextSummaries);

  if (connectorApprovals.length) {
    const audit = readLocal<ConnectorAudit[]>(AUDIT_KEY, []);
    const now = new Date().toLocaleString('vi-VN');
    const nextAudit: ConnectorAudit = {
      id: `fast-connector-mode-${Date.now()}`,
      at: now,
      action: 'FAST_MODE_CONNECTOR_APPROVALS_SIMPLIFIED',
      detail: `Fast Secure đang bật: ${connectorApprovals.length} connector approval phụ đã chuyển thành audit/policy summary. Thao tác code/push vẫn duyệt một lần ở Review Desk.`
    };
    writeLocal(AUDIT_KEY, [nextAudit, ...audit].slice(0, 200));
  }

  window.dispatchEvent(new CustomEvent('ledgerflow-connector-policy-synced'));
}

export default function FastConnectorModeBridge() {
  useEffect(() => {
    syncFastConnectorMode();
    const onSync = () => syncFastConnectorMode();
    const timer = window.setInterval(syncFastConnectorMode, 1500);
    window.addEventListener('ledgerflow-review-mode-changed', onSync);
    window.addEventListener('ledgerflow-connector-policy-synced', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ledgerflow-review-mode-changed', onSync);
      window.removeEventListener('ledgerflow-connector-policy-synced', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  return null;
}
