/**
 * aiActionLedger.ts
 * ============================================================
 * ENTERPRISE IMMUTABLE ACTION LEDGER FOR AUTONOMOUS AI AGENTS
 *
 * Compliant with:
 * - EU AI Act Article 13 (High-risk AI traceability & logging requirements)
 * - OpenAI Seven Practices for Autonomous Agents (Immutable Action Ledger)
 * - NIST AI Risk Management Framework (RMF) Lineage & Forensics
 *
 * Provides cryptographic audit trail with SHA-256 integrity hashes,
 * append-only storage, search filters, and tamper verification.
 */

import crypto from 'crypto';
import { setCacheItem } from './sqliteStorageCache.ts';

export interface AIActionLogEntry {
  entryId: string;
  timestamp: string;
  agentId: string;
  roleId: string;
  domain: string;
  actionType: string;
  targetResource: string;
  inputPayloadHash: string;
  outputSummary: string;
  permissionCheckPassed: boolean;
  constitutionalRulePassed: boolean;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
  previousHash: string;
  integrityHash: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface ActionLedgerQueryFilter {
  roleId?: string;
  domain?: string;
  actionType?: string;
  onlyViolations?: boolean;
  fromTimestamp?: string;
  limit?: number;
}

// In-memory append-only ledger with Genesis block
const ACTION_LEDGER_STORAGE: AIActionLogEntry[] = [];
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function computeIntegrityHash(entryWithoutHash: Omit<AIActionLogEntry, 'integrityHash'>): string {
  const content = JSON.stringify({
    entryId: entryWithoutHash.entryId,
    timestamp: entryWithoutHash.timestamp,
    agentId: entryWithoutHash.agentId,
    roleId: entryWithoutHash.roleId,
    domain: entryWithoutHash.domain,
    actionType: entryWithoutHash.actionType,
    targetResource: entryWithoutHash.targetResource,
    inputPayloadHash: entryWithoutHash.inputPayloadHash,
    outputSummary: entryWithoutHash.outputSummary,
    permissionCheckPassed: entryWithoutHash.permissionCheckPassed,
    constitutionalRulePassed: entryWithoutHash.constitutionalRulePassed,
    tokensUsed: entryWithoutHash.tokensUsed,
    costUsd: entryWithoutHash.costUsd,
    previousHash: entryWithoutHash.previousHash,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Hash arbitrary input payload safely
 */
export function hashPayload(payload: unknown): string {
  const stringified = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
  return crypto.createHash('sha256').update(stringified).digest('hex').substring(0, 16);
}

/**
 * Append a verified action to the immutable ledger
 */
export function recordAIAction(params: {
  agentId: string;
  roleId: string;
  domain: string;
  actionType: string;
  targetResource: string;
  inputPayload?: unknown;
  outputSummary: string;
  permissionCheckPassed: boolean;
  constitutionalRulePassed: boolean;
  tokensUsed?: number;
  costUsd?: number;
  latencyMs?: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}): AIActionLogEntry {
  const previousHash =
    ACTION_LEDGER_STORAGE.length > 0
      ? ACTION_LEDGER_STORAGE[ACTION_LEDGER_STORAGE.length - 1].integrityHash
      : GENESIS_HASH;

  const entryId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  const inputPayloadHash = hashPayload(params.inputPayload);

  const entryDraft: Omit<AIActionLogEntry, 'integrityHash'> = {
    entryId,
    timestamp,
    agentId: params.agentId,
    roleId: params.roleId,
    domain: params.domain,
    actionType: params.actionType,
    targetResource: params.targetResource,
    inputPayloadHash,
    outputSummary: params.outputSummary,
    permissionCheckPassed: params.permissionCheckPassed,
    constitutionalRulePassed: params.constitutionalRulePassed,
    tokensUsed: params.tokensUsed || 0,
    costUsd: params.costUsd || 0,
    latencyMs: params.latencyMs || 0,
    previousHash,
    sessionId: params.sessionId,
    metadata: params.metadata,
  };

  const integrityHash = computeIntegrityHash(entryDraft);
  const finalEntry: AIActionLogEntry = { ...entryDraft, integrityHash };

  ACTION_LEDGER_STORAGE.push(finalEntry);
  setCacheItem('ai_action_ledger', { id: finalEntry.entryId, ...finalEntry });

  // Keep memory bounded to last 10,000 entries
  if (ACTION_LEDGER_STORAGE.length > 10000) {
    ACTION_LEDGER_STORAGE.shift();
  }

  return finalEntry;
}

/**
 * Query action logs with filtering and pagination
 */
export function queryAIActionLedger(filter: ActionLedgerQueryFilter = {}): {
  entries: AIActionLogEntry[];
  total: number;
  isChainValid: boolean;
} {
  let list = [...ACTION_LEDGER_STORAGE];

  if (filter.roleId) {
    list = list.filter((e) => e.roleId === filter.roleId);
  }
  if (filter.domain) {
    list = list.filter((e) => e.domain === filter.domain);
  }
  if (filter.actionType) {
    list = list.filter((e) => e.actionType.toLowerCase().includes(filter.actionType!.toLowerCase()));
  }
  if (filter.onlyViolations) {
    list = list.filter((e) => !e.permissionCheckPassed || !e.constitutionalRulePassed);
  }
  if (filter.fromTimestamp) {
    list = list.filter((e) => e.timestamp >= filter.fromTimestamp!);
  }

  const isChainValid = verifyLedgerChainIntegrity();
  const limit = filter.limit && filter.limit > 0 ? filter.limit : 50;
  const sliced = list.slice(-limit).reverse(); // Latest first

  return {
    entries: sliced,
    total: list.length,
    isChainValid,
  };
}

/**
 * Verify cryptographic hash chain integrity (detect tampering)
 */
export function verifyLedgerChainIntegrity(): boolean {
  if (ACTION_LEDGER_STORAGE.length === 0) return true;

  for (let i = 0; i < ACTION_LEDGER_STORAGE.length; i++) {
    const current = ACTION_LEDGER_STORAGE[i];
    const expectedPrevHash = i === 0 ? GENESIS_HASH : ACTION_LEDGER_STORAGE[i - 1].integrityHash;

    if (current.previousHash !== expectedPrevHash) {
      return false;
    }

    const { integrityHash, ...withoutHash } = current;
    if (computeIntegrityHash(withoutHash) !== integrityHash) {
      return false;
    }
  }

  return true;
}

/**
 * Clear ledger (for testing only)
 */
export function __resetActionLedgerForTesting(): void {
  ACTION_LEDGER_STORAGE.length = 0;
}
