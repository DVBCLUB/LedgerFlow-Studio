import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';

export type AIWorkforceRuntimeRecordType =
  | 'context_pack'
  | 'safety_decision'
  | 'pr_readiness'
  | 'pr_control'
  | 'mission_plan'
  | 'runtime_snapshot';

export interface AIWorkforceRuntimeRecord<T = unknown> {
  id: string;
  type: AIWorkforceRuntimeRecordType;
  payload: T;
  createdAt: string;
}

type AIWorkforceRuntimeStoreState = Record<string, AIWorkforceRuntimeRecord>;

const runtimeStore = createJsonFileLocalStore<AIWorkforceRuntimeStoreState>({
  filePath: () => process.env.AI_WORKFORCE_RUNTIME_STORE_FILE || 'ai_workforce_runtime.local.json',
  emptyState: () => ({}),
  normalizeState: (parsed) => (parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as AIWorkforceRuntimeStoreState : {}),
});

export function appendAIWorkforceRuntimeRecord<T>(record: Omit<AIWorkforceRuntimeRecord<T>, 'createdAt'> & { createdAt?: string }): Promise<AIWorkforceRuntimeRecord<T>> {
  const fullRecord: AIWorkforceRuntimeRecord<T> = {
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
  };

  return runtimeStore.mutate((store) => {
    store[fullRecord.id] = fullRecord as AIWorkforceRuntimeRecord;
    return fullRecord;
  });
}

export async function listAIWorkforceRuntimeRecords(options: { type?: AIWorkforceRuntimeRecordType; limit?: number } = {}) {
  const records = Object.values(await runtimeStore.read())
    .filter((record) => !options.type || record.type === options.type)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return records.slice(0, options.limit || 50);
}

export async function getAIWorkforceRuntimeStoreStats() {
  const records = await listAIWorkforceRuntimeRecords({ limit: Number.MAX_SAFE_INTEGER });
  const byType = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {});
  const storage = await runtimeStore.stats();
  return {
    total: records.length,
    byType,
    latestAt: records[0]?.createdAt || null,
    storage,
  };
}

export async function clearAIWorkforceRuntimeStoreForTest() {
  await runtimeStore.clear();
}
