/**
 * connectorContract.ts
 * ============================================================
 * Chuẩn hóa hợp đồng connector — mọi connector trong hệ thống
 * phải khai báo capabilities, auth mode, risk profile và health
 * theo interface này để Control Plane đọc và điều phối được.
 */

import type { IntegrationCategory, IntegrationStatus, IntegrationPriority } from './integrationRegistry';

// ─── Auth modes ──────────────────────────────────────────────────────
export type ConnectorAuthMode =
  | 'none'           // Không cần xác thực (VD: local terminal)
  | 'local_token'    // Token trong env/biến môi trường
  | 'env_var'        // Biến môi trường như GITHUB_TOKEN
  | 'oauth_app'      // OAuth app-level (Google, Microsoft)
  | 'oauth_user'     // OAuth user-level (đăng nhập tương tác)
  | 'api_key'        // API key thuần
  | 'browser_session'; // Session trình duyệt (Web AI profile)

// ─── Capability declaration ─────────────────────────────────────────
export interface ConnectorCapability {
  id: string;                    // Mã capability, VD: 'read_issues', 'push_code'
  label: string;                 // Tên hiển thị tiếng Việt
  category: 'read' | 'write' | 'execute' | 'notify' | 'schedule';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  requiresApproval: boolean;
  description: string;
  inputSchema?: Record<string, unknown>;  // JSON Schema cho input
  outputSchema?: Record<string, unknown>; // JSON Schema cho output
}

// ─── Connector health snapshot ──────────────────────────────────────
export interface ConnectorHealth {
  ok: boolean;
  lastCheckedAt: string;
  latencyMs?: number;
  message: string;
  detail?: Record<string, unknown>;
}

// ─── Connector contract (hợp đồng chuẩn) ────────────────────────────
export interface ConnectorContract {
  id: string;
  title: string;
  subtitle: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  priority: IntegrationPriority;
  authMode: ConnectorAuthMode;
  enabled: boolean;
  capabilities: ConnectorCapability[];
  health: ConnectorHealth;
  // Actions mà control plane có thể gọi
  allowedActions: Array<'open' | 'read' | 'write' | 'execute' | 'handoff'>;
  quickActions: Array<{
    label: string;
    action: 'open_url' | 'open_local' | 'handoff_prompt' | 'api_call';
    href?: string;
    hash?: string;
  }>;
  lastHandoffAt?: string;
}

// ─── Handoff request — điều phối tác vụ sang connector ──────────────
export interface ConnectorHandoffRequest {
  connectorId: string;
  capabilityId: string;
  payload: Record<string, unknown>;
  approvalPhrase?: string;
  metadata?: {
    source: string;           // VD: 'control_plane', 'chat_tab'
    initiatedBy: string;      // email hoặc session id
    taskId?: string;
  };
}

export interface ConnectorHandoffResult {
  ok: boolean;
  connectorId: string;
  capabilityId: string;
  executedAt: string;
  evidence: Record<string, unknown>;
  message: string;
  error?: string;
}

// ─── Contract registry (in-memory) ──────────────────────────────────
const registeredContracts = new Map<string, ConnectorContract>();

export function registerContract(contract: ConnectorContract): void {
  registeredContracts.set(contract.id, contract);
}

export function getContract(id: string): ConnectorContract | undefined {
  return registeredContracts.get(id);
}

export function listContracts(category?: string): ConnectorContract[] {
  const all = Array.from(registeredContracts.values());
  if (category && category !== 'all') {
    return all.filter(c => c.category === category);
  }
  return all;
}

export function updateContractHealth(id: string, health: Partial<ConnectorHealth>): boolean {
  const contract = registeredContracts.get(id);
  if (!contract) return false;
  contract.health = {
    ...contract.health,
    ...health,
    lastCheckedAt: new Date().toISOString(),
  };
  return true;
}

export function getContractCapability(connectorId: string, capabilityId: string): ConnectorCapability | undefined {
  const contract = registeredContracts.get(connectorId);
  return contract?.capabilities.find(c => c.id === capabilityId);
}

// ─── Khởi tạo contracts từ IntegrationConnector[] ───────────────────
import type { IntegrationConnector } from './integrationRegistry';

export function seedContractsFromRegistry(connectors: IntegrationConnector[]): void {
  for (const conn of connectors) {
    if (registeredContracts.has(conn.id)) continue;

    const authMode = resolveAuthMode(conn);
    const capabilities = resolveCapabilities(conn);

    const contract: ConnectorContract = {
      id: conn.id,
      title: conn.title,
      subtitle: conn.subtitle,
      category: conn.category,
      status: conn.status,
      priority: conn.priority,
      authMode,
      enabled: conn.enabled,
      capabilities,
      health: {
        ok: conn.status === 'connected' || conn.status === 'local',
        lastCheckedAt: conn.lastCheckedAt ?? new Date().toISOString(),
        message: conn.lastMessage ?? 'Đã khởi tạo contract.',
      },
      allowedActions: conn.enabled
        ? capabilities.some(c => c.category === 'execute')
          ? ['open', 'read', 'write', 'execute', 'handoff']
          : ['open', 'read', 'handoff']
        : ['open'],
      quickActions: conn.quickActions.map(qa => ({
        label: qa.label,
        action: qa.href ? 'open_url' : 'handoff_prompt',
        href: qa.href,
        hash: qa.hash,
      })),
    };

    registeredContracts.set(conn.id, contract);
  }
}

function resolveAuthMode(conn: IntegrationConnector): ConnectorAuthMode {
  if (conn.category === 'ai' && conn.id.includes('web')) return 'browser_session';
  if (conn.category === 'ai') return 'api_key';
  if (conn.id === 'github') return 'env_var';
  if (conn.category === 'workspace') return 'oauth_user';
  if (conn.status === 'local') return 'none';
  return 'none';
}

function resolveCapabilities(conn: IntegrationConnector): ConnectorCapability[] {
  const caps: ConnectorCapability[] = [];

  // Generic: always have ability to "open" the connector
  caps.push({
    id: `${conn.id}.open`,
    label: `Mở ${conn.title}`,
    category: 'read',
    risk: 'LOW',
    requiresApproval: false,
    description: `Mở giao diện ${conn.title} để tương tác trực tiếp.`,
  });

  // Map existing capabilities strings to structured ones
  for (const capStr of conn.capabilities) {
    const risk = capStr.toLowerCase().includes('xóa') || capStr.toLowerCase().includes('push') || capStr.toLowerCase().includes('delete')
      ? 'HIGH'
      : capStr.toLowerCase().includes('tạo') || capStr.toLowerCase().includes('đồng bộ') || capStr.toLowerCase().includes('write')
        ? 'MEDIUM'
        : 'LOW';

    caps.push({
      id: `${conn.id}.${capStr.slice(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      label: capStr,
      category: capStr.toLowerCase().includes('tạo') ? 'write' : capStr.toLowerCase().includes('chạy') ? 'execute' : 'read',
      risk: risk as ConnectorCapability['risk'],
      requiresApproval: risk === 'HIGH' || risk === 'MEDIUM',
      description: `${conn.title}: ${capStr}`,
    });
  }

  return caps;
}
