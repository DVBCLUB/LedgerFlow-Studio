import { createHash } from 'node:crypto';
import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';

export interface MCPExternalExecutionRecord {
  idempotencyKey: string;
  fingerprint: string;
  serverId: string;
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  result?: unknown;
  error?: string;
}

interface Store extends Record<string, unknown> { records: Record<string, MCPExternalExecutionRecord> }
const store = createJsonFileLocalStore<Store>({
  filePath: () => resolveRuntimePathFromEnv('MCP_EXTERNAL_EXECUTION_LEDGER_FILE', 'mcp_external_execution_ledger.local.json'),
  emptyState: () => ({ records: {} }),
  normalizeState: (value) => ({ records: value && typeof value === 'object' && !Array.isArray(value) && (value as Store).records && typeof (value as Store).records === 'object' ? (value as Store).records : {} }),
});

function keyId(key: string) { return createHash('sha256').update(key).digest('hex'); }

export async function claimMCPExternalExecution(input: Pick<MCPExternalExecutionRecord, 'idempotencyKey' | 'fingerprint' | 'serverId' | 'toolName'>) {
  if (!/^[A-Za-z0-9._:-]{8,160}$/.test(input.idempotencyKey)) throw new Error('Invalid idempotency key.');
  return store.mutate((state) => {
    const id = keyId(input.idempotencyKey);
    const existing = state.records[id];
    if (existing) {
      if (existing.fingerprint !== input.fingerprint) throw new Error('Idempotency key was already used for different reviewed input.');
      return { claimed: false, record: existing };
    }
    const now = new Date().toISOString();
    const record: MCPExternalExecutionRecord = { ...input, status: 'running', createdAt: now, updatedAt: now };
    state.records[id] = record;
    return { claimed: true, record };
  });
}

export async function resolveMCPExternalExecution(key: string, outcome: { result?: unknown; error?: string }) {
  return store.mutate((state) => {
    const record = state.records[keyId(key)];
    if (!record) throw new Error('Execution claim not found.');
    record.status = outcome.error ? 'failed' : 'completed'; record.updatedAt = new Date().toISOString();
    record.result = outcome.result; record.error = outcome.error;
    return record;
  });
}

export async function clearMCPExternalExecutionLedgerForTest() { await store.clear(); }
