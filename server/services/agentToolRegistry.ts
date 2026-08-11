import { createHash } from 'node:crypto';

export type AgentToolRisk = 'low' | 'medium' | 'high' | 'blocked';
export type AgentToolPermission =
  | 'knowledge:read'
  | 'plan:draft'
  | 'patch:draft'
  | 'browser:read'
  | 'terminal:read'
  | 'connector:write'
  | 'data:analyse'
  | 'report:generate'
  | 'notification:send'
  | 'web:search'
  | 'robot:inspect'
  | 'robot:move'
  | 'github:push'
  | 'github:pull';

export interface AgentToolContract {
  id: string;
  description: string;
  permission: AgentToolPermission;
  risk: AgentToolRisk;
  requiresApproval: boolean;
  timeoutMs: number;
  maxAttempts: number;
  execution: 'simulation' | 'sandbox' | 'connector';
}

const contracts = [
  // ─── Original 6 tools ───────────────────────────────────────────────────────
  {
    id: 'read_knowledge',
    description: 'Read reviewed company knowledge from the memory store.',
    permission: 'knowledge:read',
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15_000,
    maxAttempts: 2,
    execution: 'simulation',
  },
  {
    id: 'draft_plan',
    description: 'Draft a structured plan without external side effects.',
    permission: 'plan:draft',
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 30_000,
    maxAttempts: 2,
    execution: 'simulation',
  },
  {
    id: 'draft_patch',
    description: 'Draft a virtual code patch artifact for human review.',
    permission: 'patch:draft',
    risk: 'medium',
    requiresApproval: true,
    timeoutMs: 60_000,
    maxAttempts: 1,
    execution: 'sandbox',
  },
  {
    id: 'browser_check',
    description: 'Inspect an allowlisted browser target (read-only).',
    permission: 'browser:read',
    risk: 'medium',
    requiresApproval: true,
    timeoutMs: 90_000,
    maxAttempts: 1,
    execution: 'sandbox',
  },
  {
    id: 'terminal_check',
    description: 'Run an allowlisted read-only diagnostic command.',
    permission: 'terminal:read',
    risk: 'medium',
    requiresApproval: true,
    timeoutMs: 60_000,
    maxAttempts: 1,
    execution: 'sandbox',
  },
  {
    id: 'external_connector',
    description: 'Write through an explicitly configured external connector.',
    permission: 'connector:write',
    risk: 'high',
    requiresApproval: true,
    timeoutMs: 60_000,
    maxAttempts: 1,
    execution: 'connector',
  },

  // ─── New tools — AI & Automation ───────────────────────────────────────────
  {
    id: 'analyse_data',
    description: 'Analyse structured data (JSON/CSV) from the local database and return insights.',
    permission: 'data:analyse',
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 45_000,
    maxAttempts: 2,
    execution: 'sandbox',
  },
  {
    id: 'generate_report',
    description: 'Generate a structured markdown report artifact from agent observations.',
    permission: 'report:generate',
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 60_000,
    maxAttempts: 2,
    execution: 'simulation',
  },
  {
    id: 'send_notification',
    description: 'Send a notification through a configured channel (Telegram, in-app). Approval required.',
    permission: 'notification:send',
    risk: 'high',
    requiresApproval: true,
    timeoutMs: 30_000,
    maxAttempts: 1,
    execution: 'connector',
  },
  {
    id: 'search_web_context',
    description: 'Search web for business context (market data, competitor info). Sandboxed, read-only.',
    permission: 'web:search',
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 60_000,
    maxAttempts: 2,
    execution: 'sandbox',
  },

  // ─── New tools — Robot & Automation ────────────────────────────────────────
  {
    id: 'robot_inspect',
    description: 'Read the current robot simulation state and telemetry without movement.',
    permission: 'robot:inspect',
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 10_000,
    maxAttempts: 3,
    execution: 'simulation',
  },
  {
    id: 'robot_move',
    description: 'Issue a movement command to the robot simulator within the safety envelope. Approval required.',
    permission: 'robot:move',
    risk: 'high',
    requiresApproval: true,
    timeoutMs: 30_000,
    maxAttempts: 1,
    execution: 'simulation',
  },
  // ─── New tools — DevOps & GitHub ───────────────────────────────────────────
  {
    id: 'github_create_draft_pr',
    description: 'Create an approved Draft Pull Request on GitHub with local changes.',
    permission: 'github:push',
    risk: 'high',
    requiresApproval: true,
    timeoutMs: 90_000,
    maxAttempts: 1,
    execution: 'connector',
  },
  {
    id: 'github_pull_local',
    description: 'Pull the latest code from GitHub to the local environment.',
    permission: 'github:pull',
    risk: 'medium',
    requiresApproval: true,
    timeoutMs: 60_000,
    maxAttempts: 1,
    execution: 'connector',
  },
] as const satisfies readonly AgentToolContract[];

const registry = new Map<string, AgentToolContract>(contracts.map((c) => [c.id, c]));

export function listAgentToolContracts(): AgentToolContract[] {
  return Array.from(registry.values()).map((c) => ({ ...c }));
}

export function registerAgentToolContract(contract: AgentToolContract): void {
  registry.set(contract.id, contract);
}

export function getAgentToolContract(id: string): AgentToolContract | undefined {
  const contract = registry.get(id);
  return contract ? { ...contract } : undefined;
}

export function createApprovalFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
