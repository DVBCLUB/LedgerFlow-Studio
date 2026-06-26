import { createHash } from 'node:crypto';
import { listAgentToolContracts, type AgentToolContract, type AgentToolRisk } from './agentToolRegistry.ts';

export type MCPManifestHealth = 'healthy' | 'degraded' | 'blocked';

export interface MCPToolCredentialScope {
  id: string;
  permission: string;
  required: boolean;
  reason: string;
}

export interface MCPToolManifest {
  schemaVersion: 'ledgerflow.mcp-tool.v1';
  id: string;
  name: string;
  description: string;
  version: string;
  permission: string;
  risk: AgentToolRisk;
  execution: 'simulation' | 'sandbox' | 'connector';
  approval: {
    required: boolean;
    policy: 'none' | 'human_review' | 'blocked';
  };
  runtime: {
    timeoutMs: number;
    maxAttempts: number;
  };
  credentialScopes: MCPToolCredentialScope[];
  healthCheck: {
    enabled: boolean;
    degradedAfterMs: number;
    blockedAfterMs: number;
  };
  fingerprint: string;
}

export interface MCPToolRunSignal {
  toolId: string;
  ok: boolean;
  latencyMs: number;
  createdAt: string;
  error?: string;
}

export interface MCPToolHealthRow {
  toolId: string;
  health: MCPManifestHealth;
  score: number;
  lastRunAt: string | null;
  failures: number;
  averageLatencyMs: number;
  reasons: string[];
}

export interface MCPToolManifestCatalog {
  generatedAt: string;
  schemaVersion: 'ledgerflow.mcp-catalog.v1';
  manifests: MCPToolManifest[];
  health: MCPToolHealthRow[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    blocked: number;
    approvalRequired: number;
    connectorTools: number;
  };
}

function stableFingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function titleCaseToolId(id: string) {
  return id.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function credentialScopesFor(tool: AgentToolContract): MCPToolCredentialScope[] {
  if (tool.execution === 'simulation') {
    return [{ id: `${tool.id}:local-sim`, permission: tool.permission, required: false, reason: 'Simulation tools run without external credentials.' }];
  }
  if (tool.execution === 'sandbox') {
    return [{ id: `${tool.id}:workspace-sandbox`, permission: tool.permission, required: true, reason: 'Sandbox tools need scoped local workspace access only.' }];
  }
  return [{ id: `${tool.id}:connector-token`, permission: tool.permission, required: true, reason: 'Connector tools require explicitly scoped external credentials.' }];
}

export function buildMCPToolManifest(tool: AgentToolContract): MCPToolManifest {
  const base = {
    schemaVersion: 'ledgerflow.mcp-tool.v1' as const,
    id: tool.id,
    name: titleCaseToolId(tool.id),
    description: tool.description,
    version: '1.0.0',
    permission: tool.permission,
    risk: tool.risk,
    execution: tool.execution,
    approval: {
      required: tool.requiresApproval,
      policy: tool.risk === 'blocked' ? 'blocked' as const : tool.requiresApproval ? 'human_review' as const : 'none' as const,
    },
    runtime: {
      timeoutMs: tool.timeoutMs,
      maxAttempts: tool.maxAttempts,
    },
    credentialScopes: credentialScopesFor(tool),
    healthCheck: {
      enabled: true,
      degradedAfterMs: Math.max(tool.timeoutMs * 2, 30_000),
      blockedAfterMs: Math.max(tool.timeoutMs * 5, 120_000),
    },
  };
  return { ...base, fingerprint: stableFingerprint(base) };
}

export function validateMCPToolManifest(manifest: MCPToolManifest) {
  const errors: string[] = [];
  if (manifest.schemaVersion !== 'ledgerflow.mcp-tool.v1') errors.push('Invalid schemaVersion.');
  if (!manifest.id || !manifest.name || !manifest.description) errors.push('Manifest identity fields are required.');
  if (!manifest.permission) errors.push('Permission scope is required.');
  if (manifest.risk === 'high' && !manifest.approval.required) errors.push('High-risk tools must require approval.');
  if (manifest.execution === 'connector' && manifest.credentialScopes.every((scope) => !scope.required)) {
    errors.push('Connector tools require at least one required credential scope.');
  }
  const fingerprint = manifest.fingerprint;
  const { fingerprint: _ignored, ...withoutFingerprint } = manifest;
  if (fingerprint !== stableFingerprint(withoutFingerprint)) errors.push('Manifest fingerprint mismatch.');
  return { ok: errors.length === 0, errors };
}

export function assessMCPToolHealth(manifest: MCPToolManifest, signals: MCPToolRunSignal[] = [], now = new Date()): MCPToolHealthRow {
  const toolSignals = signals.filter((signal) => signal.toolId === manifest.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const failures = toolSignals.filter((signal) => !signal.ok).length;
  const averageLatencyMs = toolSignals.length
    ? Math.round(toolSignals.reduce((sum, signal) => sum + signal.latencyMs, 0) / toolSignals.length)
    : 0;
  const lastRunAt = toolSignals[0]?.createdAt || null;
  const ageMs = lastRunAt ? now.getTime() - new Date(lastRunAt).getTime() : Number.POSITIVE_INFINITY;
  const reasons: string[] = [];

  let score = 100;
  if (manifest.risk === 'blocked') {
    score = 0;
    reasons.push('Tool risk tier is blocked.');
  }
  if (failures) {
    score -= Math.min(50, failures * 12);
    reasons.push(`${failures} recent failure signal(s).`);
  }
  if (averageLatencyMs > manifest.runtime.timeoutMs) {
    score -= 20;
    reasons.push('Average latency exceeds timeout budget.');
  }
  if (!lastRunAt) {
    score -= 10;
    reasons.push('No runtime health signal recorded yet.');
  } else if (ageMs > manifest.healthCheck.blockedAfterMs) {
    score -= 45;
    reasons.push('Last health signal is stale beyond blocked threshold.');
  } else if (ageMs > manifest.healthCheck.degradedAfterMs) {
    score -= 18;
    reasons.push('Last health signal is stale beyond degraded threshold.');
  }
  if (manifest.execution === 'connector' && manifest.credentialScopes.some((scope) => scope.required)) {
    reasons.push('Connector credential scope requires explicit configuration.');
  }

  score = Math.max(0, Math.min(100, score));
  const health: MCPManifestHealth = manifest.risk === 'blocked' || score < 45 ? 'blocked' : score < 75 ? 'degraded' : 'healthy';
  return { toolId: manifest.id, health, score, lastRunAt, failures, averageLatencyMs, reasons };
}

export function exportMCPToolManifestCatalog(signals: MCPToolRunSignal[] = [], now = new Date()): MCPToolManifestCatalog {
  const manifests = listAgentToolContracts().map(buildMCPToolManifest);
  const health = manifests.map((manifest) => assessMCPToolHealth(manifest, signals, now));
  return {
    generatedAt: now.toISOString(),
    schemaVersion: 'ledgerflow.mcp-catalog.v1',
    manifests,
    health,
    summary: {
      total: manifests.length,
      healthy: health.filter((row) => row.health === 'healthy').length,
      degraded: health.filter((row) => row.health === 'degraded').length,
      blocked: health.filter((row) => row.health === 'blocked').length,
      approvalRequired: manifests.filter((manifest) => manifest.approval.required).length,
      connectorTools: manifests.filter((manifest) => manifest.execution === 'connector').length,
    },
  };
}
