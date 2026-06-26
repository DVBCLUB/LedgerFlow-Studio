import fs from 'node:fs';
import path from 'node:path';

export type AIWorkforceRuntimeRecordType =
  | 'context_pack'
  | 'safety_decision'
  | 'pr_readiness'
  | 'runtime_snapshot';

export interface AIWorkforceRuntimeRecord<T = unknown> {
  id: string;
  type: AIWorkforceRuntimeRecordType;
  payload: T;
  createdAt: string;
}

let saveQueue = Promise.resolve();

function getStorageFile() {
  return path.resolve(process.cwd(), process.env.AI_WORKFORCE_RUNTIME_STORE_FILE || 'ai_workforce_runtime.local.json');
}

async function readStore(): Promise<Record<string, AIWorkforceRuntimeRecord>> {
  const storageFile = getStorageFile();
  try {
    const parsed = JSON.parse(await fs.promises.readFile(storageFile, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error: any) {
    if (error?.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeStore(store: Record<string, AIWorkforceRuntimeRecord>) {
  const storageFile = getStorageFile();
  await fs.promises.mkdir(path.dirname(storageFile), { recursive: true });
  const tempFile = `${storageFile}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.promises.writeFile(tempFile, JSON.stringify(store, null, 2), 'utf8');
    await fs.promises.rename(tempFile, storageFile);
  } finally {
    await fs.promises.rm(tempFile, { force: true }).catch(() => undefined);
  }
}

export function appendAIWorkforceRuntimeRecord<T>(record: Omit<AIWorkforceRuntimeRecord<T>, 'createdAt'> & { createdAt?: string }): Promise<AIWorkforceRuntimeRecord<T>> {
  const fullRecord: AIWorkforceRuntimeRecord<T> = {
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
  };

  const operation = async () => {
    const store = await readStore();
    store[fullRecord.id] = fullRecord as AIWorkforceRuntimeRecord;
    await writeStore(store);
    return fullRecord;
  };

  const queued = saveQueue.then(operation, operation);
  saveQueue = queued.then(() => undefined, () => undefined);
  return queued;
}

export async function listAIWorkforceRuntimeRecords(options: { type?: AIWorkforceRuntimeRecordType; limit?: number } = {}) {
  await saveQueue.catch(() => undefined);
  const records = Object.values(await readStore())
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
  return {
    total: records.length,
    byType,
    latestAt: records[0]?.createdAt || null,
  };
}

export async function clearAIWorkforceRuntimeStoreForTest() {
  await saveQueue.catch(() => undefined);
  await fs.promises.rm(getStorageFile(), { force: true }).catch(() => undefined);
}
