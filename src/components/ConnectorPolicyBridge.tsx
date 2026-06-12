import { useEffect } from 'react';

type ConnectorRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
type ConnectorMode = 'Read Only' | 'Draft Write' | 'Approval Required' | 'Blocked';

type ConnectorDefinition = {
  id: string;
  name: string;
  category: string;
  status: string;
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

type ConnectorPolicySummary = {
  connectorId: string;
  name: string;
  mode: ConnectorMode;
  risk: ConnectorRisk;
  mustApprove: boolean;
  mustAudit: boolean;
  status: string;
  updatedAt: string;
  allowedActions: string[];
  blockedActions: string[];
};

type ApprovalRequest = {
  id: string;
  title: string;
  source: 'Session' | 'Workboard' | 'Review Desk' | 'Connector';
  sourceId?: string;
  action: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
  conditions: string;
  approvalPhrase: string;
  expiresAt: string;
  createdAt: string;
  approvedAt?: string;
};

type ApprovalEvent = {
  id: string;
  at: string;
  approvalId: string;
  action: string;
  detail: string;
};

const CONNECTORS_KEY = 'ledgerflow_connector_sdk_registry_v1';
const POLICY_SUMMARY_KEY = 'ledgerflow_connector_policy_summary_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';
const APPROVAL_EVENTS_KEY = 'ledgerflow_approval_gate_events_v1';

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

function connectorNeedsApproval(connector: ConnectorDefinition) {
  return connector.approvalRequired || connector.mode === 'Approval Required' || connector.mode === 'Blocked' || connector.risk === 'HIGH' || connector.risk === 'BLOCKED';
}

function asApprovalRisk(risk: ConnectorRisk): ApprovalRequest['risk'] {
  if (risk === 'LOW') return 'LOW';
  if (risk === 'MEDIUM') return 'MEDIUM';
  return 'HIGH';
}

function upsertPolicySummaries(connectors: ConnectorDefinition[]) {
  const current = readLocal<ConnectorPolicySummary[]>(POLICY_SUMMARY_KEY, []);
  const now = new Date().toLocaleString('vi-VN');
  const next = connectors.map((connector) => {
    const old = current.find((item) => item.connectorId === connector.id);
    return {
      connectorId: connector.id,
      name: connector.name,
      mode: connector.mode,
      risk: connector.risk,
      mustApprove: connectorNeedsApproval(connector),
      mustAudit: connector.auditRequired,
      status: connector.status,
      updatedAt: old?.updatedAt ?? now,
      allowedActions: connector.allowedActions,
      blockedActions: connector.blockedActions
    };
  });
  writeLocal(POLICY_SUMMARY_KEY, next);
}

function upsertConnectorApprovals(connectors: ConnectorDefinition[]) {
  const approvals = readLocal<ApprovalRequest[]>(APPROVAL_KEY, []);
  const events = readLocal<ApprovalEvent[]>(APPROVAL_EVENTS_KEY, []);
  const now = new Date();
  let changed = false;
  let eventChanged = false;
  const nextApprovals = [...approvals];
  const nextEvents = [...events];

  connectors.filter(connectorNeedsApproval).forEach((connector) => {
    const existing = nextApprovals.find((approval) => approval.source === 'Connector' && approval.sourceId === connector.id && approval.status === 'Pending');
    if (existing) return;
    const id = `approval-connector-${connector.id}-${Date.now()}`;
    const approval: ApprovalRequest = {
      id,
      title: `Approve connector policy: ${connector.name}`,
      source: 'Connector',
      sourceId: connector.id,
      action: `Allow connector mode ${connector.mode} for ${connector.name}`,
      risk: asApprovalRisk(connector.risk),
      status: 'Pending',
      conditions: [
        `Connector: ${connector.name}`,
        `Mode: ${connector.mode}`,
        `Risk: ${connector.risk}`,
        `Status: ${connector.status}`,
        `Allowed: ${connector.allowedActions.join('; ')}`,
        `Blocked: ${connector.blockedActions.join('; ')}`,
        'Connector chỉ được chạy theo input/output schema đã khai báo.',
        'Mọi thao tác ghi hoặc rủi ro cao phải đi qua audit và Review Desk.'
      ].join('\n'),
      approvalPhrase: 'APPROVE AI GITHUB PUSH',
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      createdAt: now.toLocaleString('vi-VN')
    };
    nextApprovals.unshift(approval);
    nextEvents.unshift({
      id: `approval-event-${Date.now()}-${connector.id}`,
      at: now.toLocaleString('vi-VN'),
      approvalId: id,
      action: 'CONNECTOR_APPROVAL_CREATED',
      detail: `Auto-created approval request for connector ${connector.name}.`
    });
    changed = true;
    eventChanged = true;
  });

  if (changed) writeLocal(APPROVAL_KEY, nextApprovals);
  if (eventChanged) writeLocal(APPROVAL_EVENTS_KEY, nextEvents.slice(0, 200));
}

export default function ConnectorPolicyBridge() {
  useEffect(() => {
    const sync = () => {
      const connectors = readLocal<ConnectorDefinition[]>(CONNECTORS_KEY, []);
      if (!connectors.length) return;
      upsertPolicySummaries(connectors);
      upsertConnectorApprovals(connectors);
    };
    sync();
    window.addEventListener('ledgerflow-connector-sdk-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ledgerflow-connector-sdk-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return null;
}
