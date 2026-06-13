import { useEffect } from 'react';
import type { ApprovalRequest, ConnectorDefinition, ConnectorRisk } from '../../types/agentOps';

const CONNECTOR_KEYS = ['ledgerflow_connector_sdk_registry_v1', 'ledgerflow-connector-sdk-registry-v1'];
const POLICY_SUMMARY_KEY = 'ledgerflow_connector_policy_summary_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';
const APPROVAL_EVENTS_KEY = 'ledgerflow_approval_gate_events_v1';
const LAST_CONNECTOR_SNAPSHOT_KEY = 'ledgerflow_connector_policy_last_snapshot_v1';

type ConnectorPolicySummary = {
  connectorId: string;
  name: string;
  mode: string;
  risk: string;
  mustApprove: boolean;
  mustAudit: boolean;
  status: string;
  updatedAt: string;
  allowedActions: string[];
  blockedActions: string[];
};

type ApprovalEvent = {
  id: string;
  at: string;
  approvalId: string;
  action: string;
  detail: string;
};

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

function readConnectors(): ConnectorDefinition[] {
  for (const key of CONNECTOR_KEYS) {
    const connectors = readLocal<ConnectorDefinition[]>(key, []);
    if (connectors.length) return connectors;
  }
  return [];
}

function allowed(connector: ConnectorDefinition) {
  return Array.isArray(connector.allowedActions) ? connector.allowedActions : [];
}

function blocked(connector: ConnectorDefinition) {
  return Array.isArray(connector.blockedActions) ? connector.blockedActions : [];
}

function connectorNeedsApproval(connector: ConnectorDefinition) {
  return connector.approvalRequired || connector.mode === 'Approval Required' || connector.mode === 'Blocked' || connector.risk === 'HIGH' || connector.risk === 'BLOCKED';
}

function asApprovalRisk(risk: ConnectorRisk | string): ApprovalRequest['risk'] {
  if (risk === 'LOW') return 'LOW';
  if (risk === 'MEDIUM') return 'MEDIUM';
  return 'HIGH';
}

function connectorPolicyFingerprint(connector: ConnectorDefinition) {
  return JSON.stringify({
    id: connector.id,
    mode: connector.mode,
    risk: connector.risk,
    status: connector.status,
    approvalRequired: connector.approvalRequired,
    auditRequired: connector.auditRequired,
    allowedActions: allowed(connector),
    blockedActions: blocked(connector),
    inputSchema: connector.inputSchema,
    outputSchema: connector.outputSchema
  });
}

function registryFingerprint(connectors: ConnectorDefinition[]) {
  return JSON.stringify(connectors.map((connector) => connectorPolicyFingerprint(connector)).sort());
}

function upsertPolicySummaries(connectors: ConnectorDefinition[]) {
  const current = readLocal<ConnectorPolicySummary[]>(POLICY_SUMMARY_KEY, []);
  const now = new Date().toLocaleString('vi-VN');
  const next = connectors.map((connector) => {
    const old = current.find((item) => item.connectorId === connector.id);
    return {
      connectorId: connector.id,
      name: connector.name || 'Legacy connector',
      mode: connector.mode || 'Read Only',
      risk: connector.risk || 'MEDIUM',
      mustApprove: connectorNeedsApproval(connector),
      mustAudit: Boolean(connector.auditRequired),
      status: connector.status || 'Planned',
      updatedAt: old?.updatedAt ?? now,
      allowedActions: allowed(connector),
      blockedActions: blocked(connector)
    };
  });
  writeLocal(POLICY_SUMMARY_KEY, next);
}

function upsertConnectorApprovals(connectors: ConnectorDefinition[]) {
  const approvals = readLocal<ApprovalRequest[]>(APPROVAL_KEY, []);
  const events = readLocal<ApprovalEvent[]>(APPROVAL_EVENTS_KEY, []);
  const nextApprovals = [...approvals];
  const nextEvents = [...events];
  const now = new Date();
  let changed = false;

  connectors.filter(connectorNeedsApproval).forEach((connector) => {
    const policyKey = connectorPolicyFingerprint(connector);
    const existing = nextApprovals.find((approval) => approval.source === 'Connector' && approval.sourceId === connector.id && (approval.conditions ?? '').includes(`Policy key: ${policyKey}`) && (approval.status === 'Pending' || approval.status === 'Approved'));
    if (existing) return;
    const id = `approval-connector-${connector.id}-${Date.now()}`;
    nextApprovals.unshift({
      id,
      title: `Approve connector policy: ${connector.name || connector.id}`,
      source: 'Connector',
      sourceId: connector.id,
      action: `Allow connector mode ${connector.mode || 'Read Only'} for ${connector.name || connector.id}`,
      risk: asApprovalRisk(connector.risk),
      details: connector.purpose || 'Connector policy requires review.',
      conditions: [`Connector: ${connector.name || connector.id}`, `Mode: ${connector.mode || 'Read Only'}`, `Risk: ${connector.risk || 'MEDIUM'}`, `Allowed: ${allowed(connector).join('; ')}`, `Blocked: ${blocked(connector).join('; ')}`, `Policy key: ${policyKey}`].join('\n'),
      approvalPhrase: 'APPROVE AI GITHUB PUSH',
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
      status: 'Pending'
    });
    nextEvents.unshift({ id: `approval-event-${Date.now()}-${connector.id}`, at: now.toLocaleString('vi-VN'), approvalId: id, action: 'CONNECTOR_APPROVAL_CREATED', detail: `Auto-created approval request for connector ${connector.name || connector.id}.` });
    changed = true;
  });

  if (changed) {
    writeLocal(APPROVAL_KEY, nextApprovals);
    writeLocal(APPROVAL_EVENTS_KEY, nextEvents.slice(0, 200));
  }
}

function syncConnectorPolicy() {
  const connectors = readConnectors();
  if (!connectors.length) return;
  const fingerprint = registryFingerprint(connectors);
  const previous = localStorage.getItem(LAST_CONNECTOR_SNAPSHOT_KEY);
  if (fingerprint === previous) return;
  localStorage.setItem(LAST_CONNECTOR_SNAPSHOT_KEY, fingerprint);
  upsertPolicySummaries(connectors);
  upsertConnectorApprovals(connectors);
  window.dispatchEvent(new CustomEvent('ledgerflow-connector-policy-synced'));
}

export function useConnectorPolicySync() {
  useEffect(() => {
    syncConnectorPolicy();
    const timer = window.setInterval(syncConnectorPolicy, 2000);
    window.addEventListener('ledgerflow-connector-sdk-updated', syncConnectorPolicy);
    window.addEventListener('storage', syncConnectorPolicy);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ledgerflow-connector-sdk-updated', syncConnectorPolicy);
      window.removeEventListener('storage', syncConnectorPolicy);
    };
  }, []);
}
